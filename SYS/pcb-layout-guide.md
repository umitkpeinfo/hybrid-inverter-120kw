# PCB Layout Guidelines
## 120 kW T-Type Inverter with IMT65R010M2H
### High-Speed SiC MOSFET Power Stage Design

---

## 1. Overview

This guide provides PCB layout recommendations for the 3-Level T-Type power stage using Infineon IMT65R010M2H CoolSiC MOSFETs switching at **100 kHz** with dV/dt up to 20 kV/µs. Controller: STM32G474RET6.

### 1.1 Critical Design Parameters

| Parameter | Value | Impact |
|-----------|-------|--------|
| Switching Frequency | **100 kHz** | Higher frequency = tighter EMI requirements |
| dV/dt | 10-20 kV/µs | Drives layout constraints |
| di/dt | 5-10 kA/µs | Determines loop inductance needs |
| DC-Link Voltage | 850-1000 VDC | Clearance requirements |
| Peak Current | 226 A | Copper weight requirements |
| Dead Time | **80 ns** | Critical timing - requires matched traces |

### 1.2 Design Goals

1. **Minimize power loop inductance** (<10 nH target)
2. **Minimize gate loop inductance** (<5 nH target)
3. **Symmetric layout for parallel devices**
4. **Adequate clearance/creepage** for 1000V
5. **EMI containment** through proper grounding
6. **Thermal management** via copper spreading

---

## 2. Power Stage Layout

### 2.1 T-Type Power Loop Topology

```
T-TYPE POWER LOOP DIAGRAM
═════════════════════════

                DC+ Bus Bar
                    ║
    ┌───────────────╨───────────────┐
    │               │               │
    │           ┌───┴───┐           │
    │           │  T1   │           │     Loop 1: DC+ → T1 → Output
    │           │ (×2)  │           │     (Active during +Vdc/2)
    │           └───┬───┘           │
    │               │               │
    │    ┌──────────┼──────────┐    │
    │    │          │          │    │
    │    │      ┌───┴───┐      │    │
    │    │      │Output │      │    │     Loop 2: NP → T2/T3 → Output
    │    │      │ Node  │      │    │     (Active during 0V)
    │    │      └───┬───┘      │    │
    │    │          │          │    │
    │    │      ┌───┴───┐      │    │
    │    │      │T2-T3  │──────┼────┼──── Neutral Point (NP)
    │    │      │(Bidir)│      │    │
    │    │      └───────┘      │    │
    │    │                     │    │
    │    │      ┌───┴───┐      │    │
    │    │      │  T4   │      │    │     Loop 3: Output → T4 → DC-
    │    │      │ (×2)  │      │    │     (Active during -Vdc/2)
    │    │      └───┬───┘      │    │
    │    │          │          │    │
    └────┼──────────┴──────────┼────┘
         │                     │
         └──────────╥──────────┘
                    ║
                DC- Bus Bar
```

### 2.2 Optimal Device Placement

```
TOP VIEW - RECOMMENDED DEVICE PLACEMENT (One Phase)
════════════════════════════════════════════════════

    DC+ ════════════════════════════════════════════
              │                        │
         ┌────┴────┐              ┌────┴────┐
         │  T1a    │   15mm       │   T1b   │
         │ (TOLL)  │◄────────────►│ (TOLL)  │
         └────┬────┘              └────┬────┘
              │      Gate drivers      │
              │      above here        │
              ├────────────────────────┤
              │                        │
              │    ┌──────────────┐    │
              │    │   OUTPUT     │    │
              │    │   TERMINAL   │    │
              │    └──────┬───────┘    │
              │           │            │
         ┌────┴────┐      │      ┌────┴────┐
         │  T2a    │◄─────┴─────►│   T2b   │
         │ (Bidir) │   NP Bus    │ (Bidir) │
         └────┬────┘              └────┬────┘
              │                        │
         ┌────┴────┐              ┌────┴────┐
         │  T3a    │              │   T3b   │
         │ (Bidir) │              │ (Bidir) │
         └────┬────┘              └────┬────┘
              │                        │
              ├────────────────────────┤
              │                        │
         ┌────┴────┐              ┌────┴────┐
         │  T4a    │              │   T4b   │
         │ (TOLL)  │              │ (TOLL)  │
         └────┬────┘              └────┬────┘
              │                        │
    DC- ════════════════════════════════════════════

    Key Layout Rules:
    • T1a-T1b spacing: 15-20mm (allows gate driver between)
    • T1-T4 vertical distance: Minimize (reduce loop area)
    • NP bus: Wide trace between T2/T3 and DC-link midpoint
    • Symmetry: Critical for current sharing
```

