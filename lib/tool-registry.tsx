"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const DMXCalculator = dynamic(() => import("@/modules/dmx-calculator/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const PowerCalculator = dynamic(() => import("@/modules/power-calculator/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const SPLMeter = dynamic(() => import("@/modules/spl-meter/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const StagePlot = dynamic(() => import("@/modules/stage-plot/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const PatchList = dynamic(() => import("@/modules/patch-list/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const TaskTracker = dynamic(() => import("@/modules/task-tracker/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const ShowDocs = dynamic(() => import("@/modules/show-docs/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const BudgetTracker = dynamic(() => import("@/modules/budget-tracker/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const InventoryTool = dynamic(() => import("@/modules/inventory-tool/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const ToneGenerator = dynamic(() => import("@/modules/tone-generator/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const Metronome = dynamic(() => import("@/modules/metronome/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const Tuner = dynamic(() => import("@/modules/tuner/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const Photometrics = dynamic(() => import("@/modules/photometrics/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const FixtureLibrary = dynamic(() => import("@/modules/fixture-library/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const LUTColorRef = dynamic(() => import("@/modules/lut-color-ref/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const SignalTester = dynamic(() => import("@/modules/signal-tester/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const SpectrumAnalyzer = dynamic(() => import("@/modules/spectrum-analyzer/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const RFCoordination = dynamic(() => import("@/modules/rf-coordination/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const Playback = dynamic(() => import("@/modules/playback/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const ColorTools = dynamic(() => import("@/modules/color-tools/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const ConsoleRemotes = dynamic(() => import("@/modules/console-remotes/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const AspectFramerate = dynamic(() => import("@/modules/aspect-framerate/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const TestPatterns = dynamic(() => import("@/modules/test-patterns/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const Teleprompter = dynamic(() => import("@/modules/teleprompter/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const NDExposure = dynamic(() => import("@/modules/nd-exposure/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const CallsheetBuilder = dynamic(() => import("@/modules/callsheet-builder/index"), {
  ssr: false,
  loading: () => <div className="text-center p-8 text-gray-400">Loading tool...</div>
});

const toolRegistry: Record<string, ComponentType> = {
  "dmx-calculator": DMXCalculator,
  "power-calculator": PowerCalculator,
  "spl-meter": SPLMeter,
  "stage-plot": StagePlot,
  "patch-list": PatchList,
  "task-tracker": TaskTracker,
  "show-docs": ShowDocs,
  "budget-tracker": BudgetTracker,
  "inventory-tool": InventoryTool,
  "tone-generator": ToneGenerator,
  "metronome": Metronome,
  "tuner": Tuner,
  "photometrics": Photometrics,
  "fixture-library": FixtureLibrary,
  "lut-color-ref": LUTColorRef,
  "signal-tester": SignalTester,
  "spectrum-analyzer": SpectrumAnalyzer,
  "rf-coordination": RFCoordination,
  "playback": Playback,
  "color-tools": ColorTools,
  "console-remotes": ConsoleRemotes,
  "aspect-framerate": AspectFramerate,
  "test-patterns": TestPatterns,
  "teleprompter": Teleprompter,
  "nd-exposure": NDExposure,
  "callsheet-builder": CallsheetBuilder,
};

export function getToolComponent(toolId: string): ComponentType | null {
  return toolRegistry[toolId] || null;
}
