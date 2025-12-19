/**
 * @file main.c
 * @brief Main Application for 120kW T-Type Hybrid Inverter
 * @version 2.1
 * @date 2025-12
 * 
 * MCU: STM32G474RET6 @ 170 MHz
 * Control: SVPWM @ 100 kHz, Control Loop @ 200 kHz
 */

#include "stm32g4xx_hal.h"
#include "config.h"
#include "types.h"
#include "adc.h"
#include "hrtim.h"
#include "control.h"
#include "protection.h"
#include "modbus.h"
#include "can_bms.h"

/* ============================================================================
 * GLOBAL VARIABLES
 * ========================================================================== */
SystemData_t g_sys = {0};
ModbusRegisters_t g_modbus = {0};

/* Peripheral handles */
HRTIM_HandleTypeDef hhrtim1;
ADC_HandleTypeDef hadc1, hadc2;
FDCAN_HandleTypeDef hfdcan1;
UART_HandleTypeDef huart3;
TIM_HandleTypeDef htim6;    // Control loop timer
TIM_HandleTypeDef htim7;    // Millisecond timer

/* ============================================================================
 * FUNCTION PROTOTYPES
 * ========================================================================== */
static void SystemClock_Config(void);
static void GPIO_Init(void);
static void StateMachine_Run(void);
static void UpdateModbusRegisters(void);

/* ============================================================================
 * MAIN FUNCTION
 * ========================================================================== */
int main(void)
{
    /* MCU Configuration */
    HAL_Init();
    SystemClock_Config();
    
    /* Initialize Peripherals */
    GPIO_Init();
    ADC_Init(&hadc1, &hadc2);
    HRTIM_Init(&hhrtim1);
    CAN_BMS_Init(&hfdcan1);
    Modbus_Init(&huart3);
    
    /* Initialize Control */
    Control_Init();
    Protection_Init();
    
    /* Initialize System State */
    g_sys.state = STATE_INIT;
    g_sys.mode = MODE_GRID_TIED;
    g_sys.faults = FAULT_NONE;
    g_sys.enable_cmd = false;
    
    /* Start HRTIM PWM (outputs disabled) */
    HRTIM_Start(&hhrtim1);
    
    /* Start ADC conversions */
    ADC_Start(&hadc1, &hadc2);
    
    /* Enable global interrupts */
    __enable_irq();
    
    /* Transition to STANDBY */
    g_sys.state = STATE_STANDBY;
    
    /* Main Loop */
    while (1)
    {
        /* State Machine (runs in main loop) */
        StateMachine_Run();
        
        /* Update Modbus Registers */
        UpdateModbusRegisters();
        
        /* Process Modbus Requests */
        Modbus_Process();
        
        /* Process CAN BMS Data */
        CAN_BMS_Process();
        
        /* Update LEDs */
        if (g_sys.faults != FAULT_NONE) {
            HAL_GPIO_WritePin(LED_FAULT_PORT, LED_FAULT_PIN, GPIO_PIN_SET);
        } else {
            HAL_GPIO_WritePin(LED_FAULT_PORT, LED_FAULT_PIN, GPIO_PIN_RESET);
        }
        
        if (g_sys.state == STATE_RUN_INVERTER || g_sys.state == STATE_RUN_RECTIFIER) {
            HAL_GPIO_TogglePin(LED_STATUS_PORT, LED_STATUS_PIN);
        } else if (g_sys.state == STATE_READY) {
            HAL_GPIO_WritePin(LED_STATUS_PORT, LED_STATUS_PIN, GPIO_PIN_SET);
        } else {
            HAL_GPIO_WritePin(LED_STATUS_PORT, LED_STATUS_PIN, GPIO_PIN_RESET);
        }
        
        /* Small delay for main loop rate */
        HAL_Delay(10);
    }
}

/* ============================================================================
 * CONTROL LOOP INTERRUPT (200 kHz / 5 µs)
 * Called from HRTIM repetition interrupt, synchronized with PWM
 * ========================================================================== */
