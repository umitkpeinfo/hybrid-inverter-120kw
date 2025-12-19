# 120 kW Hybrid Inverter Monitoring Software

## Overview

Desktop monitoring and control application for the 120 kW T-Type hybrid inverter system.
Built with Python and CustomTkinter for a modern, cross-platform interface.

## Features

- **Real-time Monitoring**: View all inverter measurements at 2 Hz update rate
- **Control Interface**: Enable/disable inverter, set power references
- **Fault Management**: View active faults, send fault clear commands
- **Data Logging**: Automatic CSV logging of all operational data
- **Modern UI**: Dark/light theme support, responsive layout

## Screenshots

```
┌──────────────────────────────────────────────────────────────────┐
│  🔋 120kW Hybrid Inverter Monitor                    [Connected] │
├────────────────┬──────────────────┬──────────────────────────────┤
│ System Status  │    DC Side       │        AC Side               │
│                │                  │                              │
│ ● RUN_INVERTER │ Voltage: 850 V   │ Voltage (L-L): 480 V        │
│                │ Current: 141 A   │ Current: 160 A              │
│ ● PLL Locked   │ Power: 120 kW    │ Active Power: 118 kW        │
│ ● Grid         │ SOC: 85 %        │ Reactive: 0 kVAr            │
│ ● BMS Valid    │                  │ Frequency: 60.00 Hz         │
│                │                  │ PF: 0.998                   │
│ Power: 118 kW  │                  │                              │
│ Eff: 98.5%     │                  │                              │
├────────────────┼──────────────────┼──────────────────────────────┤
│ Temperatures   │    Control       │    Faults & Alarms           │
│                │                  │                              │
│ Heatsink: 65°C │ [ENABLE][DISABLE]│ ✓ No Faults                  │
│ ████████░░ 76% │                  │                              │
│                │ Power Ref: 100kW │                              │
│ MOSFET: 125°C  │ [━━━━━━━━━━●━━]  │                              │
│ ████████░░ 83% │                  │                              │
│                │ [Send Reference] │                              │
│                │ [Clear Faults]   │                              │
└────────────────┴──────────────────┴──────────────────────────────┘
```

## Installation

### Requirements
- Python 3.9 or higher
- USB-to-RS485 adapter (for serial communication)

### Setup

1. **Create virtual environment:**
   ```bash
   cd SW
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/macOS
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure connection:**
   Edit `config.yaml` to set your COM port and other settings:
   ```yaml
   communication:
     serial:
       port: "COM3"  # or "/dev/ttyUSB0" on Linux
       baudrate: 115200
   ```

## Usage

### Running the Application

```bash
python src/main.py
```

### Command Line Options

```bash
python src/main.py --port COM5        # Override serial port
python src/main.py --theme light      # Use light theme
python src/main.py --no-log          # Disable data logging
```

## Project Structure

```
SW/
├── config.yaml             # Configuration file
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── logs/                  # Data log directory
│   ├── inverter_log_*.csv # Operational data logs
│   └── events.log         # Event/fault log
└── src/
    ├── __init__.py        # Package init
    ├── main.py            # Application entry point
    ├── gui.py             # GUI implementation
    ├── modbus_client.py   # Modbus communication
    └── data_logger.py     # Data logging module
```

## Communication Protocol

### Modbus RTU Register Map

#### Input Registers (Read-Only) - Base 30001

| Address | Name | Scale | Unit |
|---------|------|-------|------|
| 30001 | Status Word | - | - |
| 30002 | Fault Code Low | - | - |
| 30003 | Fault Code High | - | - |
| 30004 | DC Voltage | ×0.01 | V |
| 30005 | DC Current | ×0.01 | A |
| 30006 | DC Power | ×100 | W |
| 30007 | AC Voltage | ×0.01 | V |
| 30008 | AC Current | ×0.01 | A |
| 30009 | AC Active Power | ×100 | W |
| 30010 | AC Reactive Power | ×100 | VAr |
| 30011 | Frequency | ×0.01 | Hz |
| 30012 | Power Factor | ×0.001 | - |
| 30013 | Heatsink Temp | ×0.1 | °C |
| 30014 | MOSFET Temp | ×0.1 | °C |
| 30015 | Efficiency | ×0.01 | % |
| 30016 | Battery SOC | ×0.01 | % |

#### Holding Registers (Read/Write) - Base 40001

| Address | Name | Scale | Unit |
|---------|------|-------|------|
| 40001 | Control Word | - | - |
| 40002 | Mode Select | - | - |
| 40003 | P Reference | ×100 | W |
| 40004 | Q Reference | ×100 | VAr |
| 40005 | PF Reference | ×0.001 | - |
| 40006 | VDC Reference | ×1 | V |

### Status Word Bits

| Bit | Description |
|-----|-------------|
| 0-3 | System State |
| 8 | PLL Locked |
| 9 | Grid Connected |
| 10 | BMS Valid |

### Control Word Bits

| Bit | Description |
|-----|-------------|
| 0 | Enable |
| 4-5 | Mode Select |
| 15 | Clear Faults |

## Data Logging

CSV log files are created in the `logs/` directory with the following format:

```csv
timestamp,state,fault_code,vdc_v,idc_a,pdc_w,...
2025-12-17T10:00:00,RUN_INVERTER,0x0,850.00,141.18,120000.0,...
```

- New file created when reaching max size (default 100 MB)
- Configurable logging interval (default 1 second)
- Event log captures faults and state changes

## Troubleshooting

### Connection Issues

1. **COM port not found**: Check Device Manager for correct port number
2. **Permission denied**: Run as Administrator or check port permissions
3. **Timeout errors**: Verify baud rate matches firmware (115200)
4. **Modbus errors**: Check RS485 adapter wiring (A+, B-, GND)

### Display Issues

1. **Scaling problems**: Set display scaling to 100% or use `--dpi-awareness` flag
2. **Missing values**: Verify inverter is powered and responding

## Development

### Running Tests

```bash
pytest tests/
```

### Code Style

```bash
black src/
flake8 src/
```

## License

Proprietary - Power Electronics Engineering Team

## Version History

- v2.1 (Dec 2025): Updated for 100 kHz switching, improved UI
- v2.0 (Dec 2025): CustomTkinter GUI, data logging
- v1.0 (Nov 2025): Initial release

