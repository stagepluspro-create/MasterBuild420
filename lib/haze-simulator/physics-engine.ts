import type { Vector3, GridCell, SimulationParams, HazeMachine, HVACVent, Obstacle } from './types';

export class PhysicsEngine {
  private grid: Float32Array;
  private velocityX: Float32Array;
  private velocityY: Float32Array;
  private velocityZ: Float32Array;
  private obstruction: Float32Array;
  private temperature: Float32Array;

  private gridSize: { x: number; y: number; z: number };
  private cellSize: { x: number; y: number; z: number };

  constructor(
    venueWidth: number,
    venueLength: number,
    venueHeight: number,
    resolution: number = 100
  ) {
    this.gridSize = {
      x: resolution,
      y: resolution,
      z: Math.floor(resolution * (venueHeight / Math.max(venueWidth, venueLength)))
    };

    this.cellSize = {
      x: venueWidth / this.gridSize.x,
      y: venueLength / this.gridSize.y,
      z: venueHeight / this.gridSize.z
    };

    const totalCells = this.gridSize.x * this.gridSize.y * this.gridSize.z;

    this.grid = new Float32Array(totalCells);
    this.velocityX = new Float32Array(totalCells);
    this.velocityY = new Float32Array(totalCells);
    this.velocityZ = new Float32Array(totalCells);
    this.obstruction = new Float32Array(totalCells);
    this.temperature = new Float32Array(totalCells).fill(20);
  }

  private getIndex(x: number, y: number, z: number): number {
    return x + y * this.gridSize.x + z * this.gridSize.x * this.gridSize.y;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  setObstacles(obstacles: Obstacle[]): void {
    this.obstruction.fill(0);

    for (const obs of obstacles) {
      const minX = Math.floor(obs.x / this.cellSize.x);
      const maxX = Math.ceil((obs.x + obs.width) / this.cellSize.x);
      const minY = Math.floor(obs.y / this.cellSize.y);
      const maxY = Math.ceil((obs.y + obs.length) / this.cellSize.y);
      const minZ = Math.floor(obs.z / this.cellSize.z);
      const maxZ = Math.ceil((obs.z + obs.height) / this.cellSize.z);

      for (let z = minZ; z < maxZ; z++) {
        for (let y = minY; y < maxY; y++) {
          for (let x = minX; x < maxX; x++) {
            if (x >= 0 && x < this.gridSize.x &&
                y >= 0 && y < this.gridSize.y &&
                z >= 0 && z < this.gridSize.z) {
              const idx = this.getIndex(x, y, z);
              this.obstruction[idx] = obs.flowReduction;
            }
          }
        }
      }
    }
  }

  addHazeMachine(machine: HazeMachine, deltaTime: number): void {
    if (!machine.isActive) return;

    const cellX = Math.floor(machine.position.x / this.cellSize.x);
    const cellY = Math.floor(machine.position.y / this.cellSize.y);
    const cellZ = Math.floor(machine.position.z / this.cellSize.z);

    if (cellX < 0 || cellX >= this.gridSize.x ||
        cellY < 0 || cellY >= this.gridSize.y ||
        cellZ < 0 || cellZ >= this.gridSize.z) return;

    const volumePerSecond = machine.outputM3PerMin / 60;
    const cellVolume = this.cellSize.x * this.cellSize.y * this.cellSize.z;
    const densityIncrease = (volumePerSecond * deltaTime) / cellVolume;

    const plumeRadius = 2;

    for (let dz = -plumeRadius; dz <= plumeRadius; dz++) {
      for (let dy = -plumeRadius; dy <= plumeRadius; dy++) {
        for (let dx = -plumeRadius; dx <= plumeRadius; dx++) {
          const x = cellX + dx;
          const y = cellY + dy;
          const z = cellZ + dz;

          if (x >= 0 && x < this.gridSize.x &&
              y >= 0 && y < this.gridSize.y &&
              z >= 0 && z < this.gridSize.z) {

            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist <= plumeRadius) {
              const falloff = 1 - (dist / plumeRadius);
              const idx = this.getIndex(x, y, z);
              this.grid[idx] = Math.min(1, this.grid[idx] + densityIncrease * falloff);
            }
          }
        }
      }
    }
  }

