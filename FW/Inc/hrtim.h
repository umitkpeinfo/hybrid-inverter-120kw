/**
 * @file hrtim.h
 * @brief HRTIM PWM Driver for 100 kHz T-Type Inverter
 * @version 2.1
 */

#ifndef __HRTIM_H
#define __HRTIM_H

#ifdef __cplusplus
extern "C" {
#endif

#include "stm32g4xx_hal.h"

/* HRTIM Initialization */
void HRTIM_Init(HRTIM_HandleTypeDef *hhrtim);

/* PWM Control */
void HRTIM_Start(HRTIM_HandleTypeDef *hhrtim);
void HRTIM_Stop(HRTIM_HandleTypeDef *hhrtim);
void HRTIM_EnableOutputs(HRTIM_HandleTypeDef *hhrtim);
void HRTIM_DisableOutputs(HRTIM_HandleTypeDef *hhrtim);

/* Duty Cycle Update */
void HRTIM_SetDuty(HRTIM_HandleTypeDef *hhrtim, 
                   uint16_t duty_a, uint16_t duty_b, uint16_t duty_c);

/* Dead Time Configuration */
void HRTIM_SetDeadTime(HRTIM_HandleTypeDef *hhrtim, uint16_t dt_rising, uint16_t dt_falling);

#ifdef __cplusplus
}
#endif

#endif /* __HRTIM_H */

