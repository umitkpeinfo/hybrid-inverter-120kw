/**
 * @file control.c
 * @brief Control Algorithms for 120kW T-Type Inverter
 * @version 2.1
 * @date 2025-12
 * 
 * Implements:
 * - SVPWM for 3-Level T-Type topology
 * - PR Current Controller
 * - PI Voltage Controller
 * - SRF-PLL for Grid Synchronization
 * - Neutral Point Balance
 */

#include "control.h"
#include "config.h"
#include "arm_math.h"
#include <math.h>

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */
#define TWO_PI          6.28318530718f
#define SQRT3           1.73205080757f
#define SQRT3_INV       0.57735026919f
#define TWO_THIRDS      0.66666666667f
#define ONE_THIRD       0.33333333333f
#define SQRT2           1.41421356237f
#define SQRT2_INV       0.70710678118f

#define CONTROL_TS      (1.0f / CONTROL_LOOP_FREQ_HZ)  // 5 µs

/* ============================================================================
 * INITIALIZATION
 * ========================================================================== */
void Control_Init(void)
{
    /* Initialize current PR controllers */
    g_sys.current_ctrl_d.Kp = CURRENT_KP;
    g_sys.current_ctrl_d.Kr = CURRENT_KR;
    g_sys.current_ctrl_d.omega0 = CURRENT_OMEGA0;
    g_sys.current_ctrl_d.omega_c = 10.0f;
    g_sys.current_ctrl_d.x1 = 0.0f;
    g_sys.current_ctrl_d.x2 = 0.0f;
    
    g_sys.current_ctrl_q.Kp = CURRENT_KP;
    g_sys.current_ctrl_q.Kr = CURRENT_KR;
    g_sys.current_ctrl_q.omega0 = CURRENT_OMEGA0;
    g_sys.current_ctrl_q.omega_c = 10.0f;
    g_sys.current_ctrl_q.x1 = 0.0f;
    g_sys.current_ctrl_q.x2 = 0.0f;
    
    /* Initialize voltage PI controller */
    g_sys.voltage_ctrl.Kp = VOLTAGE_KP;
    g_sys.voltage_ctrl.Ki = VOLTAGE_KI;
    g_sys.voltage_ctrl.integral = 0.0f;
    g_sys.voltage_ctrl.output_max = IAC_RATED_A;
    g_sys.voltage_ctrl.output_min = -IAC_RATED_A;
    
    /* Initialize PLL */
    PLL_Init(&g_sys.pll);
}

void Control_Reset(SystemData_t *sys)
{
    /* Reset controller states */
    sys->current_ctrl_d.x1 = 0.0f;
    sys->current_ctrl_d.x2 = 0.0f;
    sys->current_ctrl_q.x1 = 0.0f;
    sys->current_ctrl_q.x2 = 0.0f;
    sys->voltage_ctrl.integral = 0.0f;
    
    /* Reset references */
    sys->ref.Id_ref = 0.0f;
    sys->ref.Iq_ref = 0.0f;
}

/* ============================================================================
 * CLARKE TRANSFORMATION (abc -> αβ)
 * ========================================================================== */
void Clarke_Transform(float32_t a, float32_t b, float32_t c, AlphaBeta_t *ab)
{
    /* Equal amplitude transformation */
    ab->alpha = TWO_THIRDS * (a - 0.5f * b - 0.5f * c);
    ab->beta = TWO_THIRDS * (SQRT3 * 0.5f * b - SQRT3 * 0.5f * c);
}

void InvClarke_Transform(float32_t alpha, float32_t beta, float32_t *a, float32_t *b, float32_t *c)
{
    *a = alpha;
    *b = -0.5f * alpha + SQRT3 * 0.5f * beta;
    *c = -0.5f * alpha - SQRT3 * 0.5f * beta;
}

/* ============================================================================
 * PARK TRANSFORMATION (αβ -> dq)
 * ========================================================================== */
void Park_Transform(float32_t alpha, float32_t beta, float32_t theta, Dq_t *dq)
{
    float32_t sin_theta, cos_theta;
    arm_sin_cos_f32(theta * (180.0f / 3.14159f), &sin_theta, &cos_theta);
    
    dq->d = alpha * cos_theta + beta * sin_theta;
    dq->q = -alpha * sin_theta + beta * cos_theta;
}

