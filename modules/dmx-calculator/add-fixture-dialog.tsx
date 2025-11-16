"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { dmxService, DMXUniverse } from "@/lib/dmx-service";
import { dmxCalculations } from "@/lib/dmx-calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FixtureFromLibrary {
  id: string;
  brand: string;
  model: string;
  type: string;
  modes: Array<{
    id: string;
    name: string;
    channels: number;
  }>;
}

interface AddFixtureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patchId: string;
  universes: DMXUniverse[];
  nextAvailableAddress: number;
  onFixturesAdded: () => void;
}

export function AddFixtureDialog({
  open,
  onOpenChange,
  patchId,
  universes,
  nextAvailableAddress,
  onFixturesAdded,
}: AddFixtureDialogProps) {
  const [mode, setMode] = useState<"manual" | "library">("manual");
  const [libraryFixtures, setLibraryFixtures] = useState<FixtureFromLibrary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [fixtureName, setFixtureName] = useState("");
  const [fixtureType, setFixtureType] = useState("");
  const [channelCount, setChannelCount] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [selectedUniverse, setSelectedUniverse] = useState(
    universes[0]?.universe_number || 1
  );
  const [startAddress, setStartAddress] = useState(nextAvailableAddress);
  const [autoAddress, setAutoAddress] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState("#00E8FF");

  const [selectedLibraryFixture, setSelectedLibraryFixture] =
    useState<FixtureFromLibrary | null>(null);
  const [selectedModeId, setSelectedModeId] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (open && mode === "library") {
      loadFixturesFromLibrary();
    }
  }, [open, mode]);

  useEffect(() => {
    if (autoAddress) {
      setStartAddress(nextAvailableAddress);
    }
  }, [autoAddress, nextAvailableAddress]);

  const loadFixturesFromLibrary = async () => {
    try {
      setLoading(true);
      const { data: fixtures, error } = await supabase
        .from("fixtures")
        .select("id, brand, model, type")
        .order("brand", { ascending: true })
        .order("model", { ascending: true });

      if (error) throw error;

      const fixturesWithModes = await Promise.all(
        (fixtures || []).map(async (fixture) => {
          const { data: modes } = await supabase
            .from("dmx_modes")
            .select("id, name, channels")
            .eq("fixture_id", fixture.id)
            .order("channels", { ascending: true });

          return {
            ...fixture,
            modes: modes || [],
          };
        })
      );

      setLibraryFixtures(fixturesWithModes);
    } catch (error) {
      console.error("Failed to load fixtures:", error);
      toast({
        title: "Error",
        description: "Failed to load fixture library",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLibraryFixtureSelect = (fixture: FixtureFromLibrary) => {
    setSelectedLibraryFixture(fixture);
    setFixtureName(`${fixture.brand} ${fixture.model}`);
    setFixtureType(fixture.type);

    if (fixture.modes.length > 0) {
      const firstMode = fixture.modes[0];
      setSelectedModeId(firstMode.id);
      setChannelCount(firstMode.channels);
    }
  };

  const handleModeChange = (modeId: string) => {
    setSelectedModeId(modeId);
    const mode = selectedLibraryFixture?.modes.find((m) => m.id === modeId);
    if (mode) {
      setChannelCount(mode.channels);
    }
  };

  const validation = dmxCalculations.validateAddressRange(
    startAddress,
    channelCount * quantity
  );

  const handleAddFixtures = async () => {
    if (!fixtureName.trim()) {
      toast({
        title: "Error",
        description: "Fixture name is required",
        variant: "destructive",
      });
      return;
    }

    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      const universe = universes.find((u) => u.universe_number === selectedUniverse);
      if (!universe) throw new Error("Universe not found");

      const fixtures = [];
      let currentAddress = startAddress;

      for (let i = 1; i <= quantity; i++) {
        const endAddress = currentAddress + channelCount - 1;

        if (endAddress > 512) {
          toast({
            title: "Warning",
            description: `Fixture ${i} exceeds universe capacity. Only ${i - 1} fixtures added.`,
            variant: "destructive",
          });
          break;
        }

        fixtures.push({
          patch_id: patchId,
          universe_id: universe.id,
          fixture_id: selectedLibraryFixture?.id || undefined,
          fixture_name: quantity > 1 ? `${fixtureName} ${i}` : fixtureName,
          fixture_type: fixtureType || undefined,
          universe: selectedUniverse,
          start_address: currentAddress,
          end_address: endAddress,
          channel_count: channelCount,
          mode_name:
            selectedLibraryFixture?.modes.find((m) => m.id === selectedModeId)?.name ||
            undefined,
          dmx_mode_id: selectedModeId || undefined,
          group_name: groupName || undefined,
          group_color: groupColor,
          quantity,
          unit_number: i,
          order_index: 0,
        });

        currentAddress = endAddress + 1;
      }

      await dmxService.createFixtures(fixtures);

      toast({
        title: "Success",
        description: `Added ${fixtures.length} fixture${fixtures.length > 1 ? "s" : ""}`,
      });

      resetForm();
      onFixturesAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add fixtures:", error);
      toast({
        title: "Error",
        description: "Failed to add fixtures",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFixtureName("");
    setFixtureType("");
    setChannelCount(1);
    setQuantity(1);
    setStartAddress(nextAvailableAddress);
    setAutoAddress(true);
    setGroupName("");
    setGroupColor("#00E8FF");
    setSelectedLibraryFixture(null);
    setSelectedModeId("");
    setSearchQuery("");
  };

  const filteredLibraryFixtures = libraryFixtures.filter((f) => {
    const search = searchQuery.toLowerCase();
    return (
      f.brand.toLowerCase().includes(search) ||
      f.model.toLowerCase().includes(search) ||
      f.type.toLowerCase().includes(search)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Fixtures</DialogTitle>
          <DialogDescription>
            Add fixtures manually or select from the fixture library
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "library")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="library">Fixture Library</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search fixtures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="border border-white/10 rounded-lg max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading fixtures...</div>
              ) : filteredLibraryFixtures.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No fixtures found. Try a different search.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredLibraryFixtures.map((fixture) => (
                    <button
                      key={fixture.id}
                      className="w-full p-3 text-left hover:bg-white/5 transition-colors"
                      onClick={() => handleLibraryFixtureSelect(fixture)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {fixture.brand} {fixture.model}
                          </p>
                          <p className="text-sm text-gray-400">{fixture.type}</p>
                        </div>
                        <Badge variant="secondary">{fixture.modes.length} modes</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedLibraryFixture && selectedLibraryFixture.modes.length > 0 && (
              <div>
                <Label>DMX Mode</Label>
                <Select value={selectedModeId} onValueChange={handleModeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedLibraryFixture.modes.map((mode) => (
                      <SelectItem key={mode.id} value={mode.id}>
                        {mode.name} ({mode.channels}ch)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fixture Name *</Label>
                <Input
                  placeholder="e.g., LED Par 1"
                  value={fixtureName}
                  onChange={(e) => setFixtureName(e.target.value)}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Input
                  placeholder="e.g., LED Par"
                  value={fixtureType}
                  onChange={(e) => setFixtureType(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Channels *</Label>
              <Input
                type="number"
                min={1}
                max={512}
                value={channelCount}
                onChange={(e) => setChannelCount(parseInt(e.target.value) || 1)}
                disabled={!!selectedModeId}
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Universe</Label>
              <Select
                value={selectedUniverse.toString()}
                onValueChange={(v) => setSelectedUniverse(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {universes.map((u) => (
                    <SelectItem key={u.id} value={u.universe_number.toString()}>
                      Universe {u.universe_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="auto-address"
                checked={autoAddress}
                onChange={(e) => setAutoAddress(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="auto-address" className="cursor-pointer">
                Auto-assign address
              </Label>
            </div>
            {!autoAddress && (
              <Input
                type="number"
                min={1}
                max={512}
                value={startAddress}
                onChange={(e) => setStartAddress(parseInt(e.target.value) || 1)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Group Name</Label>
              <Input
                placeholder="e.g., Front Truss"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div>
              <Label>Group Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={groupColor}
                  onChange={(e) => setGroupColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={groupColor}
                  onChange={(e) => setGroupColor(e.target.value)}
                  placeholder="#00E8FF"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {!validation.valid && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
              <p className="text-sm text-red-400">{validation.error}</p>
            </div>
          )}

          {validation.valid && (
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <p className="text-sm text-gray-300">
                Will add {quantity} fixture{quantity > 1 ? "s" : ""} starting at address{" "}
                <span className="font-mono text-cyan-400">{startAddress}</span> (ending at{" "}
                <span className="font-mono text-cyan-400">
                  {startAddress + channelCount * quantity - 1}
                </span>
                )
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddFixtures} disabled={!validation.valid || !fixtureName.trim()}>
            Add Fixture{quantity > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
