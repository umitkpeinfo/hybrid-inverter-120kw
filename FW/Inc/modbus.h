/**
 * @file modbus.h
 * @brief Modbus RTU Communication Handler
 * @version 2.1
 */

#ifndef __MODBUS_H
#define __MODBUS_H

#ifdef __cplusplus
extern "C" {
#endif

#include "stm32g4xx_hal.h"

/* Modbus Initialization */
void Modbus_Init(UART_HandleTypeDef *huart);

/* Process Received Messages (called from main loop) */
void Modbus_Process(void);

/* Register Access */
uint16_t Modbus_ReadHoldingRegister(uint16_t address);
void Modbus_WriteHoldingRegister(uint16_t address, uint16_t value);
uint16_t Modbus_ReadInputRegister(uint16_t address);

#ifdef __cplusplus
}
#endif

#endif /* __MODBUS_H */

