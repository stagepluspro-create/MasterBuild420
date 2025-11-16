"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThrowCalculator } from "./throw-calculator";
import { IlluminanceCalculator } from "./illuminance-calculator";
import { ArrayPlanner } from "./array-planner";
import { TrimAimCalculator } from "./trim-aim-calculator";
import { CameraExposure } from "./camera-exposure";
import { DistanceChart } from "./distance-chart";

export default function Photometrics() {
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [distance, setDistance] = useState(10);
  const [beamAngle, setBeamAngle] = useState(26);
  const [fieldAngle, setFieldAngle] = useState(40);
  const [cbcp, setCbcp] = useState(50000);
  const [lumens, setLumens] = useState(10000);
  const [useEstimate, setUseEstimate] = useState(false);

  const getCurrentState = () => ({
    units,
    distance,
    beamAngle,
    fieldAngle,
    cbcp,
    lumens,
    useEstimate,
  });

  const handleLoadPreset = (data: any) => {
    if (data.units) setUnits(data.units);
    if (data.distance) setDistance(data.distance);
    if (data.beamAngle) setBeamAngle(data.beamAngle);
    if (data.fieldAngle) setFieldAngle(data.fieldAngle);
    if (data.cbcp) setCbcp(data.cbcp);
    if (data.lumens) setLumens(data.lumens);
    if (data.useEstimate !== undefined) setUseEstimate(data.useEstimate);
  };

  return (
    <ToolShell
      toolId="photometrics"
      toolName="Photometrics Calculator"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Professional throw, illuminance, and coverage calculations for lighting design.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setUnits("metric")}
              className={`px-3 py-1 rounded text-sm ${
                units === "metric"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              Metric (m/lux)
            </button>
            <button
              onClick={() => setUnits("imperial")}
              className={`px-3 py-1 rounded text-sm ${
                units === "imperial"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              Imperial (ft/fc)
            </button>
          </div>
        </div>

        <Tabs defaultValue="throw" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="throw">Throw & Coverage</TabsTrigger>
            <TabsTrigger value="illuminance">Illuminance</TabsTrigger>
            <TabsTrigger value="array">Array Planning</TabsTrigger>
            <TabsTrigger value="trim">Trim & Aim</TabsTrigger>
            <TabsTrigger value="camera">Camera</TabsTrigger>
          </TabsList>

          <TabsContent value="throw" className="space-y-4 mt-6">
            <ThrowCalculator
              units={units}
              distance={distance}
              setDistance={setDistance}
              beamAngle={beamAngle}
              setBeamAngle={setBeamAngle}
              fieldAngle={fieldAngle}
              setFieldAngle={setFieldAngle}
            />
          </TabsContent>

          <TabsContent value="illuminance" className="space-y-4 mt-6">
            <IlluminanceCalculator
              units={units}
              distance={distance}
              setDistance={setDistance}
              beamAngle={beamAngle}
              cbcp={cbcp}
              setCbcp={setCbcp}
              lumens={lumens}
              setLumens={setLumens}
              useEstimate={useEstimate}
              setUseEstimate={setUseEstimate}
            />

            <DistanceChart
              units={units}
              cbcp={useEstimate ? lumens / (2 * Math.PI * (1 - Math.cos((beamAngle * Math.PI) / 360))) : cbcp}
              maxDistance={units === "metric" ? 30 : 100}
            />
          </TabsContent>

          <TabsContent value="array" className="space-y-4 mt-6">
            <ArrayPlanner
              units={units}
              distance={distance}
              beamAngle={beamAngle}
              fieldAngle={fieldAngle}
              cbcp={useEstimate ? lumens / (2 * Math.PI * (1 - Math.cos((beamAngle * Math.PI) / 360))) : cbcp}
            />
          </TabsContent>

          <TabsContent value="trim" className="space-y-4 mt-6">
            <TrimAimCalculator units={units} />
          </TabsContent>

          <TabsContent value="camera" className="space-y-4 mt-6">
            <CameraExposure units={units} />
          </TabsContent>
        </Tabs>
      </div>
    </ToolShell>
  );
}
