/**
 * @file protection.c
 * @brief Protection System for 120kW T-Type Inverter
 * @version 2.1
 * @date 2025-12
 */

#include "protection.h"
#include "config.h"
#include "hrtim.h"
#include <math.h>

/* ============================================================================
 * PRIVATE VARIABLES
 * ========================================================================== */
static uint32_t ov_timer_ms = 0;
static uint32_t uv_timer_ms = 0;
static uint32_t oc_timer_us = 0;
static uint32_t freq_timer_ms = 0;

/* ============================================================================
 * INITIALIZATION
 * ========================================================================== */
void Protection_Init(void)
{
    ov_timer_ms = 0;
    uv_timer_ms = 0;
    oc_timer_us = 0;
    freq_timer_ms = 0;
}

/* ============================================================================
 * FAST PROTECTION CHECK (Called from ISR @ 200 kHz)
 * Response time: < 10 µs for critical faults
 * ========================================================================== */
bool Protection_CheckFast(SystemData_t *sys)
{
    bool fault_detected = false;
    
    /* ===== DC OVER-VOLTAGE (CRITICAL) ===== */
    if (sys->dc.Vdc > VDC_OV_TRIP_V) {
        sys->faults |= FAULT_DC_OVERVOLTAGE;
        fault_detected = true;
    }
    
    /* ===== DC OVER-CURRENT ===== */
    if (fabsf(sys->dc.Idc) > IDC_MAX_A * 1.2f) {
        sys->faults |= FAULT_DC_OVERCURRENT;
        fault_detected = true;
    }
    
    /* ===== AC SHORT CIRCUIT (CRITICAL) ===== */
    if (fabsf(sys->ac.Ia) > IAC_SC_TRIP_A ||
        fabsf(sys->ac.Ib) > IAC_SC_TRIP_A ||
        fabsf(sys->ac.Ic) > IAC_SC_TRIP_A) {
        sys->faults |= FAULT_AC_SHORT_CIRCUIT;
        fault_detected = true;
    }
    
    /* ===== AC OVER-CURRENT ===== */
    if (fabsf(sys->ac.Ia) > IAC_OC_TRIP_A ||
        fabsf(sys->ac.Ib) > IAC_OC_TRIP_A ||
        fabsf(sys->ac.Ic) > IAC_OC_TRIP_A) {
        oc_timer_us += 5;  // 5 µs per call
        if (oc_timer_us > FAULT_OC_RESPONSE_US) {
            sys->faults |= FAULT_AC_OVERCURRENT;
            fault_detected = true;
        }
    } else {
        oc_timer_us = 0;
    }
    
    /* ===== MOSFET OVER-TEMPERATURE (CRITICAL) ===== */
    if (sys->temps.T_max > TEMP_MOSFET_TRIP_C) {
        sys->faults |= FAULT_OVERTEMP_MOSFET;
        fault_detected = true;
    }
    
    return fault_detected;
}

/* ============================================================================
 * SLOW PROTECTION CHECK (Called from main loop @ ~100 Hz)
 * Response time: 10-100 ms for non-critical faults
 * ========================================================================== */
