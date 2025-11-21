"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Play, Pause, RotateCcw, Save, AlertTriangle, Zap, Wind, Lightbulb } from "lucide-react";
import { PhysicsEngine } from "@/lib/haze-simulator/physics-engine";
import { AnalysisEngine } from "@/lib/haze-simulator/analysis-engine";
import { hazeService } from "@/lib/haze-simulator/haze-service";
import type { HazeMachine, HVACVent, LightFixture, Obstacle, SafetyWarning, SimulationParams } from "@/lib/haze-simulator/types";
import { VenueCanvas } from "./venue-canvas";
import { ControlPanel } from "./control-panel";
import { ResultsPanel } from "./results-panel";

export default function HazeSimulator() {
  const { user } = useAuth();

  const [venueWidth, setVenueWidth] = useState(20);
  const [venueLength, setVenueLength] = useState(30);
  const [venueHeight, setVenueHeight] = useState(8);
  const [venueName, setVenueName] = useState("New Venue");

  const [machines, setMachines] = useState<HazeMachine[]>([]);
  const [vents, setVents] = useState<HVACVent[]>([]);
  const [fixtures, setFixtures] = useState<LightFixture[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [engine, setEngine] = useState<PhysicsEngine | null>(null);
  const [analysisEngine] = useState(new AnalysisEngine());

  const [coverageScore, setCoverageScore] = useState(0);
  const [uniformityScore, setUniformityScore] = useState(0);
  const [safetyWarnings, setSafetyWarnings] = useState<SafetyWarning[]>([]);
  const [visibilityMap, setVisibilityMap] = useState<Float32Array | null>(null);

  const [simParams, setSimParams] = useState<SimulationParams>({
    timeStep: 0.1,
    diffusionRate: 0.05,
    dissipationRate: 0.001,
    buoyancyStrength: 0.1,
    gravityStrength: 0.05,
    maxSteps: 10000,
    targetFPS: 30
  });

  const animationRef = useRef<number>();

  useEffect(() => {
    initializeEngine();
  }, [venueWidth, venueLength, venueHeight]);

  useEffect(() => {
    if (isRunning && engine) {
      runSimulation();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, engine]);

  const initializeEngine = () => {
    const newEngine = new PhysicsEngine(venueWidth, venueLength, venueHeight, 100);
    newEngine.setObstacles(obstacles);
    setEngine(newEngine);
    setCurrentStep(0);
    setElapsedTime(0);
  };

  const runSimulation = () => {
    if (!engine) return;

    let lastTime = Date.now();
    const frameInterval = 1000 / simParams.targetFPS;

    const step = () => {
      const now = Date.now();
      const delta = now - lastTime;

      if (delta >= frameInterval) {
        engine.step(simParams, machines, vents);

        setCurrentStep(prev => prev + 1);
        setElapsedTime(prev => prev + simParams.timeStep);

        const coverage = analysisEngine.calculateCoverageScore(engine);
        const uniformity = analysisEngine.calculateUniformityScore(engine);
        const warnings = analysisEngine.generateSafetyWarnings(engine, elapsedTime);
        const visibility = analysisEngine.calculateVisibility(engine, fixtures);

        setCoverageScore(coverage);
        setUniformityScore(uniformity);
        setSafetyWarnings(warnings);
        setVisibilityMap(visibility);

        lastTime = now;
      }

      if (isRunning && currentStep < simParams.maxSteps) {
        animationRef.current = requestAnimationFrame(step);
      } else if (currentStep >= simParams.maxSteps) {
        handleStop();
        toast({
          title: "Simulation Complete",
          description: `Completed ${simParams.maxSteps} steps.`
        });
      }
    };

    animationRef.current = requestAnimationFrame(step);
  };

  const handleStart = () => {
    if (machines.length === 0) {
      toast({
        title: "No Haze Machines",
        description: "Please add at least one haze machine to the venue.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleReset = () => {
    handleStop();
    initializeEngine();
    setCoverageScore(0);
    setUniformityScore(0);
    setSafetyWarnings([]);
    setVisibilityMap(null);
    toast({
      title: "Simulation Reset",
      description: "All simulation data has been cleared."
    });
  };

  const handleSave = async () => {
    if (!user || !engine) return;

    try {
      const venue = await hazeService.createVenue({
        user_id: user.id,
        name: venueName,
        width_m: venueWidth,
        length_m: venueLength,
        height_m: venueHeight,
        grid_resolution: 100,
        obstacles: obstacles,
        temperature_c: 20
      });

      for (const machine of machines) {
        await hazeService.createMachine({
          venue_id: venue.id,
          name: machine.name,
          machine_type: machine.type,
          output_m3_per_min: machine.outputM3PerMin,
          position_x: machine.position.x,
          position_y: machine.position.y,
          position_z: machine.position.z,
          direction_angle: machine.directionAngle,
          is_active: machine.isActive
        });
      }

      for (const vent of vents) {
        await hazeService.createVent({
          venue_id: venue.id,
          name: vent.name,
          vent_type: vent.type,
          cfm: vent.cfm,
          position_x: vent.position.x,
          position_y: vent.position.y,
          position_z: vent.position.z,
          direction_x: vent.direction.x,
          direction_y: vent.direction.y,
          direction_z: vent.direction.z,
          is_active: vent.isActive
        });
      }

      for (const fixture of fixtures) {
        await hazeService.createFixture({
          venue_id: venue.id,
          name: fixture.name,
          fixture_type: fixture.type,
          position_x: fixture.position.x,
          position_y: fixture.position.y,
          position_z: fixture.position.z,
          beam_angle: fixture.beamAngle,
          intensity: fixture.intensity,
          pan_angle: fixture.panAngle,
          tilt_angle: fixture.tiltAngle,
          color: fixture.color,
          is_active: fixture.isActive
        });
      }

      await hazeService.saveSimulation({
        venue_id: venue.id,
        user_id: user.id,
        name: `${venueName} - Simulation`,
        simulation_params: simParams,
        results: {
          coverage: coverageScore,
          uniformity: uniformityScore,
          elapsed_time: elapsedTime
        },
        coverage_score: coverageScore,
        uniformity_score: uniformityScore,
        safety_warnings: safetyWarnings
      });

      toast({
        title: "Success",
        description: "Venue and simulation saved successfully!"
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save venue.",
        variant: "destructive"
      });
    }
  };

  const handleAddMachine = () => {
    const newMachine: HazeMachine = {
      id: `machine-${Date.now()}`,
      name: `Haze Machine ${machines.length + 1}`,
      type: 'haze',
      position: { x: venueWidth / 2, y: venueLength / 2, z: 1.5 },
      outputM3PerMin: 5,
      directionAngle: 0,
      isActive: true,
      warmupTimeSec: 180
    };

    setMachines([...machines, newMachine]);
  };

  const handleAddVent = () => {
    const newVent: HVACVent = {
      id: `vent-${Date.now()}`,
      name: `HVAC Vent ${vents.length + 1}`,
      type: 'return',
      position: { x: venueWidth / 2, y: venueLength / 4, z: venueHeight - 1 },
      direction: { x: 0, y: 0, z: -1 },
      cfm: 400,
      isActive: true
    };

    setVents([...vents, newVent]);
  };

  const handleAddFixture = () => {
    const newFixture: LightFixture = {
      id: `fixture-${Date.now()}`,
      name: `Fixture ${fixtures.length + 1}`,
      type: 'moving_head',
      position: { x: venueWidth / 2, y: venueLength * 0.8, z: venueHeight - 2 },
      beamAngle: 15,
      intensity: 1.0,
      panAngle: 0,
      tiltAngle: 45,
      color: '#FFFFFF',
      isActive: true
    };

    setFixtures([...fixtures, newFixture]);
  };

  return (
    <ToolShell
      title="Haze & Atmosphere Simulator"
      description="Simulate and analyze haze/fog dispersion in venues with real-time 3D visualization"
    >
      <div className="space-y-6">
        <Card className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Venue Name</Label>
              <Input
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Enter venue name"
              />
            </div>
            <div>
              <Label>Width (m)</Label>
              <Input
                type="number"
                min="5"
                max="100"
                value={venueWidth}
                onChange={(e) => setVenueWidth(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>
            <div>
              <Label>Length (m)</Label>
              <Input
                type="number"
                min="5"
                max="100"
                value={venueLength}
                onChange={(e) => setVenueLength(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>
            <div>
              <Label>Height (m)</Label>
              <Input
                type="number"
                min="3"
                max="30"
                value={venueHeight}
                onChange={(e) => setVenueHeight(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={isRunning ? handleStop : handleStart} variant="default">
              {isRunning ? <><Pause className="mr-2 h-4 w-4" /> Pause</> : <><Play className="mr-2 h-4 w-4" /> Start</>}
            </Button>
            <Button onClick={handleReset} variant="outline" disabled={isRunning}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button onClick={handleSave} variant="outline" disabled={!user}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button onClick={handleAddMachine} variant="outline" disabled={isRunning}>
              <Zap className="mr-2 h-4 w-4" /> Add Machine
            </Button>
            <Button onClick={handleAddVent} variant="outline" disabled={isRunning}>
              <Wind className="mr-2 h-4 w-4" /> Add Vent
            </Button>
            <Button onClick={handleAddFixture} variant="outline" disabled={isRunning}>
              <Lightbulb className="mr-2 h-4 w-4" /> Add Fixture
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-4">3D Visualization</h3>
            <VenueCanvas
              engine={engine}
              machines={machines}
              vents={vents}
              fixtures={fixtures}
              obstacles={obstacles}
              visibilityMap={visibilityMap}
              venueWidth={venueWidth}
              venueLength={venueLength}
              venueHeight={venueHeight}
            />
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Simulation Stats</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Step</span>
                    <span className="text-cyan-400">{currentStep}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Time</span>
                    <span className="text-cyan-400">{elapsedTime.toFixed(1)}s</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Coverage</span>
                    <span className="text-cyan-400">{(coverageScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all"
                      style={{ width: `${coverageScore * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Uniformity</span>
                    <span className="text-cyan-400">{(uniformityScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-magenta-500 transition-all"
                      style={{ width: `${uniformityScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {safetyWarnings.length > 0 && (
              <Card className="p-6 border-yellow-500/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="h-5 w-5" />
                  Safety Warnings
                </h3>
                <div className="space-y-2">
                  {safetyWarnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-sm ${
                        warning.severity === 'critical' ? 'bg-red-500/10 border border-red-500/30' :
                        warning.severity === 'high' ? 'bg-orange-500/10 border border-orange-500/30' :
                        warning.severity === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                        'bg-blue-500/10 border border-blue-500/30'
                      }`}
                    >
                      <div className="font-semibold capitalize">{warning.type.replace(/_/g, ' ')}</div>
                      <div className="text-gray-300">{warning.message}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <Tabs defaultValue="machines" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="machines">Machines ({machines.length})</TabsTrigger>
            <TabsTrigger value="vents">HVAC ({vents.length})</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures ({fixtures.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="machines">
            <ControlPanel
              items={machines}
              onUpdate={setMachines}
              type="machine"
            />
          </TabsContent>

          <TabsContent value="vents">
            <ControlPanel
              items={vents}
              onUpdate={setVents}
              type="vent"
            />
          </TabsContent>

          <TabsContent value="fixtures">
            <ControlPanel
              items={fixtures}
              onUpdate={setFixtures}
              type="fixture"
            />
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Simulation Parameters</h3>
              <div className="space-y-4">
                <div>
                  <Label>Diffusion Rate: {simParams.diffusionRate.toFixed(3)}</Label>
                  <Slider
                    value={[simParams.diffusionRate * 100]}
                    onValueChange={([val]) => setSimParams({ ...simParams, diffusionRate: val / 100 })}
                    min={0}
                    max={10}
                    step={0.1}
                    disabled={isRunning}
                  />
                </div>
                <div>
                  <Label>Dissipation Rate: {simParams.dissipationRate.toFixed(4)}</Label>
                  <Slider
                    value={[simParams.dissipationRate * 1000]}
                    onValueChange={([val]) => setSimParams({ ...simParams, dissipationRate: val / 1000 })}
                    min={0}
                    max={10}
                    step={0.1}
                    disabled={isRunning}
                  />
                </div>
                <div>
                  <Label>Buoyancy Strength: {simParams.buoyancyStrength.toFixed(2)}</Label>
                  <Slider
                    value={[simParams.buoyancyStrength * 10]}
                    onValueChange={([val]) => setSimParams({ ...simParams, buoyancyStrength: val / 10 })}
                    min={0}
                    max={10}
                    step={0.1}
                    disabled={isRunning}
                  />
                </div>
                <div>
                  <Label>Target FPS: {simParams.targetFPS}</Label>
                  <Slider
                    value={[simParams.targetFPS]}
                    onValueChange={([val]) => setSimParams({ ...simParams, targetFPS: val })}
                    min={5}
                    max={60}
                    step={5}
                    disabled={isRunning}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ToolShell>
  );
}
