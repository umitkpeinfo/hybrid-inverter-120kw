/**
 * @file config.h
 * @brief System Configuration for 120kW T-Type Hybrid Inverter
 * @version 2.1
 * @date 2025-12
 * 
 * MCU: STM32G474RET6
 * Topology: 3-Level T-Type
 * Semiconductor: Infineon IMT65R010M2H CoolSiC G2
 */

#ifndef __CONFIG_H
#define __CONFIG_H

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================================
 * SYSTEM IDENTIFICATION
 * ========================================================================== */
#define FW_VERSION_MAJOR        2
#define FW_VERSION_MINOR        1
#define FW_VERSION_PATCH        0
#define SYSTEM_POWER_RATING     120000      // 120 kW
#define SYSTEM_NAME             "HybridInv120kW"

/* ============================================================================
 * CLOCK CONFIGURATION
 * ========================================================================== */
#define SYSCLK_FREQ_HZ          170000000   // 170 MHz
#define HRTIM_FREQ_HZ           170000000   // HRTIM clock
#define APB1_FREQ_HZ            170000000
#define APB2_FREQ_HZ            170000000

/* ============================================================================
 * PWM / SWITCHING CONFIGURATION
 * ========================================================================== */
#define PWM_FREQUENCY_HZ        100000      // 100 kHz switching
#define PWM_PERIOD_US           10          // 10 µs period
#define PWM_DEAD_TIME_NS        80          // 80 ns dead time
#define CONTROL_LOOP_FREQ_HZ    200000      // 200 kHz control rate
#define CONTROL_PERIOD_US       5           // 5 µs control period

/* HRTIM Counter Period for 100 kHz */
#define HRTIM_PERIOD            (HRTIM_FREQ_HZ / PWM_FREQUENCY_HZ)  // 1700
#define HRTIM_DEAD_TIME_RISING  ((PWM_DEAD_TIME_NS * HRTIM_FREQ_HZ) / 1000000000)
#define HRTIM_DEAD_TIME_FALLING ((PWM_DEAD_TIME_NS * HRTIM_FREQ_HZ) / 1000000000)

/* ============================================================================
 * DC BUS CONFIGURATION
 * ========================================================================== */
#define VDC_NOMINAL_V           850.0f      // Nominal DC voltage
#define VDC_MIN_V               700.0f      // Minimum operating voltage
#define VDC_MAX_V               1000.0f     // Maximum operating voltage
#define VDC_OV_WARNING_V        1020.0f     // Over-voltage warning
#define VDC_OV_TRIP_V           1050.0f     // Over-voltage trip
#define VDC_UV_WARNING_V        720.0f      // Under-voltage warning
#define VDC_UV_TRIP_V           680.0f      // Under-voltage trip
#define VDC_ABSOLUTE_MAX_V      1100.0f     // Absolute maximum

/* ============================================================================
 * AC GRID CONFIGURATION
 * ========================================================================== */
#define VAC_NOMINAL_V           480.0f      // Nominal L-L voltage (RMS)
#define VAC_PHASE_NOMINAL_V     277.0f      // Nominal L-N voltage (RMS)
#define VAC_MIN_V               408.0f      // -15% of nominal
#define VAC_MAX_V               528.0f      // +10% of nominal
#define GRID_FREQ_NOMINAL_HZ    60.0f       // Nominal grid frequency
#define GRID_FREQ_MIN_HZ        55.0f       // Minimum frequency
#define GRID_FREQ_MAX_HZ        65.0f       // Maximum frequency

/* ============================================================================
 * CURRENT LIMITS
 * ========================================================================== */
#define IDC_MAX_A               180.0f      // Max DC current
#define IAC_RATED_A             160.0f      // Rated AC RMS current
#define IAC_PEAK_A              226.0f      // Peak AC current (sqrt(2) * rated)
#define IAC_OC_TRIP_A           240.0f      // 150% overcurrent trip
#define IAC_SC_TRIP_A           320.0f      // Short circuit threshold (200%)

/* ============================================================================
 * TEMPERATURE LIMITS (°C)
 * ========================================================================== */
