/**
 * e-Samastha — Complete Arduino Starter Library & Circuit Presets
 * 
 * 25 Educational Starter Presets with complete C++ sketches,
 * component placements, wiring maps, and learning objectives.
 */

export const ARDUINO_PRESETS = [
  {
    id: 'blink',
    name: '1. Basic Blink',
    category: 'Digital',
    description: 'Blinks the built-in LED (Pin 13) on and off every second. The classic embedded Hello World.',
    learningObjectives: 'Understand GPIO output configuration, digital states (HIGH/LOW), and synchronous delay() timing.',
    code: `// e-Samastha — Basic Blink Example
const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("e-Samastha Arduino Lab Initialized!");
  Serial.println("Blinking Pin 13...");
}

void loop() {
  digitalWrite(ledPin, HIGH);
  Serial.println("LED: HIGH (ON)");
  delay(1000);

  digitalWrite(ledPin, LOW);
  Serial.println("LED: LOW (OFF)");
  delay(1000);
}`,
    components: [
      { id: 'led1', type: 'LED', name: 'Red LED', x: 420, y: 140, state: { color: 'red' } }
    ],
    wires: [
      { from: 'led1.anode', to: '13', color: '#ff4444' },
      { from: 'led1.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'button-led',
    name: '2. Pushbutton & LED',
    category: 'Digital',
    description: 'Reads an interactive tactile pushbutton using an internal pull-up resistor (INPUT_PULLUP) and controls an external LED.',
    learningObjectives: 'Master active-low digital inputs, internal pullup registers, and conditional branching.',
    code: `// e-Samastha — Pushbutton & LED
const int buttonPin = 2;
const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);
  Serial.begin(9600);
  Serial.println("Pushbutton Controller Ready.");
  Serial.println("Press the button to turn ON the LED.");
}

void loop() {
  int buttonState = digitalRead(buttonPin);

  // Active LOW with INPUT_PULLUP: 0 = pressed, 1 = released
  if (buttonState == LOW) {
    digitalWrite(ledPin, HIGH);
    Serial.println("Button: PRESSED -> LED ON");
  } else {
    digitalWrite(ledPin, LOW);
  }
  delay(100);
}`,
    components: [
      { id: 'btn1', type: 'BUTTON', name: 'Pushbutton', x: 420, y: 120 },
      { id: 'led1', type: 'LED', name: 'Green LED', x: 420, y: 220, state: { color: 'green' } }
    ],
    wires: [
      { from: 'btn1.pin1', to: '2', color: '#3b82f6' },
      { from: 'btn1.pin2', to: 'GND', color: '#1e293b' },
      { from: 'led1.anode', to: '13', color: '#10b981' },
      { from: 'led1.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'traffic-light',
    name: '3. Traffic Light Controller',
    category: 'Digital',
    description: 'Simulates a standard 3-phase automated traffic signal: Red (Stop) -> Green (Go) -> Yellow (Caution).',
    learningObjectives: 'Understand multi-output state machines, sequence timing, and traffic signal control.',
    code: `// e-Samastha — Traffic Light Controller
const int redPin = 12;
const int yellowPin = 11;
const int greenPin = 10;

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(yellowPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Traffic Light System Active");
}

void loop() {
  // RED Phase
  digitalWrite(redPin, HIGH);
  digitalWrite(yellowPin, LOW);
  digitalWrite(greenPin, LOW);
  Serial.println("[STATE] RED: STOP (3s)");
  delay(3000);

  // GREEN Phase
  digitalWrite(redPin, LOW);
  digitalWrite(yellowPin, LOW);
  digitalWrite(greenPin, HIGH);
  Serial.println("[STATE] GREEN: GO (3s)");
  delay(3000);

  // YELLOW Phase
  digitalWrite(redPin, LOW);
  digitalWrite(yellowPin, HIGH);
  digitalWrite(greenPin, LOW);
  Serial.println("[STATE] YELLOW: CAUTION (1s)");
  delay(1000);
}`,
    components: [
      { id: 'ledRed', type: 'LED', name: 'Red Signal', x: 420, y: 100, state: { color: 'red' } },
      { id: 'ledYellow', type: 'LED', name: 'Yellow Signal', x: 420, y: 180, state: { color: 'yellow' } },
      { id: 'ledGreen', type: 'LED', name: 'Green Signal', x: 420, y: 260, state: { color: 'green' } }
    ],
    wires: [
      { from: 'ledRed.anode', to: '12', color: '#ef4444' },
      { from: 'ledRed.cathode', to: 'GND', color: '#1e293b' },
      { from: 'ledYellow.anode', to: '11', color: '#f59e0b' },
      { from: 'ledYellow.cathode', to: 'GND', color: '#1e293b' },
      { from: 'ledGreen.anode', to: '10', color: '#10b981' },
      { from: 'ledGreen.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'pot-pwm',
    name: '4. Potentiometer & PWM Dimmer',
    category: 'Analog',
    description: 'Reads an analog voltage from a 10k potentiometer on pin A0 and smoothly dims an LED on PWM Pin 9.',
    learningObjectives: 'Learn ADC conversion (0-1023), value mapping with map(), and 8-bit PWM modulation (0-255).',
    code: `// e-Samastha — Potentiometer & PWM Dimmer
const int potPin = A0;
const int ledPin = 9; // PWM pin

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Potentiometer Dimmer Ready.");
}

void loop() {
  int sensorValue = analogRead(potPin); // 0 to 1023
  int outputValue = map(sensorValue, 0, 1023, 0, 255); // 0 to 255 PWM

  analogWrite(ledPin, outputValue);

  Serial.print("Pot: ");
  Serial.print(sensorValue);
  Serial.print(" | PWM: ");
  Serial.println(outputValue);

  delay(50);
}`,
    components: [
      { id: 'pot1', type: 'POTENTIOMETER', name: 'Potentiometer 10k', x: 420, y: 120, state: { ratio: 0.5 } },
      { id: 'led1', type: 'LED', name: 'Blue LED', x: 420, y: 230, state: { color: 'blue' } }
    ],
    wires: [
      { from: 'pot1.vcc', to: '5V', color: '#ef4444' },
      { from: 'pot1.wiper', to: 'A0', color: '#a855f7' },
      { from: 'pot1.gnd', to: 'GND', color: '#1e293b' },
      { from: 'led1.anode', to: '9', color: '#3b82f6' },
      { from: 'led1.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'pwm-fade',
    name: '5. Breathing LED (PWM Fade)',
    category: 'Analog',
    description: 'Produces a smooth continuous breathing fade effect by modulating the PWM duty cycle from 0 to 255 and back.',
    learningObjectives: 'Understand software modulation loops, delta step accumulation, and boundary direction reversals.',
    code: `// e-Samastha — Breathing LED (PWM Fade)
const int ledPin = 9; // PWM pin
int brightness = 0;
int fadeAmount = 5;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("PWM Breathing Fade Started");
}

void loop() {
  analogWrite(ledPin, brightness);

  brightness = brightness + fadeAmount;

  if (brightness <= 0 || brightness >= 255) {
    fadeAmount = -fadeAmount;
    Serial.print("Fade reversal at: ");
    Serial.println(brightness);
  }

  delay(30);
}`,
    components: [
      { id: 'led1', type: 'LED', name: 'White LED', x: 420, y: 150, state: { color: 'white' } }
    ],
    wires: [
      { from: 'led1.anode', to: '9', color: '#3b82f6' },
      { from: 'led1.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'servo-sweep',
    name: '6. Servo Motor Sweep',
    category: 'Actuator',
    description: 'Controls a SG90 micro-servo motor, sweeping the horn smoothly across 0 to 180 degrees using the Servo library.',
    learningObjectives: 'Learn pulse-width servo positioning, angle control (0-180 deg), and the Servo library API.',
    code: `// e-Samastha — Servo Motor Sweep
#include <Servo.h>

Servo myServo;
const int servoPin = 9;

void setup() {
  myServo.attach(servoPin);
  Serial.begin(9600);
  Serial.println("Servo Motor Sweep Initialized");
}

void loop() {
  for (int pos = 0; pos <= 180; pos += 10) {
    myServo.write(pos);
    Serial.print("Servo Angle: ");
    Serial.println(pos);
    delay(30);
  }

  for (int pos = 180; pos >= 0; pos -= 10) {
    myServo.write(pos);
    Serial.print("Servo Angle: ");
    Serial.println(pos);
    delay(30);
  }
}`,
    components: [
      { id: 'servo1', type: 'SERVO', name: 'Micro Servo SG90', x: 420, y: 130, state: { angle: 90 } }
    ],
    wires: [
      { from: 'servo1.signal', to: '9', color: '#f97316' },
      { from: 'servo1.vcc', to: '5V', color: '#ef4444' },
      { from: 'servo1.gnd', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'ultrasonic-distance',
    name: '7. Ultrasonic Distance Sensor',
    category: 'Sensor',
    description: 'Measures obstacle distance using the HC-SR04 ultrasonic sensor with speed-of-sound pulse calculations.',
    learningObjectives: 'Understand pulse timing via pulseIn(), speed of sound round-trip calculations, and proximity telemetry.',
    code: `// e-Samastha — Ultrasonic Distance Sensor (HC-SR04)
const int trigPin = 9;
const int echoPin = 10;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
  Serial.println("HC-SR04 Distance Sensor Active");
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  long distanceCm = duration * 0.034 / 2;

  Serial.print("Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");

  delay(500);
}`,
    components: [
      { id: 'ultra1', type: 'ULTRASONIC', name: 'HC-SR04 Sensor', x: 420, y: 130, state: { distanceCm: 35 } }
    ],
    wires: [
      { from: 'ultra1.vcc', to: '5V', color: '#ef4444' },
      { from: 'ultra1.trig', to: '9', color: '#3b82f6' },
      { from: 'ultra1.echo', to: '10', color: '#10b981' },
      { from: 'ultra1.gnd', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'temperature-telemetry',
    name: '8. Temperature & Humidity Telemetry',
    category: 'Sensor',
    description: 'Monitors ambient thermal conditions and streams telemetry formatted as JSON over the Serial interface.',
    learningObjectives: 'Format sensor telemetry strings, calculate millivolt sensor conversions, and stream serial data.',
    code: `// e-Samastha — Temperature Telemetry
const int sensorPin = A0;

void setup() {
  Serial.begin(9600);
  Serial.println("e-Samastha Telemetry Station Online");
}

void loop() {
  int rawAdc = analogRead(sensorPin);
  float voltage = rawAdc * (5.0 / 1023.0);
  float tempC = voltage * 20.0;

  Serial.print("{\\"tempC\\": ");
  Serial.print(tempC);
  Serial.print(", \\"voltage\\": ");
  Serial.print(voltage);
  Serial.println("}");

  delay(1000);
}`,
    components: [
      { id: 'pot1', type: 'POTENTIOMETER', name: 'Temp Sensor / Pot', x: 420, y: 130, state: { ratio: 0.3 } }
    ],
    wires: [
      { from: 'pot1.vcc', to: '5V', color: '#ef4444' },
      { from: 'pot1.wiper', to: 'A0', color: '#a855f7' },
      { from: 'pot1.gnd', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'lcd-hello',
    name: '9. 16x2 LCD Character Display',
    category: 'Display',
    description: 'Interfaces with a standard HD44780 16x2 Liquid Crystal display to render formatted text and runtime counters.',
    learningObjectives: 'Learn multi-line LCD interface, cursor positioning, and dynamic text streaming.',
    code: `// e-Samastha — 16x2 LCD Character Display
#include <LiquidCrystal.h>

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);
int count = 0;

void setup() {
  lcd.begin(16, 2);
  lcd.print("e-Samastha Lab");
  lcd.setCursor(0, 1);
  lcd.print("Arduino Studio");
  delay(1500);
  lcd.clear();
}

void loop() {
  lcd.setCursor(0, 0);
  lcd.print("Tick: ");
  lcd.print(count);

  lcd.setCursor(0, 1);
  lcd.print("Sim Sec: ");
  lcd.print(millis() / 1000);

  count++;
  delay(1000);
}`,
    components: [
      { id: 'lcd1', type: 'LCD1602', name: '16x2 LCD Display', x: 420, y: 120 }
    ],
    wires: [
      { from: 'lcd1.rs', to: '12', color: '#3b82f6' },
      { from: 'lcd1.e', to: '11', color: '#10b981' },
      { from: 'lcd1.d4', to: '5', color: '#f59e0b' },
      { from: 'lcd1.d5', to: '4', color: '#ef4444' },
      { from: 'lcd1.d6', to: '3', color: '#8b5cf6' },
      { from: 'lcd1.d7', to: '2', color: '#ec4899' }
    ]
  },

  {
    id: 'serial-echo',
    name: '10. Serial Command Console',
    category: 'Communication',
    description: 'Bidirectional serial communication: type commands in the Serial Monitor (e.g., 1 for ON, 0 for OFF) to command the hardware.',
    learningObjectives: 'Master asynchronous serial input handling (Serial.available(), Serial.read()) and command parsing.',
    code: `// e-Samastha — Serial Command Console
const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("=================================");
  Serial.println("e-Samastha Serial Command Console");
  Serial.println("Send '1' to turn ON LED");
  Serial.println("Send '0' to turn OFF LED");
  Serial.println("=================================");
}

void loop() {
  if (Serial.available() > 0) {
    int incomingByte = Serial.read();

    if (incomingByte == '1') {
      digitalWrite(ledPin, HIGH);
      Serial.println("[CMD] LED Turned ON");
    } else if (incomingByte == '0') {
      digitalWrite(ledPin, LOW);
      Serial.println("[CMD] LED Turned OFF");
    }
  }
  delay(50);
}`,
    components: [
      { id: 'led1', type: 'LED', name: 'Red LED', x: 420, y: 150, state: { color: 'red' } }
    ],
    wires: [
      { from: 'led1.anode', to: '13', color: '#ef4444' },
      { from: 'led1.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  // --- NEW PRESETS 11 to 25 ---

  {
    id: 'rgb-mixer',
    name: '11. RGB LED Color Mixer',
    category: 'Output',
    description: 'Blends Red, Green, and Blue light using 3 independent PWM channels to generate a full spectrum of colors.',
    learningObjectives: 'Understand multi-channel PWM duty cycles and additive color mixing physics.',
    code: `// e-Samastha — RGB LED Color Mixer
const int redPin = 9;
const int greenPin = 10;
const int bluePin = 11;

void setColor(int r, int g, int b) {
  analogWrite(redPin, r);
  analogWrite(greenPin, g);
  analogWrite(bluePin, b);
}

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
  Serial.begin(9600);
  Serial.println("RGB Color Mixer Started");
}

void loop() {
  // Red
  setColor(255, 0, 0); delay(800);
  // Green
  setColor(0, 255, 0); delay(800);
  // Blue
  setColor(0, 0, 255); delay(800);
  // Cyan
  setColor(0, 255, 255); delay(800);
  // Yellow
  setColor(255, 255, 0); delay(800);
  // White
  setColor(255, 255, 255); delay(800);
}`,
    components: [
      { id: 'rgb1', type: 'RGB_LED', name: 'RGB LED', x: 420, y: 140 }
    ],
    wires: [
      { from: 'rgb1.r', to: '9', color: '#ef4444' },
      { from: 'rgb1.g', to: '10', color: '#10b981' },
      { from: 'rgb1.b', to: '11', color: '#3b82f6' },
      { from: 'rgb1.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'ldr-night-lamp',
    name: '12. LDR Automatic Night Lamp',
    category: 'Sensor',
    description: 'Monitors ambient light with a Photoresistor (LDR). When ambient lux falls below threshold, automatically illuminates night light.',
    learningObjectives: 'Learn photoresistor voltage divider circuits, analog thresholding, and automated hysteresis control.',
    code: `// e-Samastha — LDR Automatic Night Lamp
const int ldrPin = A0;
const int lampPin = 13;
const int threshold = 400; // Lux threshold

void setup() {
  pinMode(lampPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Automatic Night Lamp Online");
}

void loop() {
  int lightLevel = analogRead(ldrPin);
  Serial.print("Light Level: ");
  Serial.println(lightLevel);

  if (lightLevel < threshold) {
    digitalWrite(lampPin, HIGH);
    Serial.println("[AUTO] Dark detected -> Lamp ON");
  } else {
    digitalWrite(lampPin, LOW);
  }
  delay(200);
}`,
    components: [
      { id: 'ldr1', type: 'LDR', name: 'LDR Photoresistor', x: 420, y: 120, state: { lux: 250 } },
      { id: 'led1', type: 'LED', name: 'Night Lamp', x: 420, y: 220, state: { color: 'yellow' } }
    ],
    wires: [
      { from: 'ldr1.vcc', to: '5V', color: '#ef4444' },
      { from: 'ldr1.sig', to: 'A0', color: '#a855f7' },
      { from: 'ldr1.gnd', to: 'GND', color: '#1e293b' },
      { from: 'led1.anode', to: '13', color: '#f59e0b' },
      { from: 'led1.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'pir-motion',
    name: '13. PIR Motion Detector',
    category: 'Sensor',
    description: 'Detects infrared human presence with a Passive Infrared (PIR) sensor and sounds a security buzzer.',
    learningObjectives: 'Understand digital sensor triggering, intrusion alarms, and event-driven embedded alerts.',
    code: `// e-Samastha — PIR Motion Detector
const int pirPin = 2;
const int buzzerPin = 8;
const int ledPin = 13;

void setup() {
  pinMode(pirPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("PIR Security Alarm Armed");
}

void loop() {
  int motion = digitalRead(pirPin);
  if (motion == HIGH) {
    digitalWrite(ledPin, HIGH);
    tone(buzzerPin, 2000, 100);
    Serial.println("⚠️ MOTION DETECTED! Alarm Active");
  } else {
    digitalWrite(ledPin, LOW);
    noTone(buzzerPin);
  }
  delay(100);
}`,
    components: [
      { id: 'pir1', type: 'PIR_SENSOR', name: 'PIR Motion Sensor', x: 420, y: 120 },
      { id: 'buz1', type: 'BUZZER', name: 'Alarm Buzzer', x: 420, y: 220 }
    ],
    wires: [
      { from: 'pir1.vcc', to: '5V', color: '#ef4444' },
      { from: 'pir1.out', to: '2', color: '#3b82f6' },
      { from: 'pir1.gnd', to: 'GND', color: '#1e293b' },
      { from: 'buz1.pos', to: '8', color: '#f59e0b' },
      { from: 'buz1.neg', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'dht11-weather',
    name: '14. DHT11 Weather Monitor',
    category: 'Sensor',
    description: 'Monitors environmental conditions by sampling temperature and relative humidity with serial telemetry output.',
    learningObjectives: 'Learn digital sensor communication protocols, climate metrics, and serial report formatting.',
    code: `// e-Samastha — DHT11 Weather Monitor
const int dhtPin = 2;

void setup() {
  pinMode(dhtPin, INPUT);
  Serial.begin(9600);
  Serial.println("DHT11 Weather Station Initialized");
}

void loop() {
  // Simulated ambient acquisition
  float temperature = 26.5;
  float humidity = 58.0;

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print(" °C | Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  delay(2000);
}`,
    components: [
      { id: 'dht1', type: 'DHT11', name: 'DHT11 Sensor', x: 420, y: 140 }
    ],
    wires: [
      { from: 'dht1.vcc', to: '5V', color: '#ef4444' },
      { from: 'dht1.data', to: '2', color: '#3b82f6' },
      { from: 'dht1.gnd', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'parking-sensor',
    name: '15. HC-SR04 Parking Sensor',
    category: 'Sensor',
    description: 'Emulates an automotive parking assist radar: beeps faster as an obstacle gets closer to the vehicle bumper.',
    learningObjectives: 'Translate continuous physical distance measurements into variable-rate audio feedback queues.',
    code: `// e-Samastha — HC-SR04 Parking Sensor
const int trigPin = 9;
const int echoPin = 10;
const int buzzerPin = 8;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Parking Radar Active");
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  long dist = duration * 0.034 / 2;

  Serial.print("Distance: ");
  Serial.print(dist);
  Serial.println(" cm");

  if (dist < 15) {
    tone(buzzerPin, 2500, 50);
    delay(100);
  } else if (dist < 40) {
    tone(buzzerPin, 1800, 50);
    delay(300);
  } else {
    noTone(buzzerPin);
    delay(500);
  }
}`,
    components: [
      { id: 'ultra1', type: 'ULTRASONIC', name: 'HC-SR04', x: 420, y: 120, state: { distanceCm: 20 } },
      { id: 'buz1', type: 'BUZZER', name: 'Warning Beeper', x: 420, y: 220 }
    ],
    wires: [
      { from: 'ultra1.vcc', to: '5V', color: '#ef4444' },
      { from: 'ultra1.trig', to: '9', color: '#3b82f6' },
      { from: 'ultra1.echo', to: '10', color: '#10b981' },
      { from: 'ultra1.gnd', to: 'GND', color: '#1e293b' },
      { from: 'buz1.pos', to: '8', color: '#f59e0b' },
      { from: 'buz1.neg', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'servo-door-lock',
    name: '16. Servo Door Lock',
    category: 'Actuator',
    description: 'Implements an electronic deadbolt lock using a push-to-toggle button and a micro servo actuator.',
    learningObjectives: 'Apply toggle state variables to physical actuator positions (0 deg = Locked, 90 deg = Unlocked).',
    code: `// e-Samastha — Servo Door Lock
#include <Servo.h>

Servo lockServo;
const int btnPin = 2;
const int servoPin = 9;
bool isLocked = true;

void setup() {
  lockServo.attach(servoPin);
  lockServo.write(0); // Locked position
  pinMode(btnPin, INPUT_PULLUP);
  Serial.begin(9600);
  Serial.println("Smart Lock Initialized: LOCKED");
}

void loop() {
  if (digitalRead(btnPin) == LOW) {
    isLocked = !isLocked;
    if (isLocked) {
      lockServo.write(0);
      Serial.println("[DOOR] LOCKED (0°)");
    } else {
      lockServo.write(90);
      Serial.println("[DOOR] UNLOCKED (90°)");
    }
    delay(500); // debounce delay
  }
  delay(50);
}`,
    components: [
      { id: 'btn1', type: 'BUTTON', name: 'Lock Toggle', x: 420, y: 120 },
      { id: 'srv1', type: 'SERVO', name: 'Deadbolt Servo', x: 420, y: 220, state: { angle: 0 } }
    ],
    wires: [
      { from: 'btn1.pin1', to: '2', color: '#3b82f6' },
      { from: 'btn1.pin2', to: 'GND', color: '#1e293b' },
      { from: 'srv1.signal', to: '9', color: '#f97316' },
      { from: 'srv1.vcc', to: '5V', color: '#ef4444' },
      { from: 'srv1.gnd', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'pedestrian-light',
    name: '17. Traffic Light with Pedestrian Button',
    category: 'Digital',
    description: 'A street traffic light that switches to red to safely allow pedestrian crossing when the walk button is pressed.',
    learningObjectives: 'Learn interrupt-style polling, pedestrian safety sequencing, and multi-state controllers.',
    code: `// e-Samastha — Pedestrian Traffic Light
const int redPin = 12;
const int yellowPin = 11;
const int greenPin = 10;
const int pedBtn = 2;

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(yellowPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(pedBtn, INPUT_PULLUP);
  Serial.begin(9600);
  Serial.println("Pedestrian Crossing Light Ready");
}

void loop() {
  digitalWrite(greenPin, HIGH);
  digitalWrite(yellowPin, LOW);
  digitalWrite(redPin, LOW);

  if (digitalRead(pedBtn) == LOW) {
    Serial.println("[PEDESTRIAN] Button Pressed! Cycling lights...");
    delay(1000);

    // Yellow Caution
    digitalWrite(greenPin, LOW);
    digitalWrite(yellowPin, HIGH);
    delay(2000);

    // Red Walk
    digitalWrite(yellowPin, LOW);
    digitalWrite(redPin, HIGH);
    Serial.println("[WALK] Pedestrian Crossing ACTIVE (4s)");
    delay(4000);
  }
  delay(100);
}`,
    components: [
      { id: 'btn1', type: 'BUTTON', name: 'Crosswalk Button', x: 420, y: 100 },
      { id: 'ledR', type: 'LED', name: 'Red', x: 420, y: 170, state: { color: 'red' } },
      { id: 'ledY', type: 'LED', name: 'Yellow', x: 420, y: 240, state: { color: 'yellow' } },
      { id: 'ledG', type: 'LED', name: 'Green', x: 420, y: 310, state: { color: 'green' } }
    ],
    wires: [
      { from: 'btn1.pin1', to: '2', color: '#3b82f6' },
      { from: 'btn1.pin2', to: 'GND', color: '#1e293b' },
      { from: 'ledR.anode', to: '12', color: '#ef4444' },
      { from: 'ledR.cathode', to: 'GND', color: '#1e293b' },
      { from: 'ledY.anode', to: '11', color: '#f59e0b' },
      { from: 'ledY.cathode', to: 'GND', color: '#1e293b' },
      { from: 'ledG.anode', to: '10', color: '#10b981' },
      { from: 'ledG.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'digital-thermometer',
    name: '18. Digital Thermometer (LM35)',
    category: 'Sensor',
    description: 'Reads precise temperatures using an analog LM35 precision centigrade temperature sensor.',
    learningObjectives: 'Convert raw ADC readings into accurate thermal units using linear voltage formulas ($V / 10mV$).',
    code: `// e-Samastha — Digital Thermometer (LM35)
const int lm35Pin = A0;

void setup() {
  Serial.begin(9600);
  Serial.println("Precision Digital Thermometer Online");
}

void loop() {
  int raw = analogRead(lm35Pin);
  float millivolts = (raw / 1023.0) * 5000.0;
  float celsius = millivolts / 10.0; // LM35 = 10mV per degree C
  float fahrenheit = (celsius * 9.0 / 5.0) + 32.0;

  Serial.print("Temp: ");
  Serial.print(celsius);
  Serial.print(" °C | ");
  Serial.print(fahrenheit);
  Serial.println(" °F");

  delay(1000);
}`,
    components: [
      { id: 'temp1', type: 'LM35', name: 'LM35 Sensor', x: 420, y: 140, state: { tempC: 28.5 } }
    ],
    wires: [
      { from: 'temp1.vcc', to: '5V', color: '#ef4444' },
      { from: 'temp1.vout', to: 'A0', color: '#a855f7' },
      { from: 'temp1.gnd', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'oled-dashboard',
    name: '19. OLED Sensor Dashboard',
    category: 'Display',
    description: 'Renders dynamic graphics and text on a 128x64 monochromatic OLED display over the I2C bus.',
    learningObjectives: 'Understand I2C peripheral addresses (SDA/SCL) and screen page buffering.',
    code: `// e-Samastha — OLED Sensor Dashboard
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display;
int counter = 0;

void setup() {
  display.begin();
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("e-Samastha Lab");
  display.println("OLED Monitor 128x64");
  display.display();
  delay(1000);
}

void loop() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("System Telemetry");
  display.print("Runtime (s): ");
  display.println(millis() / 1000);
  display.print("Loop Count: ");
  display.println(counter);
  display.display();

  counter++;
  delay(500);
}`,
    components: [
      { id: 'oled1', type: 'OLED12864', name: 'OLED 128x64', x: 420, y: 130 }
    ],
    wires: [
      { from: 'oled1.vcc', to: '5V', color: '#ef4444' },
      { from: 'oled1.gnd', to: 'GND', color: '#1e293b' },
      { from: 'oled1.scl', to: 'A5', color: '#3b82f6' },
      { from: 'oled1.sda', to: 'A4', color: '#10b981' }
    ]
  },

  {
    id: 'home-automation',
    name: '20. Mini Home Automation',
    category: 'System',
    description: 'A multi-zone home automation hub controlling a living room lamp, climate fan, and security door.',
    learningObjectives: 'Integrate mixed actuators (relay, motor, servo) under a central dispatch program.',
    code: `// e-Samastha — Mini Home Automation Hub
const int lightRelay = 8;
const int fanMotor = 9;

void setup() {
  pinMode(lightRelay, OUTPUT);
  pinMode(fanMotor, OUTPUT);
  Serial.begin(9600);
  Serial.println("e-Samastha Smart Home Hub Online");
  Serial.println("Commands: 'L'=Light Toggle, 'F'=Fan ON, 'O'=All OFF");
}

void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == 'L' || cmd == 'l') {
      digitalWrite(lightRelay, HIGH);
      Serial.println("[HUB] Lights Activated");
    } else if (cmd == 'F' || cmd == 'f') {
      analogWrite(fanMotor, 200);
      Serial.println("[HUB] Fan High Speed");
    } else if (cmd == 'O' || cmd == 'o') {
      digitalWrite(lightRelay, LOW);
      analogWrite(fanMotor, 0);
      Serial.println("[HUB] All Appliances OFF");
    }
  }
  delay(100);
}`,
    components: [
      { id: 'relay1', type: 'RELAY', name: 'Light Relay', x: 420, y: 110 },
      { id: 'motor1', type: 'DC_MOTOR', name: 'Climate Fan', x: 420, y: 220 }
    ],
    wires: [
      { from: 'relay1.vcc', to: '5V', color: '#ef4444' },
      { from: 'relay1.in', to: '8', color: '#3b82f6' },
      { from: 'relay1.gnd', to: 'GND', color: '#1e293b' },
      { from: 'motor1.pos', to: '9', color: '#f59e0b' },
      { from: 'motor1.neg', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'relay-control',
    name: '21. Relay Control',
    category: 'Actuator',
    description: 'Operates an electromechanical isolation relay module, providing galvanically isolated power switching.',
    learningObjectives: 'Understand galvanic isolation, coil energization, and NC/NO contacts.',
    code: `// e-Samastha — Relay Control
const int relayPin = 8;

void setup() {
  pinMode(relayPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Relay Module Test");
}

void loop() {
  digitalWrite(relayPin, HIGH);
  Serial.println("Relay: ENERGIZED (NO Closed)");
  delay(2000);

  digitalWrite(relayPin, LOW);
  Serial.println("Relay: DE-ENERGIZED (NC Closed)");
  delay(2000);
}`,
    components: [
      { id: 'rel1', type: 'RELAY', name: 'Relay Module', x: 420, y: 140 }
    ],
    wires: [
      { from: 'rel1.vcc', to: '5V', color: '#ef4444' },
      { from: 'rel1.in', to: '8', color: '#3b82f6' },
      { from: 'rel1.gnd', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'ir-remote',
    name: '22. IR Obstacle Detector',
    category: 'Sensor',
    description: 'Uses an active infrared reflective sensor to detect nearby physical objects and switch indicators.',
    learningObjectives: 'Master reflective optocoupler physics, digital active-low thresholding, and proximity detection.',
    code: `// e-Samastha — IR Obstacle Detector
const int irPin = 2;
const int ledPin = 13;

void setup() {
  pinMode(irPin, INPUT);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Infrared Proximity Station Ready");
}

void loop() {
  // IR sensors commonly output LOW when obstacle is present
  int state = digitalRead(irPin);
  if (state == LOW) {
    digitalWrite(ledPin, HIGH);
    Serial.println("Obstacle in proximity!");
  } else {
    digitalWrite(ledPin, LOW);
  }
  delay(100);
}`,
    components: [
      { id: 'ir1', type: 'IR_SENSOR', name: 'IR Proximity Sensor', x: 420, y: 120, state: { obstacle: true } },
      { id: 'led1', type: 'LED', name: 'Indicator', x: 420, y: 220, state: { color: 'red' } }
    ],
    wires: [
      { from: 'ir1.vcc', to: '5V', color: '#ef4444' },
      { from: 'ir1.out', to: '2', color: '#3b82f6' },
      { from: 'ir1.gnd', to: 'GND', color: '#1e293b' },
      { from: 'led1.anode', to: '13', color: '#ef4444' },
      { from: 'led1.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'pwm-motor-speed',
    name: '23. PWM Motor Speed Control',
    category: 'Actuator',
    description: 'Reads an analog potentiometer to control the rotational speed and RPM of a DC motor via PWM modulation.',
    learningObjectives: 'Understand motor driver duty cycles, PWM voltage modulation, and rotational kinetic power.',
    code: `// e-Samastha — PWM Motor Speed Control
const int potPin = A0;
const int motorPin = 9;

void setup() {
  pinMode(motorPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("DC Motor Speed Controller Active");
}

void loop() {
  int pot = analogRead(potPin);
  int speed = map(pot, 0, 1023, 0, 255);

  analogWrite(motorPin, speed);

  Serial.print("Throttle: ");
  Serial.print(map(speed, 0, 255, 0, 100));
  Serial.println("%");

  delay(100);
}`,
    components: [
      { id: 'pot1', type: 'POTENTIOMETER', name: 'Throttle Pot', x: 420, y: 120, state: { ratio: 0.75 } },
      { id: 'motor1', type: 'DC_MOTOR', name: 'DC Motor', x: 420, y: 230 }
    ],
    wires: [
      { from: 'pot1.vcc', to: '5V', color: '#ef4444' },
      { from: 'pot1.wiper', to: 'A0', color: '#a855f7' },
      { from: 'pot1.gnd', to: 'GND', color: '#1e293b' },
      { from: 'motor1.pos', to: '9', color: '#f59e0b' },
      { from: 'motor1.neg', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'stepper-motor',
    name: '24. Stepper Motor Step Sequence',
    category: 'Actuator',
    description: 'Executes a 4-phase unipolar stepper motor drive sequence to advance shaft rotation in precise angular steps.',
    learningObjectives: 'Understand multi-phase commutation, electromagnetic rotor alignment, and step intervals.',
    code: `// e-Samastha — Stepper Motor Sequence
const int p1 = 8;
const int p2 = 9;
const int p3 = 10;
const int p4 = 11;

void stepPhase(int a, int b, int c, int d) {
  digitalWrite(p1, a);
  digitalWrite(p2, b);
  digitalWrite(p3, c);
  digitalWrite(p4, d);
  delay(100);
}

void setup() {
  pinMode(p1, OUTPUT);
  pinMode(p2, OUTPUT);
  pinMode(p3, OUTPUT);
  pinMode(p4, OUTPUT);
  Serial.begin(9600);
  Serial.println("Stepper 4-Phase Commutation Online");
}

void loop() {
  stepPhase(1, 0, 0, 0);
  stepPhase(0, 1, 0, 0);
  stepPhase(0, 0, 1, 0);
  stepPhase(0, 0, 0, 1);
  Serial.println("Full step rotation completed");
}`,
    components: [
      { id: 'led1', type: 'LED', name: 'Phase A', x: 420, y: 100, state: { color: 'red' } },
      { id: 'led2', type: 'LED', name: 'Phase B', x: 420, y: 170, state: { color: 'green' } },
      { id: 'led3', type: 'LED', name: 'Phase C', x: 420, y: 240, state: { color: 'yellow' } },
      { id: 'led4', type: 'LED', name: 'Phase D', x: 420, y: 310, state: { color: 'blue' } }
    ],
    wires: [
      { from: 'led1.anode', to: '8', color: '#ef4444' },
      { from: 'led1.cathode', to: 'GND', color: '#1e293b' },
      { from: 'led2.anode', to: '9', color: '#10b981' },
      { from: 'led2.cathode', to: 'GND', color: '#1e293b' },
      { from: 'led3.anode', to: '10', color: '#f59e0b' },
      { from: 'led3.cathode', to: 'GND', color: '#1e293b' },
      { from: 'led4.anode', to: '11', color: '#3b82f6' },
      { from: 'led4.cathode', to: 'GND', color: '#1e293b' }
    ]
  },

  {
    id: 'i2c-lcd',
    name: '25. I2C LCD Display',
    category: 'Display',
    description: 'Communicates with a 16x2 character display across the two-wire I2C bus (SDA on A4, SCL on A5).',
    learningObjectives: 'Understand serial communication buses, I2C bus pinouts, and reduced-wire display drivers.',
    code: `// e-Samastha — I2C 16x2 LCD Display
#include <LiquidCrystal.h>

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  lcd.begin(16, 2);
  lcd.print("I2C LCD Bus");
  lcd.setCursor(0, 1);
  lcd.print("Addr: 0x27 (A4/A5)");
  Serial.begin(9600);
  Serial.println("I2C Display Initialized at address 0x27");
}

void loop() {
  delay(1000);
}`,
    components: [
      { id: 'lcd1', type: 'LCD1602', name: 'I2C 16x2 LCD', x: 420, y: 130 }
    ],
    wires: [
      { from: 'lcd1.rs', to: '12', color: '#3b82f6' },
      { from: 'lcd1.e', to: '11', color: '#10b981' },
      { from: 'lcd1.d4', to: '5', color: '#f59e0b' },
      { from: 'lcd1.d5', to: '4', color: '#ef4444' },
      { from: 'lcd1.d6', to: '3', color: '#8b5cf6' },
      { from: 'lcd1.d7', to: '2', color: '#ec4899' }
    ]
  }
];