void InvPark_Transform(float32_t d, float32_t q, float32_t theta, float32_t *alpha, float32_t *beta)
{
    float32_t sin_theta, cos_theta;
    arm_sin_cos_f32(theta * (180.0f / 3.14159f), &sin_theta, &cos_theta);
    
    *alpha = d * cos_theta - q * sin_theta;
    *beta = d * sin_theta + q * cos_theta;
}

/* ============================================================================
 * PLL (Phase-Locked Loop)
 * ========================================================================== */
void PLL_Init(Pll_t *pll)
{
    pll->theta = 0.0f;
    pll->omega = CURRENT_OMEGA0;
    pll->frequency = GRID_FREQ_NOMINAL_HZ;
    pll->Vd = 0.0f;
    pll->Vq = 0.0f;
    pll->locked = false;
    
    pll->pi.Kp = PLL_KP;
    pll->pi.Ki = PLL_KI;
    pll->pi.integral = CURRENT_OMEGA0;
    pll->pi.output_max = TWO_PI * 70.0f;  // Max 70 Hz
    pll->pi.output_min = TWO_PI * 45.0f;  // Min 45 Hz
}

void PLL_Reset(Pll_t *pll)
{
    pll->theta = 0.0f;
    pll->omega = CURRENT_OMEGA0;
    pll->pi.integral = CURRENT_OMEGA0;
    pll->locked = false;
}

void PLL_Update(Pll_t *pll, float32_t Va, float32_t Vb, float32_t Vc)
{
    AlphaBeta_t V_ab;
    Dq_t V_dq;
    
    /* Clarke transformation */
    Clarke_Transform(Va, Vb, Vc, &V_ab);
    
    /* Park transformation */
    Park_Transform(V_ab.alpha, V_ab.beta, pll->theta, &V_dq);
    
    pll->Vd = V_dq.d;
    pll->Vq = V_dq.q;
    
    /* PI controller on Vq (should be zero when locked) */
    float32_t error = -V_dq.q;  // Negative feedback
    
    pll->pi.integral += pll->pi.Ki * error * CONTROL_TS;
    
    /* Anti-windup */
    if (pll->pi.integral > pll->pi.output_max) pll->pi.integral = pll->pi.output_max;
    if (pll->pi.integral < pll->pi.output_min) pll->pi.integral = pll->pi.output_min;
    
    pll->omega = pll->pi.Kp * error + pll->pi.integral;
    
    /* Limit omega */
    if (pll->omega > pll->pi.output_max) pll->omega = pll->pi.output_max;
    if (pll->omega < pll->pi.output_min) pll->omega = pll->pi.output_min;
    
    /* Integrate to get theta */
    pll->theta += pll->omega * CONTROL_TS;
    
    /* Wrap theta to [0, 2π] */
    if (pll->theta >= TWO_PI) pll->theta -= TWO_PI;
    if (pll->theta < 0.0f) pll->theta += TWO_PI;
    
    /* Calculate frequency */
    pll->frequency = pll->omega / TWO_PI;
    
    /* Check lock condition */
    pll->locked = (fabsf(V_dq.q) < 20.0f) && 
                  (pll->frequency > GRID_FREQ_MIN_HZ) && 
                  (pll->frequency < GRID_FREQ_MAX_HZ);
}

/* ============================================================================
 * PR (Proportional-Resonant) CONTROLLER
 * ========================================================================== */
float32_t PR_Controller(PrController_t *pr, float32_t error)
{
    /* Discrete PR controller using Tustin transformation */
    /* Transfer function: Kp + Kr * 2*wc*s / (s^2 + 2*wc*s + w0^2) */
    
    float32_t omega0_sq = pr->omega0 * pr->omega0;
    float32_t wc = pr->omega_c;
    float32_t Ts = CONTROL_TS;
    
    /* State space update for resonant part */
    float32_t x1_new = pr->x1 + Ts * pr->x2;
    float32_t x2_new = pr->x2 + Ts * (-omega0_sq * pr->x1 - 2.0f * wc * pr->x2 + 2.0f * wc * pr->Kr * error);
    
    pr->x1 = x1_new;
    pr->x2 = x2_new;
    
    /* Output: Kp * error + resonant output */
    pr->output = pr->Kp * error + pr->x1;
    
    return pr->output;
}

