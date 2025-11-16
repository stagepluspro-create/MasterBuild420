"use client";

import { useState, useRef, useEffect } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, RotateCcw, Maximize } from "lucide-react";

export default function Teleprompter() {
  const [text, setText] = useState("Enter your script here...\n\nUse this teleprompter for presentations, speeches, or video production.\n\nAdjust the speed and font size to your preference.");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [fontSize, setFontSize] = useState([32]);
  const [mirror, setMirror] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isPlaying) {
      const scroll = () => {
        setScrollPosition((prev) => {
          const newPos = prev + speed[0] / 60;
          if (scrollRef.current) {
            const maxScroll = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
            if (newPos >= maxScroll) {
              setIsPlaying(false);
              return maxScroll;
            }
          }
          return newPos;
        });
        animationRef.current = requestAnimationFrame(scroll);
      };
      animationRef.current = requestAnimationFrame(scroll);
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
  }, [isPlaying, speed]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const reset = () => {
    setIsPlaying(false);
    setScrollPosition(0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      scrollRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const getCurrentState = () => ({ text, speed: speed[0], fontSize: fontSize[0], mirror });
  const handleLoadPreset = (data: any) => {
    if (data.text) setText(data.text);
    if (data.speed !== undefined) setSpeed([data.speed]);
    if (data.fontSize !== undefined) setFontSize([data.fontSize]);
    if (data.mirror !== undefined) setMirror(data.mirror);
  };

  return (
    <ToolShell
      toolId="teleprompter"
      toolName="Teleprompter"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <Card className="p-6">
          <Label>Script Text</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="mt-2 font-mono"
            placeholder="Enter your script here..."
          />
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <Label>Scroll Speed: {speed[0]}%</Label>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={10}
              max={200}
              step={5}
              className="mt-2"
            />
          </Card>

          <Card className="p-6">
            <Label>Font Size: {fontSize[0]}px</Label>
            <Slider
              value={fontSize}
              onValueChange={setFontSize}
              min={20}
              max={80}
              step={2}
              className="mt-2"
            />
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Mirror Text (for camera reflection)</Label>
              <p className="text-sm text-gray-400">Flip horizontally for teleprompter rigs</p>
            </div>
            <Switch checked={mirror} onCheckedChange={setMirror} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={toggleFullscreen} variant="outline">
            <Maximize className="w-4 h-4 mr-2" />
            Fullscreen
          </Button>
        </div>

        <Card className="bg-black">
          <div
            ref={scrollRef}
            className="h-[50vh] overflow-hidden p-12 text-center"
            style={{
              transform: mirror ? "scaleX(-1)" : "none",
            }}
          >
            <div
              className="whitespace-pre-wrap leading-relaxed"
              style={{
                fontSize: `${fontSize[0]}px`,
                color: "#FFFFFF",
              }}
            >
              {text}
            </div>
          </div>
        </Card>
      </div>
    </ToolShell>
  );
}
