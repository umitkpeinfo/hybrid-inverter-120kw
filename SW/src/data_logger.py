"""
Data Logger Module for 120kW Hybrid Inverter Monitor
Logs operational data to CSV files for analysis
"""

import os
import csv
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
import threading
import queue
import time

from modbus_client import InverterData

logger = logging.getLogger(__name__)


class DataLogger:
    """Async data logger with CSV output"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config.get('logging', {})
        self.enabled = self.config.get('enabled', True)
        self.directory = Path(self.config.get('directory', './logs'))
        self.file_prefix = self.config.get('file_prefix', 'inverter_log')
        self.interval = self.config.get('interval_seconds', 1)
        self.max_file_size = self.config.get('max_file_size_mb', 100) * 1024 * 1024
        
        self.current_file: Optional[Path] = None
        self.csv_writer = None
        self.file_handle = None
        self.data_queue: queue.Queue = queue.Queue()
        self.running = False
        self.thread: Optional[threading.Thread] = None
        
        # Ensure log directory exists
        self.directory.mkdir(parents=True, exist_ok=True)
        
    def start(self):
        """Start the logger thread"""
        if not self.enabled:
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._log_worker, daemon=True)
        self.thread.start()
        logger.info(f"Data logger started, writing to {self.directory}")
        
    def stop(self):
        """Stop the logger thread"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        self._close_file()
        logger.info("Data logger stopped")
        
    def log(self, data: InverterData):
        """Queue data for logging"""
        if self.enabled and self.running:
            self.data_queue.put((datetime.now(), data))
            
    def _log_worker(self):
        """Worker thread for writing data"""
        last_log_time = 0
        
        while self.running:
            try:
                # Get data with timeout
                try:
                    timestamp, data = self.data_queue.get(timeout=0.5)
                except queue.Empty:
                    continue
                    
                # Check interval
                current_time = time.time()
                if current_time - last_log_time < self.interval:
                    continue
                    
                last_log_time = current_time
                
                # Ensure file is open and not too large
                self._ensure_file()
                
                # Write data
                self._write_row(timestamp, data)
                
            except Exception as e:
                logger.error(f"Logger error: {e}")
                
    def _ensure_file(self):
        """Ensure log file is open and within size limits"""
        # Check if we need a new file
        if self.file_handle is None:
            self._open_new_file()
            return
            
        # Check file size
        try:
            if self.current_file.stat().st_size > self.max_file_size:
                self._close_file()
                self._open_new_file()
        except:
            pass
            
    def _open_new_file(self):
        """Open a new log file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.current_file = self.directory / f"{self.file_prefix}_{timestamp}.csv"
        
        self.file_handle = open(self.current_file, 'w', newline='')
        self.csv_writer = csv.writer(self.file_handle)
        
        # Write header
        self.csv_writer.writerow([
            'timestamp',
            'state',
            'fault_code',
            'vdc_v',
            'idc_a',
            'pdc_w',
            'vac_v',
            'iac_a',
            'pac_w',
            'qac_var',
            'frequency_hz',
            'power_factor',
            'temp_heatsink_c',
            'temp_mosfet_c',
            'efficiency_pct',
            'soc_pct',
            'pll_locked',
            'grid_connected',
            'bms_valid'
        ])
        
        logger.info(f"Opened new log file: {self.current_file}")
        
    def _close_file(self):
        """Close current log file"""
        if self.file_handle:
            self.file_handle.close()
            self.file_handle = None
            self.csv_writer = None
            
    def _write_row(self, timestamp: datetime, data: InverterData):
        """Write a data row"""
        if self.csv_writer:
            self.csv_writer.writerow([
                timestamp.isoformat(),
                data.state.name,
                hex(data.fault_code),
                f"{data.vdc:.2f}",
                f"{data.idc:.2f}",
                f"{data.pdc:.1f}",
                f"{data.vac:.2f}",
                f"{data.iac:.2f}",
                f"{data.pac:.1f}",
                f"{data.qac:.1f}",
                f"{data.frequency:.3f}",
                f"{data.power_factor:.4f}",
                f"{data.temp_heatsink:.1f}",
                f"{data.temp_mosfet:.1f}",
                f"{data.efficiency:.2f}",
                f"{data.soc:.2f}",
                data.pll_locked,
                data.grid_connected,
                data.bms_valid
            ])
            self.file_handle.flush()


class EventLogger:
    """Logs events, faults, and state transitions"""
    
    def __init__(self, directory: Path):
        self.directory = directory
        self.directory.mkdir(parents=True, exist_ok=True)
        self.event_file = self.directory / "events.log"
        
    def log_event(self, event_type: str, message: str, data: Optional[Dict] = None):
        """Log an event"""
        timestamp = datetime.now().isoformat()
        
        with open(self.event_file, 'a') as f:
            line = f"{timestamp} [{event_type}] {message}"
            if data:
                line += f" | {data}"
            f.write(line + "\n")
            
        logger.info(f"Event: {event_type} - {message}")
        
    def log_fault(self, fault_code: int, fault_strings: list):
        """Log a fault occurrence"""
        self.log_event(
            "FAULT",
            f"Fault detected: {', '.join(fault_strings)}",
            {"code": hex(fault_code)}
        )
        
    def log_state_change(self, old_state: str, new_state: str):
        """Log a state transition"""
        self.log_event(
            "STATE",
            f"State change: {old_state} -> {new_state}"
        )