/* ============================================================================
 * PI CONTROLLER
 * ========================================================================== */
float32_t PI_Controller(PiController_t *pi, float32_t error)
{
    /* Update integral */
    pi->integral += pi->Ki * error * CONTROL_TS;
    
    /* Anti-windup */
    if (pi->integral > pi->output_max) pi->integral = pi->output_max;
    if (pi->integral < pi->output_min) pi->integral = pi->output_min;
    
    /* Calculate output */
    pi->output = pi->Kp * error + pi->integral;
    
    /* Limit output */
    if (pi->output > pi->output_max) pi->output = pi->output_max;
    if (pi->output < pi->output_min) pi->output = pi->output_min;
    
    return pi->output;
}

/* ============================================================================
 * CURRENT CONTROL LOOP
 * ========================================================================== */
void Control_CurrentLoop(SystemData_t *sys)
{
    AlphaBeta_t I_ab, V_ab;
    
    /* Clarke transform currents */
    Clarke_Transform(sys->ac.Ia, sys->ac.Ib, sys->ac.Ic, &I_ab);
    
    /* Park transform to dq */
    Park_Transform(I_ab.alpha, I_ab.beta, sys->pll.theta, &sys->I_dq);
    
    /* Calculate current references from power references */
    if (sys->pll.Vd > 50.0f) {
        /* P = 1.5 * Vd * Id, Q = -1.5 * Vd * Iq */
        sys->ref.Id_ref = (2.0f / 3.0f) * sys->ref.P_ref / sys->pll.Vd;
        sys->ref.Iq_ref = -(2.0f / 3.0f) * sys->ref.Q_ref / sys->pll.Vd;
    }
    
    /* Limit current references */
    float32_t I_limit = IAC_RATED_A;
    
    /* Apply BMS current limits */
    if (sys->power_dir == POWER_DIR_RECTIFIER) {
        float32_t bms_limit = sys->bms.charge_limit * sys->dc.Vdc / (1.5f * sys->pll.Vd);
        if (bms_limit < I_limit) I_limit = bms_limit;
    } else {
        float32_t bms_limit = sys->bms.discharge_limit * sys->dc.Vdc / (1.5f * sys->pll.Vd);
        if (bms_limit < I_limit) I_limit = bms_limit;
    }
    
    if (sys->ref.Id_ref > I_limit) sys->ref.Id_ref = I_limit;
    if (sys->ref.Id_ref < -I_limit) sys->ref.Id_ref = -I_limit;
    if (sys->ref.Iq_ref > I_limit) sys->ref.Iq_ref = I_limit;
    if (sys->ref.Iq_ref < -I_limit) sys->ref.Iq_ref = -I_limit;
    
    /* Current errors */
    float32_t Id_error = sys->ref.Id_ref - sys->I_dq.d;
    float32_t Iq_error = sys->ref.Iq_ref - sys->I_dq.q;
    
    /* PR controllers */
    float32_t Vd_ctrl = PR_Controller(&sys->current_ctrl_d, Id_error);
    float32_t Vq_ctrl = PR_Controller(&sys->current_ctrl_q, Iq_error);
    
    /* Feed-forward and decoupling */
    float32_t omega_L = sys->pll.omega * LC_INDUCTANCE_H;
    
    sys->V_ref_dq.d = Vd_ctrl + sys->pll.Vd - omega_L * sys->I_dq.q;
    sys->V_ref_dq.q = Vq_ctrl + sys->pll.Vq + omega_L * sys->I_dq.d;
}

/* ============================================================================
 * SVPWM FOR 3-LEVEL T-TYPE
 * ========================================================================== */