void HRTIM1_Master_IRQHandler(void)
{
    uint32_t start_time = DWT->CYCCNT;
    
    /* Clear interrupt flag */
    __HAL_HRTIM_MASTER_CLEAR_IT(&hhrtim1, HRTIM_MASTER_IT_MREP);
    
    /* Read ADC Results */
    ADC_ReadResults(&g_sys.dc, &g_sys.ac, &g_sys.temps);
    
    /* Run Protection Checks (hardware-level) */
    if (Protection_CheckFast(&g_sys)) {
        /* Fault detected - disable outputs immediately */
        HRTIM_DisableOutputs(&hhrtim1);
        g_sys.state = STATE_FAULT;
        return;
    }
    
    /* Run Control Algorithm (only in RUN states) */
    if (g_sys.state == STATE_RUN_INVERTER || g_sys.state == STATE_RUN_RECTIFIER) {
        /* Update PLL */
        PLL_Update(&g_sys.pll, g_sys.ac.Va, g_sys.ac.Vb, g_sys.ac.Vc);
        
        /* Run Current Control Loop */
        Control_CurrentLoop(&g_sys);
        
        /* Generate SVPWM */
        SVPWM_Calculate(&g_sys.svpwm, g_sys.V_ref_dq.d, g_sys.V_ref_dq.q, 
                        g_sys.pll.theta, g_sys.dc.Vdc);
        
        /* Update HRTIM Compare Values */
        HRTIM_SetDuty(&hhrtim1, g_sys.svpwm.duty_a, g_sys.svpwm.duty_b, g_sys.svpwm.duty_c);
    }
    
    /* Update timing statistics */
    g_sys.control_cycle_count++;
    g_sys.control_exec_time_us = (DWT->CYCCNT - start_time) / (SYSCLK_FREQ_HZ / 1000000);
}

/* ============================================================================
 * STATE MACHINE
 * ========================================================================== */
