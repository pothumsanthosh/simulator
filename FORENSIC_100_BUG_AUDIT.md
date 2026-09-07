# 100-Point Forensic EDA Comparison & Comprehensive Bug/Discrepancy Audit

An exhaustive forensic comparison of **ElectroSim / Switcha** against industry standard EDA and circuit simulation tools (**NI Multisim Live**, **Falstad Circuit Simulator**, **Linear Technology LTspice**, **EveryCircuit**, **Autodesk Tinkercad Circuits**, and **CircuitLab**).

---

## Executive Summary & Comparison Matrix

| EDA Platform | Core Solver | Component Library | Real-Time Interactive | Non-Linear Physics | DSP / FFT / Oscilloscope | Offline / PWA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ElectroSim / Switcha** | Modified Nodal Analysis (MNA) | 103+ Vector Symbols | ✅ Live Switch / Bulb Glow | ✅ Newton-Raphson & Clamping | ✅ Multi-Ch Scope & DSP | ✅ PWA + Cloud Sync |
| **NI Multisim Live** | SPICE 3F5 / XSPICE | 200+ Standard | ❌ Batch Transient Run | ✅ Full SPICE Level 1-3 | ✅ Interactive Grapher | ❌ Online Only |
| **Falstad Simulator** | Modified Nodal Analysis | 150+ Minimalist | ✅ Real-Time Animated | ⚠️ Piecewise Linear (PWL) | ⚠️ Basic 1D Scope | ⚠️ Offline HTML |
| **LTspice XVII/24** | Optimized SPICE Engine | 1000+ Raw SPICE | ❌ Batch Only | ✅ Full Physics Models | ⚠️ Waveform Viewer | ❌ Desktop Native Only |
| **EveryCircuit** | Proprietary Time-Domain | ~60 Visual Models | ✅ Visual Current Animation | ⚠️ Simplified Physics | ⚠️ Inline Waveforms | ❌ Web/App Only |
| **CircuitLab** | Modified Nodal Analysis | 80+ Symbols | ❌ Batch Run | ✅ SPICE-grade DC/AC | ✅ Multi-plot Grapher | ❌ Online Only |

---

## 100 Forensic Discrepancies, Bugs & Edge-Case Audit Catalog

### Category 1: MNA Simulation Engine & Numerical Mathematics (Bugs 1 – 15)

