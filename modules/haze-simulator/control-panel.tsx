"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { HazeMachine, HVACVent, LightFixture } from "@/lib/haze-simulator/types";

interface ControlPanelProps {
  items: (HazeMachine | HVACVent | LightFixture)[];
  onUpdate: (items: any[]) => void;
  type: 'machine' | 'vent' | 'fixture';
}

export function ControlPanel({ items, onUpdate, type }: ControlPanelProps) {
  const handleUpdate = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    onUpdate(updated);
  };

  const handleUpdatePosition = (index: number, axis: 'x' | 'y' | 'z', value: number) => {
    const updated = [...items];
    (updated[index] as any).position[axis] = value;
    onUpdate(updated);
  };

  const handleDelete = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-400">
        No {type}s added yet. Click the "Add {type === 'machine' ? 'Machine' : type === 'vent' ? 'Vent' : 'Fixture'}" button to get started.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={item.id} className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <Label>Name</Label>
              <Input
                value={item.name}
                onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={item.isActive}
                onCheckedChange={(checked) => handleUpdate(index, 'isActive', checked)}
              />
              <Label className="text-sm">Active</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(index)}
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <Label className="text-xs">X Position (m)</Label>
              <Input
                type="number"
                step="0.1"
                value={item.position.x}
                onChange={(e) => handleUpdatePosition(index, 'x', Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Y Position (m)</Label>
              <Input
                type="number"
                step="0.1"
                value={item.position.y}
                onChange={(e) => handleUpdatePosition(index, 'y', Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Z Position (m)</Label>
              <Input
                type="number"
                step="0.1"
                value={item.position.z}
                onChange={(e) => handleUpdatePosition(index, 'z', Number(e.target.value))}
              />
            </div>
          </div>

          {type === 'machine' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={(item as HazeMachine).type}
                  onValueChange={(val) => handleUpdate(index, 'type', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haze">Haze</SelectItem>
                    <SelectItem value="fog">Fog</SelectItem>
                    <SelectItem value="low_fog">Low Fog</SelectItem>
                    <SelectItem value="cryo">Cryo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Output (m³/min)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="20"
                  value={(item as HazeMachine).outputM3PerMin}
                  onChange={(e) => handleUpdate(index, 'outputM3PerMin', Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {type === 'vent' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={(item as HVACVent).type}
                  onValueChange={(val) => handleUpdate(index, 'type', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supply">Supply</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="exhaust">Exhaust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">CFM</Label>
                <Input
                  type="number"
                  step="50"
                  min="100"
                  max="2000"
                  value={(item as HVACVent).cfm}
                  onChange={(e) => handleUpdate(index, 'cfm', Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {type === 'fixture' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={(item as LightFixture).type}
                  onValueChange={(val) => handleUpdate(index, 'type', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moving_head">Moving Head</SelectItem>
                    <SelectItem value="beam">Beam</SelectItem>
                    <SelectItem value="spot">Spot</SelectItem>
                    <SelectItem value="strobe">Strobe</SelectItem>
                    <SelectItem value="led_par">LED PAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Intensity</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={(item as LightFixture).intensity}
                  onChange={(e) => handleUpdate(index, 'intensity', Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs">Tilt Angle</Label>
                <Input
                  type="number"
                  min="-90"
                  max="90"
                  value={(item as LightFixture).tiltAngle}
                  onChange={(e) => handleUpdate(index, 'tiltAngle', Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
