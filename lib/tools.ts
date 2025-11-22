export type ToolCategory = "lighting" | "audio" | "console" | "planning" | "network" | "video" | "utility";
export type ToolStatus = "available";

export interface ToolConfig {
  id: string;
  name: string;
  category: ToolCategory;
  status: ToolStatus;
  description: string;
  icon: string;
  path: string;
  features: string[];
  helpText: string;
}

export const tools: ToolConfig[] = [
  { id: "dmx-calculator", name: "DMX Calculator", category: "lighting", status: "available", description: "Calculate DMX addresses, channels, universes.", icon: "Lightbulb", path: "/tools/dmx-calculator", features: [], helpText: "Address math with overflow alerts." },
  { id: "power-calculator", name: "Power Calculator", category: "utility", status: "available", description: "Convert watts, amps, volts. 1Ø/3Ø.", icon: "Zap", path: "/tools/power-calculator", features: [], helpText: "Electrical quick math." },
  { id: "spl-meter", name: "SPL Meter", category: "audio", status: "available", description: "Indicative dB SPL with A/C weighting.", icon: "Mic", path: "/tools/spl-meter", features: [], helpText: "Indicative only, not calibrated." },
  { id: "stage-plot", name: "Stage Plot Designer", category: "planning", status: "available", description: "Drag/drop stage layout and export.", icon: "LayoutGrid", path: "/tools/stage-plot", features: [], helpText: "Lightweight plotting." },
  { id: "patch-list", name: "Patch List Generator", category: "planning", status: "available", description: "Audio/DMX/SDI patch tables with CSV export.", icon: "List", path: "/tools/patch-list", features: [], helpText: "Keep routing organized." },
  { id: "task-tracker", name: "Task Tracker", category: "planning", status: "available", description: "Team Kanban board with task assignments, priorities, and due dates.", icon: "CheckSquare", path: "/tools/task-tracker", features: [], helpText: "Organize crew work and track progress." },
  { id: "show-docs", name: "Show Documents", category: "planning", status: "available", description: "Shared editable documents for cue sheets, schedules, and show notes.", icon: "FileText", path: "/tools/show-docs", features: [], helpText: "Collaborate on production documents." },
  { id: "budget-tracker", name: "Budget Tracker", category: "planning", status: "available", description: "Project budget management with categories, vendors, and status tracking.", icon: "DollarSign", path: "/tools/budget-tracker", features: [], helpText: "Track production costs and expenses." },
  { id: "inventory-tool", name: "Inventory Tool", category: "utility", status: "available", description: "Team gear inventory with check-out system and location tracking.", icon: "Package", path: "/tools/inventory-tool", features: [], helpText: "Manage and track equipment." },
  { id: "tone-generator", name: "Tone Generator", category: "audio", status: "available", description: "Professional signal generator with waveforms, noise, and sweep functions.", icon: "Waveform", path: "/tools/tone-generator", features: ["Sine, Square, Triangle, Sawtooth waveforms", "White and Pink noise", "Frequency sweep (linear/log)", "Burst mode", "Real-time waveform visualization", "Channel routing (L/R/Stereo)", "Safety features and auto-stop"], helpText: "Generate test tones for calibration, system alignment, and troubleshooting. Includes safety warnings and volume limiting." },
  { id: "signal-tester", name: "Signal Path Tester", category: "audio", status: "available", description: "Cable continuity testing with pass/fail tracking and notes.", icon: "Cable", path: "/tools/signal-tester", features: [], helpText: "Test signal paths and log results for troubleshooting." },
  {
    id: "spectrum-analyzer",
    name: "Spectrum Analyzer",
    category: "audio",
    status: "available",
    description: "Real-time audio frequency analysis with FFT spectrum, RMS metering, and waterfall spectrogram.",
    icon: "BarChart3",
    path: "/tools/spectrum-analyzer",
    features: [
      "Real-time FFT frequency spectrum display",
      "Configurable FFT size (512-8192 bins)",
      "Adjustable smoothing for stable visualization",
      "Fast and slow RMS level meters",
      "Scrolling waterfall spectrogram",
      "Color-coded frequency display",
      "Live microphone input processing",
      "GPU-accelerated canvas rendering"
    ],
    helpText: "Professional audio analysis tool for troubleshooting, system tuning, and frequency monitoring. View real-time spectrum, RMS levels, and time-frequency waterfall display."
  },
  { id: "rf-coordination", name: "RF Coordination", category: "audio", status: "available", description: "Wireless frequency planning with interference detection.", icon: "Radio", path: "/tools/rf-coordination", features: [], helpText: "Plan RF spectrum and avoid frequency conflicts." },
  { id: "playback", name: "Playback", category: "audio", status: "available", description: "Audio cue soundboard with master controls.", icon: "PlayCircle", path: "/tools/playback", features: [], helpText: "Trigger audio cues for shows and presentations." },
  {
    id: "metronome",
    name: "Metronome",
    category: "audio",
    status: "available",
    description: "Precision tempo keeper with tap tempo, multiple time signatures, and visual feedback.",
    icon: "Music2",
    path: "/tools/metronome",
    features: [
      "Adjustable BPM (20-300) with tap tempo detection",
      "Common time signatures (2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, 12/8)",
      "Multiple click sounds (woodblock, beep, digital, rimshot)",
      "Subdivision options (quarter, eighth, triplet, sixteenth)",
      "Accent control for downbeats",
      "Visual beat indicator with animations",
      "Separate accent and beat volume controls",
      "Auto-stop timer with safety features",
      "Haptic feedback for mobile devices"
    ],
    helpText: "Keep precise tempo for rehearsals, recordings, and live performances. Features tap tempo, visual feedback, and multiple sound options."
  },
  {
    id: "tuner",
    name: "Instrument Tuner",
    category: "audio",
    status: "available",
    description: "Chromatic tuner with real-time pitch detection, needle display, and instrument presets.",
    icon: "Gauge",
    path: "/tools/tuner",
    features: [
      "Real-time pitch detection via microphone",
      "Chromatic note recognition (A-G with sharps/flats)",
      "Visual needle meter with cents offset (±50 cents)",
      "Adjustable reference frequency (A4: 400-460 Hz)",
      "Instrument presets (Guitar, Bass, Violin, Ukulele, Custom)",
      "Auto-detect or manual note selection modes",
      "Signal strength indicator",
      "Flat/Sharp LED indicators",
      "Reference tone generator integration",
      "Live waveform visualization"
    ],
    helpText: "Tune instruments accurately with real-time pitch detection, visual feedback, and instrument-specific presets. Includes reference tone playback."
  },
  { id: "photometrics", name: "Photometrics", category: "lighting", status: "available", description: "Professional throw, illuminance, coverage, and camera exposure calculations for lighting design.", icon: "Sun", path: "/tools/photometrics", features: [], helpText: "Calculate beam throw, coverage grids, illuminance with CBCP or lumens, array spacing, trim/aim geometry, and camera exposure settings." },
  { id: "color-tools", name: "Color Tools", category: "lighting", status: "available", description: "Gel library and CCT to RGB converter for lighting design.", icon: "Palette", path: "/tools/color-tools", features: [], helpText: "Search gel colors and convert color temperature to RGB values." },
  { id: "console-remotes", name: "Console Remotes", category: "lighting", status: "available", description: "Quick launch links for console remote interfaces.", icon: "TabletSmartphone", path: "/tools/console-remotes", features: [], helpText: "Access MA3, ETC, Chamsys, and other console web remotes." },
  { id: "fixture-library", name: "Fixture Library", category: "lighting", status: "available", description: "Comprehensive fixture database with photometric data, gel references, CCT converter, and color utilities.", icon: "Database", path: "/tools/fixture-library", features: [], helpText: "Search fixtures, match gels, convert CCT values." },
  { id: "microphones-browser", name: "Microphone Browser", category: "audio", status: "available", description: "Browse and compare professional microphones with detailed specifications and applications.", icon: "Mic2", path: "/equipment/microphones", features: [], helpText: "Search microphones by manufacturer, type, pattern, and application. View detailed specs, frequency response, and save favorites." },
  { id: "speakers-browser", name: "Speaker Browser", category: "audio", status: "available", description: "Browse and compare professional speakers with detailed specifications and applications.", icon: "Volume2", path: "/equipment/speakers", features: [], helpText: "Search speakers by manufacturer, type, wattage, and application. View detailed specs, coverage patterns, and save favorites." },
  { id: "consoles-browser", name: "Console Browser", category: "audio", status: "available", description: "Browse and compare audio consoles with detailed specifications and connectivity.", icon: "Sliders", path: "/equipment/consoles", features: [], helpText: "Search consoles by manufacturer, channels, and application. View detailed specs, I/O options, and save favorites." },
  { id: "fixtures-browser", name: "Fixture Browser", category: "lighting", status: "available", description: "Browse and compare lighting fixtures with detailed specifications and DMX modes.", icon: "Lightbulb", path: "/equipment/fixtures", features: [], helpText: "Search fixtures by manufacturer, type, light source, and application. View detailed specs, DMX channels, and save favorites." },
  { id: "aspect-framerate", name: "Aspect/Framerate/TC Calc", category: "video", status: "available", description: "Calculate aspect ratios and SMPTE timecode from frame rates.", icon: "Monitor", path: "/tools/aspect-framerate", features: [], helpText: "Aspect ratio calculator and timecode converter for video production." },
  { id: "test-patterns", name: "Test Patterns", category: "video", status: "available", description: "SMPTE bars, grids, and calibration patterns.", icon: "Grid3x3", path: "/tools/test-patterns", features: [], helpText: "Generate test patterns for display calibration and alignment." },
  {
    id: "lut-color-ref",
    name: "LUT & Color Reference",
    category: "video",
    status: "available",
    description: "Professional LUT preview, color space conversion, gel matching, and camera-to-lighting color tools.",
    icon: "Image",
    path: "/tools/lut-color-ref",
    features: [
      "Import and preview .cube and .3dl LUT files",
      "Real-time LUT application with before/after comparison",
      "Built-in test images: skin tones, color checker, gradients",
      "Color space conversion (sRGB, Rec.709, Rec.2020, DCI-P3)",
      "CCT to RGB converter with Kelvin temperature input",
      "Gel reference library (Roscolux, Lee Filters, Apollo)",
      "RGB to gel matching by color similarity",
      "Custom LUT generator with contrast, gamma, saturation controls",
      "2D LUT slice visualizer",
      "Export corrected images and .cube LUT files"
    ],
    helpText: "Essential tool for color management in hybrid productions. Match LED wall colors to camera output, preview broadcast LUTs, and find equivalent lighting gels for any RGB value."
  },
  { id: "teleprompter", name: "Teleprompter", category: "video", status: "available", description: "Scrolling teleprompter with adjustable speed and mirroring.", icon: "Type", path: "/tools/teleprompter", features: [], helpText: "Display scrolling scripts for presentations and video production." },
  { id: "nd-exposure", name: "ND/Exposure Helper", category: "video", status: "available", description: "Calculate exposure with ND filters and stops.", icon: "Aperture", path: "/tools/nd-exposure", features: [], helpText: "Exposure triangle calculator for camera settings and ND filters." },
  { id: "callsheet-builder", name: "Callsheet Builder", category: "planning", status: "available", description: "Professional production callsheets with crew, cast, scenes, and scheduling. Export to PDF and JSON.", icon: "Clipboard", path: "/tools/callsheet-builder", features: ["Crew management with roles and call times", "Cast tracking with characters and wardrobe", "Scene scheduling with locations", "Weather and production notes", "PDF export for distribution", "JSON export for backup", "Preset saving and loading", "Printable formatted callsheets"], helpText: "Create, organize, and distribute professional production callsheets for your team." },
  {
    id: "haze-simulator",
    name: "Haze & Atmosphere Simulator",
    category: "lighting",
    status: "available",
    description: "Real-time 3D simulation of haze and fog dispersion in venues with airflow, HVAC, and beam visibility analysis.",
    icon: "Cloud",
    path: "/tools/haze-simulator",
    features: [
      "3D volumetric haze simulation with cellular automata physics",
      "HVAC vent modeling with CFM-based airflow",
      "Haze machine placement with output control",
      "Light fixture beam visibility calculations",
      "Real-time coverage and uniformity metrics",
      "Time-to-fill and time-to-clear predictions",
      "Safety warnings for ventilation and CO₂",
      "Optimal machine placement suggestions",
      "Configurable physics parameters",
      "Save and share venue configurations"
    ],
    helpText: "Predict haze behavior in your venue before the show. Model airflow, HVAC systems, and machine placement to achieve optimal beam visibility while maintaining safety."
  },
  {
    id: "console-translator",
    name: "Multi-Console Translator",
    category: "lighting",
    status: "available",
    description: "Convert showfiles between lighting console formats with intelligent fixture mapping, address allocation, and validation.",
    icon: "ArrowLeftRight",
    path: "/tools/console-translator",
    features: [
      "Parse grandMA2, Hog4, ETC Eos, Avolites showfiles",
      "Intelligent fixture mapping with confidence scores",
      "Automatic DMX address allocation with conflict detection",
      "Channel mapping between different fixture modes",
      "Dry-run validation with detailed conflict reports",
      "Export to multiple console formats",
      "Save and reuse mapping profiles",
      "Preserve cues, palettes, and patch data",
      "Universe optimization and packing",
      "Manual override for custom mappings"
    ],
    helpText: "Convert shows between different console platforms. Save hundreds of hours re-programming when switching consoles. Intelligent mapping ensures maximum attribute preservation with minimal manual editing."
  }
];

export function getToolById(id: string) {
  return tools.find(t => t.id === id);
}
