/**
 * @file types.h
 * @brief Type Definitions for 120kW T-Type Hybrid Inverter
 * @version 2.1
 * @date 2025-12
 */

#ifndef __TYPES_H
#define __TYPES_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>

/* ============================================================================
 * BASIC TYPES
 * ========================================================================== */
typedef float float32_t;
typedef double float64_t;

/* ============================================================================
 * SYSTEM STATE MACHINE
 * ========================================================================== */
typedef enum {
    STATE_INIT = 0,         // System initialization
    STATE_STANDBY,          // Standby, waiting for enable
    STATE_PRECHARGE,        // DC-link pre-charging
    STATE_READY,            // Ready, DC-link charged
    STATE_GRID_SYNC,        // Synchronizing to grid
    STATE_RUN_INVERTER,     // Running in inverter mode (DC→AC)
    STATE_RUN_RECTIFIER,    // Running in rectifier mode (AC→DC)
    STATE_STOPPING,         // Controlled shutdown
    STATE_FAULT,            // Fault condition
    STATE_EMERGENCY         // Emergency stop
} SystemState_t;

/* ============================================================================
 * OPERATION MODE
 * ========================================================================== */
typedef enum {
    MODE_GRID_TIED = 0,     // Grid-tied operation
    MODE_OFF_GRID,          // Off-grid / island mode
    MODE_DROOP,             // Droop control for parallel
    MODE_VF_CONTROL         // V/f control (off-grid)
} OperationMode_t;

typedef enum {
    POWER_DIR_IDLE = 0,     // No power flow
    POWER_DIR_INVERTER,     // DC to AC (discharging)
    POWER_DIR_RECTIFIER     // AC to DC (charging)
} PowerDirection_t;

/* ============================================================================
 * FAULT CODES
 * ========================================================================== */
typedef enum {
    FAULT_NONE = 0x0000,
    
    /* DC Side Faults */
    FAULT_DC_OVERVOLTAGE    = 0x0001,
    FAULT_DC_UNDERVOLTAGE   = 0x0002,
    FAULT_DC_OVERCURRENT    = 0x0004,
    FAULT_DC_GROUND_FAULT   = 0x0008,
    
    /* AC Side Faults */
    FAULT_AC_OVERVOLTAGE    = 0x0010,
    FAULT_AC_UNDERVOLTAGE   = 0x0020,
    FAULT_AC_OVERCURRENT    = 0x0040,
    FAULT_AC_SHORT_CIRCUIT  = 0x0080,
    
    /* Frequency Faults */
    FAULT_OVER_FREQUENCY    = 0x0100,
    FAULT_UNDER_FREQUENCY   = 0x0200,
    FAULT_ANTI_ISLANDING    = 0x0400,
    
    /* Thermal Faults */
    FAULT_OVERTEMP_MOSFET   = 0x1000,
    FAULT_OVERTEMP_HEATSINK = 0x2000,
    FAULT_OVERTEMP_INDUCTOR = 0x4000,
    FAULT_OVERTEMP_AMBIENT  = 0x8000,
    
    /* Communication Faults */
    FAULT_BMS_TIMEOUT       = 0x10000,
    FAULT_MODBUS_ERROR      = 0x20000,
    
    /* Hardware Faults */
    FAULT_DESAT_DETECTED    = 0x100000,
    FAULT_GATE_DRIVER       = 0x200000,
    FAULT_NP_IMBALANCE      = 0x400000,
    FAULT_PRECHARGE_FAIL    = 0x800000,
    
    /* System Faults */
    FAULT_ESTOP_ACTIVE      = 0x1000000,
    FAULT_WATCHDOG          = 0x2000000,
    FAULT_INTERNAL_ERROR    = 0x4000000
} FaultCode_t;

/* ============================================================================
 * MEASUREMENT STRUCTURES
 * ========================================================================== */
typedef struct {
    float32_t Vdc;          // DC bus voltage [V]
    float32_t Vdc_pos;      // Positive rail voltage [V]
    float32_t Vdc_neg;      // Negative rail voltage [V]
    float32_t Vnp;          // Neutral point voltage [V]
    float32_t Idc;          // DC current [A]
    float32_t Pdc;          // DC power [W]
} DcMeasurements_t;