void Protection_CheckSlow(SystemData_t *sys)
{
    static uint32_t last_tick = 0;
    uint32_t current_tick = HAL_GetTick();
    uint32_t elapsed = current_tick - last_tick;
    
    if (elapsed < 10) return;  // Run every 10 ms
    last_tick = current_tick;
    
    /* ===== DC UNDER-VOLTAGE ===== */
    if (sys->state == STATE_RUN_INVERTER || sys->state == STATE_RUN_RECTIFIER) {
        if (sys->dc.Vdc < VDC_UV_TRIP_V) {
            uv_timer_ms += elapsed;
            if (uv_timer_ms > FAULT_UV_RESPONSE_MS) {
                sys->faults |= FAULT_DC_UNDERVOLTAGE;
            }
        } else {
            uv_timer_ms = 0;
        }
    }
    
    /* ===== AC OVER-VOLTAGE ===== */
    float32_t Vac_mag = sqrtf(sys->ac.Va * sys->ac.Va + 
                              sys->ac.Vb * sys->ac.Vb + 
                              sys->ac.Vc * sys->ac.Vc) * 0.8165f;  // RMS
    
    if (Vac_mag > VAC_MAX_V) {
        sys->faults |= FAULT_AC_OVERVOLTAGE;
    }
    
    /* ===== AC UNDER-VOLTAGE ===== */
    if (sys->grid_connected && Vac_mag < VAC_MIN_V) {
        sys->faults |= FAULT_AC_UNDERVOLTAGE;
    }
    
    /* ===== FREQUENCY DEVIATION ===== */
    if (sys->grid_connected && sys->pll.locked) {
        if (sys->pll.frequency > GRID_FREQ_MAX_HZ || 
            sys->pll.frequency < GRID_FREQ_MIN_HZ) {
            freq_timer_ms += elapsed;
            if (freq_timer_ms > 100) {  // 100 ms delay
                if (sys->pll.frequency > GRID_FREQ_MAX_HZ) {
                    sys->faults |= FAULT_OVER_FREQUENCY;
                } else {
                    sys->faults |= FAULT_UNDER_FREQUENCY;
                }
            }
        } else {
            freq_timer_ms = 0;
        }
    }
    
    /* ===== HEATSINK OVER-TEMPERATURE ===== */
    if (sys->temps.T_heatsink > TEMP_HEATSINK_TRIP_C) {
        sys->faults |= FAULT_OVERTEMP_HEATSINK;
    }
    
    /* ===== INDUCTOR OVER-TEMPERATURE ===== */
    if (sys->temps.T_inductor > 130.0f) {
        sys->faults |= FAULT_OVERTEMP_INDUCTOR;
    }
    
    /* ===== AMBIENT OVER-TEMPERATURE ===== */
    if (sys->temps.T_ambient > TEMP_AMBIENT_MAX_C) {
        sys->faults |= FAULT_OVERTEMP_AMBIENT;
    }
    
    /* ===== BMS COMMUNICATION TIMEOUT ===== */
    if (sys->state == STATE_RUN_INVERTER || sys->state == STATE_RUN_RECTIFIER) {
        if ((current_tick - sys->bms.last_update_ms) > BMS_TIMEOUT_MS) {
            sys->bms.valid = false;
            sys->faults |= FAULT_BMS_TIMEOUT;
        }
    }
    
    /* ===== NEUTRAL POINT IMBALANCE ===== */
    float32_t np_error = sys->dc.Vdc_pos - sys->dc.Vdc_neg;
    if (fabsf(np_error) > sys->dc.Vdc * 0.05f) {  // > 5% imbalance
        sys->faults |= FAULT_NP_IMBALANCE;
    }
    
    /* ===== ANTI-ISLANDING ===== */
    if (sys->grid_connected && !sys->pll.locked) {
        static uint32_t island_timer = 0;
        island_timer += elapsed;
        if (island_timer > ANTI_ISLAND_TIME_MS) {
            sys->faults |= FAULT_ANTI_ISLANDING;
        }
    }
    
    /* ===== THERMAL DERATING ===== */
    /* Apply power derating based on temperature */
    if (sys->temps.T_max > TEMP_MOSFET_WARNING_C) {
        float32_t derating = 1.0f - (sys->temps.T_max - TEMP_MOSFET_WARNING_C) / 
                             (TEMP_MOSFET_TRIP_C - TEMP_MOSFET_WARNING_C);
        if (derating < 0.0f) derating = 0.0f;
        
        /* Apply derating to power reference */
        float32_t max_power = SYSTEM_POWER_RATING * derating;
        if (fabsf(sys->ref.P_ref) > max_power) {
            sys->ref.P_ref = (sys->ref.P_ref > 0) ? max_power : -max_power;
        }
    }
}

/* ============================================================================
 * FAULT CLEAR
 * ========================================================================== */
bool Protection_ClearFault(SystemData_t *sys, FaultCode_t fault)
{
    /* Check if fault condition is actually cleared */
    bool can_clear = true;
    
    if (fault & FAULT_DC_OVERVOLTAGE) {
        can_clear = can_clear && (sys->dc.Vdc < VDC_OV_WARNING_V);
    }
    if (fault & FAULT_DC_UNDERVOLTAGE) {
        can_clear = can_clear && (sys->dc.Vdc > VDC_UV_WARNING_V);
    }
    if (fault & FAULT_OVERTEMP_MOSFET) {
        can_clear = can_clear && (sys->temps.T_max < TEMP_MOSFET_WARNING_C);
    }
    if (fault & FAULT_OVERTEMP_HEATSINK) {
        can_clear = can_clear && (sys->temps.T_heatsink < TEMP_HEATSINK_WARNING_C);
    }
    if (fault & FAULT_BMS_TIMEOUT) {
        can_clear = can_clear && sys->bms.valid;
    }
    
    if (can_clear) {
        sys->faults &= ~fault;
        return true;
    }
    
    return false;
}

/* ============================================================================
 * GET FAULT STRING
 * ========================================================================== */
const char* Protection_GetFaultString(FaultCode_t fault)
{
    if (fault & FAULT_DC_OVERVOLTAGE) return "DC Over-Voltage";
    if (fault & FAULT_DC_UNDERVOLTAGE) return "DC Under-Voltage";
    if (fault & FAULT_DC_OVERCURRENT) return "DC Over-Current";
    if (fault & FAULT_AC_OVERVOLTAGE) return "AC Over-Voltage";
    if (fault & FAULT_AC_UNDERVOLTAGE) return "AC Under-Voltage";
    if (fault & FAULT_AC_OVERCURRENT) return "AC Over-Current";
    if (fault & FAULT_AC_SHORT_CIRCUIT) return "Short Circuit";
    if (fault & FAULT_OVERTEMP_MOSFET) return "MOSFET Over-Temp";
    if (fault & FAULT_OVERTEMP_HEATSINK) return "Heatsink Over-Temp";
    if (fault & FAULT_OVER_FREQUENCY) return "Over-Frequency";
    if (fault & FAULT_UNDER_FREQUENCY) return "Under-Frequency";
    if (fault & FAULT_ANTI_ISLANDING) return "Anti-Islanding";
    if (fault & FAULT_BMS_TIMEOUT) return "BMS Timeout";
    if (fault & FAULT_DESAT_DETECTED) return "DESAT Detected";
    if (fault & FAULT_NP_IMBALANCE) return "NP Imbalance";
    if (fault & FAULT_PRECHARGE_FAIL) return "Pre-charge Fail";
    if (fault & FAULT_ESTOP_ACTIVE) return "E-Stop Active";
    if (fault & FAULT_INTERNAL_ERROR) return "Internal Error";
    return "No Fault";
}

