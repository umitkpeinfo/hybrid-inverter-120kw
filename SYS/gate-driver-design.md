# Gate Driver Design Guide
## Infineon IMT65R010M2H CoolSiC™ G2 MOSFET
### 120 kW T-Type Hybrid Inverter Application

---

## 1. Overview

This guide provides gate driver design specifications for driving IMT65R010M2H SiC MOSFETs in a 3-Level T-Type inverter topology operating at **100 kHz** with STM32G474RET6 controller.

### 1.1 Key Design Challenges

| Challenge | Cause | Solution |
|-----------|-------|----------|
| High dV/dt (10-20 kV/µs) | Fast SiC switching | High CMTI gate drivers |
| Parasitic turn-on | Miller capacitance | VGS(th)=4.5V allows 0V turn-off |
| Gate ringing | Stray inductance | Optimized layout, ferrite beads |
| Parallel device sharing | RDS(on) mismatch | Symmetric layout, matched parts |
| EMI | Fast edges | Gate resistor optimization |

---

## 2. Gate Driver Specifications

### 2.1 Required Driver Characteristics

| Parameter | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| **Isolation Voltage** | 3 kVRMS | 5.7 kVRMS | Per IEC 62477-1 |
| **CMTI** | 50 kV/µs | **≥100 kV/µs** | Critical for SiC |
| **Peak Source Current** | 5 A | 10 A | For fast turn-on |
| **Peak Sink Current** | 5 A | 10 A | For fast turn-off |
| **Propagation Delay** | <200 ns | <150 ns | For dead time accuracy |
| **Delay Matching** | <20 ns | <10 ns | For parallel devices |
| **UVLO (Primary)** | 2.5 V | 3.0 V | 3.3V logic compatible |
| **UVLO (Secondary)** | 12 V | 15 V | Protects gate |
| **Operating Temp** | -40°C | -40 to +125°C | Industrial grade |

### 2.2 Recommended Gate Drivers

| Part Number | Manufacturer | CMTI | Peak Current | Features | Application |
|-------------|--------------|------|--------------|----------|-------------|
| **1ED3122MU12H** | Infineon | 200 kV/µs | 12A/12A | DESAT, Miller clamp | Primary choice |
| **UCC21710** | TI | 150 kV/µs | 10A/10A | Reinforced isolation | Alternative |
| **CGD15HB62LP** | Wolfspeed | 100 kV/µs | 10A/10A | SiC optimized | High performance |
| **Si828x** | Skyworks | 200 kV/µs | 4A/4A | Cost effective | Budget option |
| **STGAP2SiCSN** | ST | 150 kV/µs | 4A/4A | SiC specific | Mid-range |

### 2.3 Selected Driver: 1ED3122MU12H

