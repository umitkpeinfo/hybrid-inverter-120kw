import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';

const testData = {
  functional: {
    name: 'Functional Tests',
    tests: [
      { id: 'FT-001', name: 'Bidirectional Power Flow', req: 'REQ_0003A/B', priority: 'Critical', duration: '4h', status: 'pending', criteria: 'P_out ≥ 120 kW ±1% in both directions' },
      { id: 'FT-002', name: 'DC Voltage Range Operation', req: 'REQ_0101', priority: 'High', duration: '2h', status: 'pending', criteria: 'Stable operation 700-1000 VDC' },
      { id: 'FT-003', name: 'AC Voltage Range Operation', req: 'REQ_0122', priority: 'High', duration: '2h', status: 'pending', criteria: 'Operation within 408-528 VAC' },
      { id: 'FT-004', name: 'Grid-Tied Mode Operation', req: 'REQ_0002', priority: 'Critical', duration: '3h', status: 'pending', criteria: 'Stable grid synchronization' },
      { id: 'FT-005', name: 'Off-Grid Mode Operation', req: 'REQ_0220', priority: 'High', duration: '3h', status: 'pending', criteria: 'V/f control with droop' },
      { id: 'FT-006', name: 'Mode Transition', req: 'REQ_0510', priority: 'High', duration: '2h', status: 'pending', criteria: 'Transition < 100 ms' },
      { id: 'FT-007', name: 'Reactive Power Control', req: 'REQ_0215', priority: 'High', duration: '2h', status: 'pending', criteria: 'Q accuracy ±2%' },
      { id: 'FT-008', name: 'Power Factor Adjustment', req: 'REQ_0127', priority: 'Medium', duration: '2h', status: 'pending', criteria: 'PF 0.8 lead to 0.8 lag' },
    ]
  },
  performance: {
    name: 'Performance Tests',
    tests: [
      { id: 'PT-001', name: 'Peak Efficiency (Inverter)', req: 'REQ_0501', priority: 'Critical', duration: '4h', status: 'pending', criteria: 'η ≥ 99.2% (T-Type + IMT65R010M2H @ 100kHz)' },
      { id: 'PT-002', name: 'Peak Efficiency (Rectifier)', req: 'REQ_0501A', priority: 'Critical', duration: '4h', status: 'pending', criteria: 'η ≥ 98.5% (T-Type + SiC)' },
      { id: 'PT-003', name: 'European Weighted Efficiency', req: 'REQ_0502', priority: 'High', duration: '6h', status: 'pending', criteria: 'η_EU ≥ 98.5%' },
      { id: 'PT-004', name: 'Round-Trip Efficiency', req: 'REQ_0501B', priority: 'High', duration: '4h', status: 'pending', criteria: 'η_RT ≥ 97.0%' },
      { id: 'PT-005', name: 'Current THD', req: 'REQ_0503', priority: 'High', duration: '3h', status: 'pending', criteria: 'THD < 0.5% @ 100kHz' },
      { id: 'PT-006', name: 'Power Ramp Rate', req: 'REQ_0216', priority: 'Medium', duration: '2h', status: 'pending', criteria: '1-100% per second' },
    ]
  },
  protection: {
    name: 'Protection Tests',
    tests: [
      { id: 'PR-001', name: 'DC Over-Voltage Protection', req: 'REQ_0301', priority: 'Critical', duration: '2h', status: 'pending', criteria: 'Trip @ 1050V, response < 10ms' },
      { id: 'PR-002', name: 'DC Under-Voltage Protection', req: 'REQ_0303', priority: 'Critical', duration: '2h', status: 'pending', criteria: 'Trip @ 680V, response < 100ms' },
      { id: 'PR-003', name: 'DC Over-Current Protection', req: 'REQ_0305', priority: 'Critical', duration: '2h', status: 'pending', criteria: 'Trip @ 220A (120%)' },
      { id: 'PR-004', name: 'AC Over-Voltage Protection', req: 'REQ_0310', priority: 'Critical', duration: '2h', status: 'pending', criteria: 'Trip @ +10% nominal' },
      { id: 'PR-005', name: 'AC Under-Voltage Protection', req: 'REQ_0311', priority: 'Critical', duration: '2h', status: 'pending', criteria: 'Trip @ -15% nominal' },
      { id: 'PR-006', name: 'AC Over-Current Protection', req: 'REQ_0315', priority: 'Critical', duration: '2h', status: 'pending', criteria: 'Trip @ 150%, response < 1ms' },
      { id: 'PR-007', name: 'Short Circuit Protection', req: 'REQ_0317', priority: 'Critical', duration: '3h', status: 'pending', criteria: 'Clear @ >200%, response < 10µs' },
      { id: 'PR-008', name: 'Over-Temperature (IGBT)', req: 'REQ_0320', priority: 'Critical', duration: '4h', status: 'pending', criteria: 'Derating @ 85°C, trip @ 125°C' },
      { id: 'PR-009', name: 'Anti-Islanding Detection', req: 'REQ_0325', priority: 'Critical', duration: '4h', status: 'pending', criteria: 'Detection < 2 seconds' },
      { id: 'PR-010', name: 'Ground Fault Protection', req: 'REQ_0330', priority: 'Critical', duration: '2h', status: 'pending', criteria: 'Trip @ >300mA' },
      { id: 'PR-011', name: 'Emergency Stop', req: 'REQ_0335', priority: 'Critical', duration: '1h', status: 'pending', criteria: 'Immediate cease of power' },
    ]
  },
  grid: {
    name: 'Grid Compliance Tests',
    tests: [
      { id: 'GC-001', name: 'IEEE 1547 LVRT', req: 'IEEE 1547', priority: 'Critical', duration: '4h', status: 'pending', criteria: 'Per Category II curve' },
      { id: 'GC-002', name: 'IEEE 1547 HVRT', req: 'IEEE 1547', priority: 'Critical', duration: '4h', status: 'pending', criteria: 'Per Category II curve' },
      { id: 'GC-003', name: 'Frequency Ride-Through', req: 'IEEE 1547', priority: 'Critical', duration: '3h', status: 'pending', criteria: 'Per IEEE 1547 FRT curve' },
      { id: 'GC-004', name: 'Reactive Power Capability', req: 'IEEE 1547', priority: 'High', duration: '3h', status: 'pending', criteria: 'Q capability per 1547' },
      { id: 'GC-005', name: 'Frequency Droop Response', req: 'REQ_0221', priority: 'High', duration: '2h', status: 'pending', criteria: '4% droop at rated power' },
      { id: 'GC-006', name: 'Voltage Droop Response', req: 'REQ_0222', priority: 'High', duration: '2h', status: 'pending', criteria: '5% droop at rated Q' },
    ]
  },
  emc: {
    name: 'EMC Tests',
    tests: [
      { id: 'EMC-001', name: 'Conducted Emissions', req: 'REQ_0551', priority: 'High', duration: '4h', status: 'pending', criteria: 'Per IEC 61000-6-4' },
      { id: 'EMC-002', name: 'Radiated Emissions', req: 'REQ_0552', priority: 'High', duration: '4h', status: 'pending', criteria: 'Per IEC 61000-6-4' },
      { id: 'EMC-003', name: 'ESD Immunity', req: 'REQ_0553', priority: 'High', duration: '2h', status: 'pending', criteria: 'Per IEC 61000-4-2' },
      { id: 'EMC-004', name: 'Surge Immunity', req: 'REQ_0732', priority: 'High', duration: '3h', status: 'pending', criteria: '4kV line-earth, 2kV line-line' },
    ]
  },
  environmental: {
    name: 'Environmental Tests',
    tests: [
      { id: 'ENV-001', name: 'Temperature Range', req: 'REQ_0451', priority: 'High', duration: '24h', status: 'pending', criteria: '-30°C to +60°C operation' },
      { id: 'ENV-002', name: 'Thermal Derating', req: 'REQ_0321', priority: 'High', duration: '8h', status: 'pending', criteria: 'Full power @ 45°C' },
      { id: 'ENV-003', name: 'Humidity', req: 'REQ_0452', priority: 'Medium', duration: '48h', status: 'pending', criteria: '5-95% RH non-condensing' },
      { id: 'ENV-004', name: 'IP55 Enclosure', req: 'REQ_0457', priority: 'High', duration: '4h', status: 'pending', criteria: 'Per IEC 60529' },
      { id: 'ENV-005', name: 'Acoustic Noise', req: 'REQ_0459', priority: 'Medium', duration: '2h', status: 'pending', criteria: '≤70 dBA @ 1m' },
    ]
  },
  communication: {
    name: 'Communication Tests',
    tests: [
      { id: 'COM-001', name: 'RS485 Modbus RTU', req: 'REQ_0401', priority: 'High', duration: '2h', status: 'pending', criteria: '9600-115200 bps' },
      { id: 'COM-002', name: 'Ethernet Modbus TCP', req: 'REQ_0403', priority: 'High', duration: '2h', status: 'pending', criteria: '10/100 Mbps' },
      { id: 'COM-003', name: 'CAN BMS Interface', req: 'REQ_0404', priority: 'Critical', duration: '3h', status: 'pending', criteria: '250-500 kbps' },
      { id: 'COM-004', name: 'BMS Data Exchange', req: 'REQ_0410', priority: 'Critical', duration: '2h', status: 'pending', criteria: 'SOC/SOH/V/I/T read' },
    ]
  }
};