static void StateMachine_Run(void)
{
    static uint32_t last_tick = 0;
    uint32_t current_tick = HAL_GetTick();
    uint32_t elapsed = current_tick - last_tick;
    
    /* Update uptime */
    g_sys.uptime_ms = current_tick;
    
    /* Check E-Stop */
    if (HAL_GPIO_ReadPin(DI_ESTOP_PORT, DI_ESTOP_PIN) == GPIO_PIN_SET) {
        g_sys.faults |= FAULT_ESTOP_ACTIVE;
        g_sys.state = STATE_EMERGENCY;
        HRTIM_DisableOutputs(&hhrtim1);
        return;
    }
    
    /* Run slow protection checks */
    Protection_CheckSlow(&g_sys);
    
    /* State Machine */
    switch (g_sys.state)
    {
        case STATE_INIT:
            /* Initialization complete, go to standby */
            g_sys.state = STATE_STANDBY;
            break;
            
        case STATE_STANDBY:
            /* Wait for enable command */
            if (g_sys.enable_cmd && g_sys.faults == FAULT_NONE) {
                /* Check DC voltage is present */
                if (g_sys.dc.Vdc > VDC_MIN_V * 0.5f) {
                    g_sys.state = STATE_PRECHARGE;
                    g_sys.state_timer_ms = 0;
                    HAL_GPIO_WritePin(RELAY_PRECHARGE_PORT, RELAY_PRECHARGE_PIN, GPIO_PIN_SET);
                }
            }
            break;
            
        case STATE_PRECHARGE:
            g_sys.state_timer_ms += elapsed;
            
            /* Check if DC-link is charged */
            if (g_sys.dc.Vdc >= g_sys.bms.voltage * 0.95f) {
                /* Pre-charge complete */
                HAL_GPIO_WritePin(RELAY_MAIN_PORT, RELAY_MAIN_PIN, GPIO_PIN_SET);
                HAL_Delay(50);  // Contactor settling time
                HAL_GPIO_WritePin(RELAY_PRECHARGE_PORT, RELAY_PRECHARGE_PIN, GPIO_PIN_RESET);
                g_sys.precharge_complete = true;
                g_sys.state = STATE_READY;
                g_sys.state_timer_ms = 0;
            }
            else if (g_sys.state_timer_ms > PRECHARGE_TIME_MS) {
                /* Pre-charge timeout */
                g_sys.faults |= FAULT_PRECHARGE_FAIL;
                g_sys.state = STATE_FAULT;
                HAL_GPIO_WritePin(RELAY_PRECHARGE_PORT, RELAY_PRECHARGE_PIN, GPIO_PIN_RESET);
            }
            break;
            
        case STATE_READY:
            /* Wait for run command and valid grid */
            if (!g_sys.enable_cmd) {
                g_sys.state = STATE_STOPPING;
            }
            else if (g_sys.grid_connected) {
                g_sys.state = STATE_GRID_SYNC;
                g_sys.state_timer_ms = 0;
                PLL_Reset(&g_sys.pll);
            }
            break;
            
        case STATE_GRID_SYNC:
            g_sys.state_timer_ms += elapsed;
            
            /* Update PLL */
            PLL_Update(&g_sys.pll, g_sys.ac.Va, g_sys.ac.Vb, g_sys.ac.Vc);
            
            if (g_sys.pll.locked) {
                /* Grid synchronized - start operation */
                Control_Reset(&g_sys);
                HRTIM_EnableOutputs(&hhrtim1);
                
                if (g_sys.ref.P_ref >= 0) {
                    g_sys.state = STATE_RUN_INVERTER;
                    g_sys.power_dir = POWER_DIR_INVERTER;
                } else {
                    g_sys.state = STATE_RUN_RECTIFIER;
                    g_sys.power_dir = POWER_DIR_RECTIFIER;
                }
                HAL_GPIO_WritePin(RELAY_GRID_PORT, RELAY_GRID_PIN, GPIO_PIN_SET);
            }
            else if (g_sys.state_timer_ms > GRID_SYNC_TIMEOUT_MS) {
                /* Grid sync timeout */
                g_sys.state = STATE_READY;
            }
            break;
            
        case STATE_RUN_INVERTER:
        case STATE_RUN_RECTIFIER:
            if (!g_sys.enable_cmd || g_sys.faults != FAULT_NONE) {
                g_sys.state = STATE_STOPPING;
            }
            
            /* Check for power direction change */
            if (g_sys.state == STATE_RUN_INVERTER && g_sys.ref.P_ref < 0) {
                g_sys.state = STATE_RUN_RECTIFIER;
                g_sys.power_dir = POWER_DIR_RECTIFIER;
            }
            else if (g_sys.state == STATE_RUN_RECTIFIER && g_sys.ref.P_ref >= 0) {
                g_sys.state = STATE_RUN_INVERTER;
                g_sys.power_dir = POWER_DIR_INVERTER;
            }
            
            /* Calculate efficiency */
            if (g_sys.dc.Pdc > 1000.0f && g_sys.ac.Pac > 1000.0f) {
                if (g_sys.power_dir == POWER_DIR_INVERTER) {
                    g_sys.efficiency = g_sys.ac.Pac / g_sys.dc.Pdc * 100.0f;
                } else {
                    g_sys.efficiency = g_sys.dc.Pdc / g_sys.ac.Pac * 100.0f;
                }
            }
            break;
            
        case STATE_STOPPING:
            /* Ramp down power */
            g_sys.ref.P_ref *= 0.9f;
            g_sys.ref.Q_ref *= 0.9f;
            
            if (fabsf(g_sys.ref.P_ref) < 100.0f) {
                HRTIM_DisableOutputs(&hhrtim1);
                HAL_GPIO_WritePin(RELAY_GRID_PORT, RELAY_GRID_PIN, GPIO_PIN_RESET);
                g_sys.power_dir = POWER_DIR_IDLE;
                g_sys.state = STATE_READY;
            }
            break;
            
        case STATE_FAULT:
            /* Outputs already disabled */
            HRTIM_DisableOutputs(&hhrtim1);
            HAL_GPIO_WritePin(RELAY_GRID_PORT, RELAY_GRID_PIN, GPIO_PIN_RESET);
            HAL_GPIO_WritePin(RELAY_MAIN_PORT, RELAY_MAIN_PIN, GPIO_PIN_RESET);
            g_sys.power_dir = POWER_DIR_IDLE;
            
            /* Wait for fault clear and enable toggle */
            if (g_sys.faults == FAULT_NONE && !g_sys.enable_cmd) {
                g_sys.state = STATE_STANDBY;
            }
            break;
            
        case STATE_EMERGENCY:
            /* E-Stop active - all outputs off */
            HRTIM_DisableOutputs(&hhrtim1);
            HAL_GPIO_WritePin(RELAY_GRID_PORT, RELAY_GRID_PIN, GPIO_PIN_RESET);
            HAL_GPIO_WritePin(RELAY_MAIN_PORT, RELAY_MAIN_PIN, GPIO_PIN_RESET);
            HAL_GPIO_WritePin(RELAY_PRECHARGE_PORT, RELAY_PRECHARGE_PIN, GPIO_PIN_RESET);
            
            /* Wait for E-Stop release */
            if (HAL_GPIO_ReadPin(DI_ESTOP_PORT, DI_ESTOP_PIN) == GPIO_PIN_RESET) {
                g_sys.faults &= ~FAULT_ESTOP_ACTIVE;
                g_sys.state = STATE_STANDBY;
            }
            break;
            
        default:
            g_sys.state = STATE_FAULT;
            break;
    }
    
    last_tick = current_tick;
}