#define TEMP_MOSFET_WARNING_C   125.0f      // MOSFET warning
#define TEMP_MOSFET_TRIP_C      160.0f      // MOSFET trip
#define TEMP_MOSFET_MAX_C       175.0f      // Absolute max Tj
#define TEMP_HEATSINK_WARNING_C 75.0f       // Heatsink warning
#define TEMP_HEATSINK_TRIP_C    85.0f       // Heatsink trip
#define TEMP_AMBIENT_DERATING_C 45.0f       // Start derating
#define TEMP_AMBIENT_MAX_C      60.0f       // Max ambient

/* ============================================================================
 * CONTROL LOOP PARAMETERS
 * ========================================================================== */
/* Current Loop (PR Controller) */
#define CURRENT_KP              0.5f        // Proportional gain
#define CURRENT_KR              50.0f       // Resonant gain
#define CURRENT_OMEGA0          (2.0f * 3.14159f * GRID_FREQ_NOMINAL_HZ)
#define CURRENT_BANDWIDTH_HZ    2000.0f     // Current loop bandwidth

/* Voltage Loop (PI Controller) */
#define VOLTAGE_KP              0.1f        // Proportional gain
#define VOLTAGE_KI              10.0f       // Integral gain
#define VOLTAGE_BANDWIDTH_HZ    200.0f      // Voltage loop bandwidth

/* PLL Parameters */
#define PLL_KP                  100.0f      // PLL proportional gain
#define PLL_KI                  5000.0f     // PLL integral gain
#define PLL_BANDWIDTH_HZ        50.0f       // PLL bandwidth

/* ============================================================================
 * ADC CONFIGURATION
 * ========================================================================== */
#define ADC_RESOLUTION_BITS     12
#define ADC_MAX_VALUE           4095
#define ADC_VREF                3.3f        // ADC reference voltage

/* Current Sensing Scaling */
#define SHUNT_RESISTANCE_OHM    0.0001f     // 100 µΩ shunt
#define SHUNT_AMP_GAIN          200.0f      // INA240A4 gain
#define IDC_SCALE               (ADC_VREF / ADC_MAX_VALUE / SHUNT_AMP_GAIN / SHUNT_RESISTANCE_OHM)

/* Hall Effect Sensor (LEM HLSR 50-P) */
#define HALL_NOMINAL_CURRENT    50.0f       // Nominal primary current
#define HALL_SENSITIVITY        0.0264f     // V/A at 3.3V supply
#define HALL_OFFSET_V           1.65f       // Zero current offset (Vref/2)
#define IAC_SCALE               ((ADC_VREF / ADC_MAX_VALUE - HALL_OFFSET_V) / HALL_SENSITIVITY)

/* Voltage Sensing Scaling */
#define VDC_DIVIDER_RATIO       301.0f      // DC bus voltage divider
#define VDC_SCALE               (ADC_VREF / ADC_MAX_VALUE * VDC_DIVIDER_RATIO)
#define VAC_DIVIDER_RATIO       200.0f      // AC voltage divider
#define VAC_SCALE               (ADC_VREF / ADC_MAX_VALUE * VAC_DIVIDER_RATIO)

/* Temperature Sensing (NTC 10k B3950) */
#define NTC_R25                 10000.0f    // Resistance at 25°C
#define NTC_BETA                3950.0f     // Beta value
#define NTC_SERIES_R            10000.0f    // Series resistor

/* ============================================================================
 * FILTER PARAMETERS
 * ========================================================================== */
#define LC_INDUCTANCE_H         60e-6f      // 60 µH converter inductance
#define LG_INDUCTANCE_H         20e-6f      // 20 µH grid inductance
#define CF_CAPACITANCE_F        15e-6f      // 15 µF filter capacitance
#define CDC_CAPACITANCE_F       2e-3f       // 2 mF DC-link capacitance

/* ============================================================================
 * COMMUNICATION CONFIGURATION
 * ========================================================================== */
/* RS485 / Modbus RTU */
#define MODBUS_SLAVE_ADDRESS    1
#define MODBUS_BAUDRATE         115200
#define MODBUS_PARITY           0           // None
#define MODBUS_STOPBITS         1