```
┌─────────────────────────────────────────────────────────────────┐
│                    1ED3122MU12H BLOCK DIAGRAM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   VCC1 (3.3-5V)──┬──[UVLO]──┬──[Input]──┬──[Isolation]──┬──OUT+ │
│                  │          │     │      │    (5.7kV)   │       │
│   IN+ ───────────┼──────────┘     │      │              ├──OUT- │
│   IN- ───────────┼────────────────┘      │              │       │
│   GND1───────────┴───────────────────────┼──────────────┘       │
│                                          │                       │
│                                    ┌─────┴─────┐                │
│   VCC2 (15-20V)──────────────────►│  Secondary │                │
│   GND2 (or VEE)──────────────────►│   Side     │                │
│                                    └─────┬─────┘                │
│                                          │                       │
│   DESAT ◄────────────────────────────────┤ (Fault detection)    │
│   FAULT ◄────────────────────────────────┘                      │
│                                                                  │
│   Key Specs:                                                     │
│   • CMTI: 200 kV/µs (best-in-class)                             │
│   • Peak current: 12A source / 12A sink                         │
│   • Propagation delay: 80 ns typical                            │
│   • DESAT threshold: Configurable                               │
│   • Miller clamp: Integrated                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Gate Drive Circuit Design

### 3.1 Recommended Circuit

```
                          VCC2 (+18V)
                              │
                              │
                         ┌────┴────┐
                         │  0.1µF  │ (Ceramic, close to driver)
                         │         │
                         └────┬────┘
                              │
    ┌─────────────────────────┼─────────────────────────────┐
    │                         │                              │
    │    ┌───────────────────┴───────────────────┐          │
    │    │           1ED3122MU12H                 │          │
    │    │                                        │          │
    │    │  VCC1    VCC2    OUT+    OUT-    GND2 │          │
    │    └────┬──────┬───────┬───────┬───────┬───┘          │
    │         │      │       │       │       │               │
    │         │      │       │       │       └───────┐       │
    │    ┌────┴──┐   │   ┌───┴───┐   │               │       │
    │    │ 0.1µF │   │   │Rg_on  │   │               │       │
    │    └───┬───┘   │   │ 2.7Ω  │   │           GND2/VEE    │
    │        │       │   └───┬───┘   │           (0V or -4V) │
    │        │       │       │       │               │       │
    │      GND1      │       ├───────┼───────────────┘       │
    │                │       │       │                       │
    │           +18V │   ┌───┴───┐   │                       │
    │                │   │Rg_off │   │                       │
    │                │   │ 1.5Ω  │   │                       │
    │                │   └───┬───┘   │                       │
    │                │       │       │                       │
    │                │       └───┬───┘                       │
    │                │           │                           │
    │                │      ┌────┴────┐                      │
    │                │      │ Ferrite │  (Optional EMI)      │
    │                │      │  Bead   │                      │
    │                │      └────┬────┘                      │
    │                │           │                           │
    │                │           ▼                           │
    │                │    ┌──────────────┐                   │
    │                │    │ IMT65R010M2H │                   │
    │                │    │              │                   │
    │                │    │   G    D    S│                   │
    │                │    └───┬────┬────┬┘                   │
    │                │        │    │    │                    │
    │                │        │    │    └────────────────────┤
    │                │        │    │                         │
    │                └────────┼────┼─────────────────────────┘
    │                         │    │
    │                       Gate  Drain
    │                              │
    └──────────────────────────────┘
                            Source (Kelvin if available)
```

### 3.2 Component Selection

| Component | Value | Type | Notes |
|-----------|-------|------|-------|
| **Rg_on** | 2.7 Ω | 0603, 0.25W | Controls turn-on dV/dt |
| **Rg_off** | 1.5 Ω | 0603, 0.25W | Fast turn-off preferred |
| **C_bypass (VCC2)** | 0.1 µF + 10 µF | MLCC X7R | Close to driver |
| **C_bypass (VCC1)** | 0.1 µF | MLCC X7R | Close to driver |
| **Ferrite Bead** | 100Ω @ 100MHz | 0805 | Optional, reduces ringing |
| **Zener (protection)** | 20V | Optional | Gate over-voltage protection |

### 3.3 Gate Resistor Selection Guide

| Rg_on | dV/dt | Eon | EMI | Recommendation |
|-------|-------|-----|-----|----------------|
| 1.0 Ω | ~25 kV/µs | Lowest | High | Not recommended |
| 2.2 Ω | ~15 kV/µs | Low | Medium-High | Aggressive |
| **2.7 Ω** | **~12 kV/µs** | **Medium** | **Medium** | **Recommended** |
| 3.3 Ω | ~10 kV/µs | Medium | Low-Medium | Conservative |
| 4.7 Ω | ~7 kV/µs | Higher | Low | EMI-sensitive |

---

## 4. Power Supply Design

### 4.1 Isolated DC-DC for Gate Drive

Each gate driver requires an isolated power supply. For 18 gate drivers:

| Configuration | Qty | Recommendation |
|---------------|-----|----------------|
| T1 (Upper main) | 2 drivers | 1× isolated supply (shared) |
| T4 (Lower main) | 2 drivers | 1× isolated supply (shared) |
| T2-T3 (Bidirectional) | 2 drivers | 1× isolated supply (shared) |
| **Per Phase** | 6 drivers | 3× isolated supplies |
| **3-Phase Total** | 18 drivers | 9× isolated supplies |

### 4.2 Recommended Isolated DC-DC

| Part Number | Manufacturer | Vin | Vout | Power | Isolation |
|-------------|--------------|-----|------|-------|-----------|
| MGJ2D121809SC | Murata | 12V | +18V/-1V | 2W | 5.2kV |
| R1SE-1218 | Recom | 12V | +18V | 1W | 3kV |
| SIM1-1218S | Mean Well | 12V | +18V | 1W | 3kV |

### 4.3 Power Supply Schematic

```
    +12V Bus ─────┬─────────────────────────────────────────────┐
                  │                                              │
             ┌────┴────┐                                         │
             │ MGJ2D   │                                         │
             │ 121809  │                                         │
             │         │                                         │
             │ +Vout ──┼──► +18V (VCC2)                         │
             │ -Vout ──┼──► -1V  (VEE) [Optional, can use GND]  │
             │ GND2  ──┼──► GND2 (Secondary ground)             │
             └────┬────┘                                         │
                  │                                              │
    GND ──────────┴──────────────────────────────────────────────┘
    
    Notes:
    • Add 10µF + 0.1µF ceramic on both input and output
    • Keep isolated ground separate from main control ground
    • Route DESAT signal through isolation if needed