/* ============================================================================
 * UPDATE MODBUS REGISTERS
 * ========================================================================== */
static void UpdateModbusRegisters(void)
{
    /* Status Word */
    g_modbus.status_word = (uint16_t)g_sys.state;
    g_modbus.status_word |= (g_sys.pll.locked ? 0x0100 : 0);
    g_modbus.status_word |= (g_sys.grid_connected ? 0x0200 : 0);
    g_modbus.status_word |= (g_sys.bms.valid ? 0x0400 : 0);
    
    /* Fault Codes */
    g_modbus.fault_code_low = (uint16_t)(g_sys.faults & 0xFFFF);
    g_modbus.fault_code_high = (uint16_t)((g_sys.faults >> 16) & 0xFFFF);
    
    /* DC Measurements */
    g_modbus.Vdc_10mV = (int16_t)(g_sys.dc.Vdc * 100.0f);
    g_modbus.Idc_10mA = (int16_t)(g_sys.dc.Idc * 100.0f);
    g_modbus.Pdc_100W = (int16_t)(g_sys.dc.Pdc / 100.0f);
    
    /* AC Measurements */
    g_modbus.Vac_10mV = (int16_t)(g_sys.ac.Vab * 100.0f);
    g_modbus.Iac_10mA = (int16_t)(g_sys.ac.Ia * 100.0f);
    g_modbus.Pac_100W = (int16_t)(g_sys.ac.Pac / 100.0f);
    g_modbus.Qac_100VAr = (int16_t)(g_sys.ac.Qac / 100.0f);
    g_modbus.frequency_10mHz = (uint16_t)(g_sys.ac.frequency * 100.0f);
    g_modbus.pf_1000 = (uint16_t)(g_sys.ac.pf * 1000.0f);
    
    /* Temperatures */
    g_modbus.temp_heatsink_10C = (int16_t)(g_sys.temps.T_heatsink * 10.0f);
    g_modbus.temp_mosfet_10C = (int16_t)(g_sys.temps.T_max * 10.0f);
    
    /* Performance */
    g_modbus.efficiency_100 = (uint16_t)(g_sys.efficiency * 100.0f);
    g_modbus.soc_100 = (uint16_t)(g_sys.bms.soc * 100.0f);
    
    /* Process control commands from Modbus */
    g_sys.enable_cmd = (g_modbus.control_word & 0x0001) != 0;
    g_sys.mode = (OperationMode_t)(g_modbus.mode_select & 0x0003);
    g_sys.ref.P_ref = (float32_t)g_modbus.P_ref_100W * 100.0f;
    g_sys.ref.Q_ref = (float32_t)g_modbus.Q_ref_100VAr * 100.0f;
}

