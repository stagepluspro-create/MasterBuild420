/**
 * Tool Metadata Registry
 * Central source of truth for all tools in StageTechPro
 */

export type ToolCategory = 'lighting' | 'audio' | 'console' | 'planning' | 'network' | 'video';

export interface ToolMeta {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: ToolCategory;
  icon: string; // Lucide icon name
  features: string[];
  useCases: string[];
  requiresAuth: boolean;
  isPro: boolean;
}

export const TOOL_CATEGORIES: Record<ToolCategory, { name: string; description: string }> = {
  lighting: {
    name: 'Lighting Tools',
    description: 'DMX, fixtures, photometrics, and lighting design utilities',
  },
  audio: {
    name: 'Audio Tools',
    description: 'Sound level meters, spectrum analyzers, tone generators, and audio utilities',
  },
  console: {
    name: 'Console & Showfile',
    description: 'Console translators, patch managers, and showfile utilities',
  },
  planning: {
    name: 'Planning & Production',
    description: 'Stage plots, task tracking, budgets, and production management',
  },
  network: {
    name: 'Network & System',
    description: 'RF coordination, signal testing, and network utilities',
  },
  video: {
    name: 'Video & Broadcast',
    description: 'Test patterns, color tools, aspect ratio calculators',
  },
};

export const TOOLS: ToolMeta[] = [
  // Lighting Tools
  {
    id: 'dmx-calculator',
    slug: 'dmx-calculator',
    name: 'DMX Calculator',
    shortDescription: 'Calculate DMX addressing, universe management, and channel allocation',
    longDescription: 'Professional DMX address calculator and universe manager. Plan your lighting rig with intelligent address allocation, universe visualization, and patch list generation. Supports Art-Net, sACN, and traditional DMX512.',
    category: 'lighting',
    icon: 'Lightbulb',
    features: [
      'Automatic DMX address calculation',
      'Universe visualization and management',
      'Fixture library with channel counts',
      'Export patch lists (PDF, CSV, Excel)',
      'Art-Net and sACN universe mapping',
    ],
    useCases: [
      'Planning lighting rigs for tours and events',
      'Creating patch lists for lighting techs',
      'Managing complex multi-universe setups',
      'Documenting lighting systems',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'power-calculator',
    slug: 'power-calculator',
    name: 'Power Calculator',
    shortDescription: 'Calculate power requirements, breaker sizing, and cable runs',
    longDescription: 'Comprehensive power distribution calculator for entertainment venues. Calculate total power draw, breaker sizing, cable requirements, and voltage drop. Essential for safe electrical planning.',
    category: 'lighting',
    icon: 'Zap',
    features: [
      'Power draw calculation by phase',
      'Breaker and circuit sizing',
      'Cable gauge recommendations',
      'Voltage drop calculations',
      'Generator sizing',
    ],
    useCases: [
      'Planning power distribution for events',
      'Sizing generators and distros',
      'Ensuring electrical safety compliance',
      'Calculating cable requirements',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'photometrics',
    slug: 'photometrics',
    name: 'Photometrics Calculator',
    shortDescription: 'Calculate throw distances, beam angles, and illuminance levels',
    longDescription: 'Professional photometric calculator for lighting designers. Calculate throw distances, coverage areas, beam angles, and illuminance levels for any fixture.',
    category: 'lighting',
    icon: 'Focus',
    features: [
      'Throw distance calculation',
      'Beam angle and field angle',
      'Illuminance (lux/fc) calculation',
      'Coverage area visualization',
      'Camera exposure settings',
    ],
    useCases: [
      'Designing lighting plots',
      'Calculating throw distances',
      'Planning lighting coverage',
      'Broadcast and film lighting',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'haze-simulator',
    slug: 'haze-simulator',
    name: 'Haze & Atmosphere Simulator',
    shortDescription: 'Simulate haze dispersion and atmospheric effects',
    longDescription: 'Advanced physics-based haze simulator. Model atmospheric conditions, dispersion patterns, and visibility effects for different haze machines and venue types.',
    category: 'lighting',
    icon: 'Cloud',
    features: [
      'Physics-based haze simulation',
      'Multiple venue types',
      'Haze machine database',
      'Dispersion pattern visualization',
      'Visibility calculations',
    ],
    useCases: [
      'Planning haze coverage for venues',
      'Selecting appropriate haze machines',
      'Understanding atmospheric effects',
      'Optimizing haze placement',
    ],
    requiresAuth: false,
    isPro: true,
  },
  {
    id: 'fixture-library',
    slug: 'fixture-library',
    name: 'Fixture Library',
    shortDescription: 'Browse lighting fixtures with specs, DMX profiles, and gel references',
    longDescription: 'Comprehensive lighting fixture database with detailed specifications, DMX channel profiles, color mixing capabilities, and gel color references.',
    category: 'lighting',
    icon: 'Database',
    features: [
      'Searchable fixture database',
      'DMX channel profiles',
      'Color mixing data',
      'Gel color references (Lee, Rosco, GAM)',
      'CCT conversion tools',
    ],
    useCases: [
      'Researching fixture capabilities',
      'Planning equipment rentals',
      'Color matching and gel selection',
      'Learning fixture specifications',
    ],
    requiresAuth: false,
    isPro: false,
  },

  // Audio Tools
  {
    id: 'spl-meter',
    slug: 'spl-meter',
    name: 'SPL Meter',
    shortDescription: 'Measure sound pressure levels and analyze audio dynamics',
    longDescription: 'Professional sound level meter using your device microphone. Measure SPL (dB), monitor RMS levels, and ensure compliance with venue sound limits and regulations.',
    category: 'audio',
    icon: 'Volume2',
    features: [
      'Real-time SPL measurement',
      'A-weighted and C-weighted',
      'Peak and RMS levels',
      'Compliance monitoring',
      'Data logging and export',
    ],
    useCases: [
      'Monitoring venue sound levels',
      'Compliance with noise regulations',
      'Sound system tuning',
      'Environmental noise assessment',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'spectrum-analyzer',
    slug: 'spectrum-analyzer',
    name: 'Spectrum Analyzer',
    shortDescription: 'Real-time frequency analysis and visualization',
    longDescription: 'Professional spectrum analyzer with FFT visualization. Analyze frequency content, identify feedback, and optimize sound system EQ in real-time.',
    category: 'audio',
    icon: 'BarChart3',
    features: [
      'Real-time FFT analysis',
      'Multiple visualization modes',
      'Frequency cursor and markers',
      'Peak hold and averaging',
      'Export frequency data',
    ],
    useCases: [
      'Sound system tuning and EQ',
      'Identifying feedback frequencies',
      'Acoustic analysis',
      'Audio troubleshooting',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'tone-generator',
    slug: 'tone-generator',
    name: 'Tone Generator',
    shortDescription: 'Generate test tones and audio signals',
    longDescription: 'Multi-functional tone generator for audio testing. Generate sine, square, sawtooth, and white/pink noise signals at any frequency for system testing and calibration.',
    category: 'audio',
    icon: 'Radio',
    features: [
      'Multiple waveform types',
      'Frequency sweep generator',
      'Pink and white noise',
      'Level calibration',
      'Multi-tone generator',
    ],
    useCases: [
      'Audio system testing',
      'Speaker polarity checking',
      'Frequency response testing',
      'Signal path verification',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'patch-list',
    slug: 'patch-list',
    name: 'Audio Patch List',
    shortDescription: 'Create and manage audio input/output patch lists',
    longDescription: 'Professional patch list manager for audio engineers. Create detailed input lists, monitor mixes, and stage plots with intelligent channel management.',
    category: 'audio',
    icon: 'Cable',
    features: [
      'Input/output list management',
      'Monitor mix assignments',
      'Channel routing visualization',
      'Export to PDF and Excel',
      'Template library',
    ],
    useCases: [
      'Creating input lists for shows',
      'Managing monitor mixes',
      'Documenting audio systems',
      'Tour production paperwork',
    ],
    requiresAuth: true,
    isPro: false,
  },
  {
    id: 'rf-coordination',
    slug: 'rf-coordination',
    name: 'RF Coordinator',
    shortDescription: 'Wireless microphone frequency coordination and planning',
    longDescription: 'Professional RF coordination tool for wireless microphone systems. Calculate intermodulation-free frequencies, manage spectrum allocation, and optimize wireless performance.',
    category: 'audio',
    icon: 'Antenna',
    features: [
      'Intermod-free frequency calculation',
      'TV channel coordination',
      'Spectrum visualization',
      'Multiple manufacturer support',
      'Export frequency plans',
    ],
    useCases: [
      'Coordinating wireless microphones',
      'Planning RF spectrum usage',
      'Avoiding TV channels and interference',
      'Multi-venue frequency coordination',
    ],
    requiresAuth: false,
    isPro: true,
  },
  {
    id: 'metronome',
    slug: 'metronome',
    name: 'Metronome',
    shortDescription: 'Precision metronome for musicians and performers',
    longDescription: 'Professional metronome with visual and audio feedback. Support for complex time signatures, subdivisions, and tap tempo.',
    category: 'audio',
    icon: 'Timer',
    features: [
      'Precision timing',
      'Visual and audio feedback',
      'Complex time signatures',
      'Subdivisions and accents',
      'Tap tempo',
    ],
    useCases: [
      'Music performance timing',
      'Rehearsal tempo setting',
      'Live performance click track',
      'Timing practice',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'tuner',
    slug: 'tuner',
    name: 'Instrument Tuner',
    shortDescription: 'Chromatic tuner for instruments',
    longDescription: 'Accurate chromatic tuner for all instruments. Visual feedback with cents display, reference pitch generator, and multiple tuning standards.',
    category: 'audio',
    icon: 'Music',
    features: [
      'Chromatic tuning',
      'Visual cents display',
      'Reference pitch generator',
      'Multiple tuning standards (A=440, 432, etc)',
      'Instrument presets',
    ],
    useCases: [
      'Tuning musical instruments',
      'Sound check preparation',
      'Maintaining instrument pitch',
      'Reference tone generation',
    ],
    requiresAuth: false,
    isPro: false,
  },

  // Console & Showfile
  {
    id: 'console-translator',
    slug: 'console-translator',
    name: 'Console Translator',
    shortDescription: 'Convert showfiles between different console formats',
    longDescription: 'Professional showfile translator for lighting consoles. Convert between MA2, MA3, Hog, Avo, and other major console formats while preserving patch, groups, and presets.',
    category: 'console',
    icon: 'RefreshCw',
    features: [
      'Multi-console format support',
      'Patch data conversion',
      'Group and preset mapping',
      'Intelligent address translation',
      'Conflict resolution',
    ],
    useCases: [
      'Converting showfiles for different consoles',
      'Backing up show data',
      'Cross-platform programming',
      'Festival and rental workflows',
    ],
    requiresAuth: false,
    isPro: true,
  },
  {
    id: 'console-remotes',
    slug: 'console-remotes',
    name: 'Console Remotes',
    shortDescription: 'Remote control interfaces for lighting consoles',
    longDescription: 'Remote control application for major lighting consoles. Control fixtures, trigger cues, and adjust parameters from your mobile device.',
    category: 'console',
    icon: 'Smartphone',
    features: [
      'OSC and MIDI control',
      'Custom fader layouts',
      'Cue triggering',
      'Parameter control',
      'Multi-console support',
    ],
    useCases: [
      'Remote control during programming',
      'Focus operations',
      'Client previews',
      'Wireless console operation',
    ],
    requiresAuth: false,
    isPro: true,
  },

  // Planning & Production
  {
    id: 'stage-plot',
    slug: 'stage-plot',
    name: 'Stage Plot Designer',
    shortDescription: 'Create professional stage plots and layouts',
    longDescription: 'Visual stage plot designer for production planning. Create detailed stage layouts with equipment placement, measurements, and technical notes.',
    category: 'planning',
    icon: 'Layout',
    features: [
      'Drag-and-drop stage layout',
      'Equipment symbol library',
      'Measurement tools',
      'Layer management',
      'Export to PDF and image',
    ],
    useCases: [
      'Designing stage layouts',
      'Equipment placement planning',
      'Advance documentation',
      'Load-in planning',
    ],
    requiresAuth: true,
    isPro: false,
  },
  {
    id: 'task-tracker',
    slug: 'task-tracker',
    name: 'Task Tracker',
    shortDescription: 'Manage production tasks and checklists',
    longDescription: 'Production task management system. Create checklists, assign tasks to crew, track progress, and ensure nothing gets missed during load-in and show day.',
    category: 'planning',
    icon: 'CheckSquare',
    features: [
      'Task lists and checklists',
      'Team assignments',
      'Progress tracking',
      'Due dates and priorities',
      'Template library',
    ],
    useCases: [
      'Load-in task management',
      'Show day checklists',
      'Crew coordination',
      'Production workflows',
    ],
    requiresAuth: true,
    isPro: false,
  },
  {
    id: 'budget-tracker',
    slug: 'budget-tracker',
    name: 'Budget Tracker',
    shortDescription: 'Track production budgets and expenses',
    longDescription: 'Production budget management tool. Track expenses, manage purchase orders, compare quotes, and stay within budget for events and tours.',
    category: 'planning',
    icon: 'DollarSign',
    features: [
      'Expense tracking',
      'Budget vs actual',
      'Purchase order management',
      'Supplier database',
      'Financial reporting',
    ],
    useCases: [
      'Managing production budgets',
      'Tracking equipment rentals',
      'Purchase order workflows',
      'Financial reporting',
    ],
    requiresAuth: true,
    isPro: true,
  },
  {
    id: 'show-docs',
    slug: 'show-docs',
    name: 'Show Documents',
    shortDescription: 'Generate professional production documentation',
    longDescription: 'Production documentation generator. Create advance sheets, tech specs, rider templates, and professional documentation for touring and events.',
    category: 'planning',
    icon: 'FileText',
    features: [
      'Template library',
      'Tech spec generation',
      'Rider creation',
      'Export to multiple formats',
      'Team collaboration',
    ],
    useCases: [
      'Creating advance sheets',
      'Generating tech specs',
      'Building production riders',
      'Tour documentation',
    ],
    requiresAuth: true,
    isPro: false,
  },
  {
    id: 'inventory-tool',
    slug: 'inventory-tool',
    name: 'Inventory Manager',
    shortDescription: 'Manage equipment inventory and tracking',
    longDescription: 'Equipment inventory management system. Track gear, manage check-in/check-out, schedule maintenance, and maintain complete equipment databases.',
    category: 'planning',
    icon: 'Package',
    features: [
      'Equipment database',
      'Check-in/check-out tracking',
      'Maintenance scheduling',
      'QR code integration',
      'Rental management',
    ],
    useCases: [
      'Managing equipment inventory',
      'Rental fleet tracking',
      'Maintenance scheduling',
      'Asset management',
    ],
    requiresAuth: true,
    isPro: true,
  },
  {
    id: 'callsheet-builder',
    slug: 'callsheet-builder',
    name: 'Call Sheet Builder',
    shortDescription: 'Create professional call sheets for crew',
    longDescription: 'Professional call sheet generator for film and live production. Create detailed call sheets with crew info, schedules, and contact information.',
    category: 'planning',
    icon: 'Calendar',
    features: [
      'Call sheet templates',
      'Crew contact management',
      'Schedule builder',
      'Location information',
      'PDF export',
    ],
    useCases: [
      'Creating production call sheets',
      'Managing crew schedules',
      'Distribution of call times',
      'Production coordination',
    ],
    requiresAuth: true,
    isPro: false,
  },

  // Network & System
  {
    id: 'signal-tester',
    slug: 'signal-tester',
    name: 'Signal Path Tester',
    shortDescription: 'Test and verify signal paths',
    longDescription: 'Signal path testing utility. Generate test signals, verify connections, and troubleshoot audio/video signal flow issues.',
    category: 'network',
    icon: 'Activity',
    features: [
      'Signal generation',
      'Path verification',
      'Connection testing',
      'Visual feedback',
      'Multiple signal types',
    ],
    useCases: [
      'Verifying signal paths',
      'Troubleshooting connections',
      'System commissioning',
      'Cable testing',
    ],
    requiresAuth: false,
    isPro: false,
  },

  // Video & Broadcast
  {
    id: 'test-patterns',
    slug: 'test-patterns',
    name: 'Test Pattern Generator',
    shortDescription: 'Generate video test patterns and calibration',
    longDescription: 'Professional test pattern generator for video systems. Generate SMPTE bars, color bars, grid patterns, and other calibration patterns for displays and projectors.',
    category: 'video',
    icon: 'Grid3x3',
    features: [
      'Multiple pattern types',
      'SMPTE and EBU standards',
      'Custom patterns',
      'Full-screen output',
      'Resolution testing',
    ],
    useCases: [
      'Display calibration',
      'Projector alignment',
      'Video system testing',
      'Color accuracy verification',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'lut-color-ref',
    slug: 'lut-color-ref',
    name: 'LUT & Color Reference',
    shortDescription: 'Color grading LUTs and gel color references',
    longDescription: 'Comprehensive color reference tool with LUT management, gel color libraries (Lee, Rosco, GAM), and color space conversion utilities.',
    category: 'video',
    icon: 'Palette',
    features: [
      'LUT file support (3D/1D)',
      'Gel color database',
      'Color space conversion',
      'CCT calculator',
      'Visual color preview',
    ],
    useCases: [
      'Color grading reference',
      'Gel color selection',
      'Color matching',
      'Film and broadcast work',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'aspect-framerate',
    slug: 'aspect-framerate',
    name: 'Aspect Ratio & Frame Rate',
    shortDescription: 'Calculate aspect ratios and frame rate conversions',
    longDescription: 'Video aspect ratio and frame rate calculator. Convert between formats, calculate scaling, and plan video system configurations.',
    category: 'video',
    icon: 'Maximize2',
    features: [
      'Aspect ratio calculation',
      'Frame rate conversion',
      'Resolution scaling',
      'Pixel aspect ratio',
      'Format presets',
    ],
    useCases: [
      'Planning video systems',
      'Format conversion',
      'Display configuration',
      'Resolution calculations',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'nd-exposure',
    slug: 'nd-exposure',
    name: 'ND & Exposure Calculator',
    shortDescription: 'Calculate ND filters and camera exposure settings',
    longDescription: 'Professional exposure calculator for broadcast and film cameras. Calculate ND filter requirements, shutter speeds, and exposure settings.',
    category: 'video',
    icon: 'Camera',
    features: [
      'ND filter calculation',
      'Exposure compensation',
      'Shutter speed calculator',
      'ISO and aperture',
      'Sunny 16 rule',
    ],
    useCases: [
      'Camera exposure planning',
      'ND filter selection',
      'Outdoor shooting',
      'Lighting ratio calculation',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'color-tools',
    slug: 'color-tools',
    name: 'Color Tools',
    shortDescription: 'Color conversion and matching utilities',
    longDescription: 'Comprehensive color utility suite. Convert between color spaces, match gel colors, and analyze color relationships.',
    category: 'video',
    icon: 'Droplet',
    features: [
      'Color space conversion',
      'Gel color matching',
      'RGB/HSL/CMYK conversion',
      'Color picker',
      'Palette generator',
    ],
    useCases: [
      'Color matching',
      'Gel selection',
      'Design work',
      'Color analysis',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'teleprompter',
    slug: 'teleprompter',
    name: 'Teleprompter',
    shortDescription: 'On-screen teleprompter for talent',
    longDescription: 'Professional teleprompter application. Load scripts, control scroll speed, and provide on-screen prompting for talent and presenters.',
    category: 'video',
    icon: 'Monitor',
    features: [
      'Variable scroll speed',
      'Remote control',
      'Script import',
      'Mirror mode',
      'Full-screen display',
    ],
    useCases: [
      'Live presentations',
      'Broadcast talent prompting',
      'Video production',
      'Corporate events',
    ],
    requiresAuth: false,
    isPro: false,
  },
  {
    id: 'playback',
    slug: 'playback',
    name: 'Playback Controller',
    shortDescription: 'Control video and audio playback',
    longDescription: 'Multi-format playback controller for video and audio. Trigger clips, control timecode, and manage playback for live events.',
    category: 'video',
    icon: 'Play',
    features: [
      'Multi-format support',
      'Playlist management',
      'Timecode synchronization',
      'Hot-key triggering',
      'Loop and fade controls',
    ],
    useCases: [
      'Show playback',
      'Video triggering',
      'Background music',
      'Live event content',
    ],
    requiresAuth: false,
    isPro: true,
  },
];

/**
 * Get tool by slug
 */
export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return TOOLS.filter((tool) => tool.category === category);
}

/**
 * Get all public tools (no auth required)
 */
export function getPublicTools(): ToolMeta[] {
  return TOOLS.filter((tool) => !tool.requiresAuth);
}

/**
 * Get all pro tools
 */
export function getProTools(): ToolMeta[] {
  return TOOLS.filter((tool) => tool.isPro);
}

/**
 * Search tools by name or description
 */
export function searchTools(query: string): ToolMeta[] {
  const lowerQuery = query.toLowerCase();
  return TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.shortDescription.toLowerCase().includes(lowerQuery) ||
      tool.longDescription.toLowerCase().includes(lowerQuery)
  );
}
