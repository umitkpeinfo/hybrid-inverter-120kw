import React, { useState } from 'react';
import { Zap, Battery, Cpu, Thermometer, Shield, Radio } from 'lucide-react';

export default function MasterSpecification() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Zap },
    { id: 'electrical', label: 'Electrical', icon: Battery },
    { id: 'semiconductor', label: 'Semiconductors', icon: Cpu },
    { id: 'sensing', label: 'Sensing', icon: Cpu },
    { id: 'magnetics', label: 'Magnetics', icon: Zap },
    { id: 'thermal', label: 'Thermal', icon: Thermometer },
    { id: 'protection', label: 'Protection', icon: Shield },
    { id: 'comm', label: 'Communication', icon: Radio },
  ];

  const SpecRow = ({ label, value, unit, highlight }) => (
    <div className={`flex justify-between py-2 px-3 ${highlight ? 'bg-blue-900/30' : 'hover:bg-gray-700/50'} rounded`}>
      <span className="text-gray-300">{label}</span>
      <span className={`font-mono ${highlight ? 'text-blue-400 font-bold' : 'text-white'}`}>
        {value} {unit && <span className="text-gray-500">{unit}</span>}
      </span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-700 pb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );

  return (
    <div className="w-full bg-gray-900 text-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6">
        <h1 className="text-2xl font-bold">120 kW Hybrid Inverter System</h1>
        <p className="text-blue-200 mt-1">3-Level T-Type | Infineon IMT65R010M2H CoolSiC™ G2</p>
        <div className="flex gap-4 mt-4">
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <div className="text-xs text-gray-400">Rated Power</div>
            <div className="text-xl font-bold text-green-400">120 kW</div>
          </div>
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <div className="text-xs text-gray-400">Peak Efficiency</div>
            <div className="text-xl font-bold text-green-400">99.0%</div>
          </div>
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <div className="text-xs text-gray-400">Topology</div>
            <div className="text-xl font-bold text-blue-400">T-Type</div>
          </div>
          <div className="bg-black/30 px-4 py-2 rounded-lg">
            <div className="text-xs text-gray-400">Document</div>
            <div className="text-xl font-bold text-gray-300">v2.0</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-900' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="System Configuration">
              <SpecRow label="System Type" value="Bidirectional DC-AC Inverter (PCS)" highlight />
              <SpecRow label="Topology" value="3-Level T-Type" highlight />
              <SpecRow label="Operation Mode" value="Four-Quadrant Bidirectional" />
              <SpecRow label="Grid Connection" value="Grid-Tied + Off-Grid" />
              <SpecRow label="Phases" value="3-Phase, 3-Wire (3P3W)" />
              <SpecRow label="Isolation" value="Non-Isolated (Transformerless)" />
            </Section>
            <Section title="Power Ratings">
              <SpecRow label="Rated Power (Inverter)" value="120" unit="kW" highlight />
              <SpecRow label="Rated Power (Rectifier)" value="120" unit="kW" highlight />
              <SpecRow label="Max Apparent Power" value="132" unit="kVA" />
              <SpecRow label="Power Factor Range" value="0.8 lead to 0.8 lag" />
              <SpecRow label="Overload Capability" value="110% for 60s, 150% for 10s" />
            </Section>
            <Section title="Efficiency">
              <SpecRow label="Peak Efficiency (Inverter)" value="≥99.0" unit="%" highlight />
              <SpecRow label="Peak Efficiency (Rectifier)" value="≥98.5" unit="%" highlight />
              <SpecRow label="European Weighted (ηEU)" value="≥98.5" unit="%" />
              <SpecRow label="CEC Efficiency" value="≥98.0" unit="%" />
              <SpecRow label="Round-Trip Efficiency" value="≥97.0" unit="%" />
              <SpecRow label="Total Losses @ Rated" value="~1,200" unit="W" />
            </Section>
            <Section title="Control System">
              <SpecRow label="Microcontroller" value="STM32G474RET6" highlight />
              <SpecRow label="PWM Strategy" value="Space Vector PWM (SVPWM)" />
              <SpecRow label="Switching Frequency" value="100" unit="kHz" highlight />
              <SpecRow label="Control Loop Rate" value="200" unit="kHz" />
              <SpecRow label="Dead Time" value="80" unit="ns" />
            </Section>
          </div>
        )}

        {activeTab === 'electrical' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="DC Input (Battery Side)">
              <SpecRow label="DC Voltage Range" value="700 - 1000" unit="VDC" highlight />
              <SpecRow label="DC Nominal Voltage" value="850" unit="VDC" highlight />
              <SpecRow label="DC Maximum Voltage" value="1100" unit="VDC" />
              <SpecRow label="Full Power Voltage Range" value="750 - 1000" unit="VDC" />
              <SpecRow label="Max DC Current (Discharge)" value="180" unit="A" highlight />
              <SpecRow label="Max DC Current (Charge)" value="180" unit="A" highlight />
              <SpecRow label="DC Current Ripple" value="<5" unit="% p-p" />
            </Section>
            <Section title="AC Output (Grid Side)">
              <SpecRow label="AC Nominal Voltage" value="480" unit="VAC (L-L)" highlight />
              <SpecRow label="AC Voltage Range" value="408 - 528" unit="VAC" />
              <SpecRow label="AC Voltage Tolerance" value="-15% / +10%" unit="" />
              <SpecRow label="Grid Frequency" value="50 / 60" unit="Hz" />
              <SpecRow label="Frequency Range" value="±5" unit="Hz" />
              <SpecRow label="Max AC Current" value="160" unit="A RMS" highlight />
              <SpecRow label="Peak AC Current" value="226" unit="A" />
            </Section>
            <Section title="Power Quality">
              <SpecRow label="Current THD" value="<1.5" unit="%" highlight />
              <SpecRow label="Voltage THD" value="<3" unit="%" />
              <SpecRow label="Power Factor @ Rated" value=">0.99" unit="" />
              <SpecRow label="DC Injection" value="<0.5" unit="% of rated" />
              <SpecRow label="Voltage Unbalance" value="<3" unit="%" />
            </Section>
            <Section title="DC-Link">
              <SpecRow label="DC-Link Configuration" value="Split Capacitor (NP)" />
              <SpecRow label="Total Capacitance" value="≥2" unit="mF" />
              <SpecRow label="Capacitor Voltage Rating" value="600" unit="VDC each" />
              <SpecRow label="NP Voltage Unbalance" value="<2" unit="%" />
              <SpecRow label="Ripple Current Rating" value="≥100" unit="A RMS" />
            </Section>
            <Section title="LCL Filter (Optimized for 100kHz)">
              <SpecRow label="Converter Inductance (Lc)" value="50 - 80" unit="µH" highlight />
              <SpecRow label="Grid Inductance (Lg)" value="15 - 30" unit="µH" />
              <SpecRow label="Filter Capacitance (Cf)" value="10 - 20" unit="µF" />
              <SpecRow label="Damping Resistor (Rd)" value="0.2 - 0.5" unit="Ω" />
              <SpecRow label="Resonance Frequency" value="8 - 15" unit="kHz" />
            </Section>
            <Section title="Grounding & Isolation">
              <SpecRow label="DC Insulation Resistance" value=">1" unit="MΩ" />
              <SpecRow label="AC Insulation Resistance" value=">1" unit="MΩ" />
              <SpecRow label="Hipot Test (DC)" value="2500" unit="VDC / 1min" />
              <SpecRow label="Hipot Test (AC)" value="1800" unit="VAC / 1min" />
            </Section>
          </div>
        )}

        {activeTab === 'semiconductor' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="Primary MOSFET: IMT65R010M2H">
              <SpecRow label="Manufacturer" value="Infineon Technologies" highlight />
              <SpecRow label="Technology" value="CoolSiC™ G2 (2nd Gen)" highlight />
              <SpecRow label="Package" value="PG-HSOF-8 (TOLL)" />
              <SpecRow label="Drain-Source Voltage (VDS)" value="650" unit="V" highlight />
              <SpecRow label="RDS(on) @ 25°C" value="10" unit="mΩ" highlight />
              <SpecRow label="RDS(on) @ 175°C" value="~16" unit="mΩ" />
              <SpecRow label="Continuous Current (ID)" value="168" unit="A @ 25°C" />
              <SpecRow label="Pulsed Current (IDM)" value="400" unit="A" />
              <SpecRow label="Gate Threshold (VGS(th))" value="4.5" unit="V (typ)" />
              <SpecRow label="Max Junction Temp (Tj)" value="175" unit="°C" />
            </Section>
            <Section title="Thermal Characteristics">
              <SpecRow label="RthJC (Junction-Case)" value="0.22" unit="K/W" highlight />
              <SpecRow label="RthCS (Case-Sink)" value="~0.1" unit="K/W" />
              <SpecRow label="Package" value=".XT Interconnect" />
              <SpecRow label="Thermal Cycling" value="Enhanced reliability" />
            </Section>
            <Section title="Switching Characteristics">
              <SpecRow label="Turn-on Energy (Eon)" value="~0.30" unit="mJ" />
              <SpecRow label="Turn-off Energy (Eoff)" value="~0.15" unit="mJ" />
              <SpecRow label="Total Switching (Etot)" value="~0.45" unit="mJ" />
              <SpecRow label="Rise Time (tr)" value="~20" unit="ns" />
              <SpecRow label="Fall Time (tf)" value="~15" unit="ns" />
              <SpecRow label="dV/dt (typical)" value="10-20" unit="kV/µs" />
              <SpecRow label="Reverse Recovery" value="None (SiC body diode)" />
            </Section>
            <Section title="Device Configuration">
              <SpecRow label="Total Device Count" value="36" unit="MOSFETs" highlight />
              <SpecRow label="Devices per Phase" value="12" unit="" />
              <SpecRow label="T1 (Upper Main)" value="2× parallel" unit="" />
              <SpecRow label="T4 (Lower Main)" value="2× parallel" unit="" />
              <SpecRow label="T2-T3 (Bidirectional)" value="4× (2S2P)" unit="" />
              <SpecRow label="Effective RDS(on)/position" value="5" unit="mΩ" />
            </Section>
            <Section title="Gate Drive Requirements">
              <SpecRow label="Turn-on Voltage (VGS_on)" value="+18" unit="V" />
              <SpecRow label="Turn-off Voltage (VGS_off)" value="0 or -4" unit="V" />
              <SpecRow label="Gate Resistor (Rg_on)" value="2.2 - 3.3" unit="Ω" />
              <SpecRow label="Gate Resistor (Rg_off)" value="1.0 - 2.2" unit="Ω" />
              <SpecRow label="Dead Time" value="100 - 200" unit="ns" />
              <SpecRow label="Driver CMTI" value="≥100" unit="kV/µs" highlight />
            </Section>
            <Section title="Estimated Semiconductor Cost">
              <SpecRow label="IMT65R010M2H Unit Cost" value="~$25" unit="each" />
              <SpecRow label="36× MOSFETs" value="~$900" unit="" />
              <SpecRow label="18× Gate Drivers" value="~$150" unit="" />
              <SpecRow label="Total Semiconductor BOM" value="~$1,050" unit="" highlight />
            </Section>
          </div>
        )}

        {activeTab === 'sensing' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="DC Current Sensing">
              <SpecRow label="Sensor Type" value="Shunt Resistor + Diff Amp" highlight />
              <SpecRow label="Shunt Value" value="100" unit="µΩ" />
              <SpecRow label="Shunt Power Rating" value="20" unit="W" />
              <SpecRow label="Amplifier IC" value="INA240A4 (200V/V)" highlight />
              <SpecRow label="Bandwidth" value="400" unit="kHz" />
              <SpecRow label="Accuracy" value="±0.5" unit="%" />
              <SpecRow label="Measurement Range" value="±250" unit="A" />
              <SpecRow label="Output" value="0-3.3V to ADC" />
            </Section>
            <Section title="AC Phase Current Sensing">
              <SpecRow label="Sensor Type" value="Hall Effect (Closed Loop)" highlight />
              <SpecRow label="Sensor Part" value="LEM HLSR 50-P/SP33" highlight />
              <SpecRow label="Nominal Current" value="50" unit="A primary" />
              <SpecRow label="Measurement Range" value="±175" unit="A" />
              <SpecRow label="Accuracy" value="±0.5" unit="%" />
              <SpecRow label="Bandwidth" value="450" unit="kHz" />
              <SpecRow label="Response Time" value="<1" unit="µs" />
              <SpecRow label="Supply Voltage" value="3.3 or 5" unit="V" />
              <SpecRow label="Output" value="Ratio-metric voltage" />
            </Section>
            <Section title="Temperature Sensing - Power Stage">
              <SpecRow label="MOSFET Case Temp" value="NTC Thermistor" highlight />
              <SpecRow label="NTC Type" value="10kΩ @ 25°C (B=3950)" />
              <SpecRow label="Mounting" value="Direct on heatsink near MOSFET" />
              <SpecRow label="Sensors per Phase" value="2" unit="min" />
              <SpecRow label="Total Sensors" value="6-8" unit="" />
              <SpecRow label="Accuracy" value="±1" unit="°C" />
              <SpecRow label="Range" value="-40 to +150" unit="°C" />
            </Section>
            <Section title="Temperature Sensing - System">
              <SpecRow label="Ambient Sensor" value="NTC or Digital (DS18B20)" />
              <SpecRow label="Inductor Temp" value="NTC embedded in winding" />
              <SpecRow label="Capacitor Temp" value="NTC on DC-link cap" />
              <SpecRow label="PCB Temp" value="NTC on control board" />
              <SpecRow label="ADC Resolution" value="12-bit" unit="" />
              <SpecRow label="Sampling Rate" value="1" unit="kHz" />
              <SpecRow label="Over-temp Response" value="<10" unit="ms" />
            </Section>
            <Section title="Voltage Sensing">
              <SpecRow label="DC Bus Sensing" value="Resistor Divider + Diff Amp" highlight />
              <SpecRow label="Divider Ratio" value="301:1" unit="" />
              <SpecRow label="Isolation" value="AMC1311 (Isolated Amp)" />
              <SpecRow label="DC Accuracy" value="±0.5" unit="%" />
              <SpecRow label="AC Phase Sensing" value="Resistor Divider" />
              <SpecRow label="Neutral Point" value="Differential measurement" />
              <SpecRow label="Sampling Rate" value="100" unit="kHz/channel" />
            </Section>
            <Section title="Signal Conditioning">
              <SpecRow label="Anti-Alias Filter" value="2nd order RC" highlight />
              <SpecRow label="Cutoff Frequency" value="50" unit="kHz" />
              <SpecRow label="ADC" value="STM32G474 internal 12-bit" />
              <SpecRow label="Sampling" value="Synchronized with PWM" />
              <SpecRow label="Oversampling" value="4x (14-bit effective)" />
              <SpecRow label="Protection" value="TVS + Series R on inputs" />
            </Section>
          </div>
        )}

        {activeTab === 'magnetics' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="AC Filter Inductor (Lc) - Per Phase">
              <SpecRow label="Inductance" value="60" unit="µH" highlight />
              <SpecRow label="Current Rating" value="180" unit="A RMS" />
              <SpecRow label="Saturation Current" value="270" unit="A" />
              <SpecRow label="Core Material" value="Amorphous / Nanocrystalline" highlight />
              <SpecRow label="Core Type" value="Toroidal or EE-Core" />
              <SpecRow label="Winding" value="Litz wire (AWG 38 × 500)" />
              <SpecRow label="DC Resistance" value="<2" unit="mΩ" />
              <SpecRow label="Max Temp Rise" value="60" unit="°C" />
              <SpecRow label="Quantity" value="3" unit="(one per phase)" />
            </Section>
            <Section title="Grid Inductor (Lg) - Per Phase">
              <SpecRow label="Inductance" value="20" unit="µH" highlight />
              <SpecRow label="Current Rating" value="180" unit="A RMS" />
              <SpecRow label="Core Material" value="Amorphous / Powder Core" />
              <SpecRow label="Winding" value="Litz wire" />
              <SpecRow label="DC Resistance" value="<1" unit="mΩ" />
              <SpecRow label="Quantity" value="3" unit="(one per phase)" />
            </Section>
            <Section title="Common Mode Choke">
              <SpecRow label="CM Inductance" value="2-5" unit="mH" />
              <SpecRow label="DM Inductance" value="<10" unit="µH (low)" />
              <SpecRow label="Current Rating" value="180" unit="A" />
              <SpecRow label="Core Material" value="Nanocrystalline" highlight />
              <SpecRow label="Attenuation" value=">30 dB @ 150kHz" />
              <SpecRow label="Purpose" value="EMI suppression" />
            </Section>
            <Section title="DC-Link Inductor (Optional)">
              <SpecRow label="Inductance" value="50-100" unit="µH" />
              <SpecRow label="Current Rating" value="180" unit="A" />
              <SpecRow label="Core Material" value="Iron Powder / Sendust" />
              <SpecRow label="Purpose" value="Ripple reduction from battery" />
              <SpecRow label="Note" value="Required if battery cable >5m" />
            </Section>
            <Section title="Auxiliary Transformer (Isolated Supply)">
              <SpecRow label="Type" value="Gate Driver Isolated DC-DC" highlight />
              <SpecRow label="Topology" value="Push-Pull or Flyback" />
              <SpecRow label="Primary Voltage" value="12-24" unit="VDC" />
              <SpecRow label="Secondary Voltage" value="+18V / -4V (per driver)" />
              <SpecRow label="Power per Output" value="2" unit="W" />
              <SpecRow label="Isolation Voltage" value=">5" unit="kVRMS" />
              <SpecRow label="CMTI" value=">200" unit="kV/µs" />
              <SpecRow label="Quantity" value="9-18" unit="(isolated supplies)" />
            </Section>
            <Section title="Magnetic Design Constraints">
              <SpecRow label="Switching Frequency" value="100" unit="kHz" highlight />
              <SpecRow label="Core Loss Limit" value="100" unit="W/kg" />
              <SpecRow label="Flux Density (Bmax)" value="0.3-0.5" unit="T" />
              <SpecRow label="Fill Factor" value="40-50" unit="%" />
              <SpecRow label="Thermal Class" value="H (180°C)" />
              <SpecRow label="Total Inductor Losses" value="<150" unit="W" />
            </Section>
          </div>
        )}

        {activeTab === 'thermal' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="Operating Environment">
              <SpecRow label="Ambient Temp Range" value="-30 to +60" unit="°C" highlight />
              <SpecRow label="Storage Temp Range" value="-40 to +85" unit="°C" />
              <SpecRow label="Full Power Ambient" value="≤45" unit="°C" />
              <SpecRow label="Derating Start Temp" value="45" unit="°C" />
              <SpecRow label="Relative Humidity" value="5 - 95" unit="% (non-cond)" />
              <SpecRow label="Max Altitude" value="2000" unit="m" />
              <SpecRow label="Derating >1000m" value="1%/100m" unit="" />
            </Section>
            <Section title="Thermal Limits">
              <SpecRow label="MOSFET Tj Max" value="175" unit="°C" />
              <SpecRow label="MOSFET Tj Operating" value="≤150" unit="°C" highlight />
              <SpecRow label="Derating Start (Tj)" value="125" unit="°C" />
              <SpecRow label="Trip Threshold (Tj)" value="160" unit="°C" />
              <SpecRow label="Heatsink Max Temp" value="85" unit="°C" />
              <SpecRow label="Inductor Max Temp" value="130" unit="°C" />
              <SpecRow label="Capacitor Max Temp" value="85" unit="°C" />
            </Section>
            <Section title="Loss Budget @ 120kW">
              <SpecRow label="Conduction Losses (Main)" value="180" unit="W" />
              <SpecRow label="Conduction Losses (Bidir)" value="120" unit="W" />
              <SpecRow label="Switching Losses (Eon)" value="250" unit="W" />
              <SpecRow label="Switching Losses (Eoff)" value="130" unit="W" />
              <SpecRow label="Body Diode Losses" value="80" unit="W" />
              <SpecRow label="Gate Driver Losses" value="20" unit="W" />
              <SpecRow label="Semiconductor Total" value="780" unit="W" highlight />
              <SpecRow label="LCL Filter Losses" value="300" unit="W" />
              <SpecRow label="DC-Link Cap Losses" value="60" unit="W" />
              <SpecRow label="Auxiliary/Control" value="60" unit="W" />
              <SpecRow label="TOTAL LOSSES" value="1,200" unit="W" highlight />
            </Section>
            <Section title="Cooling System">
              <SpecRow label="Cooling Method" value="Forced Air" highlight />
              <SpecRow label="Fan Configuration" value="2-4× Variable Speed" />
              <SpecRow label="Required Airflow" value="~200" unit="CFM" />
              <SpecRow label="Heatsink Rth (System)" value="≤0.05" unit="K/W" />
              <SpecRow label="TIM Requirement" value="≤0.1" unit="K·cm²/W" />
              <SpecRow label="Acoustic Noise @ Rated" value="≤70" unit="dBA @ 1m" />
              <SpecRow label="Fan Redundancy" value="N+1 (optional)" />
            </Section>
          </div>
        )}

        {activeTab === 'protection' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="DC Side Protection">
              <SpecRow label="DC Over-Voltage Warning" value="1020" unit="VDC" />
              <SpecRow label="DC Over-Voltage Trip" value="1050" unit="VDC" highlight />
              <SpecRow label="DC OV Response Time" value="<10" unit="ms" />
              <SpecRow label="DC Under-Voltage Warning" value="700" unit="VDC" />
              <SpecRow label="DC Under-Voltage Trip" value="680" unit="VDC" highlight />
              <SpecRow label="DC UV Response Time" value="<100" unit="ms" />
              <SpecRow label="DC Over-Current Trip" value="220" unit="A (120%)" />
              <SpecRow label="DC Insulation Fault" value="<1" unit="MΩ" />
            </Section>
            <Section title="AC Side Protection">
              <SpecRow label="AC Over-Voltage Trip" value="+10" unit="% nominal" highlight />
              <SpecRow label="AC Under-Voltage Trip" value="-15" unit="% nominal" highlight />
              <SpecRow label="AC OV/UV Response" value="<100" unit="ms" />
              <SpecRow label="Over-Frequency Trip" value="+0.5" unit="Hz" />
              <SpecRow label="Under-Frequency Trip" value="-0.5" unit="Hz" />
              <SpecRow label="Freq Response Time" value="<100" unit="ms" />
              <SpecRow label="AC Over-Current Trip" value="150" unit="% rated" />
              <SpecRow label="AC OC Response Time" value="<1" unit="ms" />
            </Section>
            <Section title="Semiconductor Protection">
              <SpecRow label="Short Circuit Detection" value=">200" unit="% rated" highlight />
              <SpecRow label="SC Response Time" value="<10" unit="µs" highlight />
              <SpecRow label="DESAT Protection" value="Integrated in driver" />
              <SpecRow label="Soft Turn-off on Fault" value="Yes" />
              <SpecRow label="Shoot-through Prevention" value="Hardware interlock" />
            </Section>
            <Section title="Thermal Protection">
              <SpecRow label="MOSFET Tj Warning" value="125" unit="°C" />
              <SpecRow label="MOSFET Tj Trip" value="160" unit="°C" highlight />
              <SpecRow label="Heatsink Warning" value="75" unit="°C" />
              <SpecRow label="Heatsink Trip" value="85" unit="°C" />
              <SpecRow label="Ambient Warning" value="55" unit="°C" />
              <SpecRow label="Power Derating" value="Linear above 45°C" />
            </Section>
            <Section title="Grid Protection">
              <SpecRow label="Anti-Islanding" value="Passive + Active" highlight />
              <SpecRow label="Island Detection Time" value="<2" unit="s" />
              <SpecRow label="Ground Fault Trip" value=">300" unit="mA" />
              <SpecRow label="LVRT Compliance" value="IEEE 1547 Cat II" />
              <SpecRow label="HVRT Compliance" value="IEEE 1547 Cat II" />
            </Section>
            <Section title="System Protection">
              <SpecRow label="Emergency Stop" value="Hardwired input" highlight />
              <SpecRow label="E-Stop Response" value="Immediate" />
              <SpecRow label="Pre-charge Protection" value="Soft-start circuit" />
              <SpecRow label="Inrush Current Limit" value="<50" unit="A" />
              <SpecRow label="BMS Comm Timeout" value="<5" unit="s" />
              <SpecRow label="Watchdog Timer" value="Enabled" />
            </Section>
          </div>
        )}

        {activeTab === 'comm' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="Digital Communication">
              <SpecRow label="RS485 Interface" value="Modbus RTU" highlight />
              <SpecRow label="RS485 Baud Rate" value="9600 - 115200" unit="bps" />
              <SpecRow label="Ethernet Interface" value="10/100 Mbps" highlight />
              <SpecRow label="Ethernet Protocol" value="Modbus TCP" />
              <SpecRow label="CAN Interface" value="CAN 2.0B / CAN-FD" highlight />
              <SpecRow label="CAN Baud Rate" value="250 - 500" unit="kbps" />
            </Section>
            <Section title="BMS Communication">
              <SpecRow label="BMS Protocol" value="CAN / CANopen" highlight />
              <SpecRow label="SOC Reading" value="0 - 100%" />
              <SpecRow label="SOH Reading" value="0 - 100%" />
              <SpecRow label="Cell Voltages" value="Individual cells" />
              <SpecRow label="Pack Temperature" value="Multi-point" />
              <SpecRow label="Charge/Discharge Limits" value="Dynamic" />
            </Section>
            <Section title="Digital I/O">
              <SpecRow label="Digital Inputs" value="4× (24VDC)" />
              <SpecRow label="DI Functions" value="E-Stop, Remote Enable" />
              <SpecRow label="Digital Outputs" value="4× (Dry Contact)" />
              <SpecRow label="DO Rating" value="250VAC / 5A" />
              <SpecRow label="DO Functions" value="Run, Fault, Ready" />
            </Section>
            <Section title="Monitoring Parameters">
              <SpecRow label="DC Voltage/Current" value="Real-time" />
              <SpecRow label="AC Voltage/Current" value="Per phase" />
              <SpecRow label="Active/Reactive Power" value="Real-time" />
              <SpecRow label="Frequency" value="0.01 Hz resolution" />
              <SpecRow label="Efficiency" value="Calculated" />
              <SpecRow label="Temperatures" value="6+ points" />
              <SpecRow label="Fault History" value="Last 100 events" />
            </Section>
            <Section title="Certifications & Standards">
              <SpecRow label="Safety" value="IEC 62477-1, UL 1741 SB" highlight />
              <SpecRow label="Grid Interconnection" value="IEEE 1547-2018" highlight />
              <SpecRow label="EMC Emissions" value="IEC 61000-6-4" />
              <SpecRow label="EMC Immunity" value="IEC 61000-6-2" />
              <SpecRow label="Surge Withstand" value="IEC 61000-4-5" />
              <SpecRow label="Enclosure Rating" value="IP55" />
            </Section>
            <Section title="Mechanical">
              <SpecRow label="Dimensions (W×H×D)" value="600×2000×600" unit="mm" />
              <SpecRow label="Weight" value="<350" unit="kg" />
              <SpecRow label="Mounting" value="Floor standing" />
              <SpecRow label="Cable Entry" value="Bottom / Top" />
              <SpecRow label="Cooling Air Flow" value="Front to Rear" />
            </Section>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-6 py-4 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>Document: SWE_HybridInverter_MasterSpec_v2.0</span>
          <span>December 2025 | Power Electronics Engineering Team</span>
        </div>
      </div>
    </div>
  );
}