/* CAN-FD (BMS Interface) */
#define CAN_BAUDRATE            500000      // 500 kbps nominal
#define CAN_FD_BAUDRATE         2000000     // 2 Mbps data phase
#define BMS_NODE_ID             0x100       // BMS CAN ID base
#define BMS_TIMEOUT_MS          5000        // BMS communication timeout

/* ============================================================================
 * PROTECTION TIMING
 * ========================================================================== */
#define FAULT_OV_RESPONSE_MS    10          // DC over-voltage response
#define FAULT_UV_RESPONSE_MS    100         // DC under-voltage response
#define FAULT_OC_RESPONSE_US    1000        // AC over-current response
#define FAULT_SC_RESPONSE_US    10          // Short circuit response
#define FAULT_OT_RESPONSE_MS    10          // Over-temperature response
#define ANTI_ISLAND_TIME_MS     2000        // Anti-islanding detection time

/* ============================================================================
 * STATE MACHINE TIMING
 * ========================================================================== */
#define PRECHARGE_TIME_MS       2000        // Pre-charge duration
#define SOFT_START_TIME_MS      1000        // Soft start ramp time
#define GRID_SYNC_TIMEOUT_MS    5000        // Grid synchronization timeout
#define FAULT_RETRY_DELAY_MS    30000       // Delay before fault retry

/* ============================================================================
 * GPIO PIN DEFINITIONS (STM32G474)
 * ========================================================================== */
/* HRTIM PWM Outputs */
#define PWM_T1_HIGH_PORT        GPIOA
#define PWM_T1_HIGH_PIN         GPIO_PIN_8  // HRTIM_CHA1
#define PWM_T1_LOW_PORT         GPIOA
#define PWM_T1_LOW_PIN          GPIO_PIN_9  // HRTIM_CHA2
#define PWM_T4_HIGH_PORT        GPIOA
#define PWM_T4_HIGH_PIN         GPIO_PIN_10 // HRTIM_CHB1
#define PWM_T4_LOW_PORT         GPIOA
#define PWM_T4_LOW_PIN          GPIO_PIN_11 // HRTIM_CHB2

/* ADC Inputs */
#define ADC_VDC_CHANNEL         ADC_CHANNEL_1   // PA0
#define ADC_IDC_CHANNEL         ADC_CHANNEL_2   // PA1
#define ADC_IA_CHANNEL          ADC_CHANNEL_3   // PA2
#define ADC_IB_CHANNEL          ADC_CHANNEL_4   // PA3
#define ADC_IC_CHANNEL          ADC_CHANNEL_5   // PF0
#define ADC_TEMP1_CHANNEL       ADC_CHANNEL_6   // PC0
#define ADC_TEMP2_CHANNEL       ADC_CHANNEL_7   // PC1

/* Digital I/O */
#define RELAY_PRECHARGE_PORT    GPIOB
#define RELAY_PRECHARGE_PIN     GPIO_PIN_0
#define RELAY_MAIN_PORT         GPIOB
#define RELAY_MAIN_PIN          GPIO_PIN_1
#define RELAY_GRID_PORT         GPIOB
#define RELAY_GRID_PIN          GPIO_PIN_2
#define LED_STATUS_PORT         GPIOB
#define LED_STATUS_PIN          GPIO_PIN_3
#define LED_FAULT_PORT          GPIOB
#define LED_FAULT_PIN           GPIO_PIN_4
#define DI_ESTOP_PORT           GPIOC
#define DI_ESTOP_PIN            GPIO_PIN_6
#define DI_ENABLE_PORT          GPIOC
#define DI_ENABLE_PIN           GPIO_PIN_7

/* Communication Pins */
#define UART_MODBUS_TX_PORT     GPIOC
#define UART_MODBUS_TX_PIN      GPIO_PIN_10     // USART3
#define UART_MODBUS_RX_PORT     GPIOC
#define UART_MODBUS_RX_PIN      GPIO_PIN_11
#define RS485_DE_PORT           GPIOC
#define RS485_DE_PIN            GPIO_PIN_12
#define CAN_TX_PORT             GPIOD
#define CAN_TX_PIN              GPIO_PIN_1      // FDCAN1
#define CAN_RX_PORT             GPIOD
#define CAN_RX_PIN              GPIO_PIN_0

#ifdef __cplusplus
}
#endif

#endif /* __CONFIG_H */

