"use client";

import React, { useState, useRef, useEffect } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Link, Wifi, CheckCircle, XCircle } from "lucide-react";

// ------------------------------
// Console Definitions
// ------------------------------
const CONSOLE_REMOTES = [
  {
    name: "GrandMA3 onPC",
    description: "Remote access for MA Lighting consoles",
    url: "http://__IP__:80",
    theme: "from-yellow-500 to-cyan-500",
    icon: "🎭",
  },
  {
    name: "ETC Eos",
    description: "Electronic Theatre Controls remote",
    url: "http://__IP__:80",
    theme: "from-blue-500 to-indigo-500",
    icon: "🎪",
  },
  {
    name: "Chamsys MagicQ",
    description: "ChamSys remote control interface",
    url: "http://__IP__:8080",
    theme: "from-cyan-500 to-teal-500",
    icon: "✨",
  },
  {
    name: "Avolites Titan",
    description: "Avolites Titan mobile/web remote",
    url: "http://__IP__:80",
    theme: "from-red-500 to-orange-500",
    icon: "🎬",
  },
  {
    name: "Martin M-PC",
    description: "Martin M-Series console web remote",
    url: "http://__IP__:80",
    theme: "from-green-500 to-emerald-500",
    icon: "💡",
  },
  {
    name: "High End Hog 4",
    description: "Hog 4 Web Remote and status interface",
    url: "http://__IP__:80",
    theme: "from-purple-500 to-pink-500",
    icon: "🐗",
  },
];

// ------------------------------
// Component Start
// ------------------------------
export default function ConsoleRemotes() {
  const getCurrentState = () => ({})
  const handleLoadPreset = () => {}

  const [ipModalOpen, setIpModalOpen] = useState(false);
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [ipInput, setIpInput] = useState("");
  const [pingStatus, setPingStatus] = useState(null); // null | "online" | "offline"
  const ipFieldRef = useRef();

  // Auto-focus modal input
  useEffect(() => {
    if (ipModalOpen && ipFieldRef.current) {
      setTimeout(() => ipFieldRef.current.focus(), 50);
    }
  }, [ipModalOpen]);

  const openIpModal = (consoleConfig) => {
    setSelectedConsole(consoleConfig);
    const lastIp = localStorage.getItem(`console-ip-${consoleConfig.name}`) || "";
    setIpInput(lastIp);
    setPingStatus(null);
    setIpModalOpen(true);
  };

  const buildUrl = () => {
    if (!selectedConsole) return "";
    return selectedConsole.url.replace("__IP__", ipInput.trim());
  };

  // ------------------------------
  // Ping Check
  // ------------------------------
  const checkStatus = async () => {
    const url = buildUrl();
    try {
      const res = await fetch(url, { method: "HEAD", mode: "no-cors" });
      setPingStatus("online");
    } catch (e) {
      setPingStatus("offline");
    }
  };

  const launch = () => {
    const url = buildUrl();
    localStorage.setItem(`console-ip-${selectedConsole.name}`, ipInput);
    window.open(url, "_blank");
  };

  return (
    <ToolShell
      toolId="console-remotes"
      toolName="Console Remotes"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        {/* Instructions */}
        <Card className="p-6 bg-cyan-500/10 border-cyan-400/20">
          <h3 className="font-semibold text-cyan-300 mb-2">How to Use</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
            <li>Confirm your console & device share the same network</li>
            <li>Find console IP under its network settings</li>
            <li>Select a console → enter IP → launch the remote</li>
            <li>Bookmark each remote for fast access during shows</li>
          </ol>
        </Card>

        {/* Console Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONSOLE_REMOTES.map((console) => (
            <Card
              key={console.name}
              className="p-6 border border-white/10 bg-black/40 hover:border-cyan-400 transition-all duration-200 rounded-xl group"
            >
              <div
                className={`h-2 w-full mb-4 rounded bg-gradient-to-r ${console.theme}`}
              />
              <div className="text-4xl mb-3">{console.icon}</div>
              <h3 className="text-lg font-bold text-white mb-1">{console.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{console.description}</p>

              <Button className="w-full" onClick={() => openIpModal(console)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Remote
              </Button>
            </Card>
          ))}
        </div>

        {/* Common IP Ranges */}
        <Card className="p-6 bg-black/40 border-white/10">
          <h3 className="font-semibold text-white mb-3">Typical Lighting Console IP Ranges</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400">Standard LAN</div>
              <div className="text-white font-mono">192.168.x.x</div>
            </div>
            <div>
              <div className="text-gray-400">Art-Net Range</div>
              <div className="text-white font-mono">2.x.x.x or 10.x.x.x</div>
            </div>
          </div>
        </Card>

        {/* IP Entry Modal */}
        <Dialog open={ipModalOpen} onOpenChange={setIpModalOpen}>
          <DialogContent className="bg-black/80 border-white/10 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedConsole?.icon} {selectedConsole?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter your console's IP to generate the remote URL.
              </DialogDescription>
            </DialogHeader>

            {/* IP Input */}
            <div className="space-y-3">
              <Label className="text-gray-300">Console IP Address</Label>
              <Input
                ref={ipFieldRef}
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="Ex: 192.168.1.100"
                className="bg-black/50 border-white/20 text-white"
              />

              {/* Live URL */}
              <div className="text-xs text-gray-400 break-all">
                <span className="text-gray-500">Generated URL:</span>
                <br />
                <span className="text-cyan-400 font-mono">{buildUrl()}</span>
              </div>

              {/* Ping Status */}
              {pingStatus === "online" && (
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" /> Console Responded – Online
                </div>
              )}
              {pingStatus === "offline" && (
                <div className="flex items-center text-red-400 text-sm">
                  <XCircle className="w-4 h-4 mr-2" /> No Response – Offline
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-2">
                <Button className="w-full" onClick={launch}>
                  <ExternalLink className="w-4 h