```

---

## 5. Dead Time Configuration

### 5.1 Dead Time Calculation

```
t_dead = t_off(max) + t_margin - t_on(min)

Where:
• t_off(max) = Worst-case turn-off time = ~40 ns
• t_on(min) = Best-case turn-on time = ~25 ns
• t_margin = Safety margin = 50 ns (optimized for 100 kHz)

t_dead = 40 + 50 - 25 = 65 ns (minimum)

Recommended: 80 ns (optimized for 100 kHz, duty cycle impact minimized)
```

### 5.2 Dead Time vs. Distortion Trade-off (100 kHz Operation)

At 100 kHz (10 µs period), dead time has 5× more impact on distortion than at 20 kHz.

| Dead Time | Duty Cycle Loss | Output Distortion | Recommendation |
|-----------|-----------------|-------------------|----------------|
| 60 ns | 0.6% | Lowest | Lab testing only |
| **80 ns** | **0.8%** | **Low** | **Production (100 kHz)** |
| 100 ns | 1.0% | Medium | Conservative |
| 150 ns | 1.5% | Higher | Not recommended @ 100 kHz |

---

## 6. Protection Features

### 6.1 DESAT (Desaturation) Protection

The 1ED3122MU12H includes DESAT protection for short-circuit detection:

```
Configuration:
• DESAT threshold: VDS > 9V (indicating fault)
• Blanking time: 500 ns (ignore turn-on transient)
• Response time: <1 µs (soft turn-off)

External Components:
• DESAT diode: Fast recovery, VRRM > 1200V
• DESAT resistor: Sets threshold (typically 10-47kΩ)
• Blanking capacitor: Sets blanking time (47-220pF)
```

### 6.2 Under-Voltage Lockout (UVLO)

| Parameter | Primary Side | Secondary Side |
|-----------|--------------|----------------|
| UVLO On | 2.7V | 13.5V |
| UVLO Off | 2.5V | 12.0V |
| Hysteresis | 0.2V | 1.5V |

### 6.3 Miller Clamp

The integrated Miller clamp actively holds VGS low during high dV/dt events, preventing parasitic turn-on. This is especially important when using 0V turn-off (no negative bias).

---

## 7. PCB Layout Guidelines

### 7.1 Critical Layout Rules

```
┌─────────────────────────────────────────────────────────────────┐
│                    PCB LAYOUT GUIDELINES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. GATE LOOP MINIMIZATION                                       │
│     ┌─────────┐                                                  │
│     │ Driver  │◄──── Keep gate loop area < 1 cm²                │
│     └────┬────┘                                                  │
│          │ < 10mm                                                │
│     ┌────┴────┐                                                  │
│     │ MOSFET  │◄──── Place driver directly above MOSFET         │
│     └─────────┘                                                  │
│                                                                  │
│  2. POWER LOOP MINIMIZATION                                      │
│     DC+ ═══╦═══════════╗                                        │
│            ║           ║                                         │
│          ┌─╨─┐      ┌──╨──┐                                     │
│          │C_dc│      │MOSFET│◄── Minimize loop area             │
│          └─╥─┘      └──╥──┘                                     │
│            ║           ║                                         │
│     DC- ═══╩═══════════╝                                        │
│                                                                  │
│  3. GROUND PLANE STRATEGY                                        │
│     • Solid ground plane under gate driver                       │
│     • Keep power ground and signal ground separate              │
│     • Single-point connection at DC-link minus                  │
│                                                                  │
│  4. PARALLEL DEVICE SYMMETRY                                     │
│     ┌──────┐  ┌──────┐                                          │
│     │ Q1a  │  │ Q1b  │◄── Equal trace length from driver        │
│     └──┬───┘  └───┬──┘                                          │
│        │          │                                              │
│        └────┬─────┘                                              │
│             │                                                    │
│     ════════╧════════◄── Common source connection               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Recommended Stackup (4-Layer)