/* ============================================================================
 * SYSTEM CLOCK CONFIGURATION (170 MHz)
 * ========================================================================== */
static void SystemClock_Config(void)
{
    RCC_OscInitTypeDef RCC_OscInitStruct = {0};
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
    
    /* Configure the main internal regulator output voltage */
    HAL_PWREx_ControlVoltageScaling(PWR_REGULATOR_VOLTAGE_SCALE1_BOOST);
    
    /* Initializes the RCC Oscillators */
    RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
    RCC_OscInitStruct.HSEState = RCC_HSE_ON;
    RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
    RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
    RCC_OscInitStruct.PLL.PLLM = RCC_PLLM_DIV2;
    RCC_OscInitStruct.PLL.PLLN = 85;
    RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
    RCC_OscInitStruct.PLL.PLLQ = RCC_PLLQ_DIV2;
    RCC_OscInitStruct.PLL.PLLR = RCC_PLLR_DIV2;
    HAL_RCC_OscConfig(&RCC_OscInitStruct);
    
    /* Initializes the CPU, AHB and APB buses clocks */
    RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK | RCC_CLOCKTYPE_SYSCLK |
                                  RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
    RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
    RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV1;
    RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;
    HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_8);
    
    /* Enable DWT cycle counter for timing */
    CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
    DWT->CYCCNT = 0;
    DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
}

/* ============================================================================
 * GPIO INITIALIZATION
 * ========================================================================== */
static void GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    
    /* Enable GPIO Clocks */
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();
    __HAL_RCC_GPIOC_CLK_ENABLE();
    __HAL_RCC_GPIOD_CLK_ENABLE();
    
    /* Configure Relay Outputs */
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    
    GPIO_InitStruct.Pin = RELAY_PRECHARGE_PIN;
    HAL_GPIO_Init(RELAY_PRECHARGE_PORT, &GPIO_InitStruct);
    HAL_GPIO_WritePin(RELAY_PRECHARGE_PORT, RELAY_PRECHARGE_PIN, GPIO_PIN_RESET);
    
    GPIO_InitStruct.Pin = RELAY_MAIN_PIN;
    HAL_GPIO_Init(RELAY_MAIN_PORT, &GPIO_InitStruct);
    HAL_GPIO_WritePin(RELAY_MAIN_PORT, RELAY_MAIN_PIN, GPIO_PIN_RESET);
    
    GPIO_InitStruct.Pin = RELAY_GRID_PIN;
    HAL_GPIO_Init(RELAY_GRID_PORT, &GPIO_InitStruct);
    HAL_GPIO_WritePin(RELAY_GRID_PORT, RELAY_GRID_PIN, GPIO_PIN_RESET);
    
    /* Configure LED Outputs */
    GPIO_InitStruct.Pin = LED_STATUS_PIN;
    HAL_GPIO_Init(LED_STATUS_PORT, &GPIO_InitStruct);
    
    GPIO_InitStruct.Pin = LED_FAULT_PIN;
    HAL_GPIO_Init(LED_FAULT_PORT, &GPIO_InitStruct);
    
    /* Configure Digital Inputs */
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    GPIO_InitStruct.Pull = GPIO_PULLDOWN;
    
    GPIO_InitStruct.Pin = DI_ESTOP_PIN;
    HAL_GPIO_Init(DI_ESTOP_PORT, &GPIO_InitStruct);
    
    GPIO_InitStruct.Pin = DI_ENABLE_PIN;
    HAL_GPIO_Init(DI_ENABLE_PORT, &GPIO_InitStruct);
}

/* ============================================================================
 * ERROR HANDLER
 * ========================================================================== */
void Error_Handler(void)
{
    __disable_irq();
    HRTIM_DisableOutputs(&hhrtim1);
    g_sys.faults |= FAULT_INTERNAL_ERROR;
    g_sys.state = STATE_FAULT;
    
    while (1) {
        HAL_GPIO_TogglePin(LED_FAULT_PORT, LED_FAULT_PIN);
        HAL_Delay(100);
    }
}

