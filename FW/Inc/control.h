/**
 * @file control.h
 * @brief Control Algorithm Headers
 * @version 2.1
 */

#ifndef __CONTROL_H
#define __CONTROL_H

#ifdef __cplusplus
extern "C" {
#endif

#include "types.h"

/* Initialization */
void Control_Init(void);
void Control_Reset(SystemData_t *sys);

/* Transformations */
void Clarke_Transform(float32_t a, float32_t b, float32_t c, AlphaBeta_t *ab);
void InvClarke_Transform(float32_t alpha, float32_t beta, float32_t *a, float32_t *b, float32_t *c);
void Park_Transform(float32_t alpha, float32_t beta, float32_t theta, Dq_t *dq);
void InvPark_Transform(float32_t d, float32_t q, float32_t theta, float32_t *alpha, float32_t *beta);

/* PLL */
void PLL_Init(Pll_t *pll);
void PLL_Reset(Pll_t *pll);
void PLL_Update(Pll_t *pll, float32_t Va, float32_t Vb, float32_t Vc);

/* Controllers */
float32_t PR_Controller(PrController_t *pr, float32_t error);
float32_t PI_Controller(PiController_t *pi, float32_t error);

/* Control Loops */
void Control_CurrentLoop(SystemData_t *sys);

/* SVPWM */
void SVPWM_Calculate(SvpwmOutput_t *svpwm, float32_t Vd, float32_t Vq, 
                     float32_t theta, float32_t Vdc);

/* Neutral Point Balance */
float32_t NeutralPointBalance(float32_t Vnp_error, float32_t Ia, float32_t Ib, float32_t Ic);

#ifdef __cplusplus
}
#endif

#endif /* __CONTROL_H */

