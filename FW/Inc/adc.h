/**
 * @file adc.h
 * @brief ADC Driver for Current, Voltage, and Temperature Sensing
 * @version 2.1
 */

#ifndef __ADC_H
#define __ADC_H

#ifdef __cplusplus
extern "C" {
#endif

#include "stm32g4xx_hal.h"
#include "types.h"

/* ADC Initialization */
void ADC_Init(ADC_HandleTypeDef *hadc1, ADC_HandleTypeDef *hadc2);

/* Start Conversions */
void ADC_Start(ADC_HandleTypeDef *hadc1, ADC_HandleTypeDef *hadc2);

/* Read Results (called from control ISR) */
void ADC_ReadResults(DcMeasurements_t *dc, AcMeasurements_t *ac, Temperatures_t *temps);

/* Calibration */
void ADC_CalibrateOffsets(void);

/* Temperature Conversion */
float32_t ADC_ConvertNtcToTemp(uint16_t adc_value);

#ifdef __cplusplus
}
#endif

#endif /* __ADC_H */

