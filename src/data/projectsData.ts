import { Project } from '../types';

export const projectsData: Project[] = [
  {
    id: 'iot-soil-testing',
    title: 'IoT-Based Soil Testing',
    subtitle: 'Real-Time Precision Soil Monitoring & Diagnostics',
    category: 'Smart Agriculture & Sensor Systems',
    tagline: 'A sensor-driven approach to soil monitoring designed to bring real-time data into agricultural decision-making.',
    description: 'A sensor-driven approach to soil monitoring designed to bring real-time data into agricultural decision-making. Developed to address slow laboratory turnarounds and costly commercial testing rigs through an accessible, field-ready hardware architecture.',
    badge: 'Flagship Exhibition Project',
    image: '/assets/projects/iot-soil-testing-stall.jpg',
    diagramImage: '/assets/projects/soil-testing-diagram.svg',
    eventImage: '/assets/projects/iot-soil-testing-stall.jpg',
    technologies: [
      'Multi-Parameter Soil Probes',
      'Embedded Microcontrollers',
      'RS-485 / Modbus Bus Protocol',
      'Real-Time Telemetry',
      'Low-Power ADC Circuitry',
      'LCD Field Display'
    ],
    application: 'Precision Soil Health, Irrigation Management, Crop Nutrient Planning',
    developmentStage: 'Exhibited & Validated',
    problem: {
      title: 'The Ground-Level Challenge in Agricultural Diagnostics',
      summary: 'Traditional soil health testing requires manual sample extraction, postal transit to distant laboratory facilities, and turnaround times often spanning 10 to 14 days. By the time results arrive, soil moisture and localized nutrient dynamics have already changed significantly.',
      bulletPoints: [
        'High laboratory turnaround times delay critical fertilization and irrigation actions.',
        'High upfront equipment costs prevent smallholder cultivators from adopting precision diagnostics.',
        'Lack of real-time multi-depth measurements leaves root-zone stress undetected.',
        'Complex scientific interfaces hinder instant comprehension by field operators.'
      ]
    },
    approach: {
      title: 'Problem-First Engineering & Hardware Design',
      summary: 'ANBU IoT engineered a ruggedized, portable testing architecture integrating precision multi-tine stainless steel sensor probes with an embedded controller unit. The system samples electrochemical conductivity, pH variations, and moisture content with sub-second latency.',
      steps: [
        {
          title: 'Direct Multi-Depth Sensing',
          desc: 'Corrosion-resistant steel tines establish direct galvanic contact within the root substrate zone.'
        },
        {
          title: 'Differential Signal Conditioning',
          desc: 'High-impedance operational amplifiers filter out electrical noise and stabilize fluctuating microvolt signals.'
        },
        {
          title: 'Embedded Processing & Calibration',
          desc: 'Onboard 32-bit MCU computes temperature-compensated pH and volumetric water content curves.'
        },
        {
          title: 'Immediate Field Readout & Bus Output',
          desc: 'Displays metrics on an intuitive field-ready LCD screen and outputs data over standard industrial bus lines.'
        }
      ]
    },
    prototypeDetails: {
      overview: 'The working prototype consists of a hand-held weatherproof ABS enclosure, multi-parameter probe assembly, lithium power management module, and real-time OLED/LCD numeric readouts.',
      hardwareSpecs: [
        { name: 'Sensing Parameters', value: 'Soil pH, Volumetric Moisture (VWC), Electrical Conductivity (EC), Substrate Temp' },
        { name: 'Microcontroller Core', value: '32-Bit Low-Power RISC MCU' },
        { name: 'Measurement Latency', value: '< 1.2 Seconds per sampling cycle' },
        { name: 'Interface Protocol', value: 'UART / RS-485 Modbus Compatible' },
        { name: 'Power Architecture', value: 'Rechargeable Li-ion battery with integrated 5V boost regulation' },
        { name: 'Housing', value: 'High-impact rugged field enclosure' }
      ]
    },
    demonstration: {
      title: 'Exhibitions & Dignitary Review',
      event: 'Dindigul Science, Technology and Startups Fest 2026 & Institutional Showcases',
      details: 'The IoT-Based Soil Testing system was demonstrated live before academic evaluators, agricultural researchers, and startup officials at the official exhibition stall (Stall 019). Visitors observed live soil probe insertions with immediate pH and moisture response readings.',
      imageCaption: 'ANBU IoT founders and mentors at the official IOT BASED SOIL TESTING exhibition stall.'
    },
    recognitionInfo: 'Awarded Second Place at the Dindigul Science, Technology and Startups Fest 2026 (Arts and Science Colleges Category - District Level).',
    futureDirection: {
      title: 'Planned Iterations & Technical Roadmap',
      goals: [
        'Integration of ultra-low power LoRaWAN telemetry for wireless farm-wide sensor meshes.',
        'Development of a modular N-P-K optical/spectroscopic probe expansion card.',
        'Field ruggedization testing across diverse agro-climatic soil profiles in Tamil Nadu.',
        'Bluetooth Low Energy (BLE) mobile dashboard integration for field log storage.'
      ]
    }
  },
  {
    id: 'smart-agriculture-microgreens',
    title: 'Smart Agriculture & Automated Irrigation',
    subtitle: 'IoT-Enabled Automated Water Delivery & Climate Regulation',
    category: 'Agricultural Automation & Embedded Control',
    tagline: 'An IoT-enabled agricultural prototype combining sensing, control and automated water delivery for controlled plant cultivation.',
    description: 'An IoT-enabled agricultural prototype combining sensing, control and automated water delivery for controlled plant cultivation. Features real hardware with integrated solar harvesting, 18650 power storage, sensor telemetry, and closed-loop pump delivery.',
    badge: 'Real Hardware Prototype',
    image: '/assets/projects/smart-agriculture-prototype.jpg',
    diagramImage: '/assets/projects/smart-agriculture-microgreens.svg',
    eventImage: '/assets/projects/smart-agriculture-prototype.jpg',
    technologies: [
      'Solar Panel Energy Harvesting',
      '18650 Lithium Battery Management',
      'Submersible Micro-Pump Actuation',
      'Soil Substrate Moisture Sensor',
      'DHT Environmental Sensor Array',
      'Embedded Microcontroller Logic'
    ],
    application: 'Urban Agriculture, Vertical Farming, Controlled Plant Cultivation, Automated Microgreens',
    developmentStage: 'Working Prototype',
    problem: {
      title: 'Vulnerability of High-Value Plants & Seedlings to Moisture Stress',
      summary: 'Delicate plants, crops, and microgreens require strict moisture thresholds. Manual watering often causes waterlogging root rot or premature dehydration, leading to high crop mortality.',
      bulletPoints: [
        'Over-watering and uneven irrigation cause fungal proliferation in root zones.',
        'Manual watering schedules require constant physical presence and oversight.',
        'Temperature spikes rapidly deplete substrate moisture during daytime hours.',
        'Lack of automated feedback loops leads to significant water and energy waste.'
      ]
    },
    approach: {
      title: 'Sensor-Driven Autonomous Regulation & Off-Grid Power',
      summary: 'The prototype combines a solar charging module with an 18650 lithium power system, driving an embedded controller that continuously reads substrate moisture and triggers a 5V submersible pump only when threshold drops occur.',
      steps: [
        {
          title: 'Substrate Moisture Acquisition',
          desc: 'Electrochemical probe continuously measures volumetric moisture directly at the plant root zone.'
        },
        {
          title: 'Solar & Battery Power Regulation',
          desc: 'Integrated miniature solar panel charges the onboard 18650 cell via boost regulation.'
        },
        {
          title: 'Threshold-Driven Pump Actuation',
          desc: 'MCU triggers the submersible pump relay to deliver precise water pulses through silicone tubing.'
        },
        {
          title: 'Closed-Loop Hydration Verification',
          desc: 'The sensor immediately detects moisture replenishment, automatically disengaging the pump.'
        }
      ]
    },
    prototypeDetails: {
      overview: 'The working physical prototype features a clear weatherproof electronics enclosure, 18650 lithium cell, solar panel array, custom circuit board with microcontroller, DHT sensor, wireless telemetry module, and silicone fluid delivery tubing connecting the reservoir to the cultivated plant.',
      hardwareSpecs: [
        { name: 'Power Architecture', value: '18650 Li-ion battery + Integrated Solar Panel + 5V Boost Module' },
        { name: 'Actuation Mechanism', value: '5V DC Submersible micro-pump with clear vinyl/silicone fluid tubing' },
        { name: 'Sensors', value: 'Soil Moisture Insertion Probe + DHT Ambient Temp/Humidity Sensor' },
        { name: 'Microcontroller Core', value: 'Low-Power Microcontroller with status indicator LEDs' },
        { name: 'Telemetry Module', value: 'RF / Wireless Communication Transceiver Header' },
        { name: 'Housing', value: 'Transparent industrial component enclosure with strain-relief connectors' }
      ]
    },
    demonstration: {
      title: 'Active Plant Cultivation Showcase',
      event: 'Live Bench Testing & Institutional Review',
      details: 'Demonstrated with active plant cultivation, showing real-time sensor triggering and automated water pulsing from the fluid reservoir.',
      imageCaption: 'Real ANBU IoT Smart Agriculture prototype showing controller enclosure, solar cell, battery, pump, and plant sensor probe.'
    },
    recognitionInfo: 'Core agricultural automation prototype presented during StartupTN and state innovation showcases.',
    futureDirection: {
      title: 'Next Phase Development',
      goals: [
        'Multi-channel manifold for scaling across multiple cultivation trays simultaneously.',
        'LoRaWAN telemetry node for extended kilometers-range farm monitoring.',
        'Low-cost optical chlorophyll index screening.'
      ]
    }
  },
  {
    id: 'smart-safety-helmet',
    title: 'Embedded IoT Safety & Sensor System',
    subtitle: 'Wearable Intelligent Sensor Architecture for Worker Safety',
    category: 'Embedded Systems & Industrial IoT',
    tagline: 'Practical embedded sensing prototype designed for industrial protection, impact monitoring, and real-world safety experimentation.',
    description: 'An embedded safety electronics prototype integrating impact detection, status LED indicators, onboard power regulation, and microcontroller logic onto an industrial protective helmet.',
    badge: 'Hardware Prototype',
    image: '/assets/projects/smart-safety-helmet.jpg',
    diagramImage: '/assets/projects/low-cost-sensor-system.svg',
    eventImage: '/assets/projects/smart-safety-helmet.jpg',
    technologies: [
      'Custom Wearable PCB Circuitry',
      'Microcontroller Processing Core',
      'Multi-LED Status Warning Array',
      '9V / 5V Regulated Power Rail',
      'Impact & Vibration Telemetry',
      'Compact Enclosure Integration'
    ],
    application: 'Industrial Safety, Construction Site Telemetry, Hazardous Environment Monitoring',
    developmentStage: 'Working Prototype',
    problem: {
      title: 'Blind Spots in High-Risk Field Safety & Incident Response',
      summary: 'Construction and industrial personnel operate in hazardous environments where impacts, falls, and disorientation go unnoticed until severe harm occurs.',
      bulletPoints: [
        'Delayed incident reporting in large industrial complexes and construction zones.',
        'Lack of localized telemetry alerting supervisors to blunt impacts or falls.',
        'Need for lightweight, self-contained wearable electronics that do not impede mobility.',
        'High cost of proprietary imported safety telemetry gear.'
      ]
    },
    approach: {
      title: 'Head-Mounted Modular Embedded Safety Node',
      summary: 'ANBU IoT designed a self-contained embedded electronics module mounted directly onto industrial headgear, incorporating impact sensors, multi-stage indicator arrays, and power regulation.',
      steps: [
        {
          title: 'Physical Integration',
          desc: 'Custom PCB mounted securely onto protective chassis with isolated battery power.'
        },
        {
          title: 'Continuous Acceleration/Impact Monitoring',
          desc: 'Firmware monitors sudden G-force spikes and tilt thresholds.'
        },
        {
          title: 'Multi-LED Status Signaling',
          desc: 'High-visibility LED array indicates system power, active telemetry, and hazard alerts.'
        },
        {
          title: 'Alert Broadcast',
          desc: 'Sends urgent safety signals when critical thresholds are breached.'
        }
      ]
    },
    prototypeDetails: {
      overview: 'Assembled on a high-visibility red protective helmet with custom dual-layer PCB, microcontroller IC, power regulator circuit, Hi-Watt 9V power supply, and multi-LED diagnostic indicators.',
      hardwareSpecs: [
        { name: 'Hardware Platform', value: 'Custom embedded PCB with DIP microcontroller core' },
        { name: 'Status Indicators', value: '5-Stage High-Intensity LED telemetry array' },
        { name: 'Power Source', value: 'High-energy 9V battery with step-down filtering' },
        { name: 'Mounting', value: 'Vibration-isolated chassis mount with strain relief' }
      ]
    },
    demonstration: {
      title: 'Institutional Safety Hardware Showcase',
      event: 'Engineering Prototype Evaluations & Student Demonstrations',
      details: 'Demonstrated live with real-time LED visual alerts and sensor responses to simulated shock events.',
      imageCaption: 'Real ANBU IoT Smart Safety Helmet prototype with custom PCB, battery, and indicator LED array.'
    },
    recognitionInfo: 'Demonstrated as part of ANBU IoT’s physical prototyping and embedded systems portfolio.',
    futureDirection: {
      title: 'Production Roadmap',
      goals: [
        'Integration of ultra-compact BLE beacons for real-time indoor worker positioning.',
        'Miniaturization into flexible PCB (FPC) form-factor embedded within helmet linings.',
        'Toxic gas and ambient heat-stress sensor integration.'
      ]
    }
  }
];
