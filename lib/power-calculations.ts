export interface PowerCalculation {
  voltage: number;
  current: number;
  power: number;
  apparentPower: number;
  powerFactor: number;
}

export interface VoltageDropResult {
  voltageDrop: number;
  voltageDropPercent: number;
  voltageAtLoad: number;
  isExcessive: boolean;
}

export interface CableRecommendation {
  awg: number;
  mm2: number;
  maxCurrent: number;
  resistance: number;
}

export interface BreakerRecommendation {
  size: number;
  type: string;
  loadPercent: number;
  isSafe: boolean;
}

export const VOLTAGE_PRESETS = {
  "US/Canada 120V Single": { voltage: 120, phases: 1, frequency: 60 },
  "US/Canada 208V Three": { voltage: 208, phases: 3, frequency: 60 },
  "US/Canada 240V Single": { voltage: 240, phases: 1, frequency: 60 },
  "US/Canada 480V Three": { voltage: 480, phases: 3, frequency: 60 },
  "EU 230V Single": { voltage: 230, phases: 1, frequency: 50 },
  "EU 400V Three": { voltage: 400, phases: 3, frequency: 50 },
  "UK 230V Single": { voltage: 230, phases: 1, frequency: 50 },
  "AU 230V Single": { voltage: 230, phases: 1, frequency: 50 },
  "AU 400V Three": { voltage: 400, phases: 3, frequency: 50 },
};

export const CABLE_SPECS = [
  { awg: 18, mm2: 0.82, maxCurrent: 7, resistance: 21.4 },
  { awg: 16, mm2: 1.31, maxCurrent: 10, resistance: 13.5 },
  { awg: 14, mm2: 2.08, maxCurrent: 15, resistance: 8.5 },
  { awg: 12, mm2: 3.31, maxCurrent: 20, resistance: 5.4 },
  { awg: 10, mm2: 5.26, maxCurrent: 30, resistance: 3.4 },
  { awg: 8, mm2: 8.37, maxCurrent: 40, resistance: 2.1 },
  { awg: 6, mm2: 13.3, maxCurrent: 55, resistance: 1.3 },
  { awg: 4, mm2: 21.2, maxCurrent: 70, resistance: 0.85 },
  { awg: 2, mm2: 33.6, maxCurrent: 95, resistance: 0.53 },
  { awg: 1, mm2: 42.4, maxCurrent: 110, resistance: 0.42 },
  { awg: 0, mm2: 53.5, maxCurrent: 125, resistance: 0.33 },
  { awg: -1, mm2: 67.4, maxCurrent: 145, resistance: 0.26 },
  { awg: -2, mm2: 85.0, maxCurrent: 165, resistance: 0.21 },
  { awg: -3, mm2: 107, maxCurrent: 195, resistance: 0.17 },
];

export const BREAKER_SIZES = [
  5, 10, 15, 16, 20, 25, 30, 32, 40, 50, 60, 63, 80, 100, 125, 150, 200, 250,
  300, 400,
];

export function calculateSinglePhase(
  voltage: number,
  current: number,
  powerFactor: number
): PowerCalculation {
  const power = voltage * current * powerFactor;
  const apparentPower = voltage * current;

  return {
    voltage,
    current,
    power,
    apparentPower,
    powerFactor,
  };
}

export function calculateThreePhase(
  voltage: number,
  current: number,
  powerFactor: number
): PowerCalculation {
  const power = Math.sqrt(3) * voltage * current * powerFactor;
  const apparentPower = Math.sqrt(3) * voltage * current;

  return {
    voltage,
    current,
    power,
    apparentPower,
    powerFactor,
  };
}

export function calculateCurrent(
  power: number,
  voltage: number,
  powerFactor: number,
  phases: 1 | 3
): number {
  if (phases === 1) {
    return power / (voltage * powerFactor);
  } else {
    return power / (Math.sqrt(3) * voltage * powerFactor);
  }
}

export function calculateVoltageFromPower(
  power: number,
  current: number,
  powerFactor: number,
  phases: 1 | 3
): number {
  if (phases === 1) {
    return power / (current * powerFactor);
  } else {
    return power / (Math.sqrt(3) * current * powerFactor);
  }
}

export function calculateVoltageDrop(
  current: number,
  length: number,
  resistance: number,
  voltage: number,
  phases: 1 | 3
): VoltageDropResult {
  const multiplier = phases === 1 ? 2 : Math.sqrt(3);
  const voltageDrop = (multiplier * length * current * resistance) / 1000;
  const voltageDropPercent = (voltageDrop / voltage) * 100;
  const voltageAtLoad = voltage - voltageDrop;
  const isExcessive = voltageDropPercent > 3;

  return {
    voltageDrop,
    voltageDropPercent,
    voltageAtLoad,
    isExcessive,
  };
}

export function recommendCable(
  current: number,
  length: number,
  voltage: number,
  phases: 1 | 3,
  safetyFactor: number = 1.25
): CableRecommendation | null {
  const requiredCurrent = current * safetyFactor;

  for (const cable of CABLE_SPECS) {
    if (cable.maxCurrent >= requiredCurrent) {
      const dropResult = calculateVoltageDrop(
        current,
        length,
        cable.resistance,
        voltage,
        phases
      );

      if (!dropResult.isExcessive) {
        return cable;
      }
    }
  }

  return CABLE_SPECS[CABLE_SPECS.length - 1];
}

