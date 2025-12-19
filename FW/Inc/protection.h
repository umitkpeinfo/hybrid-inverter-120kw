/**
 * @file protection.h
 * @brief Protection System Headers
 * @version 2.1
 */

#ifndef __PROTECTION_H
#define __PROTECTION_H

#ifdef __cplusplus
extern "C" {
#endif

#include "types.h"
#include "stm32g4xx_hal.h"

/* Initialization */
void Protection_Init(void);

/* Protection Checks */
bool Protection_CheckFast(SystemData_t *sys);   // Called from ISR
void Protection_CheckSlow(SystemData_t *sys);   // Called from main loop

/* Fault Management */
bool Protection_ClearFault(SystemData_t *sys, FaultCode_t fault);
const char* Protection_GetFaultString(FaultCode_t fault);

#ifdef __cplusplus
}
#endif

#endif /* __PROTECTION_H */