1. **[BUG-001] Floating Node Matrix Singularity without GND Reference**: Circuits simulated without an explicit Ground (`GROUND`) node create a singular MNA conductance matrix ($G$) with rank deficiency. Falstad auto-references the largest subnet; LTspice inserts $1\text{G}\Omega$ to ground. *Status in Switcha*: Uses $G_{\text{min}} = 1\text{pS}$, but requires auto-grounding default subnet.
2. **[BUG-002] Trapezoidal Integration Ringing on Inductive Switching**: Pure trapezoidal integration exhibits numerical oscillations ($V(t) = -V(t-\Delta t)$) upon step discontinuity. Needs Gear-2 or TR-BDF2 damping.
3. **[BUG-003] Zero-Resistance Ideal Voltage Source Loop Paradox**: Connecting two ideal voltage sources in parallel ($V_1 \neq V_2$ with $R_s = 0$) causes infinite current and non-invertible Jacobian. Needs series internal resistance ($R_{\text{int}} = 1\text{m}\Omega$) stamping.
4. **[BUG-004] Inductor Sudden Open-Circuit Flyback Singularity**: When an SPST switch opens an inductor current loop, $V_L = L \cdot \frac{di}{dt} \to \infty$, causing matrix overflow. Requires a transient voltage clamping snubber.
5. **[BUG-005] Newton-Raphson Exponential Overflow in Shockley Diode Equation**: For $V_D > 1.0\text{V}$, $I_s(e^{qV/kT} - 1)$ overflows standard double-precision `64-bit IEEE 754` floating point. Requires logarithmic damping ($V_{\text{new}} = V_{\text{old}} + V_t \ln(1 + \frac{\Delta V}{V_t})$).
6. **[BUG-006] Square/Pulse Voltage Zero Rise-Time ($\Delta t_r = 0$) Step Discontinuity**: Instantaneous voltage step creates infinite initial capacitor current $I = C \frac{\Delta V}{0}$. Requires auto-enforcing $t_r \ge 1\text{ns}$.
7. **[BUG-007] Op-Amp Infinite Open-Loop Gain Singular Matrix**: Op-amp voltage-controlled voltage source with $A_{ol} = 10^9$ causes extreme condition numbers in matrix pivoting. Needs finite $A_{ol} = 2 \times 10^5$ with single-pole roll-off.
8. **[BUG-008] Timestep Adaptation Missing Local Truncation Error (LTE) Control**: High-frequency transients require dynamic sub-stepping ($\Delta t < \frac{1}{20 f_{\text{max}}}$) to prevent aliasing.
9. **[BUG-009] Matrix Diagonal Pivot Selection Failure**: Standard Gauss elimination without partial pivoting fails when pivot element $|A_{kk}| < 10^{-14}$. Needs row permutation with maximum column element.
10. **[BUG-010] Branch Current Matrix Expansion for Dependent Sources**: Current-controlled sources (CCVS, CCCS) require auxiliary MNA matrix current variables.
11. **[BUG-011] Real-Time Speed Synchronizer vs Wall-Clock Throttling**: Simulation running faster than real-time on desktop CPUs causes LEDs and oscilloscopes to flash too fast. Requires requestAnimationFrame throttle matching $\Delta t$ to real seconds.
12. **[BUG-012] Sub-Millivolt DC Operating Point Bias Divergence**: Initial DC operating point solve fails to converge on high-gain positive feedback circuits (Schmitt trigger, bistable latch) without transient ramping.
13. **[BUG-013] AC Frequency Domain Small-Signal Matrix Phasor Stamping**: Currently transient-only; lacks complex phasor matrix solve $(G + j\omega C + \frac{1}{j\omega L}) \tilde{V} = \tilde{I}$ for Bode magnitude/phase plots.
14. **[BUG-014] Mixed-Signal Boundary Quantization Delay**: Analog-to-digital gate input thresholds need Schmitt hysteresis ($V_{IL} = 1.5\text{V}, V_{IH} = 3.5\text{V}$) to prevent 50Hz noise oscillation on digital pins.
15. **[BUG-015] Power Dissipation & Energy Conservation Validation**: Instantaneous component power $P(t) = V(t) \cdot I(t)$ must obey Tellegen's Theorem ($\sum P_k = 0$).

---

### Category 2: Component Physics Models & Catalog Completeness (Bugs 16 – 35)

