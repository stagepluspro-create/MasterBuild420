import type { PhysicsEngine } from './physics-engine';
import type { LightFixture, SafetyWarning, PlacementSuggestion, SimulationResult } from './types';

export class AnalysisEngine {
  calculateVisibility(
    engine: PhysicsEngine,
    fixtures: LightFixture[]
  ): Float32Array {
    const gridSize = engine.getGridSize();
    const cellSize = engine.getCellSize();
    const grid = engine.getGrid();

    const visibilityMap = new Float32Array(gridSize.x * gridSize.y * gridSize.z);

    for (const fixture of fixtures) {
      if (!fixture.isActive) continue;

      const scatterFactor = this.getScatterFactor(fixture.type);

      const beamDirX = Math.sin(fixture.panAngle * Math.PI / 180) * Math.cos(fixture.tiltAngle * Math.PI / 180);
      const beamDirY = Math.cos(fixture.panAngle * Math.PI / 180) * Math.cos(fixture.tiltAngle * Math.PI / 180);
      const beamDirZ = -Math.sin(fixture.tiltAngle * Math.PI / 180);

      const beamLength = 20;
      const steps = 50;

      for (let step = 0; step < steps; step++) {
        const t = step / steps;
        const x = fixture.position.x + beamDirX * beamLength * t;
        const y = fixture.position.y + beamDirY * beamLength * t;
        const z = fixture.position.z + beamDirZ * beamLength * t;

        const cellX = Math.floor(x / cellSize.x);
        const cellY = Math.floor(y / cellSize.y);
        const cellZ = Math.floor(z / cellSize.z);

        if (cellX >= 0 && cellX < gridSize.x &&
            cellY >= 0 && cellY < gridSize.y &&
            cellZ >= 0 && cellZ < gridSize.z) {

          const idx = cellX + cellY * gridSize.x + cellZ * gridSize.x * gridSize.y;
          const hazeDensity = grid[idx];

          const distanceAttenuation = 1 - (t * 0.7);
          const visibility = fixture.intensity * hazeDensity * scatterFactor * distanceAttenuation;

          visibilityMap[idx] = Math.max(visibilityMap[idx], visibility);
        }
      }
    }

    return visibilityMap;
  }

  private getScatterFactor(fixtureType: string): number {
    const factors: Record<string, number> = {
      'moving_head': 1.0,
      'beam': 1.3,
      'spot': 0.9,
      'strobe': 1.5,
      'led_par': 0.7
    };

    return factors[fixtureType] || 1.0;
  }

  calculateTimeToFill(engine: PhysicsEngine, targetCoverage: number = 0.8): number {
    const grid = engine.getGrid();
    const totalCells = grid.length;
    const targetFilledCells = totalCells * targetCoverage;

    let filledCells = 0;
    const threshold = 0.3;

    for (let i = 0; i < grid.length; i++) {
      if (grid[i] >= threshold) {
        filledCells++;
      }
    }

    return filledCells / targetFilledCells;
  }

  calculateCoverageScore(engine: PhysicsEngine): number {
    const grid = engine.getGrid();
    const threshold = 0.2;

    let coveredCells = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] >= threshold) {
        coveredCells++;
      }
    }

    return coveredCells / grid.length;
  }

  calculateUniformityScore(engine: PhysicsEngine): number {
    const grid = engine.getGrid();

    let sum = 0;
    let count = 0;
    const threshold = 0.1;

    for (let i = 0; i < grid.length; i++) {
      if (grid[i] >= threshold) {
        sum += grid[i];
        count++;
      }
    }

    if (count === 0) return 0;

    const mean = sum / count;

    let variance = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] >= threshold) {
        variance += Math.pow(grid[i] - mean, 2);
      }
    }

    variance /= count;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, 1 - stdDev);
  }

  generateSafetyWarnings(
    engine: PhysicsEngine,
    elapsedTime: number
  ): SafetyWarning[] {
    const warnings: SafetyWarning[] = [];
    const grid = engine.getGrid();
    const gridSize = engine.getGridSize();

    let maxDensity = 0;
    let avgDensity = 0;
    let hazardousCells = 0;

    for (let i = 0; i < grid.length; i++) {
      maxDensity = Math.max(maxDensity, grid[i]);
      avgDensity += grid[i];

      if (grid[i] > 0.8) {
        hazardousCells++;
      }
    }

    avgDensity /= grid.length;

    if (maxDensity > 0.9) {
      warnings.push({
        type: 'visibility',
        severity: 'high',
        message: 'Excessive haze density detected. May cause visibility issues and safety concerns.'
      });
    }

    if (avgDensity > 0.6 && elapsedTime < 300) {
      warnings.push({
        type: 'ventilation',
        severity: 'medium',
        message: 'Poor ventilation detected. Haze is accumulating faster than it can dissipate.'
      });
    }

    const hazardousRatio = hazardousCells / grid.length;
    if (hazardousRatio > 0.3) {
      warnings.push({
        type: 'co2',
        severity: 'critical',
        message: 'Potentially hazardous CO₂ levels. Ensure adequate ventilation and consider reducing haze output.'
      });
    }

    const groundLevelDensity = this.getGroundLevelDensity(engine);
    if (groundLevelDensity > 0.7) {
      warnings.push({
        type: 'emergency_exit',
        severity: 'high',
        message: 'High haze density at ground level may obscure emergency exit visibility.'
      });
    }

    return warnings;
  }

  private getGroundLevelDensity(engine: PhysicsEngine): number {
    const grid = engine.getGrid();
    const gridSize = engine.getGridSize();

    let sum = 0;
    let count = 0;

    const zMax = Math.min(3, gridSize.z);

    for (let z = 0; z < zMax; z++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
          const idx = x + y * gridSize.x + z * gridSize.x * gridSize.y;
          sum += grid[idx];
          count++;
        }
      }
    }

    return count > 0 ? sum / count : 0;
  }

  suggestOptimalPlacement(
    venueWidth: number,
    venueLength: number,
    venueHeight: number
  ): PlacementSuggestion[] {
    const suggestions: PlacementSuggestion[] = [];

    suggestions.push({
      position: { x: venueWidth * 0.25, y: venueLength * 0.5, z: venueHeight * 0.3 },
      score: 0.9,
      reason: 'Front-stage position provides good coverage with natural airflow'
    });

    suggestions.push({
      position: { x: venueWidth * 0.75, y: venueLength * 0.5, z: venueHeight * 0.3 },
      score: 0.85,
      reason: 'Rear-stage position balances coverage and reduces front-stage buildup'
    });

    suggestions.push({
      position: { x: venueWidth * 0.5, y: venueLength * 0.3, z: venueHeight * 0.6 },
      score: 0.8,
      reason: 'Elevated center position allows haze to settle naturally for uniform coverage'
    });

    return suggestions;
  }
}
