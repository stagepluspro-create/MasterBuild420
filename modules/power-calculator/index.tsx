"use client";

import { useState, useMemo } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Device, DeviceTable } from "./device-table";
import { PhaseDistribution } from "./phase-distribution";
import { CableCalculator } from "./cable-calculator";
import { BreakerCircuit } from "./breaker-circuit";
import { GeneratorPlanner } from "./generator-planner";
import { AdvancedFeatures } from "./advanced-features";
import { SafetyAlerts } from "./safety-alerts";
import { VOLTAGE_PRESETS } from "@/lib/power-calculations";

export default function PowerCalculator() {
  const [voltagePreset, setVoltagePreset] = useState<string>("US/Canada 120V Single");
  const [devices, setDevices] = useState<Device[]>([]);

  const systemConfig = useMemo(() => {
    const preset = VOLTAGE_PRESETS[voltagePreset as keyof typeof VOLTAGE_PRESETS];
    return {
      voltage: preset.voltage,
      phases: preset.phases as 1 | 3,
      frequency: preset.frequency,
    };
  }, [voltagePreset]);

  const totalPowerKW = useMemo(() => {
    return devices.reduce((sum, d) => sum + (d.powerRating * d.quantity) / 1000, 0);
  }, [devices]);

  const averagePowerFactor = useMemo(() => {
    if (devices.length === 0) return 0.9;
    const totalPF = devices.reduce((sum, d) => sum + d.powerFactor, 0);
    return totalPF / devices.length;
  }, [devices]);

  const getCurrentState = () => ({
    voltagePreset,
    devices,
  });

  const handleLoadPreset = (data: any) => {
    if (data.voltagePreset) setVoltagePreset(data.voltagePreset);
    if (data.devices) setDevices(data.devices);
  };

  return (
    <ToolShell
      toolId="power-calculator"
      toolName="Power Calculator & Distribution Planner"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-gray-400 text-sm max-w-2xl">
            Professional power distribution planning with load calculations, phase balancing,
            cable sizing, and safety analysis for live production environments.
          </p>

          <div className="w-full md:w-auto">
            <Label className="text-gray-300 mb-2 block">System Configuration</Label>
            <Select value={voltagePreset} onValueChange={setVoltagePreset}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(VOLTAGE_PRESETS).map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {preset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="p-4 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-cyan-500/20">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400 mb-1">System Voltage</p>
              <p className="text-xl font-bold text-white">{systemConfig.voltage}V</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Configuration</p>
              <p className="text-xl font-bold gradient-text">
                {systemConfig.phases}-Phase
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Load</p>
              <p className="text-xl font-bold text-cyan-300">
                {totalPowerKW.toFixed(2)} kW
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Devices</p>
              <p className="text-xl font-bold text-white">{devices.length}</p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="devices">Devices</TabsTrigger>
            {systemConfig.phases === 3 && (
              <TabsTrigger value="phases">Phases</TabsTrigger>
            )}
            <TabsTrigger value="cables">Cables</TabsTrigger>
            <TabsTrigger value="breakers">Breakers</TabsTrigger>
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="mt-6">
            <DeviceTable
              devices={devices}
              onDevicesChange={setDevices}
              systemPhases={systemConfig.phases}
            />
          </TabsContent>

          {systemConfig.phases === 3 && (
            <TabsContent value="phases" className="mt-6">
              <PhaseDistribution
                devices={devices}
                voltage={systemConfig.voltage}
                onDevicesChange={setDevices}
              />
            </TabsContent>
          )}

          <TabsContent value="cables" className="mt-6">
            <CableCalculator voltage={systemConfig.voltage} phases={systemConfig.phases} />
          </TabsContent>

          <TabsContent value="breakers" className="mt-6">
            <BreakerCircuit
              devices={devices}
              voltage={systemConfig.voltage}
              phases={systemConfig.phases}
            />
          </TabsContent>

          <TabsContent value="generator" className="mt-6">
            <GeneratorPlanner
              totalPowerKW={totalPowerKW}
              averagePowerFactor={averagePowerFactor}
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <AdvancedFeatures devices={devices} />
          </TabsContent>

          <TabsContent value="safety" className="mt-6">
            <SafetyAlerts
              devices={devices}
              voltage={systemConfig.voltage}
              phases={systemConfig.phases}
            />
          </TabsContent>
        </Tabs>

        <Card className="p-4 bg-white/5 border-white/10">
          <div className="text-xs text-gray-400 space-y-1">
            <p className="font-semibold text-white mb-2">Important Notes:</p>
            <p>
              • All calculations are for reference only. Verify with licensed electrician
              before implementation.
            </p>
            <p>• Comply with local electrical codes (NEC, IEC, AS/NZS, etc.).</p>
            <p>
              • Consider environmental factors: altitude, temperature, enclosure ratings.
            </p>
            <p>• Always use properly rated connectors, cables, and distribution equipment.</p>
            <p>
              • Obtain necessary permits and inspections for temporary power distribution.
            </p>
          </div>
        </Card>
      </div>
    </ToolShell>
  );
}