### 2.3 Power Loop Inductance Optimization

```
POWER LOOP MINIMIZATION TECHNIQUES
══════════════════════════════════

BEFORE OPTIMIZATION:               AFTER OPTIMIZATION:
────────────────────               ───────────────────

    DC+                               DC+ (Plane)
     │                                ══════════════
     │ Long trace                           ║
     │                                  ┌───╨───┐
  ┌──┴──┐                               │ MOSFET│
  │MOSFET│     Loop                     └───╥───┘
  └──┬──┘     Area                    DC- (Plane)
     │        ~50cm²                  ══════════════
     │ Long trace
     │                               Loop Area: <2cm²
    DC-

Techniques Used:
1. DC+ and DC- as adjacent planes (0.2mm separation)
2. Vertical current flow (through vias)
3. Decoupling capacitors at MOSFET locations
4. Wide, short traces for AC current path
```

### 2.4 Laminated Bus Bar Design (Recommended)

For lowest inductance, use laminated bus bars:

```
LAMINATED BUS BAR CROSS-SECTION
═══════════════════════════════

    ┌────────────────────────────────┐
    │         DC+ Copper (2mm)       │
    ├────────────────────────────────┤
    │       Insulation (0.2mm)       │  Kapton or Nomex
    ├────────────────────────────────┤
    │         NP Copper (2mm)        │
    ├────────────────────────────────┤
    │       Insulation (0.2mm)       │
    ├────────────────────────────────┤
    │         DC- Copper (2mm)       │
    └────────────────────────────────┘

    Benefits:
    • Loop inductance <5 nH
    • Even current distribution
    • Excellent high-frequency performance
    • Integrated DC-link capacitor mounting

    Connections:
    • MOSFETs mount on top with standoffs
    • DC-link capacitors at edges
    • Output taken from between T1 and T4
```

---

## 3. Gate Driver Layout

### 3.1 Gate Loop Requirements

```
GATE DRIVER PLACEMENT STRATEGY
══════════════════════════════

    ┌───────────────────────────────────────┐
    │           GATE DRIVER PCB             │
    │    ┌─────────────────────────────┐    │
    │    │        Gate Driver IC       │    │
    │    │       (1ED3122MU12H)        │    │
    │    └────────────┬────────────────┘    │
    │                 │                      │
    │    ┌────────────┼────────────┐        │
    │    │ Rg_on      │     Rg_off │        │
    │    │ 2.7Ω       │     1.5Ω   │        │
    │    └────────────┼────────────┘        │
    │                 │                      │
    │    ─────────────┴───────────── Gate   │
    │                                        │
    └───────────────────────────────────────┘
                      │
                      │  <10mm vertical
                      │
    ┌─────────────────┴─────────────────────┐
    │              MOSFET PCB               │
    │         ┌───────────────┐             │
    │         │  IMT65R010M2H │             │
    │         │    G   D   S  │             │
    │         └───┬───┬───┬───┘             │
    │             │   │   │                 │
    └─────────────┴───┴───┴─────────────────┘

    Gate Loop Rules:
    • Total gate loop area: <1 cm²
    • Gate trace width: ≥0.5mm (low inductance)
    • Return path: Directly under gate trace
    • Kelvin source: Use if 4-pin package available
```

### 3.2 Gate Driver PCB Stackup

```
4-LAYER STACKUP (Gate Driver Board)
═══════════════════════════════════

Layer 1 (Top)     : Signal, Gate traces
                    1 oz copper
                    ─────────────────
                    Prepreg 0.2mm
                    ─────────────────
Layer 2 (Inner 1) : Ground plane (GND2)
                    1 oz copper
                    ─────────────────
                    Core 0.8mm
                    ─────────────────
Layer 3 (Inner 2) : Power plane (+18V)
                    1 oz copper
                    ─────────────────
                    Prepreg 0.2mm
                    ─────────────────
Layer 4 (Bottom)  : Signal, DC-DC converter
                    1 oz copper

Total thickness: ~1.6mm
```

### 3.3 Parallel Device Gate Drive

