"use client";

import { useState, useRef, useEffect } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Trash2, Plus, Play, Pause, Square, Volume2, Upload } from "lucide-react";

interface Cue {
  id: string;
  name: string;
  audioUrl: string | null;
  audioFile: File | null;
  duration: number;
}

export default function PlaybackCues() {
  const [cues, setCues] = useState<Cue[]>([]);
  const [newCueName, setNewCueName] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState([75]);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeCue, setActiveCue] = useState<Cue | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setPlaying(null);
      setActiveCue(null);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file");
      return;
    }

    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio(audioUrl);

    audio.addEventListener("loadedmetadata", () => {
      const newCue: Cue = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCueName || file.name.replace(/\.[^/.]+$/, ""),
        audioUrl,
        audioFile: file,
        duration: audio.duration,
      };

      setCues([...cues, newCue]);
      setNewCueName("");
    });
  };

  const playCue = (cue: Cue) => {
    if (!cue.audioUrl) return;

    if (playing === cue.id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = cue.audioUrl;
      audioRef.current.load();
      audioRef.current.play();
      setPlaying(cue.id);
      setActiveCue(cue);
    }
  };

  const stopAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(null);
      setActiveCue(null);
      setCurrentTime(0);
    }
  };

  const deleteCue = (id: string) => {
    const cue = cues.find((c) => c.id === id);
    if (cue?.audioUrl) {
      URL.revokeObjectURL(cue.audioUrl);
    }
    setCues(cues.filter((c) => c.id !== id));
    if (playing === id) {
      stopAll();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCurrentState = () => ({
    cues: cues.map((c) => ({ id: c.id, name: c.name, duration: c.duration })),
    volume: volume[0],
  });

  const handleLoadPreset = (data: any) => {
    if (data.volume !== undefined) {
      setVolume([data.volume]);
    }
  };

  return (
    <ToolShell
      toolId="playback"
      toolName="Playback Cues"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Add Audio Cue</h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <Label>Cue Name (optional)</Label>
              <Input
                value={newCueName}
                onChange={(e) => setNewCueName(e.target.value)}
                placeholder="Leave blank to use filename"
              />
            </div>
            <div className="col-span-7 flex items-end gap-2">
              <Button
                className="flex-1"
                onClick={() => document.getElementById("audio-upload")?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Audio File
              </Button>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Master Controls</h3>
            <Button variant="destructive" size="sm" onClick={stopAll} disabled={!playing}>
              <Square className="w-4 h-4 mr-2" />
              Stop All
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <Label>Master Volume: {volume[0]}%</Label>
              </div>
              <Slider
                value={volume}
                onValueChange={setVolume}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {activeCue && (
              <div className="pt-4 border-t border-white/10">
                <div className="text-sm text-gray-400 mb-1">Now Playing</div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{activeCue.name}</div>
                  <div className="text-sm text-gray-400">
                    {formatTime(currentTime)} / {formatTime(activeCue.duration)}
                  </div>
                </div>
                <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all"
                    style={{ width: `${(currentTime / activeCue.duration) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {cues.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {cues.map((cue) => (
              <Card
                key={cue.id}
                className={`p-4 cursor-pointer transition-all ${
                  playing === cue.id ? "border-cyan-400 bg-cyan-500/10" : "hover:border-white/30"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{cue.name}</div>
                    <div className="text-sm text-gray-400">{formatTime(cue.duration)}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCue(cue.id);
                    }}
                    className="text-red-400 hover:text-red-300 -mr-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  className="w-full"
                  variant={playing === cue.id ? "secondary" : "default"}
                  onClick={() => playCue(cue)}
                >
                  {playing === cue.id ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {cues.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No audio cues loaded</p>
            <p className="text-sm">Upload audio files to create a playback soundboard</p>
          </div>
        )}

        <audio ref={audioRef} />
      </div>
    </ToolShell>
  );
}
