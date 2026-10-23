import { Course } from '../types';

export const coursesData: Course[] = [
  {
    id: 'iot-hardware-firmware',
    title: 'Practical IoT Systems & Firmware Engineering',
    tagline: 'Connect sensors, write low-power firmware, and stream telemetry over wireless networks.',
    category: 'Internet of Things',
    level: 'Foundational to Intermediate',
    description: 'A hands-on, hardware-first curriculum focused on interfacing physical sensors, designing resilient microcontroller circuits, and publishing data over MQTT and HTTP protocols.',
    curriculumHighlights: [
      'Microcontroller architecture & register-level GPIO control',
      'Analog-to-digital conversion, noise filtering & sensor calibration',
      'Serial protocols: I2C, SPI, UART, and RS-485 Modbus',
      'Low-power sleep profiling and battery management circuits',
      'Cloud & local telemetry visualization dashboards'
    ],
    handsOnDeliverable: 'Build a working multi-sensor environmental IoT node with live web telemetry.',
    status: 'Coming Soon'
  },
  {
    id: 'embedded-c-microcontrollers',
    title: 'Embedded Systems & Microcontroller Programming',
    tagline: 'Master C/C++ firmware, bare-metal hardware control, and real-time scheduling.',
    category: 'Embedded Systems',
    level: 'Intermediate',
    description: 'Learn the principles of robust embedded programming: writing interrupt service routines, timer manipulation, memory optimization, and multi-tasking on 32-bit MCUs.',
    curriculumHighlights: [
      'C/C++ for embedded targets: pointers, bitwise math, memory maps',
      'Hardware timers, PWM generation, and external interrupts',
      'State-machine architecture and non-blocking task schedulers',
      'Hardware debugging with logic analyzers and oscilloscopes',
      'Writing device drivers for display screens and sensors'
    ],
    handsOnDeliverable: 'Develop a deterministic firmware controller for a closed-loop automated actuator.',
    status: 'Coming Soon'
  },
  {
    id: 'smart-agri-tech-systems',
    title: 'Smart Agriculture & Sensor Instrumentation',
    tagline: 'Engineer sensor systems for soil health, microclimate monitoring, and automated irrigation.',
    category: 'Smart Agriculture',
    level: 'Applied Engineering',
    description: 'Designed for engineers, agritech enthusiasts, and researchers who want to build precision agricultural instrumentation adapted for harsh outdoor and greenhouse conditions.',
    curriculumHighlights: [
      'Soil chemistry fundamentals: pH, electrical conductivity, and NPK metrics',
      'Capacitive soil moisture sensing vs. resistive probe degradation',
      'Automated drip and mist actuation with fail-safe relay interlocks',
      'Weather station design (temp, RH, solar radiation, barometric pressure)',
      'Solar-powered off-grid power supply sizing'
    ],
    handsOnDeliverable: 'Construct an automated greenhouse micro-climate controller and soil tester.',
    status: 'Coming Soon'
  },
  {
    id: 'robotics-actuator-control',
    title: 'Robotics, Actuators & Motor Drives',
    tagline: 'Integrate stepper motors, servo mechanisms, kinematics, and spatial sensors.',
    category: 'Robotics',
    level: 'Intermediate',
    description: 'Explore the mechanical and electrical integration of robotic mechanisms: motor driver stages, optical encoders, trajectory smoothing, and ultrasonic feedback.',
    curriculumHighlights: [
      'DC, stepper, and servo motor operating principles & H-bridge drivers',
      'Encoder feedback loops and closed-loop PID positioning',
      'Ultrasonic, infrared, and time-of-flight (ToF) rangefinding',
      'Power distribution, flyback protection, and motor noise decoupling',
      'Kinematic stage design and linear automation'
    ],
    handsOnDeliverable: 'Build a programmable multi-axis robotic mechanism with precision position feedback.',
    status: 'Coming Soon'
  },
  {
    id: 'edge-ai-sensor-intelligence',
    title: 'Applied AI & TinyML for Connected Devices',
    tagline: 'Deploy machine learning models directly onto resource-constrained microcontrollers.',
    category: 'AI / ML',
    level: 'Advanced',
    description: 'Discover how to run anomaly detection, acoustic keyword spotting, and signal classification right at the hardware edge without relying on cloud computation.',
    curriculumHighlights: [
      'Time-series sensor feature extraction (FFT, spectral analysis, filtering)',
      'Model training with TensorFlow Lite for Microcontrollers (TFLM)',
      'Quantization techniques (int8 precision) for low memory footprints',
      'Anomaly detection algorithms for vibrating machinery',
      'Edge vision screening with low-cost camera modules'
    ],
    handsOnDeliverable: 'Train and deploy an embedded model to classify sensor vibration patterns in real time.',
    status: 'Coming Soon'
  },
  {
    id: 'arduino-microcontrollers-starter',
    title: 'Hands-On Microcontrollers & Circuit Building',
    tagline: 'The ideal entry point: understand electronics, breadboard circuits, and write your first code.',
    category: 'Arduino / Microcontrollers',
    level: 'Beginner',
    description: 'A practical, zero-fluff introduction to building electronic circuits, understanding voltage/current fundamentals, and programming microcontroller boards to interact with the physical world.',
    curriculumHighlights: [
      'Basic electrical concepts: Ohm’s law, pull-up/pull-down resistors, capacitors',
      'Digital input/output and analog reading basics',
      'Interfacing LEDs, buzzers, relays, buttons, and light sensors',
      'Reading temperature and distance sensors',
      'Writing clean, modular Arduino code'
    ],
    handsOnDeliverable: 'Build an interactive automated lighting and security alarm circuit.',
    status: 'Coming Soon'
  }
];
