"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolShell } from "@/components/tools/tool-shell";
import { LUTPreview } from "./lut-preview";
import { GelLibrary } from "./gel-library";
import { CCTConverter } from "./cct-converter";
import { ColorSpaceTools } from "./color-space-tools";
import { LUTVisualizer } from "./lut-visualizer";

export default function LUTColorReference() {
  const [activeTab, setActiveTab] = useState("preview");

  const getCurrentState = () => ({
    activeTab,
  });

  const handleLoadPreset = (data: any) => {
    if (data.activeTab) setActiveTab(data.activeTab);
  };

  return (
    <ToolShell
      toolId="lut-color-ref"
      toolName="LUT & Color Reference"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <p className="text-gray-400 text-sm">
          Professional color management for hybrid productions. Preview LUTs, match camera colors to lighting, and reference gel filters.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="preview">LUT Preview</TabsTrigger>
            <TabsTrigger value="gels">Gel Library</TabsTrigger>
            <TabsTrigger value="cct">CCT Converter</TabsTrigger>
            <TabsTrigger value="colorspace">Color Space</TabsTrigger>
            <TabsTrigger value="visualizer">LUT Visualizer</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4 mt-6">
            <LUTPreview />
          </TabsContent>

          <TabsContent value="gels" className="space-y-4 mt-6">
            <GelLibrary />
          </TabsContent>

          <TabsContent value="cct" className="space-y-4 mt-6">
            <CCTConverter />
          </TabsContent>

          <TabsContent value="colorspace" className="space-y-4 mt-6">
            <ColorSpaceTools />
          </TabsContent>

          <TabsContent value="visualizer" className="space-y-4 mt-6">
            <LUTVisualizer />
          </TabsContent>
        </Tabs>
      </div>
    </ToolShell>
  );
}
