import { InternshipTrack } from '../types';

export const internshipsData: InternshipTrack[] = [
  {
    id: 'track-iot-systems',
    title: 'IoT & Telemetry Systems Intern',
    area: 'Connected Hardware & Sensor Networks',
    focus: 'Sensor interfacing, telemetry protocols, wireless transceiver firmware, and cloud data logging.',
    description: 'Work alongside the engineering team to design, assemble, and bench-test multi-sensor hardware nodes. You will interface real-world sensors, optimize low-power sleep modes, and build live telemetry visualizations.',
    skillsDeveloped: [
      'ESP32 / ARM Cortex firmware design',
      'MQTT & HTTP telemetry pipelines',
      'Hardware sensor calibration & signal filtering',
      'PCB testing & logic analyzer debugging'
    ],
    prerequisites: [
      'Basic knowledge of C/C++ or Python',
      'Familiarity with microcontroller boards (ESP32, Arduino, STM32)',
      'Curiosity for physical computing and hardware prototyping'
    ],
    status: 'Opportunities Coming Soon'
  },
  {
    id: 'track-embedded-firmware',
    title: 'Embedded Systems & Firmware Engineering Intern',
    area: 'Hardware Design & Low-Level C/C++',
    focus: 'Microcontroller architecture, register manipulation, hardware timers, and communication bus drivers.',
    description: 'Dive deep into bare-metal embedded programming and hardware design. You will write device drivers for I2C/SPI sensors, construct RTOS task schedulers, and assist in schematic and PCB layout reviews.',
    skillsDeveloped: [
      'Embedded C/C++ memory management',
      'FreeRTOS task scheduling & synchronization',
      'Hardware bus protocols (RS-485, SPI, I2C, UART)',
      'Circuit schematic capture & PCB layout basics'
    ],
    prerequisites: [
      'Good foundation in C programming and digital electronics',
      'Understanding of microcontrollers and memory concepts',
      'Hands-on experience with breadboarding or circuit wiring'
    ],
    status: 'Opportunities Coming Soon'
  },
  {
    id: 'track-smart-agritech',
    title: 'Smart Agriculture & Automation Intern',
    area: 'Agritech Prototyping & Actuation',
    focus: 'Soil testing instrumentation, closed-loop irrigation controllers, and automated greenhouse chambers.',
    description: 'Contribute to real agricultural technology prototypes. You will help build and calibrate soil parameter probes, assemble automated micro-irrigation chambers, and test closed-loop pump control algorithms.',
    skillsDeveloped: [
      'Electrochemical sensor interfacing (pH, EC, moisture)',
      'Actuator & relay safety driver circuits',
      'Field testing methodology & environmental validation',
      'Data logging & agricultural metrics analysis'
    ],
    prerequisites: [
      'Background in Electrical, Electronics, Mechatronics, Agriculture Engineering, or Computer Science',
      'Interest in real-world agricultural engineering solutions',
      'Hands-on problem solving orientation'
    ],
    status: 'Opportunities Coming Soon'
  },
  {
    id: 'track-robotics-mechatronics',
    title: 'Robotics & Mechatronics Intern',
    area: 'Physical Mechanisms & Motion Control',
    focus: 'Motor drives, robotic linkages, spatial sensor fusion, and micro-positioning automation.',
    description: 'Participate in the mechanical and electrical prototyping of automated stages and robotic mechanisms. You will implement motor control algorithms, interface rotary encoders, and calibrate motion feedback loops.',
    skillsDeveloped: [
      'Stepper / BLDC / DC servo motor control',
      'Closed-loop PID velocity and position tuning',
      'Mechanical CAD prototyping & 3D printing integration',
      'Sensor feedback fusion (ultrasonic, optical, limit switches)'
    ],
    prerequisites: [
      'Knowledge of mechanics, motors, and microcontrollers',
      'Basic CAD familiarity is a plus',
      'Enthusiasm for building physical mechanical assemblies'
    ],
    status: 'Opportunities Coming Soon'
  },
  {
    id: 'track-applied-ai-ml',
    title: 'Applied AI & TinyML Intern',
    area: 'Edge Machine Learning & Analytics',
    focus: 'Sensor time-series classification, vibration anomaly detection, and embedded edge inferencing.',
    description: 'Explore applying machine learning models to physical data streams. You will collect real sensor telemetry, train compact models, quantize them, and deploy them onto microcontroller hardware.',
    skillsDeveloped: [
      'Time-series preprocessing & feature engineering',
      'TensorFlow Lite / Edge AI deployment pipelines',
      'Anomaly detection algorithms for sensor data',
      'Model optimization for low RAM/Flash constraints'
    ],
    prerequisites: [
      'Proficiency in Python, NumPy, and basic machine learning principles',
      'Interest in edge computing and physical sensor intelligence'
    ],
    status: 'Opportunities Coming Soon'
  },
  {
    id: 'track-technology-rd',
    title: 'Technology R&D & Prototyping Intern',
    area: 'Experimental Engineering & Proof-of-Concepts',
    focus: 'Literature review, rapid breadboard prototyping, feasibility testing, and technical documentation.',
    description: 'Work at the intersection of emerging concepts and practical hardware. You will investigate new sensing methods, assemble rapid proof-of-concept breadboards, and produce rigorous technical test reports.',
    skillsDeveloped: [
      'Rapid prototype iteration & bench testing',
      'Technical report authoring & schematic documentation',
      'Component sourcing & Bill-of-Materials (BOM) optimization',
      'Experimental design & measurement repeatability'
    ],
    prerequisites: [
      'Strong engineering curiosity and systematic thinking',
      'Disciplined documentation and analytical skills',
      'Passion for turning early ideas into working physical devices'
    ],
    status: 'Opportunities Coming Soon'
  }
];