16. **[BUG-016] Incandescent Lamp Non-Linear Cold-to-Hot Thermal Inrush**: A cold bulb has $R_{\text{cold}} \approx \frac{1}{10} R_{\text{hot}}$. Real bulbs experience a 10x current spike for $50\text{ms}$ upon switch closure.
17. **[BUG-017] LED Forward Knee Voltage Color Dispersion**: Red ($1.8\text{V}$), Green ($2.1\text{V}$), Blue ($3.2\text{V}$), White ($3.3\text{V}$), and Infrared ($1.2\text{V}$) LEDs require distinct Shockley forward knees.
18. **[BUG-018] Zener Reverse Breakdown Avalanche Knee**: Zener diode model must accurately model reverse breakdown dynamic resistance $R_z \approx 5\Omega$ beyond $V_z$.
19. **[BUG-019] BJT Early Voltage ($V_A$) & Output Conductance**: BJT collector current in active region should increase slightly with $V_{CE}$ ($I_C = I_s e^{V_{BE}/V_t}(1 + \frac{V_{CE}}{V_A})$).
20. **[BUG-020] BJT Saturation Voltage ($V_{CE(sat)}$) Floor**: Saturated BJT collector voltage cannot drop below $0.05\text{V} - 0.2\text{V}$.
21. **[BUG-021] MOSFET Channel-Length Modulation ($\lambda$) & Threshold ($V_{th}$)**: NMOS/PMOS drain current must obey quadratic saturation $(V_{GS} - V_{th})^2(1 + \lambda V_{DS})$.
22. **[BUG-022] MOSFET Sub-Threshold Leakage**: MOSFET gate below $V_{th}$ currently snaps to pure 0; needs exponential sub-threshold drain leakage.
23. **[BUG-023] JFET Symmetric Bi-Directional Channel Conduction**: JFET channel conducts symmetrically when $V_{DS}$ reverses.
24. **[BUG-024] SCR / TRIAC Holding Current ($I_H$) Gate Release**: Once triggered, SCR must latch ON until anode current drops below $I_{\text{holding}} \approx 5\text{mA}$.
25. **[BUG-025] 555 Timer Pin 5 (Control Voltage) Decoupling Node Interaction**: Applying external voltage to Pin 5 must modulate the upper threshold to $V_{\text{ctrl}}$ and lower trigger to $V_{\text{ctrl}}/2$.
26. **[BUG-026] 555 Timer Pin 7 Discharge Transistor Saturation**: Discharge pin saturation voltage must clamp to $\approx 0.1\text{V}$ under pull-up resistor loading.
27. **[BUG-027] Op-Amp Rail Clamping with Output Slew Rate Limit**: Op-amp output slew rate $SR = \frac{dV}{dt} \le 13\text{V}/\mu\text{s}$ (TL082) prevents instantaneous step outputs on high-frequency signals.
28. **[BUG-028] Linear Regulators (LM7805, LM317) Minimum Dropout ($V_{\text{drop}}$)**: If $V_{\text{in}} < V_{\text{out}} + 2.0\text{V}$, output must drop out and track $V_{\text{in}} - 2.0\text{V}$.
29. **[BUG-029] Digital Gate Fan-Out & Output Sinking Limits**: 74HC logic gates sinking $> 25\text{mA}$ must show output voltage degradation.
30. **[BUG-030] 74HC161 Counter Asynchronous Clear vs Synchronous Load**: Clear input (`CLR`) must reset outputs immediately regardless of clock, while Load (`LD`) waits for clock edge.
31. **[BUG-031] Transformer Magnetizing Inductance & Core Saturation**: High DC bias through transformer primary causes core saturation, collapsing secondary output.
32. **[BUG-032] Potentiometer Logarithmic Audio Taper ($10\%$ at 50% rotation)**: Volume controls require audio logarithmic taper rather than pure linear resistance division.
33. **[BUG-033] Quartz Crystal Motional RLC Equivalent Model**: Crystal resonator must exhibit sharp series resonance ($f_s$) and parallel anti-resonance ($f_p$).
34. **[BUG-034] LDR / Photodiode Optical Irradiance Response**: Light dependent resistor resistance must vary inversely with Lux ($R = R_0 \cdot \text{Lux}^{-\gamma}$).
35. **[BUG-035] Fuse Non-Linear Thermal $I^2 t$ Melting Integral**: Overcurrent causes fuse element to melt permanently based on Joule heating $\int I^2 dt \ge I^2 t_{\text{rating}}$.

---

### Category 3: Schematic Capture, Wiring & Routing Mechanics (Bugs 36 – 55)