void SVPWM_Calculate(SvpwmOutput_t *svpwm, float32_t Vd, float32_t Vq, 
                     float32_t theta, float32_t Vdc)
{
    float32_t Valpha, Vbeta;
    float32_t Va, Vb, Vc;
    float32_t Vmax, Vmin, Voffset;
    
    /* Inverse Park transform */
    InvPark_Transform(Vd, Vq, theta, &Valpha, &Vbeta);
    
    /* Inverse Clarke transform */
    InvClarke_Transform(Valpha, Vbeta, &Va, &Vb, &Vc);
    
    /* Normalize by DC voltage (modulation indices) */
    float32_t Vdc_half = Vdc * 0.5f;
    Va /= Vdc_half;
    Vb /= Vdc_half;
    Vc /= Vdc_half;
    
    /* Find min and max for space vector limitation and neutral point balance */
    Vmax = Va;
    if (Vb > Vmax) Vmax = Vb;
    if (Vc > Vmax) Vmax = Vc;
    
    Vmin = Va;
    if (Vb < Vmin) Vmin = Vb;
    if (Vc < Vmin) Vmin = Vc;
    
    /* Add offset for symmetric PWM (min-max injection) */
    Voffset = -0.5f * (Vmax + Vmin);
    
    Va += Voffset;
    Vb += Voffset;
    Vc += Voffset;
    
    /* Limit modulation index to ±1 */
    if (Va > 1.0f) Va = 1.0f;
    if (Va < -1.0f) Va = -1.0f;
    if (Vb > 1.0f) Vb = 1.0f;
    if (Vb < -1.0f) Vb = -1.0f;
    if (Vc > 1.0f) Vc = 1.0f;
    if (Vc < -1.0f) Vc = -1.0f;
    
    /* Store modulation indices */
    svpwm->ma = Va;
    svpwm->mb = Vb;
    svpwm->mc = Vc;
    svpwm->m_max = Vmax;
    
    /* Calculate sector (for monitoring) */
    if (theta < TWO_PI / 6.0f) svpwm->sector = 1;
    else if (theta < 2.0f * TWO_PI / 6.0f) svpwm->sector = 2;
    else if (theta < 3.0f * TWO_PI / 6.0f) svpwm->sector = 3;
    else if (theta < 4.0f * TWO_PI / 6.0f) svpwm->sector = 4;
    else if (theta < 5.0f * TWO_PI / 6.0f) svpwm->sector = 5;
    else svpwm->sector = 6;
    
    /* Convert to HRTIM compare values */
    /* For T-Type: duty = (1 + m) / 2 for upper switch, complementary for lower */
    /* Center-aligned PWM: compare value = period/2 * (1 + m) */
    uint16_t period = HRTIM_PERIOD;
    
    svpwm->duty_a = (uint16_t)((1.0f + Va) * 0.5f * (float32_t)period);
    svpwm->duty_b = (uint16_t)((1.0f + Vb) * 0.5f * (float32_t)period);
    svpwm->duty_c = (uint16_t)((1.0f + Vc) * 0.5f * (float32_t)period);
    
    /* Limit to valid range */
    if (svpwm->duty_a < 10) svpwm->duty_a = 10;
    if (svpwm->duty_a > period - 10) svpwm->duty_a = period - 10;
    if (svpwm->duty_b < 10) svpwm->duty_b = 10;
    if (svpwm->duty_b > period - 10) svpwm->duty_b = period - 10;
    if (svpwm->duty_c < 10) svpwm->duty_c = 10;
    if (svpwm->duty_c > period - 10) svpwm->duty_c = period - 10;
}

/* ============================================================================
 * NEUTRAL POINT BALANCE
 * For 3-level T-Type, inject offset to balance NP voltage
 * ========================================================================== */
float32_t NeutralPointBalance(float32_t Vnp_error, float32_t Ia, float32_t Ib, float32_t Ic)
{
    /* Simple NP balance: adjust the common-mode voltage based on NP error */
    /* The offset direction depends on which phase is carrying current */
    float32_t Kp_np = 0.1f;
    float32_t offset = Kp_np * Vnp_error;
    
    /* Limit offset */
    if (offset > 0.05f) offset = 0.05f;
    if (offset < -0.05f) offset = -0.05f;
    
    return offset;
}

