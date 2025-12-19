"""
Modbus RTU/TCP Client for 120kW Hybrid Inverter
Handles communication with the STM32G474 controller
"""

import struct
import logging
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from enum import IntEnum

from pymodbus.client import ModbusSerialClient, ModbusTcpClient
from pymodbus.exceptions import ModbusException

logger = logging.getLogger(__name__)


class SystemState(IntEnum):
    """Inverter State Machine States"""
    INIT = 0
    STANDBY = 1
    PRECHARGE = 2
    READY = 3
    GRID_SYNC = 4
    RUN_INVERTER = 5
    RUN_RECTIFIER = 6
    STOPPING = 7
    FAULT = 8
    EMERGENCY = 9


class FaultCode(IntEnum):
    """Fault Code Bit Definitions"""
    NONE = 0x0000
    DC_OVERVOLTAGE = 0x0001
    DC_UNDERVOLTAGE = 0x0002
    DC_OVERCURRENT = 0x0004
    DC_GROUND_FAULT = 0x0008
    AC_OVERVOLTAGE = 0x0010
    AC_UNDERVOLTAGE = 0x0020
    AC_OVERCURRENT = 0x0040
    AC_SHORT_CIRCUIT = 0x0080
    OVER_FREQUENCY = 0x0100
    UNDER_FREQUENCY = 0x0200
    ANTI_ISLANDING = 0x0400
    OVERTEMP_MOSFET = 0x1000
    OVERTEMP_HEATSINK = 0x2000
    OVERTEMP_INDUCTOR = 0x4000
    OVERTEMP_AMBIENT = 0x8000
    BMS_TIMEOUT = 0x10000
    MODBUS_ERROR = 0x20000
    DESAT_DETECTED = 0x100000
    GATE_DRIVER = 0x200000
    NP_IMBALANCE = 0x400000
    PRECHARGE_FAIL = 0x800000
    ESTOP_ACTIVE = 0x1000000
    WATCHDOG = 0x2000000
    INTERNAL_ERROR = 0x4000000


@dataclass
class InverterData:
    """Data structure for inverter measurements"""
    # Status
    state: SystemState = SystemState.INIT
    fault_code: int = 0
    pll_locked: bool = False
    grid_connected: bool = False
    bms_valid: bool = False
    
    # DC Measurements
    vdc: float = 0.0        # V
    idc: float = 0.0        # A
    pdc: float = 0.0        # W
    
    # AC Measurements
    vac: float = 0.0        # V (L-L RMS)
    iac: float = 0.0        # A (RMS)
    pac: float = 0.0        # W
    qac: float = 0.0        # VAr
    frequency: float = 0.0  # Hz
    power_factor: float = 0.0
    
    # Temperatures
    temp_heatsink: float = 0.0  # °C
    temp_mosfet: float = 0.0    # °C
    
    # Performance
    efficiency: float = 0.0  # %
    soc: float = 0.0         # %
    
    # Communication
    connected: bool = False
    last_error: str = ""