36. **[BUG-036] Auto-Junction Dot Placement on 3-Wire Intersections**: Connecting a wire to an existing wire segment must automatically insert a junction connection node.
37. **[BUG-037] Wire Split on Component Drop**: Dropping a 2-terminal resistor or diode directly onto an active wire should split the wire into two and connect in series (Falstad style).
38. **[BUG-038] Manhattan Routing Collinear Redundancy Elimination**: Moving components can create superfluous zig-zag doglegs in wires. Requires collinear waypoint merging.
39. **[BUG-039] Overlapping Wire Bridge Arcs**: When two unconnected wires cross perpendicular on the schematic, optional bridge jumper arcs prevent confusion with 4-way junctions.
40. **[BUG-040] Dangling Wire Stub Cleanup**: Deleting a component leaves floating unattached wire stubs that clutter the netlist.
41. **[BUG-041] Centroid Group Rotation Wire Rubber-Banding**: Rotating a multi-selection group by 90° must preserve relative terminal positions of all internal wires.
42. **[BUG-042] Mirroring ($Flip X / Flip Y$) Pin Inversion Preservation**: Mirroring components must invert pin cardinal directions (`left` $\leftrightarrow$ `right`, `top` $\leftrightarrow$ `bottom`) correctly in Manhattan router.
43. **[BUG-043] Duplicate Component ID Collision Prevention on Copy/Paste**: Pasting cloned circuits must strictly generate monotonic unique IDs (`R1` $\to$ `R2`, `C1` $\to$ `C2`).
44. **[BUG-044] Multi-Component Alignment & Distribution Toolbar**: Missing EDA standard alignment tools (Align Left, Center, Top, Distribute Horizontally).
45. **[BUG-045] SPICE Node Badges Visual Collision Avoidance**: Node voltage labels placed at $(x, y)$ can overlap dense component pins without collision offset.
46. **[BUG-046] Net Label Simultaneous Subnet Linking**: Changing a `NET_LABEL` text must instantly update all corresponding net labels across the schematic without requiring manual reconnect.
47. **[BUG-047] Canvas Edge Auto-Panning on Drag**: Dragging a component or wire near canvas borders should auto-scroll/pan the viewport.
48. **[BUG-048] Grid Snapping Multi-Resolution Setting**: Need selectable grid spacing ($10\text{px}$, $20\text{px}$, Freeform).
49. **[BUG-049] Marquee Selection Shift-Additive & Ctrl-Toggle Modes**: Dragging a box while holding Shift adds to selection; holding Ctrl toggles individual items.
50. **[BUG-050] Direct Component-to-Component Pin Snap**: Snapping two component terminals directly together without wire creates a direct net node.
51. **[BUG-051] Hierarchical Sub-Circuit Block Creation**: Creating composite multi-pin IC sub-circuits from a group of components.
52. **[BUG-052] High-DPI Retina Vector Icon Crispness**: SVG mini-icons in sidebar palette must render sharp on $2\text{x}$ and $3\text{x}$ DPR displays.
53. **[BUG-053] Text Annotation Rich Formatting**: Text labels need multi-line wrapping and markdown support.
54. **[BUG-054] Component Z-Index Layering (Send to Back / Bring to Front)**: Text notes and bounding boxes should sit beneath wires and components.
55. **[BUG-055] Netlist Circular Loop Impedance Singularity**: Connecting a pure zero-ohm wire loop ($A \to B \to C \to A$) must be reduced to a single electrical node.

---

### Category 4: Interactive Switches & Lighting Dynamics (Bugs 56 – 70)

