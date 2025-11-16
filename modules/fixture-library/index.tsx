"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolShell } from "@/components/tools/tool-shell";
import { FixtureBrowser } from "./fixture-browser";
import { GelReference } from "./gel-reference";
import { CCTConverter } from "./cct-converter";
import { ColorPreview } from "./color-preview";

export default function FixtureLibrary() {
  const [activeTab, setActiveTab] = useState("fixtures");

  const getCurrentState = () => ({
    activeTab,
  });

  const handleLoadPreset = (data: any) => {
    if (data.activeTab) setActiveTab(data.activeTab);
  };

  return (
    <ToolShell
      toolId="fixture-library"
      toolName="Fixture Library"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <p className="text-gray-400 text-sm">
          Comprehensive fixture database with photometric data, DMX profiles, gel references, and color utilities.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="gels">Gel Reference</TabsTrigger>
            <TabsTrigger value="cct">CCT Converter</TabsTrigger>
            <TabsTrigger value="color">Color Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="fixtures" className="space-y-4">
            <FixtureBrowser />
          </TabsContent>

          <TabsContent value="gels" className="space-y-4">
            <GelReference />
          </TabsContent>

          <TabsContent value="cct" className="space-y-4">
            <CCTConverter />
          </TabsContent>

          <TabsContent value="color" className="space-y-4">
            <ColorPreview />
          </TabsContent>
        </Tabs>
      </div>
    </ToolShell>
  );
}