typedef struct {
    float32_t Va;           // Phase A voltage [V]
    float32_t Vb;           // Phase B voltage [V]
    float32_t Vc;           // Phase C voltage [V]
    float32_t Ia;           // Phase A current [A]
    float32_t Ib;           // Phase B current [A]
    float32_t Ic;           // Phase C current [A]
    float32_t Vab;          // Line-to-line voltage [V]
    float32_t Vbc;          // Line-to-line voltage [V]
    float32_t Vca;          // Line-to-line voltage [V]
    float32_t frequency;    // Grid frequency [Hz]
    float32_t Pac;          // Active power [W]
    float32_t Qac;          // Reactive power [VAr]
    float32_t Sac;          // Apparent power [VA]
    float32_t pf;           // Power factor
} AcMeasurements_t;

typedef struct {
    float32_t alpha;        // Alpha component
    float32_t beta;         // Beta component
} AlphaBeta_t;

typedef struct {
    float32_t d;            // Direct component
    float32_t q;            // Quadrature component
} Dq_t;

typedef struct {
    float32_t Tj_phase_a[2];    // MOSFET junction temp phase A [°C]
    float32_t Tj_phase_b[2];    // MOSFET junction temp phase B [°C]
    float32_t Tj_phase_c[2];    // MOSFET junction temp phase C [°C]
    float32_t T_heatsink;       // Heatsink temperature [°C]
    float32_t T_inductor;       // Inductor temperature [°C]
    float32_t T_ambient;        // Ambient temperature [°C]
    float32_t T_pcb;            // PCB temperature [°C]
    float32_t T_max;            // Maximum temperature [°C]
} Temperatures_t;

/* ============================================================================
 * CONTROL STRUCTURES
 * ========================================================================== */
typedef struct {
    float32_t Kp;           // Proportional gain
    float32_t Ki;           // Integral gain
    float32_t integral;     // Integral accumulator
    float32_t output_max;   // Output upper limit
    float32_t output_min;   // Output lower limit
    float32_t output;       // Controller output
} PiController_t;

typedef struct {
    float32_t Kp;           // Proportional gain
    float32_t Kr;           // Resonant gain
    float32_t omega0;       // Resonant frequency [rad/s]
    float32_t omega_c;      // Cutoff frequency for damping [rad/s]
    float32_t x1;           // State variable 1
    float32_t x2;           // State variable 2
    float32_t output;       // Controller output
} PrController_t;

typedef struct {
    float32_t theta;        // Grid angle [rad]
    float32_t omega;        // Angular frequency [rad/s]
    float32_t frequency;    // Frequency [Hz]
    float32_t Vd;           // D-axis voltage
    float32_t Vq;           // Q-axis voltage
    bool locked;            // PLL locked status
    PiController_t pi;      // PI controller for PLL
} Pll_t;

typedef struct {
    float32_t ma;           // Modulation index phase A
    float32_t mb;           // Modulation index phase B
    float32_t mc;           // Modulation index phase C
    float32_t m_max;        // Maximum modulation index
    uint16_t sector;        // SVPWM sector (1-6)
    uint16_t duty_a;        // Duty cycle phase A (HRTIM compare)
    uint16_t duty_b;        // Duty cycle phase B
    uint16_t duty_c;        // Duty cycle phase C
} SvpwmOutput_t;

/* ============================================================================
 * REFERENCE STRUCTURES
 * ========================================================================== */
typedef struct {
    float32_t P_ref;        // Active power reference [W]
    float32_t Q_ref;        // Reactive power reference [VAr]
    float32_t Id_ref;       // D-axis current reference [A]
    float32_t Iq_ref;       // Q-axis current reference [A]
    float32_t Vdc_ref;      // DC voltage reference [V]
    float32_t pf_ref;       // Power factor reference
} References_t;

/* ============================================================================
 * BMS DATA STRUCTURE
 * ========================================================================== */