56. **[BUG-056] Toggle Switch Contact Bounce Transient**: Real switches exhibit $1\text{ms}-5\text{ms}$ contact chatter before steady conduction, essential for digital debouncing demos.
57. **[BUG-057] SPDT Break-Before-Make (BBM) Dead-Time**: SPDT switches must enforce a brief open state ($1\mu\text{s}$) between throws to avoid momentary rail short circuits.
58. **[BUG-058] Pushbutton Momentary Hold Physics**: Pressing down and holding mouse/touch should keep pushbutton closed until release.
59. **[BUG-059] Digital Constant Tri-State (Hi-Z) Mode**: Digital constants should support `0`, `1`, and `Z` (High-Impedance) states.
60. **[BUG-060] Relay Inductive Kickback Back-EMF**: De-energizing a relay coil without a flyback diode must produce a sharp $100\text{V}+$ inductive voltage spike.
61. **[BUG-061] Multi-Pole DIP Switch Array Component**: Adding a 4-pole / 8-pole DIP switch package for bus configuration.
62. **[BUG-062] Keyboard Hotkey Component Triggering**: Pressing numeric keys `1`-`8` toggles corresponding switches; Spacebar fires active pulse.
63. **[BUG-063] Lamp Brightness Proportional to RMS Power**: Incandescent lamp luminosity should scale smoothly with $I_{\text{rms}}^2 R$.
64. **[BUG-064] LED Glowing Halo Emission Angle & Color Filter**: Forward-biased LED emission should project dynamic colored light onto adjacent schematic wires.
65. **[BUG-065] Piezo Buzzer Web Audio Acoustic Synthesizer**: Buzzers with dynamic AC/DC voltage must synthesize real audio frequency via Web Audio API.
66. **[BUG-066] DC Motor RPM & Back-EMF Induction**: Motor back-EMF voltage $V_{\text{bemf}} = K_e \cdot \omega$ increases as rotational speed spins up.
67. **[BUG-067] 7-Segment Display Multi-Segment Dynamic Multiplexing**: Common-anode vs common-cathode 7-segment displays must support rapid dynamic multiplexing.
68. **[BUG-068] Interactive Slider Direct Parameter Tuning**: Potentiometers and variable capacitors should display an on-canvas interactive slider for instant live tuning.
69. **[BUG-069] Voltage-Controlled Switch (VCS) Smooth Conductance Knee**: VCS should transition smoothly between $R_{\text{off}} = 10^9\Omega$ and $R_{\text{on}} = 0.01\Omega$.
70. **[BUG-070] Fuse Blown Visual Indicator & Reset Button**: Blown fuses should display a burned filament vector and interactive reset button.

---

### Category 5: Oscilloscope, Grapher & DSP Analytics (Bugs 71 – 85)

71. **[BUG-071] Multi-Channel Color-Coded Oscilloscope (4 Channels)**: Simultaneous plotting of CH1 (Yellow), CH2 (Cyan), CH3 (Magenta), CH4 (Green).
72. **[BUG-072] Real-Time FFT Spectrum Analyzer with Windowing**: 1024-point FFT with Hanning/Hamming windowing for harmonic distortion and RF analysis.
73. **[BUG-073] Total Harmonic Distortion (THD) Calculator**: Automated THD (%) DSP analytics calculation for audio amplifier benchmarks.
74. **[BUG-074] Differential Voltage Probe Measurement ($V_A - V_B$)**: Probing across floating components without referencing ground.
75. **[BUG-075] AC Coupling DC Block Filter Emulation**: Oscilloscope AC coupling mode ($1\mu\text{F} + 1\text{M}\Omega$) to inspect small AC ripple on high DC voltages.
76. **[BUG-076] Edge Triggering (Rising / Falling Edge with Level & Hysteresis)**: Stabilizing repetitive waveforms on the grapher display.
77. **[BUG-077] XY Mode (Lissajous Figure Pattern Plotter)**: Plotting CH1 vs CH2 on X-Y Cartesian axes for phase shift measurement.
78. **[BUG-078] Dual Vertical & Horizontal Measurement Cursors**: $T_1, T_2, \Delta T, 1/\Delta T$ and $V_1, V_2, \Delta V$ with cubic spline interpolation.
79. **[BUG-079] Arbitrary Waveform Generator (AWG)**: Configurable frequency, amplitude, offset, duty cycle, and DC bias.
80. **[BUG-080] Math Waveform Channels ($A+B, A-B, A \times B, \frac{dA}{dt}$)**: DSP channel arithmetic for power and differential waveforms.
81. **[BUG-081] Roll / Strip-Chart Slow Time-Domain Mode**: Rolling strip-chart display for slow temperature, capacitor charge, and battery discharge curves.
82. **[BUG-082] Single-Shot Transient Trigger with Pre-Trigger Buffer**: Capturing single transient events with 20% pre-trigger waveform history.
83. **[BUG-083] Export Waveform Data to CSV & JSON**: One-click download of all simulated time-voltage datapoints.
84. **[BUG-084] Peak-to-Peak ($V_{pp}$), RMS, Mean, and Frequency Auto-Readouts**: Live hardware-style digital readout tiles.
85. **[BUG-085] Anti-Aliased High-DPI Trace Glow Rendering**: Oscilloscope traces with simulated CRT phosphor bloom and anti-aliasing.

