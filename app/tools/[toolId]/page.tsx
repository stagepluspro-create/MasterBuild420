"use client";

import { notFound } from "next/navigation";
import { getToolById, tools } from "@/lib/tools";
import { getToolComponent } from "@/lib/tool-registry";
import { useEffect, useState } from "react";

export default function ToolPage({ params }: { params: { toolId: string } }) {
  const [mounted, setMounted] = useState(false);
  const tool = getToolById(params.toolId);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!tool) {
    notFound();
  }

  if (!mounted) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center glass-panel p-12">
          <p className="text-gray-400">Loading tool...</p>
        </div>
      </div>
    );
  }

  const ToolComponent = getToolComponent(params.toolId);

  if (!ToolComponent) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center glass-panel p-12">
          <h1 className="text-3xl font-bold gradient-text mb-4">{tool.name}</h1>
          <p className="text-xl text-gray-300 mb-8">{tool.description}</p>
          <p className="text-gray-400">This tool is currently being implemented.</p>
        </div>
      </div>
    );
  }

  return <ToolComponent />;
}