| Layer | Function | Copper Weight |
|-------|----------|---------------|
| Top | Gate drive, signal routing | 2 oz |
| Inner 1 | Ground plane | 2 oz |
| Inner 2 | Power planes (VCC) | 2 oz |
| Bottom | Power stage, bus bars | 4 oz |

### 7.3 Clearance Requirements (1000V DC)

| Voltage | Creepage | Clearance | Notes |
|---------|----------|-----------|-------|
| 0-50V | 0.4 mm | 0.2 mm | Signal level |
| 50-300V | 2.5 mm | 1.5 mm | Gate drive |
| 300-600V | 4.0 mm | 3.0 mm | DC-link/2 |
| 600-1000V | 6.3 mm | 5.5 mm | Full DC-link |

---

## 8. EMI Mitigation

### 8.1 Common-Mode EMI Sources

| Source | Frequency | Mitigation |
|--------|-----------|------------|
| dV/dt at switch node | 1-30 MHz | Gate resistor, CM choke |
| Gate drive switching | 10-100 MHz | Ferrite beads, shielding |
| Power loop ringing | 5-50 MHz | Snubber, layout optimization |

### 8.2 Recommended EMI Countermeasures

```
1. GATE RESISTOR OPTIMIZATION
   • Increase Rg from 2.7Ω to 3.3Ω if EMI issues
   • Separate Rg_on and Rg_off for better control

2. COMMON-MODE CHOKE
   • Location: AC output, before LCL filter
   • Inductance: 1-5 mH common-mode
   • Current rating: ≥200 A

3. FERRITE BEADS ON GATE
   • 100Ω @ 100MHz
   • Place between driver output and gate resistor

4. SHIELDING
   • Metal enclosure for gate driver board
   • Separate power and control compartments

5. SNUBBER CIRCUITS (if needed)
   • RC snubber across MOSFET: 10Ω + 1nF
   • Only if ringing exceeds 10% of VDS
```

---

## 9. Bill of Materials (Gate Drive Section)

| Item | Part Number | Qty | Description | Est. Cost |
|------|-------------|-----|-------------|-----------|
| Gate Driver | 1ED3122MU12H | 18 | Infineon isolated driver | $8 × 18 = $144 |
| DC-DC Converter | MGJ2D121809SC | 9 | Isolated 12V to ±18V | $12 × 9 = $108 |
| Gate Resistor (On) | CRCW06032R70 | 36 | 2.7Ω, 0603, 0.25W | $0.05 × 36 = $2 |
| Gate Resistor (Off) | CRCW06031R50 | 36 | 1.5Ω, 0603, 0.25W | $0.05 × 36 = $2 |
| Bypass Capacitor | GRM188R71H104 | 50 | 0.1µF, 50V, X7R | $0.02 × 50 = $1 |
| Bulk Capacitor | GRM21BR61E106 | 20 | 10µF, 25V, X5R | $0.10 × 20 = $2 |
| Ferrite Bead | BLM21PG101 | 36 | 100Ω @ 100MHz | $0.05 × 36 = $2 |
| DESAT Diode | STTH112 | 18 | 1200V fast recovery | $0.50 × 18 = $9 |
| **TOTAL** | | | | **~$270** |

---

## 10. Validation Checklist

### 10.1 Pre-Power Checklist

- [ ] Verify isolated power supply voltages (+18V, 0V or -4V)
- [ ] Check UVLO thresholds with variable supply
- [ ] Measure gate drive output with no load
- [ ] Verify dead time with oscilloscope
- [ ] Check DESAT threshold setting
- [ ] Verify propagation delay matching (<10ns)

### 10.2 Double-Pulse Test Requirements

| Parameter | Test Condition | Pass Criteria |
|-----------|---------------|---------------|
| Turn-on dV/dt | VDS=400V, ID=80A | <15 kV/µs |
| Turn-off dV/dt | VDS=400V, ID=80A | <20 kV/µs |
| VGS overshoot | Full load | <+22V |
| VGS undershoot | Full load | >-8V |
| Gate ringing | Full load | <2V p-p |
| DESAT response | Short circuit | <1 µs |

---

*Document Version: 1.0*
*Created: December 2025*
*Application: 120 kW T-Type Hybrid Inverter*