```
SYMMETRIC GATE DRIVE FOR PARALLEL MOSFETs
═════════════════════════════════════════

                    Gate Driver
                        │
              ┌─────────┴─────────┐
              │                   │
           ┌──┴──┐             ┌──┴──┐
           │Rg/2 │             │Rg/2 │
           │5.4Ω │             │5.4Ω │
           └──┬──┘             └──┬──┘
              │                   │
              │     EQUAL         │
              │    LENGTH         │
              │                   │
           ┌──┴──┐             ┌──┴──┐
           │ Q1a │             │ Q1b │
           └──┬──┘             └──┬──┘
              │                   │
              └─────────┬─────────┘
                        │
                    Source Bus
                   (Common point)

    Critical Requirements:
    • Trace length matching: ±1mm
    • Trace width matching: Identical
    • Via count matching: Same number
    • Return path: Common ground plane
```

---

## 4. Clearance & Creepage

### 4.1 Voltage Classification

| Net | Voltage | Category |
|-----|---------|----------|
| DC+ to DC- | 700-1000 VDC | High Voltage |
| DC+ to NP | 350-500 VDC | Medium Voltage |
| DC- to NP | 350-500 VDC | Medium Voltage |
| Gate Drive | 18-22 VDC | Low Voltage |
| Control Logic | 3.3-5 VDC | Low Voltage |

### 4.2 Clearance/Creepage Requirements (IEC 62477-1)

| Voltage (Working) | Clearance (mm) | Creepage (mm) | Notes |
|-------------------|----------------|---------------|-------|
| 50-150V | 1.0 | 1.5 | Gate drive |
| 150-300V | 1.5 | 2.5 | - |
| 300-600V | 3.0 | 4.0 | Half DC-link |
| 600-1000V | 5.5 | 8.0 | Full DC-link |

### 4.3 Layout Implementation

```
CLEARANCE ZONES ON PCB
══════════════════════

    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │  ███████████████   DC+ Area   █████████████████│
    │  ███████████████  (1000V ref) █████████████████│
    │                                                 │
    │  ════════════════════════════════════════════  │
    │        ↑  5.5mm clearance to DC- area  ↑       │
    │  ════════════════════════════════════════════  │
    │                                                 │
    │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   NP Area   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
    │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  (500V ref) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
    │                                                 │
    │  ════════════════════════════════════════════  │
    │        ↑  3.0mm clearance to DC+ area  ↑       │
    │  ════════════════════════════════════════════  │
    │                                                 │
    │  ░░░░░░░░░░░░░░░  Control   ░░░░░░░░░░░░░░░░░│
    │  ░░░░░░░░░░░░░░░ (Isolated) ░░░░░░░░░░░░░░░░░│
    │                                                 │
    └─────────────────────────────────────────────────┘

    Slot Requirements:
    • Slot width: ≥1.5mm
    • Slot under isolated gate driver boundary
    • Filled with conformal coating if outdoor use
```

---

## 5. EMI Considerations

### 5.1 EMI Sources and Mitigation

| Source | Frequency | Mitigation |
|--------|-----------|------------|
| Switching edges | 1-50 MHz | Gate resistor, ferrite |
| Power loop ringing | 10-100 MHz | Snubber, layout |
| Gate ringing | 50-200 MHz | Ferrite bead |
| Common-mode current | 100 kHz-10 MHz | CM choke, shielding |

### 5.2 Ground Plane Strategy

```
GROUND PLANE PARTITIONING
═════════════════════════

┌─────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────────────┐    ┌─────────────────────┐    │
│   │                 │    │                      │    │
│   │   POWER GND     │    │    CONTROL GND       │    │
│   │   (DC- Bus)     │    │    (Signal GND)      │    │
│   │                 │    │                      │    │
│   │  • MOSFET Source│    │  • MCU               │    │
│   │  • DC-Link Cap  │    │  • ADC               │    │
│   │  • Current Sense│    │  • Communication     │    │
│   │                 │    │                      │    │
│   └────────┬────────┘    └──────────┬───────────┘    │
│            │                        │                │
│            │    SINGLE POINT        │                │
│            └────────┬───────────────┘                │
│                     │                                │
│              ┌──────┴──────┐                        │
│              │ STAR GROUND │                        │
│              │  (at DC-)   │                        │
│              └─────────────┘                        │
│                                                      │
└─────────────────────────────────────────────────────┘

Rules:
• No control signals routed over power area
• Power return under power traces only
• Single connection between domains
```

### 5.3 Shielding Recommendations