typedef struct {
    float32_t voltage;          // Pack voltage [V]
    float32_t current;          // Pack current [A]
    float32_t soc;              // State of charge [%]
    float32_t soh;              // State of health [%]
    float32_t temperature_max;  // Max cell temperature [°C]
    float32_t temperature_min;  // Min cell temperature [°C]
    float32_t charge_limit;     // Max charge current [A]
    float32_t discharge_limit;  // Max discharge current [A]
    uint32_t status;            // BMS status flags
    uint32_t last_update_ms;    // Last update timestamp
    bool valid;                 // Data validity flag
} BmsData_t;

/* ============================================================================
 * SYSTEM DATA STRUCTURE
 * ========================================================================== */
typedef struct {
    /* State */
    SystemState_t state;
    SystemState_t prev_state;
    OperationMode_t mode;
    PowerDirection_t power_dir;
    FaultCode_t faults;
    FaultCode_t fault_history;
    uint32_t state_timer_ms;
    
    /* Measurements */
    DcMeasurements_t dc;
    AcMeasurements_t ac;
    Temperatures_t temps;
    
    /* Control */
    References_t ref;
    Pll_t pll;
    PrController_t current_ctrl_d;
    PrController_t current_ctrl_q;
    PiController_t voltage_ctrl;
    SvpwmOutput_t svpwm;
    Dq_t I_dq;
    Dq_t V_dq;
    Dq_t V_ref_dq;
    
    /* BMS */
    BmsData_t bms;
    
    /* Statistics */
    float32_t efficiency;
    float32_t energy_inverter_kWh;
    float32_t energy_rectifier_kWh;
    uint32_t run_time_hours;
    uint32_t fault_count;
    
    /* Timing */
    uint32_t uptime_ms;
    uint32_t control_cycle_count;
    uint16_t control_exec_time_us;
    
    /* Flags */
    bool enable_cmd;
    bool grid_connected;
    bool precharge_complete;
    bool ready_to_run;
} SystemData_t;

/* ============================================================================
 * MODBUS REGISTER MAP
 * ========================================================================== */
typedef struct {
    /* Holding Registers (Read/Write) - 40001+ */
    uint16_t control_word;          // 40001: Control commands
    uint16_t mode_select;           // 40002: Operation mode
    int16_t  P_ref_100W;            // 40003: Power reference (×100W)
    int16_t  Q_ref_100VAr;          // 40004: Reactive power ref (×100VAr)
    uint16_t pf_ref_1000;           // 40005: Power factor (×1000)
    uint16_t Vdc_ref_V;             // 40006: DC voltage reference
    
    /* Input Registers (Read Only) - 30001+ */
    uint16_t status_word;           // 30001: System status
    uint16_t fault_code_low;        // 30002: Fault code (low word)
    uint16_t fault_code_high;       // 30003: Fault code (high word)
    int16_t  Vdc_10mV;              // 30004: DC voltage (×10mV)
    int16_t  Idc_10mA;              // 30005: DC current (×10mA)
    int16_t  Pdc_100W;              // 30006: DC power (×100W)
    int16_t  Vac_10mV;              // 30007: AC voltage (×10mV)
    int16_t  Iac_10mA;              // 30008: AC current (×10mA)
    int16_t  Pac_100W;              // 30009: AC power (×100W)
    int16_t  Qac_100VAr;            // 30010: Reactive power (×100VAr)
    uint16_t frequency_10mHz;       // 30011: Frequency (×10mHz)
    uint16_t pf_1000;               // 30012: Power factor (×1000)
    int16_t  temp_heatsink_10C;     // 30013: Heatsink temp (×0.1°C)
    int16_t  temp_mosfet_10C;       // 30014: MOSFET temp (×0.1°C)
    uint16_t efficiency_100;        // 30015: Efficiency (×0.01%)
    uint16_t soc_100;               // 30016: Battery SOC (×0.01%)
} ModbusRegisters_t;

/* Global system data instance (defined in main.c) */
extern SystemData_t g_sys;
extern ModbusRegisters_t g_modbus;

#ifdef __cplusplus
}
#endif

#endif /* __TYPES_H */

