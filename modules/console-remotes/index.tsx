"use client";

import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const CONSOLE_REMOTES = [
  {
    name: "GrandMA3 onPC",
    description: "Remote access for MA Lighting consoles",
    url: "http://your-console-ip",
    defaultPort: "80",
    icon: "🎭",
  },
  {
    name: "ETC Eos",
    description: "Electronic Theatre Controls remote",
    url: "http://your-console-ip",
    defaultPort: "80",
    icon: "🎪",
  },
  {
    name: "Chamsys MagicQ",
    description: "ChamSys remote control",
    url: "http://your-console-ip:8080",
    defaultPort: "8080",
    icon: "✨",
  },
  {
    name: "Avolites Titan",
    description: "Avolites remote interface",
    url: "http://your-console-ip",
    defaultPort: "80",
    icon: "🎬",
  },
  {
    name: "Martin M-PC",
    description: "Martin console remote",
    url: "http://your-console-ip",
    defaultPort: "80",
    icon: "💡",
  },
  {
    name: "High End Hog 4",
    description: "Hog console web interface",
    url: "http://your-console-ip",
    defaultPort: "80",
    icon: "🐗",
  },
];

export default function ConsoleRemotes() {
  const getCurrentState = () => ({});
  const handleLoadPreset = () => {};

  return (
    <ToolShell
      toolId="console-remotes"
      toolName="Console Remotes"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <Card className="p-6 bg-blue-500/10 border-blue-500/30">
          <h3 className="font-semibold text-blue-300 mb-2">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
            <li>Ensure your device and console are on the same network</li>
            <li>Find your console's IP address in network settings</li>
            <li>Click a remote link and replace "your-console-ip" with actual IP</li>
            <li>Bookmark the working URL in your browser for quick access</li>
          </ol>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONSOLE_REMOTES.map((console) => (
            <Card key={console.name} className="p-6 hover:border-cyan-400 transition-colors">
              <div className="text-4xl mb-3">{console.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{console.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{console.description}</p>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Default Port: <span className="text-cyan-400 font-mono">{console.defaultPort}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    const ip = prompt(
                      "Enter console IP address:",
                      "192.168.1.100"
                    );
                    if (ip) {
                      const url = console.url.replace("your-console-ip", ip);
                      window.open(url, "_blank");
                    }
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Launch Remote
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h3 className="font-semibold text-white mb-3">Common Console IPs</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400">Default Range</div>
              <div className="text-white font-mono">192.168.x.x</div>
            </div>
            <div>
              <div className="text-gray-400">Art-Net Range</div>
              <div className="text-white font-mono">2.x.x.x or 10.x.x.x</div>
            </div>
          </div>
        </Card>
      </div>
    </ToolShell>
  );
}
