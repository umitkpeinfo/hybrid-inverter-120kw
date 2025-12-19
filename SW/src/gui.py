"""
120kW Hybrid Inverter Monitor - GUI Application
CustomTkinter-based modern interface
"""

import tkinter as tk
import customtkinter as ctk
from typing import Dict, Any, Optional
import logging
from datetime import datetime
from collections import deque
import threading
import time

from modbus_client import ModbusClient, InverterData, SystemState

logger = logging.getLogger(__name__)


class InverterMonitorApp:
    """Main application window"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.modbus = ModbusClient(config.get('communication', {}))
        self.running = False
        self.update_thread: Optional[threading.Thread] = None
        
        # Data history for trends
        history_len = config.get('display', {}).get('trend_history_seconds', 300)
        self.history = {
            'time': deque(maxlen=history_len),
            'power': deque(maxlen=history_len),
            'vdc': deque(maxlen=history_len),
            'temp': deque(maxlen=history_len),
            'efficiency': deque(maxlen=history_len),
        }
        
        # Setup GUI
        self._setup_window()
        self._create_widgets()
        
    def _setup_window(self):
        """Configure main window"""
        theme = self.config.get('display', {}).get('theme', 'dark')
        ctk.set_appearance_mode(theme)
        ctk.set_default_color_theme("blue")
        
        self.root = ctk.CTk()
        self.root.title("120kW Hybrid Inverter Monitor")
        self.root.geometry("1400x900")
        self.root.minsize(1200, 800)
        
        # Configure grid
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_rowconfigure(1, weight=1)
        
    def _create_widgets(self):
        """Create all GUI widgets"""
        # Header
        self._create_header()
        
        # Main content area
        self.main_frame = ctk.CTkFrame(self.root)
        self.main_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=5)
        self.main_frame.grid_columnconfigure((0, 1, 2), weight=1)
        self.main_frame.grid_rowconfigure((0, 1), weight=1)
        
        # Status panel
        self._create_status_panel()
        
        # DC measurements panel
        self._create_dc_panel()
        
        # AC measurements panel
        self._create_ac_panel()
        
        # Temperature panel
        self._create_temp_panel()
        
        # Control panel
        self._create_control_panel()
        
        # Fault panel
        self._create_fault_panel()
        
        # Footer / Status bar
        self._create_footer()
        
    def _create_header(self):
        """Create header with title and connection status"""
        header = ctk.CTkFrame(self.root, height=80)
        header.grid(row=0, column=0, sticky="ew", padx=10, pady=10)
        header.grid_columnconfigure(1, weight=1)
        
        # Title
        title = ctk.CTkLabel(
            header, 
            text="🔋 120kW Hybrid Inverter Monitor",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title.grid(row=0, column=0, padx=20, pady=10)
        
        # Subtitle
        subtitle = ctk.CTkLabel(
            header,
            text="T-Type | IMT65R010M2H | 100 kHz | STM32G474",
            font=ctk.CTkFont(size=12),
            text_color="gray"
        )
        subtitle.grid(row=1, column=0, padx=20)
        
        # Connection controls
        conn_frame = ctk.CTkFrame(header)
        conn_frame.grid(row=0, column=2, rowspan=2, padx=20, pady=10)
        
        self.port_entry = ctk.CTkEntry(conn_frame, width=100, placeholder_text="COM3")
        self.port_entry.grid(row=0, column=0, padx=5)
        self.port_entry.insert(0, self.config.get('communication', {}).get('serial', {}).get('port', 'COM3'))
        
        self.connect_btn = ctk.CTkButton(
            conn_frame, text="Connect", width=100,
            command=self._toggle_connection
        )
        self.connect_btn.grid(row=0, column=1, padx=5)
        
        self.conn_status = ctk.CTkLabel(conn_frame, text="● Disconnected", text_color="red")
        self.conn_status.grid(row=1, column=0, columnspan=2, pady=5)
        
    def _create_status_panel(self):
        """Create system status panel"""
        panel = ctk.CTkFrame(self.main_frame)
        panel.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
        
        ctk.CTkLabel(panel, text="System Status", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=10)
        
        # State indicator
        self.state_frame = ctk.CTkFrame(panel, fg_color="gray20")
        self.state_frame.pack(fill="x", padx=10, pady=5)
        
        self.state_label = ctk.CTkLabel(
            self.state_frame, text="DISCONNECTED",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        self.state_label.pack(pady=20)
        
        # Status indicators
        indicators_frame = ctk.CTkFrame(panel)
        indicators_frame.pack(fill="x", padx=10, pady=10)
        
        self.indicators = {}
        for i, (key, label) in enumerate([
            ('pll', 'PLL Locked'),
            ('grid', 'Grid Connected'),
            ('bms', 'BMS Valid'),
        ]):
            frame = ctk.CTkFrame(indicators_frame)
            frame.grid(row=i, column=0, sticky="w", pady=2)
            
            ind = ctk.CTkLabel(frame, text="●", text_color="gray", width=20)
            ind.grid(row=0, column=0)
            ctk.CTkLabel(frame, text=label).grid(row=0, column=1, padx=5)
            self.indicators[key] = ind
            
        # Power display
        power_frame = ctk.CTkFrame(panel, fg_color="gray20")
        power_frame.pack(fill="x", padx=10, pady=10)
        
        ctk.CTkLabel(power_frame, text="Active Power", font=ctk.CTkFont(size=12)).pack(pady=5)
        self.power_label = ctk.CTkLabel(
            power_frame, text="0.0 kW",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color="#4ade80"
        )
        self.power_label.pack(pady=10)
        
        # Efficiency
        ctk.CTkLabel(power_frame, text="Efficiency", font=ctk.CTkFont(size=12)).pack(pady=5)
        self.efficiency_label = ctk.CTkLabel(
            power_frame, text="0.0 %",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color="#60a5fa"
        )
        self.efficiency_label.pack(pady=10)
        
    def _create_dc_panel(self):
        """Create DC measurements panel"""
        panel = ctk.CTkFrame(self.main_frame)
        panel.grid(row=0, column=1, sticky="nsew", padx=5, pady=5)
        
        ctk.CTkLabel(panel, text="DC Side", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=10)
        
        # DC measurements
        self.dc_values = {}
        measurements = [
            ('vdc', 'Voltage', 'V', '#fcd34d'),
            ('idc', 'Current', 'A', '#60a5fa'),
            ('pdc', 'Power', 'kW', '#4ade80'),
            ('soc', 'Battery SOC', '%', '#a78bfa'),
        ]
        
        for key, label, unit, color in measurements:
            frame = ctk.CTkFrame(panel)
            frame.pack(fill="x", padx=10, pady=5)
            
            ctk.CTkLabel(frame, text=label, width=100, anchor="w").grid(row=0, column=0, padx=5)
            
            val = ctk.CTkLabel(
                frame, text="---",
                font=ctk.CTkFont(size=18, weight="bold"),
                text_color=color, width=100
            )
            val.grid(row=0, column=1, padx=5)
            
            ctk.CTkLabel(frame, text=unit, width=40).grid(row=0, column=2)
            
            self.dc_values[key] = val
            
    def _create_ac_panel(self):
        """Create AC measurements panel"""
        panel = ctk.CTkFrame(self.main_frame)
        panel.grid(row=0, column=2, sticky="nsew", padx=5, pady=5)
        
        ctk.CTkLabel(panel, text="AC Side", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=10)
        
        # AC measurements
        self.ac_values = {}
        measurements = [
            ('vac', 'Voltage (L-L)', 'V', '#fcd34d'),
            ('iac', 'Current', 'A', '#60a5fa'),
            ('pac', 'Active Power', 'kW', '#4ade80'),
            ('qac', 'Reactive Power', 'kVAr', '#f472b6'),
            ('freq', 'Frequency', 'Hz', '#22d3ee'),
            ('pf', 'Power Factor', '', '#a78bfa'),
        ]
        
        for key, label, unit, color in measurements:
            frame = ctk.CTkFrame(panel)
            frame.pack(fill="x", padx=10, pady=5)
            
            ctk.CTkLabel(frame, text=label, width=120, anchor="w").grid(row=0, column=0, padx=5)
            
            val = ctk.CTkLabel(
                frame, text="---",
                font=ctk.CTkFont(size=18, weight="bold"),
                text_color=color, width=80
            )
            val.grid(row=0, column=1, padx=5)
            
            ctk.CTkLabel(frame, text=unit, width=50).grid(row=0, column=2)
            
            self.ac_values[key] = val
            
    def _create_temp_panel(self):
        """Create temperature panel"""
        panel = ctk.CTkFrame(self.main_frame)
        panel.grid(row=1, column=0, sticky="nsew", padx=5, pady=5)
        
        ctk.CTkLabel(panel, text="Temperatures", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=10)
        
        self.temp_values = {}
        temps = [
            ('heatsink', 'Heatsink', 85),
            ('mosfet', 'MOSFET', 150),
        ]
        
        for key, label, max_temp in temps:
            frame = ctk.CTkFrame(panel)
            frame.pack(fill="x", padx=10, pady=8)
            
            ctk.CTkLabel(frame, text=label, width=100, anchor="w").grid(row=0, column=0, padx=5)
            
            val = ctk.CTkLabel(
                frame, text="---",
                font=ctk.CTkFont(size=16, weight="bold"),
                width=60
            )
            val.grid(row=0, column=1, padx=5)
            ctk.CTkLabel(frame, text="°C", width=30).grid(row=0, column=2)
            
            # Progress bar for temperature
            progress = ctk.CTkProgressBar(frame, width=150)
            progress.grid(row=0, column=3, padx=10)
            progress.set(0)
            
            self.temp_values[key] = (val, progress, max_temp)
            
    def _create_control_panel(self):
        """Create control panel"""
        panel = ctk.CTkFrame(self.main_frame)
        panel.grid(row=1, column=1, sticky="nsew", padx=5, pady=5)
        
        ctk.CTkLabel(panel, text="Control", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=10)
        
        # Enable/Disable buttons
        btn_frame = ctk.CTkFrame(panel)
        btn_frame.pack(pady=10)
        
        self.enable_btn = ctk.CTkButton(
            btn_frame, text="ENABLE", width=100,
            fg_color="green", hover_color="darkgreen",
            command=self._enable_inverter
        )
        self.enable_btn.grid(row=0, column=0, padx=5)
        
        self.disable_btn = ctk.CTkButton(
            btn_frame, text="DISABLE", width=100,
            fg_color="gray", hover_color="darkgray",
            command=self._disable_inverter
        )
        self.disable_btn.grid(row=0, column=1, padx=5)
        
        # Power reference
        ref_frame = ctk.CTkFrame(panel)
        ref_frame.pack(fill="x", padx=10, pady=10)
        
        ctk.CTkLabel(ref_frame, text="Power Reference (kW)").pack(pady=5)
        
        self.power_slider = ctk.CTkSlider(
            ref_frame, from_=-120, to=120, number_of_steps=240,
            command=self._power_slider_changed
        )
        self.power_slider.pack(fill="x", padx=20, pady=5)
        self.power_slider.set(0)
        
        self.power_ref_label = ctk.CTkLabel(ref_frame, text="0 kW")
        self.power_ref_label.pack()
        
        # Send button
        self.send_ref_btn = ctk.CTkButton(
            ref_frame, text="Send Reference",
            command=self._send_power_reference
        )
        self.send_ref_btn.pack(pady=10)
        
        # Clear faults button
        self.clear_fault_btn = ctk.CTkButton(
            panel, text="Clear Faults",
            fg_color="orange", hover_color="darkorange",
            command=self._clear_faults
        )
        self.clear_fault_btn.pack(pady=10)
        
    def _create_fault_panel(self):
        """Create fault display panel"""
        panel = ctk.CTkFrame(self.main_frame)
        panel.grid(row=1, column=2, sticky="nsew", padx=5, pady=5)
        
        ctk.CTkLabel(panel, text="Faults & Alarms", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=10)
        
        # Fault list
        self.fault_text = ctk.CTkTextbox(panel, height=200, state="disabled")
        self.fault_text.pack(fill="both", expand=True, padx=10, pady=10)
        
    def _create_footer(self):
        """Create footer/status bar"""
        footer = ctk.CTkFrame(self.root, height=30)
        footer.grid(row=2, column=0, sticky="ew", padx=10, pady=5)
        
        self.status_label = ctk.CTkLabel(footer, text="Ready", anchor="w")
        self.status_label.pack(side="left", padx=10)
        
        self.time_label = ctk.CTkLabel(footer, text="", anchor="e")
        self.time_label.pack(side="right", padx=10)
        
    def _toggle_connection(self):
        """Connect or disconnect from inverter"""
        if self.modbus.data.connected:
            self._disconnect()
        else:
            self._connect()
            
    def _connect(self):
        """Establish connection"""
        port = self.port_entry.get()
        self.config['communication']['serial']['port'] = port
        self.modbus = ModbusClient(self.config.get('communication', {}))
        
        if self.modbus.connect():
            self.connect_btn.configure(text="Disconnect")
            self.conn_status.configure(text="● Connected", text_color="green")
            self.running = True
            self.update_thread = threading.Thread(target=self._update_loop, daemon=True)
            self.update_thread.start()
            self.status_label.configure(text=f"Connected to {port}")
        else:
            self.status_label.configure(text=f"Connection failed: {self.modbus.data.last_error}")
            
    def _disconnect(self):
        """Close connection"""
        self.running = False
        if self.update_thread:
            self.update_thread.join(timeout=1.0)
        self.modbus.disconnect()
        self.connect_btn.configure(text="Connect")
        self.conn_status.configure(text="● Disconnected", text_color="red")
        self.status_label.configure(text="Disconnected")
        
    def _update_loop(self):
        """Background thread for data updates"""
        update_rate = self.config.get('display', {}).get('update_rate_ms', 500) / 1000.0
        
        while self.running:
            try:
                self.modbus.read_all()
                self.root.after(0, self._update_display)
            except Exception as e:
                logger.error(f"Update error: {e}")
            time.sleep(update_rate)
            
    def _update_display(self):
        """Update all display values (called in main thread)"""
        data = self.modbus.data
        
        # Update state
        state_str = self.modbus.get_state_string()
        self.state_label.configure(text=state_str)
        
        # Color based on state
        if data.state == SystemState.FAULT:
            self.state_frame.configure(fg_color="darkred")
        elif data.state in [SystemState.RUN_INVERTER, SystemState.RUN_RECTIFIER]:
            self.state_frame.configure(fg_color="darkgreen")
        elif data.state == SystemState.READY:
            self.state_frame.configure(fg_color="darkorange")
        else:
            self.state_frame.configure(fg_color="gray20")
            
        # Update indicators
        self.indicators['pll'].configure(text_color="green" if data.pll_locked else "gray")
        self.indicators['grid'].configure(text_color="green" if data.grid_connected else "gray")
        self.indicators['bms'].configure(text_color="green" if data.bms_valid else "gray")
        
        # Update power display
        self.power_label.configure(text=f"{data.pac/1000:.1f} kW")
        self.efficiency_label.configure(text=f"{data.efficiency:.1f} %")
        
        # Update DC values
        self.dc_values['vdc'].configure(text=f"{data.vdc:.1f}")
        self.dc_values['idc'].configure(text=f"{data.idc:.1f}")
        self.dc_values['pdc'].configure(text=f"{data.pdc/1000:.1f}")
        self.dc_values['soc'].configure(text=f"{data.soc:.1f}")
        
        # Update AC values
        self.ac_values['vac'].configure(text=f"{data.vac:.1f}")
        self.ac_values['iac'].configure(text=f"{data.iac:.1f}")
        self.ac_values['pac'].configure(text=f"{data.pac/1000:.1f}")
        self.ac_values['qac'].configure(text=f"{data.qac/1000:.1f}")
        self.ac_values['freq'].configure(text=f"{data.frequency:.2f}")
        self.ac_values['pf'].configure(text=f"{data.power_factor:.3f}")
        
        # Update temperatures
        for key, (val_label, progress, max_temp) in self.temp_values.items():
            temp = getattr(data, f'temp_{key}')
            val_label.configure(text=f"{temp:.1f}")
            progress.set(min(temp / max_temp, 1.0))
            
            # Color based on temperature
            if temp > max_temp * 0.9:
                val_label.configure(text_color="red")
            elif temp > max_temp * 0.75:
                val_label.configure(text_color="orange")
            else:
                val_label.configure(text_color="white")
                
        # Update faults
        faults = self.modbus.get_fault_strings()
        self.fault_text.configure(state="normal")
        self.fault_text.delete("1.0", "end")
        for fault in faults:
            self.fault_text.insert("end", f"⚠ {fault}\n")
        self.fault_text.configure(state="disabled")
        
        # Update time
        self.time_label.configure(text=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        
    def _enable_inverter(self):
        """Send enable command"""
        if self.modbus.write_control_word(enable=True):
            self.status_label.configure(text="Enable command sent")
        else:
            self.status_label.configure(text="Failed to send enable command")
            
    def _disable_inverter(self):
        """Send disable command"""
        if self.modbus.write_control_word(enable=False):
            self.status_label.configure(text="Disable command sent")
        else:
            self.status_label.configure(text="Failed to send disable command")
            
    def _power_slider_changed(self, value):
        """Update power reference label"""
        self.power_ref_label.configure(text=f"{int(value)} kW")
        
    def _send_power_reference(self):
        """Send power reference to inverter"""
        power_kw = self.power_slider.get()
        if self.modbus.write_power_reference(power_kw):
            self.status_label.configure(text=f"Power reference set to {power_kw:.0f} kW")
        else:
            self.status_label.configure(text="Failed to send power reference")
            
    def _clear_faults(self):
        """Send fault clear command"""
        if self.modbus.clear_faults():
            self.status_label.configure(text="Fault clear command sent")
        else:
            self.status_label.configure(text="Failed to clear faults")
            
    def run(self):
        """Start the application"""
        self.root.mainloop()
        
        # Cleanup
        if self.running:
            self._disconnect()

