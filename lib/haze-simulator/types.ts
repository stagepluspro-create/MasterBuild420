export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GridCell {
  density: number;
  velocity: Vector3;
  temperature: number;
  obstruction: number;
}

export interface VenueConfig {
  id?: string;
  name: string;
  width: number;
  length: number;
  height: number;
  gridResolution: number;
  temperature: number;
  obstacles: Obstacle[];
}

export interface Obstacle {
  type: 'wall' | 'truss' | 'curtain' | 'door';
  x: number;
  y: number;
  z: number;
  width: number;
  length: number;
  height: number;
  rotation: number;
  flowReduction: number;
}

export interface HazeMachine {
  id: string;
  name: string;
  type: 'haze' | 'fog' | 'low_fog' | 'cryo';
  position: Vector3;
  outputM3PerMin: number;
  directionAngle: number;
  isActive: boolean;
  warmupTimeSec: number;
}

export interface HVACVent {
  id: string;
  name: string;
  type: 'supply' | 'return' | 'exhaust';
  position: Vector3;
  direction: Vector3;
  cfm: number;
  isActive: boolean;
}

export interface LightFixture {
  id: string;
  name: string;
  type: 'moving_head' | 'strobe' | 'led_par' | 'beam' | 'spot';
  position: Vector3;
  beamAngle: number;
  intensity: number;
  panAngle: number;
  tiltAngle: number;
  color: string;
  isActive: boolean;
}

export interface SimulationParams {
  timeStep: number;
  diffusionRate: number;
  dissipationRate: number;
  buoyancyStrength: number;
  gravityStrength: number;
  maxSteps: number;
  targetFPS: number;
}

export interface SimulationResult {
  timeToFill: number;
  timeToClear: number;
  coverageScore: number;
  uniformityScore: number;
  visibilityMap: Float32Array;
  safetyWarnings: SafetyWarning[];
  optimalPlacement?: PlacementSuggestion[];
}

export interface SafetyWarning {
  type: 'ventilation' | 'co2' | 'visibility' | 'equipment' | 'emergency_exit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location?: Vector3;
}

export interface PlacementSuggestion {
  position: Vector3;
  score: number;
  reason: string;
}

export interface VisibilityZone {
  x: number;
  y: number;
  z: number;
  visibility: number;
  classification: 'invisible' | 'low' | 'optimal' | 'excessive';
}
