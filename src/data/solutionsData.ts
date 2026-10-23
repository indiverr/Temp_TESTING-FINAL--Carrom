import { Solution } from '../types';

export const solutionsData: Solution[] = [
  {
    id: 'iot-sensor-systems',
    title: 'IoT & Sensor Systems',
    shortDesc: 'Connected sensing systems designed to collect meaningful real-world data.',
    fullDesc: 'We architect end-to-end sensing solutions that capture physical signals from soil, water, ambient atmospheres, and machinery, transforming raw analog telemetry into clear, actionable digital streams.',
    iconName: 'Cpu',
    highlight: 'Reliable Signal Acquisition in Challenging Physical Environments',
    capabilities: [
      'Multi-parameter sensor interfacing (analog, I2C, SPI, RS-485)',
      'Low-power telemetry & remote data packet transmission',
      'Signal conditioning, noise filtering, and edge calibration',
      'Real-time metric visualization & alerting architectures'
    ],
    applications: [
      'Soil health & environmental monitoring',
      'Water quality & liquid storage monitoring',
      'Industrial machinery temperature & vibration checks',
      'Atmospheric greenhouse condition telemetry'
    ]
  },
  {
    id: 'embedded-systems',
    title: 'Embedded Systems',
    shortDesc: 'Hardware and firmware development for practical intelligent devices.',
    fullDesc: 'Ground-up microcontroller design, circuit layout, and deterministic embedded firmware engineered for continuous operation, energy efficiency, and rugged physical reliability.',
    iconName: 'CircuitBoard',
    highlight: 'Hardware-Firmware Harmony for Mission-Critical Reliability',
    capabilities: [
      'Custom PCB schematic design & rapid prototyping',
      'C/C++ and FreeRTOS embedded firmware development',
      'Microcontroller optimization (32-bit ARM, RISC-V, ESP32, AVR)',
      'Battery management, solar charging, and deep sleep profiling'
    ],
    applications: [
      'Dedicated field measurement instruments',
      'Custom controller breakout boards',
      'Automated actuator and relay switching nodes',
      'Portable diagnostic devices'
    ]
  },
  {
    id: 'smart-agriculture',
    title: 'Smart Agriculture',
    shortDesc: 'Technology for monitoring, sensing and automation in agricultural environments.',
    fullDesc: 'Empowering cultivators, research nurseries, and modern agricultural setups with real-time insight into soil pH, root-zone moisture, and climate parameters to optimize water and nutrient application.',
    iconName: 'Sprout',
    highlight: 'Practical Field Tech Built for Real Ground Conditions',
    capabilities: [
      'In-situ multi-depth soil testing arrays',
      'Automated micro-drip and mist irrigation controllers',
      'Greenhouse climate monitoring (temp, humidity, PAR light)',
      'Closed-loop cultivation chamber systems'
    ],
    applications: [
      'Precision open-field crop management',
      'Urban vertical farming & microgreens cultivation',
      'Soil health assessment & laboratory verification',
      'Automated nursery and greenhouse management'
    ]
  },
  {
    id: 'automation',
    title: 'Automation',
    shortDesc: 'Sensor-driven systems that reduce repetitive manual intervention.',
    fullDesc: 'Autonomous feedback loops that couple physical sensing directly to high-reliability actuators, pumps, valves, and electrical switches to eliminate manual monitoring errors.',
    iconName: 'Cog',
    highlight: 'Closed-Loop Systems That React Faster Than Human Reflexes',
    capabilities: [
      'Hysteresis-based autonomous relay switching',
      'Pump protection interlocks and reservoir level sensing',
      'Motor drive & servo actuator integration',
      'Fail-safe hardware states and watchdog timers'
    ],
    applications: [
      'Irrigation and liquid dispensing automation',
      'Industrial batch tank level control',
      'Automated climate ventilation and fan cycling',
      'Scheduled electrical equipment management'
    ]
  },
  {
    id: 'robotics-intelligent-systems',
    title: 'Robotics & Intelligent Systems',
    shortDesc: 'Integrated hardware and software for intelligent physical systems.',
    fullDesc: 'Merging sensors, motor controllers, mechanical linkages, and embedded compute to create articulated robotic systems and responsive physical mechanisms.',
    iconName: 'Bot',
    highlight: 'Physical Mechanics Guided by Sensor Precision',
    capabilities: [
      'Precision stepper and DC servo motor control',
      'Kinematic mechanisms and automated positioning stages',
      'Ultrasonic, LiDAR, and optical proximity integration',
      'Embedded trajectory planning and collision avoidance logic'
    ],
    applications: [
      'Automated inspection mechanisms',
      'Laboratory sample handling stages',
      'Mobile robotic prototyping platforms',
      'Precision linear positioning actuators'
    ]
  },
  {
    id: 'ai-ml-integration',
    title: 'AI / ML Integration',
    shortDesc: 'Use AI and machine learning where they provide meaningful value to connected systems.',
    fullDesc: 'We apply machine learning models pragmatically to sensor time-series data and edge vision streams where computational inference solves real diagnostic, predictive, and classification problems.',
    iconName: 'BrainCircuit',
    highlight: 'Pragmatic Machine Learning with Real Physical Signals',
    capabilities: [
      'Edge anomaly detection in sensor time-series',
      'Predictive trend modeling for agricultural metrics',
      'Computer vision for crop health & surface inspection',
      'Lightweight model quantization for embedded deployment'
    ],
    applications: [
      'Soil nutrient trend forecasting',
      'Machine health anomaly alerts',
      'Visual leaf disease screening',
      'Intelligent resource optimization algorithms'
    ]
  }
];
