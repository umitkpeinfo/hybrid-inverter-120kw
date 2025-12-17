import React, { useState } from 'react';

export default function HybridInverterDiagram() {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [viewMode, setViewMode] = useState('power');

  const blockInfo = {
    battery: {
      title: 'Battery Pack Interface',
      specs: ['700-1000 VDC operating range', '850 VDC nominal voltage', '180 A max charge/discharge', 'BMS communication via CAN-FD', 'Pre-charge circuit with soft-start', 'DC contactor with arc suppression'],
      reqs: ['REQ_0101', 'REQ_0102', 'REQ_0105', 'REQ_0404']
    },
    dclink: {
      title: 'DC-Link Capacitor Bank',
      specs: ['Split capacitor topology (NP)', '≥2 mF total capacitance', '2 × 600V film capacitors', 'Voltage balancing via NP control', 'ESR < 5 mΩ total', 'Ripple current: 100 A RMS'],
      reqs: ['REQ_0106', 'REQ_0107', 'REQ_0213']
    },
    inverter: {
      title: '3-Level T-Type Power Stage',
      specs: ['36× Infineon IMT65R010M2H', 'CoolSiC G2: 650V / 10mΩ', '100 kHz SVPWM switching', '2 parallel per position', '80 ns dead time', 'Peak efficiency ≥99.2%'],
      reqs: ['REQ_0140', 'REQ_0141', 'REQ_0142', 'REQ_0213']
    },
    gatedriver: {
      title: 'Isolated Gate Drivers',
      specs: ['18× 1ED3122MU12H drivers', 'CMTI > 200 kV/µs', '+18V/-4V gate drive', 'DESAT protection integrated', 'Propagation delay < 100 ns', '9× isolated DC-DC (MGJ2D series)'],
      reqs: ['REQ_0143', 'REQ_0144', 'REQ_0145']
    },
    lcfilter: {
      title: 'LCL Output Filter (100 kHz)',
      specs: ['Lc: 60 µH/phase (amorphous)', 'Lg: 20 µH/phase', 'Cf: 15 µF/phase (film)', 'THD < 1%', 'Resonance: 10 kHz', 'Litz wire for AC losses'],
      reqs: ['REQ_0129', 'REQ_0130', 'REQ_0131', 'REQ_0503']
    },
    cmchoke: {
      title: 'Common Mode Choke',
      specs: ['Lcm: 3 mH common mode', 'Nanocrystalline core', '180 A rated current', 'Attenuation > 30 dB @ 150 kHz', 'EMI compliance IEC 61000-6-4'],
      reqs: ['REQ_0551', 'REQ_0552']
    },
    grid: {
      title: 'Grid Connection',
      specs: ['480 VAC 3-Phase 3-Wire', '50/60 Hz ± 5 Hz', '160 A RMS per phase', 'PF: 0.8 lead to 0.8 lag', 'IEEE 1547-2018 compliant', 'Anti-islanding < 2s'],
      reqs: ['REQ_0120', 'REQ_0123', 'REQ_0125', 'REQ_0325']
    },
    controller: {
      title: 'STM32G474RET6 Control System',
      specs: ['ARM Cortex-M4F @ 170 MHz', 'HRTIM for 100 kHz PWM', '5× 12-bit ADC (4 MSPS total)', 'Math accelerator (CORDIC)', 'Control loop: 200 kHz', 'SVPWM + NP balance algorithm'],
      reqs: ['REQ_0201', 'REQ_0202', 'REQ_0210', 'REQ_0211']
    },
    currentsense: {
      title: 'Current Sensing Subsystem',
      specs: ['DC: 100 µΩ shunt + INA240A4', 'AC: LEM HLSR 50-P Hall effect', 'Bandwidth: 400-450 kHz', 'Accuracy: ±0.5%', '3 AC phases + 1 DC channel', 'Anti-alias: 50 kHz RC filter'],
      reqs: ['REQ_0180', 'REQ_0181', 'REQ_0182']
    },
    tempsense: {
      title: 'Temperature Monitoring',
      specs: ['8× NTC thermistors (10kΩ)', 'Heatsink: 6 sensors (2/phase)', 'Inductor: 3 embedded sensors', 'Ambient + PCB sensors', 'Range: -40 to +150°C', 'Over-temp trip < 10 ms'],
      reqs: ['REQ_0320', 'REQ_0420', 'REQ_0421']
    },
    voltagesense: {
      title: 'Voltage Sensing',
      specs: ['DC bus: AMC1311 isolated amp', 'Resistor divider 301:1', 'AC phases: Direct divider', 'NP voltage differential', '12-bit ADC, 100 kHz rate', 'Accuracy: ±0.5%'],
      reqs: ['REQ_0183', 'REQ_0184']
    },
    protection: {
      title: 'Protection System',
      specs: ['Hardware DESAT: < 3 µs', 'DC OV: 1050V / 10 ms', 'AC OC: 150% / < 1 ms', 'Short circuit: < 10 µs', 'Anti-islanding: Active + Passive', 'Ground fault: 300 mA trip'],
      reqs: ['REQ_0301', 'REQ_0315', 'REQ_0317', 'REQ_0325']
    },
    rs485: {
      title: 'RS485 / Modbus RTU',
      specs: ['MAX3485 transceiver', 'Baud: 9600 - 115200 bps', 'Half-duplex, 2-wire', '120Ω termination', 'Isolation: SI8641 digital iso', 'Cable length: < 1200 m'],
      reqs: ['REQ_0401']
    },
    ethernet: {
      title: 'Ethernet / Modbus TCP',
      specs: ['10/100 Mbps PHY (LAN8720)', 'RJ45 with magnetics', 'Modbus TCP server', 'Optional MQTT client', 'Static or DHCP IP', 'Web interface for config'],
      reqs: ['REQ_0403']
    },
    canbus: {
      title: 'CAN-FD (BMS Interface)',
      specs: ['TCAN1043 transceiver', 'CAN-FD up to 5 Mbps', 'Isolated via ISO1042', 'BMS data: SOC/SOH/V/I/T', 'Charge/discharge limits', 'Heartbeat monitoring'],
      reqs: ['REQ_0404', 'REQ_0410']
    },
    digitalio: {
      title: 'Digital I/O',
      specs: ['4× Digital Inputs (24 VDC)', 'Opto-isolated inputs', 'Functions: E-Stop, Enable', '4× Relay Outputs (5 A)', 'Functions: Run, Fault, Ready', 'Status LED indicators'],
      reqs: ['REQ_0415', 'REQ_0416']
    },
    auxpower: {
      title: 'Auxiliary Power Supply',
      specs: ['Input: 24 VDC (external)', '3.3V @ 1A (MCU, logic)', '5V @ 2A (sensors, CAN)', '18V @ 0.5A (per gate driver)', '9× isolated gate supplies', 'Efficiency > 90%'],
      reqs: ['REQ_0190', 'REQ_0191']
    }
  };

  const Block = ({ id, x, y, w, h, color, children }) => (
    <g 
      className="cursor-pointer transition-all duration-200"
      onClick={() => setSelectedBlock(selectedBlock === id ? null : id)}
      style={{ filter: selectedBlock === id ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))' : 'none' }}
    >
      <rect
        x={x} y={y} width={w} height={h}
        fill={color}
        stroke={selectedBlock === id ? '#3B82F6' : '#374151'}
        strokeWidth={selectedBlock === id ? 3 : 1.5}
        rx={6}
      />
      {children}
    </g>
  );

  const Arrow = ({ x1, y1, x2, y2, bidirectional = false, color = "#6B7280" }) => (
    <g>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
        <marker id="arrowhead-rev" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <polygon points="10 0, 0 3.5, 10 7" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
        markerStart={bidirectional ? "url(#arrowhead-rev)" : ""}
      />
    </g>
  );

  const SignalLine = ({ x1, y1, x2, y2, color = "#10B981", dashed = true }) => (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray={dashed ? "4,3" : ""}
    />
  );

  return (
    <div className="w-full bg-gray-900 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">120 kW T-Type Hybrid Inverter - System Architecture</h2>
          <p className="text-sm text-gray-400">STM32G474 • IMT65R010M2H CoolSiC G2 • 100 kHz SVPWM</p>
        </div>
        <div className="flex gap-2">
          {['power', 'control', 'sensing', 'comm'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === mode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 1100 700" className="w-full h-auto">
        <rect width="1100" height="700" fill="#111827" />
        
        {/* ===== POWER STAGE ROW ===== */}
        
        {/* Battery */}
        <Block id="battery" x={20} y={80} w={100} h={110} color="#1E40AF">
          <text x={70} y={115} fill="white" textAnchor="middle" fontSize="11" fontWeight="bold">BATTERY</text>
          <text x={70} y={132} fill="#93C5FD" textAnchor="middle" fontSize="9">700-1000V</text>
          <text x={70} y={147} fill="#93C5FD" textAnchor="middle" fontSize="9">180A max</text>
          <text x={70} y={162} fill="#FCD34D" textAnchor="middle" fontSize="8">CAN-FD→BMS</text>
        </Block>

        {/* DC-Link */}
        <Block id="dclink" x={145} y={80} w={85} h={110} color="#4338CA">
          <text x={187} y={115} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">DC-LINK</text>
          <text x={187} y={132} fill="#A5B4FC" textAnchor="middle" fontSize="9">Split Cap</text>
          <text x={187} y={147} fill="#A5B4FC" textAnchor="middle" fontSize="9">≥2 mF</text>
          <text x={187} y={162} fill="#A5B4FC" textAnchor="middle" fontSize="8">NP Balance</text>
        </Block>

        {/* Gate Drivers */}
        <Block id="gatedriver" x={255} y={30} w={130} h={50} color="#9333EA">
          <text x={320} y={50} fill="white" textAnchor="middle" fontSize="9" fontWeight="bold">GATE DRIVERS</text>
          <text x={320} y={65} fill="#E9D5FF" textAnchor="middle" fontSize="8">18× 1ED3122 | CMTI>200kV/µs</text>
        </Block>

        {/* Inverter Bridge */}
        <Block id="inverter" x={255} y={90} w={130} h={130} color="#7C3AED">
          <text x={320} y={118} fill="white" textAnchor="middle" fontSize="11" fontWeight="bold">3-LEVEL</text>
          <text x={320} y={133} fill="white" textAnchor="middle" fontSize="11" fontWeight="bold">T-TYPE</text>
          <text x={320} y={150} fill="#C4B5FD" textAnchor="middle" fontSize="8">IMT65R010M2H</text>
          <text x={320} y={163} fill="#C4B5FD" textAnchor="middle" fontSize="8">36× CoolSiC G2</text>
          <text x={320} y={180} fill="#10B981" textAnchor="middle" fontSize="9" fontWeight="bold">100 kHz SVPWM</text>
          <text x={320} y={198} fill="#FCD34D" textAnchor="middle" fontSize="9" fontWeight="bold">120 kW | η≥99%</text>
        </Block>

        {/* LCL Filter */}
        <Block id="lcfilter" x={410} y={90} w={100} h={90} color="#059669">
          <text x={460} y={118} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">LCL FILTER</text>
          <text x={460} y={135} fill="#6EE7B7" textAnchor="middle" fontSize="8">Lc: 60µH</text>
          <text x={460} y={148} fill="#6EE7B7" textAnchor="middle" fontSize="8">Lg: 20µH</text>
          <text x={460} y={161} fill="#6EE7B7" textAnchor="middle" fontSize="8">Cf: 15µF</text>
        </Block>

        {/* CM Choke */}
        <Block id="cmchoke" x={410} y={190} w={100} h={45} color="#047857">
          <text x={460} y={210} fill="white" textAnchor="middle" fontSize="9" fontWeight="bold">CM CHOKE</text>
          <text x={460} y={225} fill="#6EE7B7" textAnchor="middle" fontSize="8">3mH | EMI Filter</text>
        </Block>

        {/* Grid */}
        <Block id="grid" x={535} y={90} w={100} h={110} color="#DC2626">
          <text x={585} y={120} fill="white" textAnchor="middle" fontSize="11" fontWeight="bold">GRID</text>
          <text x={585} y={137} fill="#FCA5A5" textAnchor="middle" fontSize="9">480 VAC 3φ</text>
          <text x={585} y={152} fill="#FCA5A5" textAnchor="middle" fontSize="9">50/60 Hz</text>
          <text x={585} y={167} fill="#FCA5A5" textAnchor="middle" fontSize="8">IEEE 1547</text>
          <text x={585} y={182} fill="#FCA5A5" textAnchor="middle" fontSize="8">160A max</text>
        </Block>

        {/* Power Flow Arrows */}
        <Arrow x1={120} y1={135} x2={140} y2={135} bidirectional />
        <Arrow x1={230} y1={135} x2={250} y2={135} bidirectional />
        <Arrow x1={385} y1={135} x2={405} y2={135} bidirectional />
        <Arrow x1={510} y1={135} x2={530} y2={135} bidirectional />
        
        {/* Gate driver to inverter */}
        <SignalLine x1={320} y1={80} x2={320} y2={90} color="#9333EA" dashed={false} />

        {/* ===== SENSING ROW ===== */}
        
        {/* Current Sensing */}
        <Block id="currentsense" x={80} y={260} w={120} h={80} color="#0891B2">
          <text x={140} y={285} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">CURRENT SENSE</text>
          <text x={140} y={300} fill="#67E8F9" textAnchor="middle" fontSize="8">DC: Shunt+INA240</text>
          <text x={140} y={313} fill="#67E8F9" textAnchor="middle" fontSize="8">AC: LEM HLSR Hall</text>
          <text x={140} y={326} fill="#67E8F9" textAnchor="middle" fontSize="8">BW: 450kHz | ±0.5%</text>
        </Block>

        {/* Temperature Sensing */}
        <Block id="tempsense" x={220} y={260} w={120} h={80} color="#0E7490">
          <text x={280} y={285} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">TEMP SENSE</text>
          <text x={280} y={300} fill="#67E8F9" textAnchor="middle" fontSize="8">8× NTC Thermistors</text>
          <text x={280} y={313} fill="#67E8F9" textAnchor="middle" fontSize="8">Heatsink + Inductor</text>
          <text x={280} y={326} fill="#67E8F9" textAnchor="middle" fontSize="8">Range: -40 to 150°C</text>
        </Block>

        {/* Voltage Sensing */}
        <Block id="voltagesense" x={360} y={260} w={120} h={80} color="#155E75">
          <text x={420} y={285} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">VOLTAGE SENSE</text>
          <text x={420} y={300} fill="#67E8F9" textAnchor="middle" fontSize="8">DC: AMC1311 Isolated</text>
          <text x={420} y={313} fill="#67E8F9" textAnchor="middle" fontSize="8">AC: Resistor Divider</text>
          <text x={420} y={326} fill="#67E8F9" textAnchor="middle" fontSize="8">NP + Phase Voltages</text>
        </Block>

        {/* Protection */}
        <Block id="protection" x={500} y={260} w={120} h={80} color="#EA580C">
          <text x={560} y={285} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">PROTECTION</text>
          <text x={560} y={300} fill="#FDBA74" textAnchor="middle" fontSize="8">OV/UV/OC/OT/SC</text>
          <text x={560} y={313} fill="#FDBA74" textAnchor="middle" fontSize="8">DESAT < 3µs</text>
          <text x={560} y={326} fill="#FDBA74" textAnchor="middle" fontSize="8">Anti-Island | GND Fault</text>
        </Block>

        {/* Sensing signal lines to power stage */}
        {(viewMode === 'sensing' || viewMode === 'control') && (
          <>
            <SignalLine x1={140} y1={260} x2={140} y2={190} color="#22D3EE" />
            <SignalLine x1={140} y1={190} x2={320} y2={190} color="#22D3EE" />
            <SignalLine x1={280} y1={260} x2={280} y2={220} color="#22D3EE" />
            <SignalLine x1={420} y1={260} x2={420} y2={180} color="#22D3EE" />
            <SignalLine x1={560} y1={260} x2={560} y2={200} color="#FB923C" />
          </>
        )}

        {/* ===== CONTROLLER ===== */}
        
        <Block id="controller" x={170} y={380} w={270} h={100} color="#1D4ED8">
          <text x={305} y={405} fill="white" textAnchor="middle" fontSize="12" fontWeight="bold">STM32G474RET6</text>
          <text x={305} y={422} fill="#93C5FD" textAnchor="middle" fontSize="9">ARM Cortex-M4F @ 170 MHz</text>
          <text x={220} y={440} fill="#60A5FA" textAnchor="middle" fontSize="8">• HRTIM 100kHz PWM</text>
          <text x={220} y={453} fill="#60A5FA" textAnchor="middle" fontSize="8">• 5× ADC 12-bit</text>
          <text x={220} y={466} fill="#60A5FA" textAnchor="middle" fontSize="8">• CORDIC Math</text>
          <text x={370} y={440} fill="#10B981" textAnchor="middle" fontSize="8">• Control: 200 kHz</text>
          <text x={370} y={453} fill="#10B981" textAnchor="middle" fontSize="8">• SVPWM + NP Bal</text>
          <text x={370} y={466} fill="#10B981" textAnchor="middle" fontSize="8">• PR Current Loop</text>
        </Block>

        {/* Controller to sensing connections */}
        {(viewMode === 'sensing' || viewMode === 'control') && (
          <>
            <SignalLine x1={200} y1={380} x2={200} y2={340} color="#22D3EE" />
            <SignalLine x1={280} y1={340} x2={280} y2={380} color="#22D3EE" />
            <SignalLine x1={360} y1={340} x2={360} y2={380} color="#22D3EE" />
          </>
        )}

        {/* Controller to gate drivers */}
        {(viewMode === 'power' || viewMode === 'control') && (
          <>
            <SignalLine x1={305} y1={380} x2={305} y2={55} color="#9333EA" dashed={false} />
            <text x={315} y={250} fill="#9333EA" fontSize="8" transform="rotate(-90, 315, 250)">PWM Signals</text>
          </>
        )}

        {/* ===== COMMUNICATION SECTION ===== */}
        
        {/* RS485 */}
        <Block id="rs485" x={660} y={80} w={90} h={70} color="#6366F1">
          <text x={705} y={105} fill="white" textAnchor="middle" fontSize="9" fontWeight="bold">RS485</text>
          <text x={705} y={120} fill="#A5B4FC" textAnchor="middle" fontSize="8">Modbus RTU</text>
          <text x={705} y={133} fill="#A5B4FC" textAnchor="middle" fontSize="8">115200 bps</text>
        </Block>

        {/* Ethernet */}
        <Block id="ethernet" x={770} y={80} w={90} h={70} color="#4F46E5">
          <text x={815} y={105} fill="white" textAnchor="middle" fontSize="9" fontWeight="bold">ETHERNET</text>
          <text x={815} y={120} fill="#A5B4FC" textAnchor="middle" fontSize="8">Modbus TCP</text>
          <text x={815} y={133} fill="#A5B4FC" textAnchor="middle" fontSize="8">10/100 Mbps</text>
        </Block>

        {/* CAN-FD */}
        <Block id="canbus" x={660} y={170} w={90} h={70} color="#7C3AED">
          <text x={705} y={195} fill="white" textAnchor="middle" fontSize="9" fontWeight="bold">CAN-FD</text>
          <text x={705} y={210} fill="#C4B5FD" textAnchor="middle" fontSize="8">BMS Interface</text>
          <text x={705} y={223} fill="#C4B5FD" textAnchor="middle" fontSize="8">5 Mbps</text>
        </Block>

        {/* Digital I/O */}
        <Block id="digitalio" x={770} y={170} w={90} h={70} color="#8B5CF6">
          <text x={815} y={195} fill="white" textAnchor="middle" fontSize="9" fontWeight="bold">DIGITAL I/O</text>
          <text x={815} y={210} fill="#C4B5FD" textAnchor="middle" fontSize="8">4× DI (24V)</text>
          <text x={815} y={223} fill="#C4B5FD" textAnchor="middle" fontSize="8">4× DO (Relay)</text>
        </Block>

        {/* Aux Power */}
        <Block id="auxpower" x={880} y={80} w={90} h={160} color="#475569">
          <text x={925} y={110} fill="white" textAnchor="middle" fontSize="9" fontWeight="bold">AUX POWER</text>
          <text x={925} y={130} fill="#94A3B8" textAnchor="middle" fontSize="8">24V Input</text>
          <text x={925} y={148} fill="#94A3B8" textAnchor="middle" fontSize="8">→ 3.3V MCU</text>
          <text x={925} y={163} fill="#94A3B8" textAnchor="middle" fontSize="8">→ 5V Sensors</text>
          <text x={925} y={178} fill="#94A3B8" textAnchor="middle" fontSize="8">→ 18V/-4V</text>
          <text x={925} y={193} fill="#94A3B8" textAnchor="middle" fontSize="8">Gate Drivers</text>
          <text x={925} y={213} fill="#FCD34D" textAnchor="middle" fontSize="8">9× Isolated</text>
        </Block>

        {/* Communication signal lines */}
        {(viewMode === 'comm' || viewMode === 'control') && (
          <>
            <SignalLine x1={440} y1={430} x2={660} y2={115} color="#A5B4FC" />
            <SignalLine x1={440} y1={430} x2={770} y2={115} color="#A5B4FC" />
            <SignalLine x1={440} y1={430} x2={660} y2={205} color="#C4B5FD" />
            <SignalLine x1={440} y1={430} x2={770} y2={205} color="#C4B5FD" />
          </>
        )}

        {/* ===== CONTROL ARCHITECTURE DETAIL (visible in control mode) ===== */}
        
        {viewMode === 'control' && (
          <g>
            <rect x={660} y={280} width={300} height={200} fill="#1F2937" rx={8} stroke="#374151" />
            <text x={810} y={305} fill="#F9FAFB" textAnchor="middle" fontSize="11" fontWeight="bold">CONTROL ARCHITECTURE</text>
            
            {/* Control blocks */}
            <rect x={680} y={320} width={80} height={35} fill="#0891B2" rx={4} />
            <text x={720} y={342} fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">PLL</text>
            <text x={720} y={352} fill="#67E8F9" textAnchor="middle" fontSize="7">Grid Sync</text>

            <rect x={780} y={320} width={80} height={35} fill="#0891B2" rx={4} />
            <text x={820} y={342} fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">CURRENT</text>
            <text x={820} y={352} fill="#67E8F9" textAnchor="middle" fontSize="7">PR Control</text>

            <rect x={880} y={320} width={65} height={35} fill="#0891B2" rx={4} />
            <text x={912} y={342} fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">VOLTAGE</text>
            <text x={912} y={352} fill="#67E8F9" textAnchor="middle" fontSize="7">PI Loop</text>

            <rect x={680} y={370} width={80} height={35} fill="#059669" rx={4} />
            <text x={720} y={392} fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">SVPWM</text>
            <text x={720} y={402} fill="#6EE7B7" textAnchor="middle" fontSize="7">100 kHz</text>

            <rect x={780} y={370} width={80} height={35} fill="#059669" rx={4} />
            <text x={820} y={392} fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">NP BALANCE</text>
            <text x={820} y={402} fill="#6EE7B7" textAnchor="middle" fontSize="7">V_np Control</text>

            <rect x={880} y={370} width={65} height={35} fill="#EA580C" rx={4} />
            <text x={912} y={392} fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">PROT</text>
            <text x={912} y={402} fill="#FDBA74" textAnchor="middle" fontSize="7">< 10 µs</text>

            <rect x={680} y={420} width={130} height={35} fill="#7C3AED" rx={4} />
            <text x={745} y={442} fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">STATE MACHINE</text>
            <text x={745} y={452} fill="#C4B5FD" textAnchor="middle" fontSize="7">Startup • Run • Fault</text>

            <rect x={830} y={420} width={115} height={35} fill="#6366F1" rx={4} />
            <text x={887} y={442} fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">COMM HANDLER</text>
            <text x={887} y={452} fill="#A5B4FC" textAnchor="middle" fontSize="7">Modbus • CAN</text>
          </g>
        )}

        {/* ===== LEGEND ===== */}
        <g transform="translate(660, 500)">
          <rect width={310} height={90} fill="#1F2937" rx={8} />
          <text x={155} y={20} fill="#9CA3AF" textAnchor="middle" fontSize="10" fontWeight="bold">Legend - Click blocks for details</text>
          
          <rect x={15} y={35} width={12} height={12} fill="#7C3AED" rx={2} />
          <text x={35} y={45} fill="#9CA3AF" fontSize="9">Power Stage</text>
          
          <rect x={110} y={35} width={12} height={12} fill="#0891B2" rx={2} />
          <text x={130} y={45} fill="#9CA3AF" fontSize="9">Sensing</text>
          
          <rect x={195} y={35} width={12} height={12} fill="#6366F1" rx={2} />
          <text x={215} y={45} fill="#9CA3AF" fontSize="9">Communication</text>

          <line x1={15} y1={65} x2={45} y2={65} stroke="#6B7280" strokeWidth={2} markerEnd="url(#arrowhead)" />
          <text x={55} y={69} fill="#9CA3AF" fontSize="9">Power Flow</text>
          
          <line x1={130} y1={65} x2={160} y2={65} stroke="#22D3EE" strokeWidth={2} strokeDasharray="4,3" />
          <text x={170} y={69} fill="#9CA3AF" fontSize="9">Signal/Data</text>
        </g>

        {/* Key Specifications Box */}
        <g transform="translate(20, 510)">
          <rect width={620} height={80} fill="#1F2937" rx={8} />
          <text x={310} y={22} fill="#10B981" textAnchor="middle" fontSize="11" fontWeight="bold">T-Type Topology + IMT65R010M2H CoolSiC G2 @ 100 kHz</text>
          
          <text x={80} y={45} fill="#9CA3AF" textAnchor="middle" fontSize="10">Peak: 99.2%</text>
          <text x={180} y={45} fill="#9CA3AF" textAnchor="middle" fontSize="10">EU: 98.8%</text>
          <text x={280} y={45} fill="#9CA3AF" textAnchor="middle" fontSize="10">Losses: 1.0kW</text>
          <text x={400} y={45} fill="#9CA3AF" textAnchor="middle" fontSize="10">THD: <1%</text>
          <text x={520} y={45} fill="#9CA3AF" textAnchor="middle" fontSize="10">Fsw: 100kHz</text>
          
          <text x={80} y={65} fill="#60A5FA" textAnchor="middle" fontSize="9">Efficiency</text>
          <text x={180} y={65} fill="#60A5FA" textAnchor="middle" fontSize="9">Weighted</text>
          <text x={280} y={65} fill="#60A5FA" textAnchor="middle" fontSize="9">@ 120kW</text>
          <text x={400} y={65} fill="#60A5FA" textAnchor="middle" fontSize="9">Current</text>
          <text x={520} y={65} fill="#60A5FA" textAnchor="middle" fontSize="9">Switching</text>
        </g>
      </svg>

      {/* Info Panel */}
      {selectedBlock && blockInfo[selectedBlock] && (
        <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-2">{blockInfo[selectedBlock].title}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-blue-400 mb-1">Specifications</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {blockInfo[selectedBlock].specs.map((spec, i) => (
                  <li key={i}>• {spec}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-1">Requirements</h4>
              <div className="flex flex-wrap gap-1">
                {blockInfo[selectedBlock].reqs.map((req, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">{req}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Specs Summary */}
      <div className="mt-4 grid grid-cols-6 gap-2 text-center">
        {[
          { label: 'Rated Power', value: '120 kW', color: 'text-green-400' },
          { label: 'DC Voltage', value: '700-1000V', color: 'text-blue-400' },
          { label: 'AC Output', value: '480 VAC', color: 'text-purple-400' },
          { label: 'Switching', value: '100 kHz', color: 'text-yellow-400' },
          { label: 'Controller', value: 'STM32G474', color: 'text-cyan-400' },
          { label: 'Peak η', value: '≥99.2%', color: 'text-green-400' }
        ].map((item, i) => (
          <div key={i} className="bg-gray-800 rounded p-2">
            <div className="text-xs text-gray-400">{item.label}</div>
            <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
