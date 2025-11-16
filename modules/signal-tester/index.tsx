"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, CheckCircle2, XCircle, Circle } from "lucide-react";

interface CableTest {
  id: string;
  label: string;
  cableType: string;
  status: "pass" | "fail" | "untested";
  notes: string;
  timestamp?: string;
}

export default function SignalTester() {
  const [tests, setTests] = useState<CableTest[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("xlr");

  const addTest = () => {
    if (!newLabel.trim()) return;

    const newTest: CableTest = {
      id: Math.random().toString(36).substr(2, 9),
      label: newLabel,
      cableType: newType,
      status: "untested",
      notes: "",
    };

    setTests([...tests, newTest]);
    setNewLabel("");
  };

  const updateTestStatus = (id: string, status: "pass" | "fail" | "untested") => {
    setTests(
      tests.map((t) =>
        t.id === id
          ? { ...t, status, timestamp: status !== "untested" ? new Date().toLocaleTimeString() : undefined }
          : t
      )
    );
  };

  const updateTestNotes = (id: string, notes: string) => {
    setTests(tests.map((t) => (t.id === id ? { ...t, notes } : t)));
  };

  const deleteTest = (id: string) => {
    setTests(tests.filter((t) => t.id !== id));
  };

  const exportResults = () => {
    const csv = [
      ["Label", "Type", "Status", "Notes", "Timestamp"].join(","),
      ...tests.map((t) =>
        [t.label, t.cableType, t.status, t.notes.replace(/,/g, ";"), t.timestamp || ""].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signal-test-${Date.now()}.csv`;
    a.click();
  };

  const getCurrentState = () => ({ tests });

  const handleLoadPreset = (data: any) => {
    if (data.tests) {
      setTests(data.tests);
    }
  };

  const stats = {
    total: tests.length,
    passed: tests.filter((t) => t.status === "pass").length,
    failed: tests.filter((t) => t.status === "fail").length,
    untested: tests.filter((t) => t.status === "untested").length,
  };

  return (
    <ToolShell
      toolId="signal-tester"
      toolName="Signal Path Tester"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Tests</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.passed}</div>
            <div className="text-sm text-gray-400">Passed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.untested}</div>
            <div className="text-sm text-gray-400">Untested</div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Add Cable Test</h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <Label>Cable Label</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., Stage Left Main"
                onKeyDown={(e) => e.key === "Enter" && addTest()}
              />
            </div>
            <div className="col-span-4">
              <Label>Cable Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlr">XLR (Audio)</SelectItem>
                  <SelectItem value="speakon">Speakon (Speaker)</SelectItem>
                  <SelectItem value="trs">TRS / TS (1/4")</SelectItem>
                  <SelectItem value="dmx">DMX (Lighting)</SelectItem>
                  <SelectItem value="ethernet">Ethernet (Network)</SelectItem>
                  <SelectItem value="sdi">SDI (Video)</SelectItem>
                  <SelectItem value="hdmi">HDMI</SelectItem>
                  <SelectItem value="power">Power Cable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-end">
              <Button onClick={addTest} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </Card>

        {tests.length > 0 && (
          <>
            <div className="flex justify-end">
              <Button onClick={exportResults} variant="outline">
                Export CSV
              </Button>
            </div>

            <div className="space-y-3">
              {tests.map((test) => (
                <Card key={test.id} className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-3">
                      <div className="font-semibold text-white">{test.label}</div>
                      <div className="text-sm text-gray-400 capitalize">{test.cableType}</div>
                      {test.timestamp && (
                        <div className="text-xs text-gray-500 mt-1">{test.timestamp}</div>
                      )}
                    </div>
                    <div className="col-span-3 flex gap-2">
                      <Button
                        size="sm"
                        variant={test.status === "pass" ? "default" : "outline"}
                        onClick={() => updateTestStatus(test.id, "pass")}
                        className={test.status === "pass" ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Pass
                      </Button>
                      <Button
                        size="sm"
                        variant={test.status === "fail" ? "default" : "outline"}
                        onClick={() => updateTestStatus(test.id, "fail")}
                        className={test.status === "fail" ? "bg-red-600 hover:bg-red-700" : ""}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Fail
                      </Button>
                      <Button
                        size="sm"
                        variant={test.status === "untested" ? "default" : "outline"}
                        onClick={() => updateTestStatus(test.id, "untested")}
                      >
                        <Circle className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                    <div className="col-span-5">
                      <Textarea
                        placeholder="Notes (optional)"
                        value={test.notes}
                        onChange={(e) => updateTestNotes(test.id, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTest(test.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {tests.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Circle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No cable tests added yet</p>
            <p className="text-sm">Add cables above to start testing signal continuity</p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
