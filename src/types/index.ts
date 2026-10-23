export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tagline: string;
  description: string;
  badge: string;
  image: string;
  diagramImage?: string;
  eventImage?: string;
  technologies: string[];
  application: string;
  developmentStage: 'Working Prototype' | 'Exhibited & Validated' | 'R&D Stage' | 'Field Tested';
  problem: {
    title: string;
    summary: string;
    bulletPoints: string[];
  };
  approach: {
    title: string;
    summary: string;
    steps: { title: string; desc: string }[];
  };
  prototypeDetails: {
    overview: string;
    hardwareSpecs: { name: string; value: string }[];
  };
  demonstration: {
    title: string;
    event: string;
    details: string;
    imageCaption: string;
  };
  recognitionInfo?: string;
  futureDirection: {
    title: string;
    goals: string[];
  };
}

export interface Solution {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  capabilities: string[];
  applications: string[];
  highlight: string;
}

export interface RecognitionItem {
  id: string;
  year: string;
  title: string;
  badge: string;
  category: string;
  organization: string;
  location?: string;
  date?: string;
  description: string;
  evidenceType: 'Award Plaque' | 'Seed Grant / Sanction' | 'Media Clipping' | 'Institutional Showcase';
  image: string;
  highlights: string[];
}

export interface Course {
  id: string;
  title: string;
  tagline: string;
  category: string;
  level: string;
  description: string;
  curriculumHighlights: string[];
  handsOnDeliverable: string;
  status: 'Coming Soon' | 'Programs will be announced soon';
}

export interface InternshipTrack {
  id: string;
  title: string;
  area: string;
  focus: string;
  description: string;
  skillsDeveloped: string[];
  prerequisites: string[];
  status: 'Opportunities Coming Soon';
}

export interface ContactEnquiry {
  name: string;
  email: string;
  phone: string;
  organization: string;
  interest: string;
  message: string;
}
