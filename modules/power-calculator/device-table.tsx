import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Search, Database } from "lucide-react";
import { searchEquipment, EquipmentSpec, EQUIPMENT_CATEGORIES } from "@/lib/equipment-library";

export interface Device {
  id: string;
  name: string;
  manufacturer?: string;
  quantity: number;
  powerRating: number;
  voltage: number;
  powerFactor: number;
  phase: "A" | "B" | "C" | "Single";
  circuit?: string;
  category?: string;
  notes?: string;
}

interface DeviceTableProps {
  devices: Device[];
  onDevicesChange: (devices: Device[]) => void;
  systemPhases: 1 | 3;
}

export function DeviceTable({ devices, onDevicesChange, systemPhases }: DeviceTableProps) {
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const addDevice = () => {
    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      name: "",
      quantity: 1,
      powerRating: 0,
      voltage: 120,
      powerFactor: 0.95,
      phase: systemPhases === 3 ? "A" : "Single",
    };
    onDevicesChange([...devices, newDevice]);
  };

  const addFromLibrary = (equipment: EquipmentSpec) => {
    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      name: equipment.name,
      manufacturer: equipment.manufacturer,
      quantity: 1,
      powerRating: equipment.powerRating,
      voltage: equipment.voltage,
      powerFactor: equipment.powerFactor,
      phase: systemPhases === 3 ? "A" : "Single",
      category: equipment.category,
      notes: equipment.notes,
    };
    onDevicesChange([...devices, newDevice]);
    setLibraryDialogOpen(false);
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
    onDevicesChange(
      devices.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const deleteDevice = (id: string) => {
    onDevicesChange(devices.filter((d) => d.id !== id));
  };

  const totalPower = devices.reduce(
    (sum, d) => sum + d.powerRating * d.quantity,
    0
  );

  const filteredEquipment = searchEquipment(searchQuery).filter(
    (eq) => selectedCategory === "all" || eq.category === selectedCategory
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Devices</h3>
        <div className="flex gap-2">
          <Dialog open={libraryDialogOpen} onOpenChange={setLibraryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Database className="mr-2 h-4 w-4" />
                Equipment Library
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Equipment Library</DialogTitle>
                <DialogDescription>
                  Select equipment with manufacturer specifications
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, manufacturer, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-auto flex-1">
                <div className="space-y-2">
                  {filteredEquipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                      onClick={() => addFromLibrary(eq)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{eq.name}</p>
                          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                            {eq.manufacturer}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {eq.subcategory} • {eq.powerRating}W @ {eq.voltage}V • PF: {eq.powerFactor}
                        </p>
                        {eq.notes && (
                          <p className="text-xs text-gray-500 mt-1">{eq.notes}</p>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {filteredEquipment.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No equipment found matching your search
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button size="sm" onClick={addDevice}>
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-sm font-medium text-gray-400 pb-3 px-2">Device</th>
              <th className="text-left text-sm font-medium text-gray-400 pb-3 px-2">Qty</th>
              <th className="text-left text-sm font-medium text-gray-400 pb-3 px-2">Power (W)</th>
              <th className="text-left text-sm font-medium text-gray-400 pb-3 px-2">Voltage</th>
              <th className="text-left text-sm font-medium text-gray-400 pb-3 px-2">PF</th>
              {systemPhases === 3 && (
                <th className="text-left text-sm font-medium text-gray-400 pb-3 px-2">Phase</th>
              )}
              <th className="text-left text-sm font-medium text-gray-400 pb-3 px-2">Circuit</th>
              <th className="text-left text-sm font-medium text-gray-400 pb-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id} className="border-b border-white/5">
                <td className="py-2 px-2">
                  <Input
                    value={device.name}
                    onChange={(e) => updateDevice(device.id, { name: e.target.value })}
                    placeholder="Device name"
                    className="min-w-[200px]"
                  />
                  {device.manufacturer && (
                    <span className="text-xs text-gray-500 mt-1 block">
                      {device.manufacturer}
                    </span>
                  )}
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    min="1"
                    value={device.quantity}
                    onChange={(e) =>
                      updateDevice(device.id, { quantity: parseInt(e.target.value) || 1 })
                    }
                    className="w-16"
                  />
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    min="0"
                    value={device.powerRating}
                    onChange={(e) =>
                      updateDevice(device.id, { powerRating: parseFloat(e.target.value) || 0 })
                    }
                    className="w-24"
                  />
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    value={device.voltage}
                    onChange={(e) =>
                      updateDevice(device.id, { voltage: parseFloat(e.target.value) || 120 })
                    }
                    className="w-20"
                  />
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={device.powerFactor}
                    onChange={(e) =>
                      updateDevice(device.id, { powerFactor: parseFloat(e.target.value) || 1 })
                    }
                    className="w-20"
                  />
                </td>
                {systemPhases === 3 && (
                  <td className="py-2 px-2">
                    <Select
                      value={device.phase}
                      onValueChange={(value: any) =>
                        updateDevice(device.id, { phase: value })
                      }
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                )}
                <td className="py-2 px-2">
                  <Input
                    value={device.circuit || ""}
                    onChange={(e) => updateDevice(device.id, { circuit: e.target.value })}
                    placeholder="Circuit"
                    className="w-24"
                  />
                </td>
                <td className="py-2 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDevice(device.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {devices.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No devices added yet. Click "Add Device" or use the Equipment Library.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
        <span className="text-gray-300 font-medium">Total Power Draw:</span>
        <div className="text-right">
          <p className="text-2xl font-bold gradient-text">{totalPower.toFixed(0)} W</p>
          <p className="text-sm text-gray-400">{(totalPower / 1000).toFixed(2)} kW</p>
        </div>
      </div>
    </div>
  );
}