export default function TestMatrix() {
  const [expandedCategories, setExpandedCategories] = useState(Object.keys(testData));
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const getPriorityColor = (p) => {
    const colors = { Critical: 'bg-red-600', High: 'bg-orange-500', Medium: 'bg-yellow-500', Low: 'bg-green-500' };
    return colors[p] || 'bg-gray-500';
  };

  const getStatusIcon = (s) => {
    if (s === 'pass') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (s === 'fail') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const totalTests = Object.values(testData).reduce((a, c) => a + c.tests.length, 0);
  const criticalTests = Object.values(testData).reduce((a, c) => 
    a + c.tests.filter(t => t.priority === 'Critical').length, 0);

  const filteredData = Object.entries(testData).reduce((acc, [key, val]) => {
    const filtered = val.tests.filter(t => {
      const matchPriority = filter === 'all' || t.priority === filter;
      const matchSearch = search === '' || 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.req.toLowerCase().includes(search.toLowerCase());
      return matchPriority && matchSearch;
    });
    if (filtered.length > 0) acc[key] = { ...val, tests: filtered };
    return acc;
  }, {});

  return (
    <div className="w-full bg-gray-900 text-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Test Specification Matrix</h2>
          <p className="text-sm text-gray-400">120 kW T-Type Inverter | IMT65R010M2H CoolSiC G2 | 100 kHz | STM32G474</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-gray-800 px-3 py-1 rounded">
            <span className="text-gray-400">Total: </span>
            <span className="font-bold">{totalTests}</span>
          </div>
          <div className="bg-red-900/50 px-3 py-1 rounded">
            <span className="text-gray-400">Critical: </span>
            <span className="font-bold text-red-400">{criticalTests}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search tests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm flex-1 max-w-xs"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
        </select>
      </div>

      {/* Test Categories */}
      <div className="space-y-2">
        {Object.entries(filteredData).map(([catKey, cat]) => (
          <div key={catKey} className="bg-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(catKey)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedCategories.includes(catKey) ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
                <span className="font-semibold">{cat.name}</span>
                <span className="text-sm text-gray-400">({cat.tests.length} tests)</span>
              </div>
            </button>

            {expandedCategories.includes(catKey) && (
              <div className="px-4 pb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-gray-700">
                      <th className="py-2 w-20">ID</th>
                      <th className="py-2">Test Name</th>
                      <th className="py-2 w-28">Requirement</th>
                      <th className="py-2 w-20">Priority</th>
                      <th className="py-2 w-16">Time</th>
                      <th className="py-2 w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.tests.map(test => (
                      <tr key={test.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-2 font-mono text-blue-400">{test.id}</td>
                        <td className="py-2">
                          <div>{test.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{test.criteria}</div>
                        </td>
                        <td className="py-2 font-mono text-xs text-green-400">{test.req}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(test.priority)}`}>
                            {test.priority}
                          </span>
                        </td>
                        <td className="py-2 text-gray-400">{test.duration}</td>
                        <td className="py-2">{getStatusIcon(test.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
        {Object.entries(testData).slice(0, 4).map(([key, cat]) => (
          <div key={key} className="bg-gray-800 rounded p-2">
            <div className="text-xs text-gray-400">{cat.name.split(' ')[0]}</div>
            <div className="font-bold">{cat.tests.length} tests</div>
          </div>
        ))}
      </div>

      {/* Estimated Duration */}
      <div className="mt-4 bg-gray-800 rounded p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Estimated Total Test Duration:</span>
          <span className="font-bold text-blue-400">~8-10 weeks</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-gray-400">Required Equipment:</span>
          <span className="text-gray-300">Grid Simulator, Battery Emulator, Power Analyzer, EMC Chamber</span>
        </div>
      </div>
    </div>
  );
}