  addHVACVent(vent: HVACVent, deltaTime: number): void {
    if (!vent.isActive) return;

    const cellX = Math.floor(vent.position.x / this.cellSize.x);
    const cellY = Math.floor(vent.position.y / this.cellSize.y);
    const cellZ = Math.floor(vent.position.z / this.cellSize.z);

    if (cellX < 0 || cellX >= this.gridSize.x ||
        cellY < 0 || cellY >= this.gridSize.y ||
        cellZ < 0 || cellZ >= this.gridSize.z) return;

    const cfmToM3s = vent.cfm * 0.000471947;
    const cellVolume = this.cellSize.x * this.cellSize.y * this.cellSize.z;
    const velocityMagnitude = cfmToM3s / (cellVolume * 4);

    const radius = 3;

    for (let dz = -radius; dz <= radius; dz++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = cellX + dx;
          const y = cellY + dy;
          const z = cellZ + dz;

          if (x >= 0 && x < this.gridSize.x &&
              y >= 0 && y < this.gridSize.y &&
              z >= 0 && z < this.gridSize.z) {

            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist <= radius && dist > 0) {
              const falloff = 1 - (dist / radius);
              const idx = this.getIndex(x, y, z);

              if (vent.type === 'supply') {
                this.velocityX[idx] += vent.direction.x * velocityMagnitude * falloff;
                this.velocityY[idx] += vent.direction.y * velocityMagnitude * falloff;
                this.velocityZ[idx] += vent.direction.z * velocityMagnitude * falloff;
              } else if (vent.type === 'return' || vent.type === 'exhaust') {
                this.grid[idx] *= (1 - 0.1 * falloff * deltaTime);
              }
            }
          }
        }
      }
    }
  }

  advection(deltaTime: number): void {
    const newGrid = new Float32Array(this.grid.length);

    for (let z = 0; z < this.gridSize.z; z++) {
      for (let y = 0; y < this.gridSize.y; y++) {
        for (let x = 0; x < this.gridSize.x; x++) {
          const idx = this.getIndex(x, y, z);

          if (this.obstruction[idx] > 0.9) {
            newGrid[idx] = 0;
            continue;
          }

          const vx = this.velocityX[idx];
          const vy = this.velocityY[idx];
          const vz = this.velocityZ[idx];

          const sourceX = x - vx * deltaTime / this.cellSize.x;
          const sourceY = y - vy * deltaTime / this.cellSize.y;
          const sourceZ = z - vz * deltaTime / this.cellSize.z;

          const x0 = Math.floor(sourceX);
          const y0 = Math.floor(sourceY);
          const z0 = Math.floor(sourceZ);

          if (x0 >= 0 && x0 < this.gridSize.x - 1 &&
              y0 >= 0 && y0 < this.gridSize.y - 1 &&
              z0 >= 0 && z0 < this.gridSize.z - 1) {

            const tx = sourceX - x0;
            const ty = sourceY - y0;
            const tz = sourceZ - z0;

            const c000 = this.grid[this.getIndex(x0, y0, z0)];
            const c100 = this.grid[this.getIndex(x0 + 1, y0, z0)];
            const c010 = this.grid[this.getIndex(x0, y0 + 1, z0)];
            const c110 = this.grid[this.getIndex(x0 + 1, y0 + 1, z0)];
            const c001 = this.grid[this.getIndex(x0, y0, z0 + 1)];
            const c101 = this.grid[this.getIndex(x0 + 1, y0, z0 + 1)];
            const c011 = this.grid[this.getIndex(x0, y0 + 1, z0 + 1)];
            const c111 = this.grid[this.getIndex(x0 + 1, y0 + 1, z0 + 1)];

            const c00 = c000 * (1 - tx) + c100 * tx;
            const c10 = c010 * (1 - tx) + c110 * tx;
            const c01 = c001 * (1 - tx) + c101 * tx;
            const c11 = c011 * (1 - tx) + c111 * tx;

            const c0 = c00 * (1 - ty) + c10 * ty;
            const c1 = c01 * (1 - ty) + c11 * ty;

            newGrid[idx] = c0 * (1 - tz) + c1 * tz;
          } else {
            newGrid[idx] = this.grid[idx];
          }
        }
      }
    }

    this.grid.set(newGrid);
  }

  diffusion(deltaTime: number, diffusionRate: number): void {
    const rate = diffusionRate * deltaTime;

    for (let z = 1; z < this.gridSize.z - 1; z++) {
      for (let y = 1; y < this.gridSize.y - 1; y++) {
        for (let x = 1; x < this.gridSize.x - 1; x++) {
          const idx = this.getIndex(x, y, z);

          if (this.obstruction[idx] > 0.9) continue;

          const neighbors = [
            this.grid[this.getIndex(x - 1, y, z)],
            this.grid[this.getIndex(x + 1, y, z)],
            this.grid[this.getIndex(x, y - 1, z)],
            this.grid[this.getIndex(x, y + 1, z)],
            this.grid[this.getIndex(x, y, z - 1)],
            this.grid[this.getIndex(x, y, z + 1)]
          ];

          const avg = neighbors.reduce((sum, val) => sum + val, 0) / 6;
          this.grid[idx] += (avg - this.grid[idx]) * rate;
        }
      }
    }
  }

  applyBuoyancy(deltaTime: number, strength: number): void {
    for (let z = 1; z < this.gridSize.z - 1; z++) {
      for (let y = 0; y < this.gridSize.y; y++) {
        for (let x = 0; x < this.gridSize.x; x++) {
          const idx = this.getIndex(x, y, z);

          if (this.grid[idx] > 0.01) {
            const tempDiff = this.temperature[idx] - 20;
            this.velocityZ[idx] += strength * tempDiff * deltaTime;
          }
        }
      }
    }
  }

  applyGravity(deltaTime: number, strength: number): void {
    for (let z = 1; z < this.gridSize.z - 1; z++) {
      for (let y = 0; y < this.gridSize.y; y++) {
        for (let x = 0; x < this.gridSize.x; x++) {
          const idx = this.getIndex(x, y, z);
          this.velocityZ[idx] -= strength * deltaTime;
        }
      }
    }
  }

  applyDissipation(deltaTime: number, rate: number): void {
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i] *= (1 - rate * deltaTime);
    }
  }

  step(params: SimulationParams, machines: HazeMachine[], vents: HVACVent[]): void {
    const dt = params.timeStep;

    for (const machine of machines) {
      this.addHazeMachine(machine, dt);
    }

    for (const vent of vents) {
      this.addHVACVent(vent, dt);
    }

    this.advection(dt);
    this.diffusion(dt, params.diffusionRate);

    if (params.buoyancyStrength > 0) {
      this.applyBuoyancy(dt, params.buoyancyStrength);
    }

    if (params.gravityStrength > 0) {
      this.applyGravity(dt, params.gravityStrength);
    }

    this.applyDissipation(dt, params.dissipationRate);
  }

  getDensityAt(x: number, y: number, z: number): number {
    const cellX = this.clamp(Math.floor(x / this.cellSize.x), 0, this.gridSize.x - 1);
    const cellY = this.clamp(Math.floor(y / this.cellSize.y), 0, this.gridSize.y - 1);
    const cellZ = this.clamp(Math.floor(z / this.cellSize.z), 0, this.gridSize.z - 1);

    return this.grid[this.getIndex(cellX, cellY, cellZ)];
  }

  getGrid(): Float32Array {
    return this.grid;
  }

  getGridSize(): { x: number; y: number; z: number } {
    return this.gridSize;
  }

  getCellSize(): { x: number; y: number; z: number } {
    return this.cellSize;
  }

  reset(): void {
    this.grid.fill(0);
    this.velocityX.fill(0);
    this.velocityY.fill(0);
    this.velocityZ.fill(0);
  }
}
