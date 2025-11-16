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
};

export function getToolComponent(toolId: string): ComponentType | null {
  return toolRegistry[toolId] || null;
}