---

### Category 6: PWA, Mobile, Storage & Platform Architecture (Bugs 86 – 100)

86. **[BUG-086] Double-Click vs Double-Tap Touchscreen Parity**: Ensure double-tap on mobile touchscreens activates component move mode identically to mouse double-click.
87. **[BUG-087] Bare Hands Two-Finger Pinch Zoom Anchor Point Invariance**: Pinch zoom on mobile must keep the exact touch midpoint fixed in world coordinates.
88. **[BUG-088] Service Worker Cache Versioning Strategy**: PWA updates must invalidate old script caches and reload seamlessly.
89. **[BUG-089] Firestore Cloud Sync 3-Way Conflict Resolution**: Offline edits must merge gracefully with cloud circuits when reconnecting.
90. **[BUG-090] LocalStorage Quota Guard with Compressed JSON**: Large circuits with 100+ components should use compact JSON serialization.
91. **[BUG-091] Vector SVG & High-Res PNG Export**: Exporting publication-grade circuit schematics with white background and vector text.
92. **[BUG-092] Standard SPICE Netlist (.cir / .net) Import & Export**: Full interoperability with LTspice and Multisim netlist files.
93. **[BUG-093] Fuzzy Component Palette Search & Filter**: Real-time search bar filtering components by keyword, prefix, or category.
94. **[BUG-094] Dark Mode & High-Contrast Light Mode Theme Switching**: CSS variables supporting dark studio theme.
95. **[BUG-095] Keyboard Accessible Navigation**: Arrow keys nudge components; Escape cancels wiring; Delete removes selection.
96. **[BUG-096] Mobile Collapsible Toolbars & Drawers**: Small screens automatically collapse palettes into sliding side drawers.
97. **[BUG-097] Bill of Materials (BOM) & Parts List Generator**: Tabulated parts list with quantities, tolerances, and designators.
98. **[BUG-098] Auto-Save Recovery Snapshot Buffer**: Periodic 15-second background snapshot preserving work against browser crashes.
99. **[BUG-099] Touch Long-Press Quick Action Context Menu**: Long-pressing a component on mobile reveals radial quick menu (Rotate, Flip, Delete, Properties).
100. **[BUG-100] Real-Time Multi-User Collaboration Architecture**: WebRTC / Firestore presence channel for live paired schematic editing.

---

## Verification Plan

### Automated Regression Suites
* Run `test/audit.js` (Component Catalog and Pin Verification).
* Run `test/adversarial_human_workflow_suite.js` (All 10 Groups, 90 Verification Tests).
* Run `test/switcha_features_test.js` (PWA, Manifest, Icons, Switcha 2.0 Feature Tests).
* Run `test/forensic_suite.js` (63 Forensic Physics & Matrix Tests).
* Run `test/real_world_qa_suite.js` (50 Real-World Production EDA QA Tests).

### Manual Verification
* Test pin numbers and IC descriptions on `https://electrosim-4cf3f.web.app`.
* Test default dragging (schematic pan) and double-clicking (component repositioning).
* Test interactive switches (`SPST`, `SPDT`, `DG` switch) and light bulb / LED illumination.
