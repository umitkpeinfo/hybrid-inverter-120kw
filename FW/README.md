# 120 kW Hybrid Inverter Firmware

## Overview

Firmware for STM32G474RET6-based 3-Level T-Type hybrid inverter controller.

## Specifications

| Parameter | Value |
|-----------|-------|
| MCU | STM32G474RET6 (ARM Cortex-M4F @ 170 MHz) |
| Switching Frequency | 100 kHz |
| Control Loop Rate | 200 kHz |
| PWM Resolution | 184 ps (HRTIM) |
| Dead Time | 80 ns |
| ADC Channels | 8 (dual ADC, synchronized) |

## Project Structure

```
FW/
├── Inc/                    # Header files
│   ├── config.h           # System configuration parameters
│   ├── types.h            # Type definitions and structures
│   ├── control.h          # Control algorithm headers
│   ├── protection.h       # Protection system headers
│   ├── hrtim.h            # PWM driver headers
│   ├── adc.h              # ADC driver headers
│   ├── modbus.h           # Modbus RTU headers
│   └── can_bms.h          # CAN BMS interface headers
├── Src/                    # Source files
│   ├── main.c             # Main application
│   ├── control.c          # Control algorithms (SVPWM, PLL, PR)
│   ├── protection.c       # Fault detection and protection
│   ├── hrtim.c            # HRTIM PWM driver
│   ├── adc.c              # ADC driver
│   ├── modbus.c           # Modbus RTU handler
│   └── can_bms.c          # CAN BMS communication
└── README.md
```

## Control Architecture

### Control Loops
1. **Current Loop**: PR (Proportional-Resonant) controller @ 2 kHz bandwidth
2. **Voltage Loop**: PI controller @ 200 Hz bandwidth
3. **PLL**: SRF-PLL for grid synchronization @ 50 Hz bandwidth

### SVPWM
- 3-Level Space Vector PWM for T-Type topology
- Neutral point balancing
- Min-Max injection for maximum DC bus utilization

## State Machine

```
INIT → STANDBY → PRECHARGE → READY → GRID_SYNC → RUN_INVERTER/RUN_RECTIFIER
                                   ↓
                                STOPPING
                                   ↓
                                STANDBY
                                   
Any State → FAULT → STANDBY (after clear)
Any State → EMERGENCY (E-Stop)
```

## Protection Features

| Fault | Threshold | Response Time |
|-------|-----------|---------------|
| DC Over-Voltage | 1050 V | < 10 µs |
| DC Under-Voltage | 680 V | < 100 ms |
| AC Over-Current | 240 A (150%) | < 1 ms |
| Short Circuit | 320 A (200%) | < 10 µs |
| MOSFET Over-Temp | 160°C | < 10 ms |
| Anti-Islanding | - | < 2 s |

## Communication

### Modbus RTU (RS485)
- Baud: 9600 - 115200
- Address: Configurable (default 1)
- Holding Registers: 40001+ (R/W)
- Input Registers: 30001+ (R/O)

### CAN-FD (BMS)
- Nominal: 500 kbps
- Data: 2 Mbps
- Protocol: Custom (SOC, SOH, V, I, T, limits)

## Building

1. Install STM32CubeIDE or ARM GCC toolchain
2. Import project
3. Build configuration: Release
4. Flash via ST-Link or SWD

## Hardware Requirements

- STM32G474RET6 (LQFP64)
- 8 MHz external crystal (HSE)
- 170 MHz PLL configuration
- HRTIM outputs on PA8-PA11, PB12-PB15
- ADC inputs on PA0-PA5, PC0-PC3

## License

Proprietary - Power Electronics Engineering Team

## Version History

- v2.1 (Dec 2025): 100 kHz switching, updated control parameters
- v2.0 (Dec 2025): T-Type topology, IMT65R010M2H support
- v1.0 (Nov 2025): Initial release

