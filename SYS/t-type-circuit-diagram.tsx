import React, { useState } from 'react';

export default function TTypeSystemDiagram() {
  const [activeSwitch, setActiveSwitch] = useState(null);
  const [outputState, setOutputState] = useState('O');
  const [view, setView] = useState('circuit');

  const states = {
    'P': { T1: true, T4: false, T2: false, T3: false, voltage: '+Vdc/2 = +425V', color: '#10B981' },
    'O': { T1: false, T4: false, T2: true, T3: true, voltage: '0V (Neutral)', color: '#6366F1' },
    'N': { T1: false, T4: true, T2: false, T3: false, voltage: '-Vdc/2 = -425V', color: '#EF4444' }
  };

  const currentState = states[outputState];

  const Switch = ({ id, x, y, on, label }) => (
    <g 
      className="cursor-pointer"
      onMouseEnter={() => setActiveSwitch(id)}
      onMouseLeave={() => setActiveSwitch(null)}
    >
      <rect 
        x={x-25} y={y-20} width={50} height={40} 
        fill={on ? '#10B981' : '#374151'} 
        stroke={activeSwitch === id ? '#FBBF24' : '#6B7280'}
        strokeWidth={activeSwitch === id ? 3 : 1}
        rx={4}
      />
      <text x={x} y={y-5} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">{label}</text>
      <text x={x} y={y+10} fill={on ? '#D1FAE5' : '#9CA3AF'} textAnchor="middle" fontSize="8">{on ? 'ON' : 'OFF'}</text>
    </g>
  );

  return (
    <div className="w-full bg-gray-900 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">120 kW T-Type Hybrid Inverter</h2>
          <p className="text-sm text-gray-400">Infineon IMT65R010M2H CoolSiC™ G2 | 36 Devices | 100 kHz SVPWM | STM32G474</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 mr-4">
            {['circuit', 'system'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded text-xs ${view === v ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                {v === 'circuit' ? 'Circuit' : 'System'}
              </button>
            ))}
          </div>
          {view === 'circuit' && ['P', 'O', 'N'].map(state => (
            <button key={state} onClick={() => setOutputState(state)}
              className={`px-3 py-1 rounded font-bold text-sm ${
                outputState === state 
                  ? state === 'P' ? 'bg-green-600 text-white' 
                    : state === 'N' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300'}`}>
              {state === 'P' ? '+V' : state === 'N' ? '-V' : '0V'}
            </button>
          ))}
        </div>
      </div>

      {view === 'circuit' ? (
        <svg viewBox="0 0 700 400" className="w-full h-auto bg-gray-800 rounded-lg">
          {/* DC Bus Lines */}
          <line x1={50} y1={50} x2={500} y2={50} stroke="#10B981" strokeWidth={3} />
          <line x1={50} y1={200} x2={300} y2={200} stroke="#6366F1" strokeWidth={3} strokeDasharray="10,5" />
          <line x1={50} y1={350} x2={500} y2={350} stroke="#EF4444" strokeWidth={3} />

          {/* DC Bus Labels */}
          <text x={25} y={55} fill="#10B981" fontSize="11" fontWeight="bold">+Vdc/2</text>
          <text x={25} y={205} fill="#6366F1" fontSize="11" fontWeight="bold">NP</text>
          <text x={25} y={355} fill="#EF4444" fontSize="11" fontWeight="bold">-Vdc/2</text>

          {/* Capacitors */}
          <g transform="translate(80, 100)">
            <line x1={0} y1={0} x2={0} y2={-50} stroke="#10B981" strokeWidth={2} />
            <line x1={-12} y1={0} x2={12} y2={0} stroke="#9CA3AF" strokeWidth={3} />
            <line x1={-12} y1={8} x2={12} y2={8} stroke="#9CA3AF" strokeWidth={3} />
            <line x1={0} y1={8} x2={0} y2={100} stroke="#6366F1" strokeWidth={2} />
            <text x={20} y={4} fill="#9CA3AF" fontSize="9">C1</text>
          </g>
          <g transform="translate(80, 250)">
            <line x1={0} y1={0} x2={0} y2={-50} stroke="#6366F1" strokeWidth={2} />
            <line x1={-12} y1={0} x2={12} y2={0} stroke="#9CA3AF" strokeWidth={3} />
            <line x1={-12} y1={8} x2={12} y2={8} stroke="#9CA3AF" strokeWidth={3} />
            <line x1={0} y1={8} x2={0} y2={100} stroke="#EF4444" strokeWidth={2} />
            <text x={20} y={4} fill="#9CA3AF" fontSize="9">C2</text>
          </g>

          {/* Connection Lines */}
          <line x1={280} y1={50} x2={280} y2={100} stroke={currentState.T1 ? '#10B981' : '#4B5563'} strokeWidth={currentState.T1 ? 3 : 2} />
          <line x1={280} y1={140} x2={280} y2={200} stroke={currentState.T2 ? '#6366F1' : '#4B5563'} strokeWidth={currentState.T2 ? 3 : 2} />
          <line x1={280} y1={200} x2={280} y2={260} stroke={currentState.T3 ? '#6366F1' : '#4B5563'} strokeWidth={currentState.T3 ? 3 : 2} />
          <line x1={280} y1={300} x2={280} y2={350} stroke={currentState.T4 ? '#EF4444' : '#4B5563'} strokeWidth={currentState.T4 ? 3 : 2} />

          {/* Switches */}
          <Switch id="T1" x={280} y={120} on={currentState.T1} label="T1 (2×)" />
          <Switch id="T4" x={280} y={280} on={currentState.T4} label="T4 (2×)" />

          {/* Bidirectional Switch */}
          <rect x={310} y={170} width={100} height={60} fill="none" stroke="#4B5563" strokeWidth={1} strokeDasharray="5,5" rx={6} />
          <text x={360} y={188} fill="#9CA3AF" textAnchor="middle" fontSize="8">Bidirectional</text>
          <g transform="translate(360, 200)">
            <rect x={-35} y={-15} width={70} height={30} fill={currentState.T2 ? '#6366F1' : '#374151'} stroke="#6B7280" rx={4} />
            <text x={0} y={0} fill="white" textAnchor="middle" fontSize="9" fontWeight="bold">T2-T3 (4×)</text>
            <text x={0} y={12} fill={currentState.T2 ? '#C7D2FE' : '#9CA3AF'} textAnchor="middle" fontSize="7">{currentState.T2 ? 'ON' : 'OFF'}</text>
          </g>
          <line x1={325} y1={200} x2={280} y2={200} stroke={currentState.T2 ? '#6366F1' : '#4B5563'} strokeWidth={2} />
          <line x1={395} y1={200} x2={450} y2={200} stroke="#6B7280" strokeWidth={2} />

          {/* Output */}
          <line x1={280} y1={200} x2={550} y2={200} stroke={states[outputState].color} strokeWidth={3} />
          <circle cx={550} cy={200} r={20} fill={states[outputState].color} />
          <text x={550} y={205} fill="white" textAnchor="middle" fontSize="11" fontWeight="bold">OUT</text>

          {/* Current Flow Animation */}
          {outputState !== 'O' && (
            <path 
              d={outputState === 'P' ? "M 280 80 L 280 200 L 520 200" : "M 280 320 L 280 200 L 520 200"}
              fill="none" stroke={states[outputState].color} strokeWidth={4} strokeDasharray="10,5">
              <animate attributeName="stroke-dashoffset" values="0;-30" dur="0.5s" repeatCount="indefinite" />
            </path>
          )}

          {/* Specs Box */}
          <rect x={500} y={50} width={180} height={120} fill="#1F2937" rx={6} />
          <text x={590} y={72} fill="#F9FAFB" textAnchor="middle" fontSize="10" fontWeight="bold">IMT65R010M2H</text>
          <text x={520} y={92} fill="#9CA3AF" fontSize="9">VDS:</text>
          <text x={660} y={92} fill="#10B981" fontSize="9" textAnchor="end">650V</text>
          <text x={520} y={108} fill="#9CA3AF" fontSize="9">RDS(on):</text>
          <text x={660} y={108} fill="#10B981" fontSize="9" textAnchor="end">10mΩ</text>
          <text x={520} y={124} fill="#9CA3AF" fontSize="9">ID:</text>
          <text x={660} y={124} fill="#10B981" fontSize="9" textAnchor="end">168A</text>
          <text x={520} y={140} fill="#9CA3AF" fontSize="9">Devices:</text>
          <text x={660} y={140} fill="#FBBF24" fontSize="9" textAnchor="end">36 total</text>
          <text x={520} y={156} fill="#9CA3AF" fontSize="9">Fsw:</text>
          <text x={660} y={156} fill="#60A5FA" fontSize="9" textAnchor="end">100 kHz</text>

          {/* Output Voltage Display */}
          <rect x={500} y={260} width={180} height={50} fill={states[outputState].color} fillOpacity={0.2} stroke={states[outputState].color} rx={6} />
          <text x={590} y={280} fill={states[outputState].color} textAnchor="middle" fontSize="10">Output Voltage</text>
          <text x={590} y={300} fill="white" textAnchor="middle" fontSize="14" fontWeight="bold">{currentState.voltage}</text>
        </svg>
      ) : (
        <svg viewBox="0 0 800 400" className="w-full h-auto bg-gray-800 rounded-lg">
          {/* System Block Diagram */}
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
            </marker>
          </defs>

          {/* Battery */}
          <rect x={30} y={120} width={100} height={80} fill="#1E40AF" stroke="#3B82F6" strokeWidth={2} rx={6} />
          <text x={80} y={155} fill="white" textAnchor="middle" fontSize="11" fontWeight="bold">BATTERY</text>
          <text x={80} y={175} fill="#93C5FD" textAnchor="middle" fontSize="9">700-1000V</text>
          <text x={80} y={190} fill="#93C5FD" textAnchor="middle" fontSize="9">180A max</text>

          {/* DC-Link */}
          <rect x={170} y={120} width={80} height={80} fill="#4338CA" stroke="#6366F1" strokeWidth={2} rx={6} />
          <text x={210} y={150} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">DC-LINK</text>
          <text x={210} y={168} fill="#A5B4FC" textAnchor="middle" fontSize="9">Split Cap</text>
          <text x={210} y={183} fill="#A5B4FC" textAnchor="middle" fontSize="9">≥2mF</text>

          {/* T-Type Bridge */}
          <rect x={290} y={100} width={140} height={120} fill="#7C3AED" stroke="#A78BFA" strokeWidth={2} rx={6} />
          <text x={360} y={125} fill="white" textAnchor="middle" fontSize="11" fontWeight="bold">T-TYPE</text>
          <text x={360} y={143} fill="#C4B5FD" textAnchor="middle" fontSize="9">IMT65R010M2H</text>
          <text x={360} y={158} fill="#C4B5FD" textAnchor="middle" fontSize="9">36× CoolSiC G2</text>
          <text x={360} y={173} fill="#C4B5FD" textAnchor="middle" fontSize="9">100 kHz SVPWM</text>
          <text x={360} y={195} fill="#10B981" textAnchor="middle" fontSize="11" fontWeight="bold">120 kW | η≥99%</text>

          {/* LCL Filter */}
          <rect x={470} y={120} width={80} height={80} fill="#059669" stroke="#10B981" strokeWidth={2} rx={6} />
          <text x={510} y={150} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">LCL</text>
          <text x={510} y={168} fill="#6EE7B7" textAnchor="middle" fontSize="9">Filter</text>
          <text x={510} y={183} fill="#6EE7B7" textAnchor="middle" fontSize="8">THD<1.5%</text>

          {/* Grid */}
          <rect x={590} y={120} width={100} height={80} fill="#DC2626" stroke="#F87171" strokeWidth={2} rx={6} />
          <text x={640} y={150} fill="white" textAnchor="middle" fontSize="11" fontWeight="bold">GRID</text>
          <text x={640} y={168} fill="#FCA5A5" textAnchor="middle" fontSize="9">480 VAC</text>
          <text x={640} y={183} fill="#FCA5A5" textAnchor="middle" fontSize="9">50/60 Hz</text>

          {/* Controller */}
          <rect x={250} y={280} width={160} height={70} fill="#0891B2" stroke="#22D3EE" strokeWidth={2} rx={6} />
          <text x={330} y={305} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">STM32G474/H743</text>
          <text x={330} y={322} fill="#67E8F9" textAnchor="middle" fontSize="9">Control System</text>
          <text x={330} y={337} fill="#67E8F9" textAnchor="middle" fontSize="8">SVPWM 100kHz • PR Control • PLL</text>

          {/* Protection */}
          <rect x={450} y={280} width={120} height={70} fill="#EA580C" stroke="#FB923C" strokeWidth={2} rx={6} />
          <text x={510} y={305} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">PROTECTION</text>
          <text x={510} y={322} fill="#FDBA74" textAnchor="middle" fontSize="9">OV/UV/OC/OT</text>
          <text x={510} y={337} fill="#FDBA74" textAnchor="middle" fontSize="8">Anti-Island</text>

          {/* Arrows */}
          <line x1={130} y1={160} x2={165} y2={160} stroke="#6B7280" strokeWidth={2} markerEnd="url(#arrow)" />
          <line x1={250} y1={160} x2={285} y2={160} stroke="#6B7280" strokeWidth={2} markerEnd="url(#arrow)" />
          <line x1={430} y1={160} x2={465} y2={160} stroke="#6B7280" strokeWidth={2} markerEnd="url(#arrow)" />
          <line x1={550} y1={160} x2={585} y2={160} stroke="#6B7280" strokeWidth={2} markerEnd="url(#arrow)" />
          <line x1={360} y1={220} x2={360} y2={275} stroke="#6B7280" strokeWidth={2} markerEnd="url(#arrow)" />

          {/* Bidirectional indicators */}
          <text x={145} y={150} fill="#6B7280" fontSize="10">◄►</text>
          <text x={265} y={150} fill="#6B7280" fontSize="10">◄►</text>
          <text x={445} y={150} fill="#6B7280" fontSize="10">◄►</text>

          {/* Key Specs */}
          <rect x={30} y={280} width={180} height={90} fill="#1F2937" stroke="#374151" rx={6} />
          <text x={120} y={300} fill="#F9FAFB" textAnchor="middle" fontSize="10" fontWeight="bold">Key Specifications</text>
          <text x={40} y={318} fill="#9CA3AF" fontSize="9">• Peak Efficiency: ≥99.0%</text>
          <text x={40} y={333} fill="#9CA3AF" fontSize="9">• Total Losses: ~1.2 kW</text>
          <text x={40} y={348} fill="#9CA3AF" fontSize="9">• Current THD: <1.5%</text>
          <text x={40} y={363} fill="#9CA3AF" fontSize="9">• Fsw: 100 kHz</text>
        </svg>
      )}

      {/* Bottom Info Cards */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { label: 'Rated Power', value: '120 kW', color: 'text-green-400' },
          { label: 'Peak Efficiency', value: '≥99.0%', color: 'text-green-400' },
          { label: 'DC Voltage', value: '700-1000V', color: 'text-blue-400' },
          { label: 'AC Output', value: '480 VAC', color: 'text-purple-400' }
        ].map((item, i) => (
          <div key={i} className="bg-gray-800 rounded p-2 text-center">
            <div className="text-xs text-gray-400">{item.label}</div>
            <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {view === 'circuit' && (
        <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400 text-xs">T1 (Upper)</div>
            <div className="text-white font-bold">2× parallel</div>
            <div className="text-green-400 text-xs">650V devices</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400 text-xs">T4 (Lower)</div>
            <div className="text-white font-bold">2× parallel</div>
            <div className="text-green-400 text-xs">650V devices</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400 text-xs">T2-T3 (Bidir)</div>
            <div className="text-white font-bold">4× (2S2P)</div>
            <div className="text-yellow-400 text-xs">Back-to-back</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400 text-xs">Per Phase</div>
            <div className="text-white font-bold">12 devices</div>
            <div className="text-blue-400 text-xs">36 total (3φ)</div>
          </div>
        </div>
      )}
    </div>
  );
}
          {['P', 'O', 'N'].map(state => (
            <button
              key={state}
              onClick={() => setOutputState(state)}
              className={`px-4 py-2 rounded font-bold transition-colors ${
                outputState === state 
                  ? state === 'P' ? 'bg-green-600 text-white' 
                    : state === 'N' ? 'bg-red-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {state === 'P' ? '+Vdc/2' : state === 'N' ? '-Vdc/2' : '0V'}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 600 450" className="w-full h-auto bg-gray-800 rounded-lg">
        {/* DC Bus Lines */}
        <line x1={50} y1={50} x2={400} y2={50} stroke="#10B981" strokeWidth={3} />
        <line x1={50} y1={200} x2={250} y2={200} stroke="#6366F1" strokeWidth={3} strokeDasharray="10,5" />
        <line x1={50} y1={350} x2={400} y2={350} stroke="#EF4444" strokeWidth={3} />

        {/* DC Bus Labels */}
        <text x={30} y={55} fill="#10B981" fontSize="12" fontWeight="bold">+Vdc/2</text>
        <text x={30} y={205} fill="#6366F1" fontSize="12" fontWeight="bold">NP (0V)</text>
        <text x={30} y={355} fill="#EF4444" fontSize="12" fontWeight="bold">-Vdc/2</text>

        {/* Capacitor symbols */}
        <g transform="translate(80, 100)">
          <line x1={0} y1={0} x2={0} y2={-50} stroke="#10B981" strokeWidth={2} />
          <line x1={-15} y1={0} x2={15} y2={0} stroke="#9CA3AF" strokeWidth={3} />
          <line x1={-15} y1={10} x2={15} y2={10} stroke="#9CA3AF" strokeWidth={3} />
          <line x1={0} y1={10} x2={0} y2={100} stroke="#6366F1" strokeWidth={2} />
          <text x={25} y={5} fill="#9CA3AF" fontSize="10">C1</text>
        </g>
        <g transform="translate(80, 250)">
          <line x1={0} y1={0} x2={0} y2={-50} stroke="#6366F1" strokeWidth={2} />
          <line x1={-15} y1={0} x2={15} y2={0} stroke="#9CA3AF" strokeWidth={3} />
          <line x1={-15} y1={10} x2={15} y2={10} stroke="#9CA3AF" strokeWidth={3} />
          <line x1={0} y1={10} x2={0} y2={100} stroke="#EF4444" strokeWidth={2} />
          <text x={25} y={5} fill="#9CA3AF" fontSize="10">C2</text>
        </g>

        {/* Main vertical line */}
        <line x1={250} y1={50} x2={250} y2={100} stroke={currentState.T1 ? '#10B981' : '#4B5563'} strokeWidth={currentState.T1 ? 3 : 2} />
        <line x1={250} y1={140} x2={250} y2={200} stroke={currentState.T2 ? '#6366F1' : '#4B5563'} strokeWidth={currentState.T2 ? 3 : 2} />
        <line x1={250} y1={200} x2={250} y2={260} stroke={currentState.T3 ? '#6366F1' : '#4B5563'} strokeWidth={currentState.T3 ? 3 : 2} />
        <line x1={250} y1={300} x2={250} y2={350} stroke={currentState.T4 ? '#EF4444' : '#4B5563'} strokeWidth={currentState.T4 ? 3 : 2} />

        {/* T1 - Upper Main Switch */}
        <Switch id="T1" x={250} y={120} on={currentState.T1} label="T1" voltage="425V" />
        
        {/* T4 - Lower Main Switch */}
        <Switch id="T4" x={250} y={280} on={currentState.T4} label="T4" voltage="425V" />

        {/* Bidirectional Switch Box */}
        <rect x={280} y={160} width={120} height={80} fill="none" stroke="#4B5563" strokeWidth={1} strokeDasharray="5,5" rx={8} />
        <text x={340} y={180} fill="#9CA3AF" textAnchor="middle" fontSize="9">Bidirectional Switch</text>

        {/* T2-T3 Bidirectional (simplified as one block) */}
        <g transform="translate(340, 200)">
          <rect x={-40} y={-25} width={80} height={50} 
                fill={currentState.T2 ? '#6366F1' : '#374151'} 
                stroke="#6B7280" strokeWidth={1} rx={4} />
          <text x={0} y={-5} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">T2-T3</text>
          <text x={0} y={10} fill={currentState.T2 ? '#C7D2FE' : '#9CA3AF'} textAnchor="middle" fontSize="8">
            {currentState.T2 ? 'ON (NP)' : 'OFF'}
          </text>
        </g>

        {/* Connection from bidirectional to NP */}
        <line x1={300} y1={200} x2={250} y2={200} stroke={currentState.T2 ? '#6366F1' : '#4B5563'} strokeWidth={currentState.T2 ? 3 : 2} />
        
        {/* Connection from bidirectional to output */}
        <line x1={380} y1={200} x2={450} y2={200} stroke={currentState.T2 ? states[outputState].color : '#4B5563'} strokeWidth={2} />

        {/* Output Line */}
        <line x1={250} y1={200} x2={450} y2={200} stroke={states[outputState].color} strokeWidth={3} />
        <line x1={450} y1={200} x2={550} y2={200} stroke={states[outputState].color} strokeWidth={3} />

        {/* Output Terminal */}
        <circle cx={550} cy={200} r={15} fill={states[outputState].color} />
        <text x={550} y={205} fill="white" textAnchor="middle" fontSize="12" fontWeight="bold">OUT</text>

        {/* Current flow indicator */}
        {outputState === 'P' && (
          <g>
            <path d="M 250 80 L 250 200 L 500 200" fill="none" stroke="#10B981" strokeWidth={4} strokeDasharray="10,5">
              <animate attributeName="stroke-dashoffset" values="0;-30" dur="0.5s" repeatCount="indefinite" />
            </path>
            <text x={350} y={170} fill="#10B981" fontSize="10">Current Flow →</text>
          </g>
        )}
        {outputState === 'N' && (
          <g>
            <path d="M 250 320 L 250 200 L 500 200" fill="none" stroke="#EF4444" strokeWidth={4} strokeDasharray="10,5">
              <animate attributeName="stroke-dashoffset" values="0;-30" dur="0.5s" repeatCount="indefinite" />
            </path>
            <text x={350} y={230} fill="#EF4444" fontSize="10">Current Flow →</text>
          </g>
        )}
        {outputState === 'O' && (
          <g>
            <path d="M 80 200 L 250 200 L 500 200" fill="none" stroke="#6366F1" strokeWidth={4} strokeDasharray="10,5">
              <animate attributeName="stroke-dashoffset" values="0;-30" dur="0.5s" repeatCount="indefinite" />
            </path>
            <text x={350} y={170} fill="#6366F1" fontSize="10">Through NP →</text>
          </g>
        )}

        {/* Voltage labels */}
        <rect x={430} y={50} width={120} height={30} fill="#1F2937" rx={4} />
        <text x={490} y={70} fill="#10B981" textAnchor="middle" fontSize="11">+425V (Vdc/2)</text>
        
        <rect x={430} y={340} width={120} height={30} fill="#1F2937" rx={4} />
        <text x={490} y={360} fill="#EF4444" textAnchor="middle" fontSize="11">-425V (Vdc/2)</text>
      </svg>

      {/* State Info Panel */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className={`p-3 rounded-lg ${outputState === 'P' ? 'bg-green-900/50 border border-green-500' : 'bg-gray-800'}`}>
          <div className="font-bold text-white">State P (+)</div>
          <div className="text-sm text-gray-300">T1=ON, T2-T3=OFF, T4=OFF</div>
          <div className="text-sm text-green-400">Output: +Vdc/2 = +425V</div>
        </div>
        <div className={`p-3 rounded-lg ${outputState === 'O' ? 'bg-indigo-900/50 border border-indigo-500' : 'bg-gray-800'}`}>
          <div className="font-bold text-white">State O (0)</div>
          <div className="text-sm text-gray-300">T1=OFF, T2-T3=ON, T4=OFF</div>
          <div className="text-sm text-indigo-400">Output: 0V (Neutral)</div>
        </div>
        <div className={`p-3 rounded-lg ${outputState === 'N' ? 'bg-red-900/50 border border-red-500' : 'bg-gray-800'}`}>
          <div className="font-bold text-white">State N (-)</div>
          <div className="text-sm text-gray-300">T1=OFF, T2-T3=OFF, T4=ON</div>
          <div className="text-sm text-red-400">Output: -Vdc/2 = -425V</div>
        </div>
      </div>

      {/* Device Summary */}
      <div className="mt-4 bg-gray-800 rounded-lg p-4">
        <h3 className="font-bold text-white mb-2">IMT65R010M2H Device Summary (Per Phase)</h3>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">T1 (Upper)</div>
            <div className="text-white font-bold">2× parallel</div>
            <div className="text-green-400 text-xs">Blocks: Vdc/2</div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">T4 (Lower)</div>
            <div className="text-white font-bold">2× parallel</div>
            <div className="text-green-400 text-xs">Blocks: Vdc/2</div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">T2-T3 (Bidir)</div>
            <div className="text-white font-bold">4× (2S2P)</div>
            <div className="text-yellow-400 text-xs">Blocks: Vdc</div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">Total/Phase</div>
            <div className="text-white font-bold">12 devices</div>
            <div className="text-blue-400 text-xs">36 total (3φ)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