```
SHIELDING STRUCTURE
═══════════════════

┌─────────────────────────────────────────────────────┐
│                   ENCLOSURE (Metal)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │                                                │  │
│  │   ┌─────────────┐      ┌─────────────────┐   │  │
│  │   │   POWER     │      │    CONTROL      │   │  │
│  │   │ COMPARTMENT │      │  COMPARTMENT    │   │  │
│  │   │             │      │                 │   │  │
│  │   │  MOSFETs    │      │  MCU Board      │   │  │
│  │   │  Gate Drv   │      │  Comm Board     │   │  │
│  │   │  Bus Bars   │      │  Power Supply   │   │  │
│  │   │             │      │                 │   │  │
│  │   └─────────────┘      └─────────────────┘   │  │
│  │         │                      │              │  │
│  │         │    SHIELD WALL       │              │  │
│  │         │    (Grounded)        │              │  │
│  │         └──────────────────────┘              │  │
│  │                                                │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘

EMI Filters:
• Input: CM choke + Y-capacitors
• Output: LCL filter provides attenuation
• Control I/O: Ferrite beads, TVS protection
```

---

## 6. Current Sensing Layout

### 6.1 Shunt Resistor Placement

```
DC CURRENT SENSING
══════════════════

    DC+ ═══════════════════════════════════
                     │
                ┌────┴────┐
                │  SHUNT  │  1mΩ, 10W
                │ Resistor│  4-terminal (Kelvin)
                └────┬────┘
                     │
          ┌──────────┴──────────┐
          │                     │
       Sense+              Sense-
     (to diff amp)       (to diff amp)

    Layout Rules:
    • Kelvin connection for sense lines
    • Sense traces away from power traces
    • Differential routing to amplifier
    • Add RC filter at amplifier input
```

### 6.2 AC Current Sensing (Hall Effect)

```
HALL SENSOR PLACEMENT
═════════════════════

          ┌─────────────────────────┐
          │        LEM HLSR        │
          │     or Allegro ACS     │
          │                        │
    IN ───┤►      ┌─────┐      ◄├─── OUT
          │       │SENSE│         │
          │       │COIL │         │
          │       └─────┘         │
          │                        │
          │  Vcc  GND  Vref  OUT  │
          └───┬────┬────┬────┬────┘
              │    │    │    │

    Placement:
    • After output contactor (grid current)
    • Away from switching nodes (noise)
    • Shield if near high dV/dt nodes
```

---

## 7. Recommended PCB Specifications

### 7.1 Power Stage PCB

| Parameter | Specification |
|-----------|---------------|
| Material | FR-4 Tg170 or higher |
| Layers | 4-6 layers |
| Copper Weight (outer) | 4 oz (140 µm) |
| Copper Weight (inner) | 2 oz (70 µm) |
| Board Thickness | 2.0-2.4 mm |
| Min Trace/Space | 0.2mm / 0.2mm |
| Min Via | 0.3mm drill, 0.6mm pad |
| Via Fill | Conductive fill for thermal vias |
| Surface Finish | ENIG or Hard Gold |
| Solder Mask | High-temp (260°C) |
| Impedance Control | Not required for power |

### 7.2 Control/Gate Driver PCB

| Parameter | Specification |
|-----------|---------------|
| Material | FR-4 standard |
| Layers | 4 layers |
| Copper Weight | 1 oz (35 µm) |
| Board Thickness | 1.6 mm |
| Min Trace/Space | 0.15mm / 0.15mm |
| Impedance Control | Yes (for high-speed signals) |
| Surface Finish | ENIG |

---

## 8. Design Checklist

### 8.1 Power Stage

- [ ] Power loop inductance calculated (<10 nH)
- [ ] DC-link capacitors placed at MOSFETs
- [ ] Symmetric layout for parallel devices
- [ ] Clearance/creepage per IEC 62477-1
- [ ] Thermal vias under MOSFETs
- [ ] Current sensing Kelvin connected
- [ ] Output terminal properly rated

### 8.2 Gate Drive

- [ ] Gate loop area minimized (<1 cm²)
- [ ] Gate traces matched for parallel devices
- [ ] Isolated power supply for each driver
- [ ] DESAT sensing properly routed
- [ ] Ferrite beads included if needed
- [ ] Dead time verified in schematic

### 8.3 EMI

- [ ] Ground plane partitioning defined
- [ ] Star ground point identified
- [ ] Shield wall between power/control
- [ ] CM choke location defined
- [ ] Filtered connectors for I/O

---

*Document Version: 1.0*
*Created: December 2025*
*Application: 120 kW T-Type Hybrid Inverter*