class ModbusClient:
    """Modbus client for inverter communication"""
    
    # Register addresses (Modbus convention: 30001 = address 0 for input, 40001 = address 0 for holding)
    INPUT_REG_BASE = 0      # Input registers start at address 0 (30001)
    HOLDING_REG_BASE = 0    # Holding registers start at address 0 (40001)
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize Modbus client with configuration"""
        self.config = config
        self.client: Optional[ModbusSerialClient | ModbusTcpClient] = None
        self.slave_address = config.get('modbus', {}).get('slave_address', 1)
        self.data = InverterData()
        
    def connect(self) -> bool:
        """Establish connection to inverter"""
        try:
            comm_type = self.config.get('type', 'modbus_rtu')
            
            if comm_type == 'modbus_rtu':
                serial_cfg = self.config.get('serial', {})
                self.client = ModbusSerialClient(
                    port=serial_cfg.get('port', 'COM3'),
                    baudrate=serial_cfg.get('baudrate', 115200),
                    parity=serial_cfg.get('parity', 'N'),
                    stopbits=serial_cfg.get('stopbits', 1),
                    timeout=serial_cfg.get('timeout', 1.0)
                )
            else:  # modbus_tcp
                tcp_cfg = self.config.get('tcp', {})
                self.client = ModbusTcpClient(
                    host=tcp_cfg.get('host', '192.168.1.100'),
                    port=tcp_cfg.get('port', 502),
                    timeout=self.config.get('modbus', {}).get('timeout', 1.0)
                )
            
            connected = self.client.connect()
            self.data.connected = connected
            
            if connected:
                logger.info(f"Connected to inverter via {comm_type}")
            else:
                logger.error("Failed to connect to inverter")
                self.data.last_error = "Connection failed"
                
            return connected
            
        except Exception as e:
            logger.error(f"Connection error: {e}")
            self.data.connected = False
            self.data.last_error = str(e)
            return False
    
    def disconnect(self):
        """Close connection"""
        if self.client:
            self.client.close()
            self.data.connected = False
            logger.info("Disconnected from inverter")
    
    def read_all(self) -> InverterData:
        """Read all inverter data"""
        if not self.client or not self.data.connected:
            return self.data
            
        try:
            # Read input registers (30001-30016 = addresses 0-15)
            result = self.client.read_input_registers(
                address=0, count=16, slave=self.slave_address
            )
            
            if result.isError():
                raise ModbusException(f"Read error: {result}")
            
            regs = result.registers
            
            # Parse status word
            status_word = regs[0]
            self.data.state = SystemState(status_word & 0x000F)
            self.data.pll_locked = bool(status_word & 0x0100)
            self.data.grid_connected = bool(status_word & 0x0200)
            self.data.bms_valid = bool(status_word & 0x0400)
            
            # Fault codes (32-bit)
            self.data.fault_code = regs[1] | (regs[2] << 16)
            
            # DC measurements (signed values)
            self.data.vdc = self._to_signed(regs[3]) / 100.0
            self.data.idc = self._to_signed(regs[4]) / 100.0
            self.data.pdc = self._to_signed(regs[5]) * 100.0
            
            # AC measurements
            self.data.vac = self._to_signed(regs[6]) / 100.0
            self.data.iac = self._to_signed(regs[7]) / 100.0
            self.data.pac = self._to_signed(regs[8]) * 100.0
            self.data.qac = self._to_signed(regs[9]) * 100.0
            self.data.frequency = regs[10] / 100.0
            self.data.power_factor = regs[11] / 1000.0
            
            # Temperatures
            self.data.temp_heatsink = self._to_signed(regs[12]) / 10.0
            self.data.temp_mosfet = self._to_signed(regs[13]) / 10.0
            
            # Performance
            self.data.efficiency = regs[14] / 100.0
            self.data.soc = regs[15] / 100.0
            
            self.data.last_error = ""
            
        except Exception as e:
            logger.error(f"Read error: {e}")
            self.data.last_error = str(e)
            
        return self.data
    
    def write_control_word(self, enable: bool, mode: int = 0) -> bool:
        """Write control word to inverter"""
        try:
            control_word = (0x0001 if enable else 0x0000) | (mode << 4)
            result = self.client.write_register(
                address=0, value=control_word, slave=self.slave_address
            )
            return not result.isError()
        except Exception as e:
            logger.error(f"Write error: {e}")
            return False
    
    def write_power_reference(self, p_kw: float, q_kvar: float = 0) -> bool:
        """Write power references"""
        try:
            p_100w = int(p_kw * 10)  # Convert kW to 100W units
            q_100var = int(q_kvar * 10)
            
            self.client.write_register(address=2, value=self._to_unsigned(p_100w), slave=self.slave_address)
            self.client.write_register(address=3, value=self._to_unsigned(q_100var), slave=self.slave_address)
            return True
        except Exception as e:
            logger.error(f"Write error: {e}")
            return False
    
    def clear_faults(self) -> bool:
        """Send fault clear command"""
        try:
            # Write 0x8000 to control word to clear faults
            result = self.client.write_register(
                address=0, value=0x8000, slave=self.slave_address
            )
            return not result.isError()
        except Exception as e:
            logger.error(f"Clear fault error: {e}")
            return False
    
    @staticmethod
    def _to_signed(value: int) -> int:
        """Convert unsigned 16-bit to signed"""
        return value if value < 0x8000 else value - 0x10000
    
    @staticmethod
    def _to_unsigned(value: int) -> int:
        """Convert signed to unsigned 16-bit"""
        return value if value >= 0 else value + 0x10000
    
    def get_fault_strings(self) -> list:
        """Get list of active fault descriptions"""
        faults = []
        code = self.data.fault_code
        
        fault_map = {
            FaultCode.DC_OVERVOLTAGE: "DC Over-Voltage",
            FaultCode.DC_UNDERVOLTAGE: "DC Under-Voltage",
            FaultCode.DC_OVERCURRENT: "DC Over-Current",
            FaultCode.AC_OVERVOLTAGE: "AC Over-Voltage",
            FaultCode.AC_UNDERVOLTAGE: "AC Under-Voltage",
            FaultCode.AC_OVERCURRENT: "AC Over-Current",
            FaultCode.AC_SHORT_CIRCUIT: "Short Circuit",
            FaultCode.OVERTEMP_MOSFET: "MOSFET Over-Temperature",
            FaultCode.OVERTEMP_HEATSINK: "Heatsink Over-Temperature",
            FaultCode.OVER_FREQUENCY: "Over-Frequency",
            FaultCode.UNDER_FREQUENCY: "Under-Frequency",
            FaultCode.ANTI_ISLANDING: "Anti-Islanding",
            FaultCode.BMS_TIMEOUT: "BMS Timeout",
            FaultCode.ESTOP_ACTIVE: "E-Stop Active",
        }
        
        for fault_code, description in fault_map.items():
            if code & fault_code:
                faults.append(description)
                
        return faults if faults else ["No Faults"]
    
    def get_state_string(self) -> str:
        """Get state description"""
        state_map = {
            SystemState.INIT: "Initializing",
            SystemState.STANDBY: "Standby",
            SystemState.PRECHARGE: "Pre-charging",
            SystemState.READY: "Ready",
            SystemState.GRID_SYNC: "Grid Sync",
            SystemState.RUN_INVERTER: "Running (Inverter)",
            SystemState.RUN_RECTIFIER: "Running (Rectifier)",
            SystemState.STOPPING: "Stopping",
            SystemState.FAULT: "FAULT",
            SystemState.EMERGENCY: "EMERGENCY STOP",
        }
        return state_map.get(self.data.state, "Unknown")