export function recommendBreaker(
  current: number,
  continuousLoad: boolean = true
): BreakerRecommendation {
  const safetyFactor = continuousLoad ? 1.25 : 1.0;
  const requiredSize = current * safetyFactor;

  let selectedSize = BREAKER_SIZES[0];
  for (const size of BREAKER_SIZES) {
    if (size >= requiredSize) {
      selectedSize = size;
      break;
    }
  }

  const loadPercent = (current / selectedSize) * 100;
  const isSafe = continuousLoad ? loadPercent <= 80 : loadPercent <= 100;

  return {
    size: selectedSize,
    type: selectedSize <= 100 ? "Standard" : "High Capacity",
    loadPercent,
    isSafe,
  };
}

export function calculateGeneratorSize(
  totalPowerKW: number,
  powerFactor: number,
  safetyMargin: number = 0.25
): {
  kVA: number;
  kW: number;
  recommendedKVA: number;
  fuelConsumptionLH: number;
} {
  const kVA = totalPowerKW / powerFactor;
  const recommendedKVA = kVA * (1 + safetyMargin);
  const fuelConsumptionLH = recommendedKVA * 0.25;

  return {
    kVA,
    kW: totalPowerKW,
    recommendedKVA,
    fuelConsumptionLH,
  };
}

export function calculateHarmonicDistortion(
  fundamentalCurrent: number,
  harmonicCurrents: number[]
): {
  thd: number;
  rms: number;
  derateFactor: number;
} {
  const sumOfSquares = harmonicCurrents.reduce(
    (sum, i) => sum + i * i,
    0
  );
  const thd = (Math.sqrt(sumOfSquares) / fundamentalCurrent) * 100;

  const totalRMS = Math.sqrt(
    fundamentalCurrent * fundamentalCurrent + sumOfSquares
  );

  let derateFactor = 1.0;
  if (thd > 50) derateFactor = 0.8;
  else if (thd > 30) derateFactor = 0.9;
  else if (thd > 15) derateFactor = 0.95;

  return {
    thd,
    rms: totalRMS,
    derateFactor,
  };
}

export function calculateInrushCurrent(
  steadyStateCurrent: number,
  equipmentType: "LED" | "Incandescent" | "Motor" | "Transformer" | "Capacitive"
): {
  inrushCurrent: number;
  duration: number;
  peakMultiplier: number;
} {
  let peakMultiplier = 1;
  let duration = 0;

  switch (equipmentType) {
    case "LED":
      peakMultiplier = 2;
      duration = 0.01;
      break;
    case "Incandescent":
      peakMultiplier = 10;
      duration = 0.05;
      break;
    case "Motor":
      peakMultiplier = 6;
      duration = 0.5;
      break;
    case "Transformer":
      peakMultiplier = 8;
      duration = 0.1;
      break;
    case "Capacitive":
      peakMultiplier = 20;
      duration = 0.001;
      break;
  }

  return {
    inrushCurrent: steadyStateCurrent * peakMultiplier,
    duration,
    peakMultiplier,
  };
}

export function balancePhases(
  devices: Array<{ power: number; id: string }>
): {
  phaseA: string[];
  phaseB: string[];
  phaseC: string[];
  loadA: number;
  loadB: number;
  loadC: number;
  imbalance: number;
} {
  const sorted = [...devices].sort((a, b) => b.power - a.power);

  const phases = {
    A: { devices: [] as string[], load: 0 },
    B: { devices: [] as string[], load: 0 },
    C: { devices: [] as string[], load: 0 },
  };

  for (const device of sorted) {
    const minPhase = Object.entries(phases).reduce<keyof typeof phases>((min, [key, phase]) => {
      const phaseKey = key as keyof typeof phases;
      return phase.load < phases[min].load ? phaseKey : min;
    }, "A");

    phases[minPhase].devices.push(device.id);
    phases[minPhase].load += device.power;
  }

  const avgLoad = (phases.A.load + phases.B.load + phases.C.load) / 3;
  const maxDeviation = Math.max(
    Math.abs(phases.A.load - avgLoad),
    Math.abs(phases.B.load - avgLoad),
    Math.abs(phases.C.load - avgLoad)
  );
  const imbalance = avgLoad > 0 ? (maxDeviation / avgLoad) * 100 : 0;

  return {
    phaseA: phases.A.devices,
    phaseB: phases.B.devices,
    phaseC: phases.C.devices,
    loadA: phases.A.load,
    loadB: phases.B.load,
    loadC: phases.C.load,
    imbalance,
  };
}

export function calculatePowerFactor(
  realPower: number,
  apparentPower: number
): number {
  return apparentPower > 0 ? realPower / apparentPower : 1.0;
}

export function calculateDeratingFactor(
  ambientTemp: number,
  bundledCables: number,
  insulationType: "THHN" | "THWN" | "XHHW"
): number {
  let tempFactor = 1.0;
  if (ambientTemp > 30) {
    tempFactor = 1 - (ambientTemp - 30) * 0.01;
  }

  let bundleFactor = 1.0;
  if (bundledCables > 3) {
    bundleFactor = 0.7;
  } else if (bundledCables === 3) {
    bundleFactor = 0.8;
  }

  let insulationFactor = 1.0;
  if (insulationType === "THHN") insulationFactor = 1.0;
  else if (insulationType === "THWN") insulationFactor = 0.95;
  else if (insulationType === "XHHW") insulationFactor = 1.05;

  return tempFactor * bundleFactor * insulationFactor;
}
