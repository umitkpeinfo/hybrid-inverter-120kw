/**
 * @file can_bms.h
 * @brief CAN-FD BMS Communication Handler
 * @version 2.1
 */

#ifndef __CAN_BMS_H
#define __CAN_BMS_H

#ifdef __cplusplus
extern "C" {
#endif

#include "stm32g4xx_hal.h"
#include "types.h"

/* CAN Initialization */
void CAN_BMS_Init(FDCAN_HandleTypeDef *hfdcan);

/* Process BMS Messages (called from main loop) */
void CAN_BMS_Process(void);

/* Get BMS Data */
BmsData_t* CAN_BMS_GetData(void);

/* Send Commands to BMS */
void CAN_BMS_SendHeartbeat(void);

#ifdef __cplusplus
}
#endif

#endif /* __CAN_BMS_H */

