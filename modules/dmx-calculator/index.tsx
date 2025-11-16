import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { ToolShell } from "@/components/tools/tool-shell";
import { dmxService, DMXPatch, DMXFixture, DMXUniverse } from "@/lib/dmx-service";
import { dmxCalculations } from "@/lib/dmx-calculations";
import { exportFormats } from "./export-formats";
import { PatchManager } from "./patch-manager";
import { UniverseBar } from "./universe-bar";
import { FixtureTable } from "./fixture-table";
import { AddFixtureDialog } from "./add-fixture-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  Plus,
  Download,
  ArrowLeft,
  Save,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DMXCalculator() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentPatch, setCurrentPatch] = useState<DMXPatch | null>(null);
  const [fixtures, setFixtures] = useState<DMXFixture[]>([]);
  const [universes, setUniverses] = useState<DMXUniverse[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<string[]>([]);

  useEffect(() => {
    if (currentPatch) {
      loadPatchData();
    }
  }, [currentPatch?.id]);

  const loadPatchData = async () => {
    if (!currentPatch) return;

    try {
      setLoading(true);
      const [fixturesData, universesData] = await Promise.all([
        dmxService.getFixtures(currentPatch.id),
        dmxService.getUniverses(currentPatch.id),
      ]);

      setFixtures(fixturesData);
      setUniverses(universesData);
    } catch (error) {
      console.error("Failed to load patch data:", error);
      toast({
        title: "Error",
        description: "Failed to load patch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const overlaps = useMemo(() => {
    return dmxCalculations.getAllOverlaps(fixtures);
  }, [fixtures]);

  const universeDistribution = useMemo(() => {
    return dmxCalculations.getUniverseDistribution(fixtures);
  }, [fixtures]);

  const nextAvailableAddress = useMemo(() => {
    if (!universes.length || !fixtures.length) return 1;
    const firstUniverse = universes[0].universe_number;
    return dmxService.calculateNextAvailableAddress(fixtures, firstUniverse);
  }, [fixtures, universes]);

  const handlePatchSelect = (patch: DMXPatch) => {
    setCurrentPatch(patch);
    setSelectedFixtureIds([]);
  };

  const handleFixtureSelect = (fixtureId: string) => {
    setSelectedFixtureIds((prev) =>
      prev.includes(fixtureId)
        ? prev.filter((id) => id !== fixtureId)
        : [...prev, fixtureId]
    );
  };

  const handleFixtureSelectAll = (selected: boolean) => {
    setSelectedFixtureIds(selected ? fixtures.map((f) => f.id) : []);
  };

  const handleFixtureDelete = async (fixtureId: string) => {
    if (!confirm("Delete this fixture?")) return;

    try {
      await dmxService.deleteFixture(fixtureId);
      toast({ title: "Success", description: "Fixture deleted" });
      loadPatchData();
    } catch (error) {
      console.error("Failed to delete fixture:", error);
      toast({
        title: "Error",
        description: "Failed to delete fixture",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedFixtureIds.length) return;
    if (!confirm(`Delete ${selectedFixtureIds.length} selected fixtures?`)) return;

    try {
      await dmxService.deleteFixtures(selectedFixtureIds);
      toast({
        title: "Success",
        description: `Deleted ${selectedFixtureIds.length} fixtures`,
      });
      setSelectedFixtureIds([]);
      loadPatchData();
    } catch (error) {
      console.error("Failed to delete fixtures:", error);
      toast({
        title: "Error",
        description: "Failed to delete fixtures",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!currentPatch || !user) return;

    try {
      await dmxService.updatePatch(currentPatch.id, {
        ...currentPatch,
        version: currentPatch.version + 1,
      });

      await dmxService.createVersion(currentPatch.id, user.id, "Manual save");

      toast({ title: "Success", description: "Patch saved successfully" });

      setCurrentPatch({
        ...currentPatch,
        version: currentPatch.version + 1,
      });
    } catch (error) {
      console.error("Failed to save:", error);
      toast({
        title: "Error",
        description: "Failed to save patch",
        variant: "destructive",
      });
    }
  };

  const handleExport = (format: "csv" | "ma3" | "etc" | "chamsys" | "pdf") => {
    if (!currentPatch) return;

    exportFormats.export({
      format,
      patch: currentPatch,
      fixtures,
    });

    toast({
      title: "Success",
      description: `Exported to ${format.toUpperCase()}`,
    });
  };

  const handleAutoCompress = async () => {
    if (!currentPatch || !universes.length) return;

    try {
      const updates = dmxCalculations.compressAddresses(
        fixtures,
        universes[0].universe_number
      );

      for (const update of updates) {
        await dmxService.updateFixture(update.id, {
          start_address: update.newStartAddress,
          end_address: update.newEndAddress,
        });
      }

      toast({
        title: "Success",
        description: "Addresses compressed successfully",
      });

      loadPatchData();
    } catch (error) {
      console.error("Failed to compress addresses:", error);
      toast({
        title: "Error",
        description: "Failed to compress addresses",
        variant: "destructive",
      });
    }
  };

  const getCurrentState = () => ({
    patchId: currentPatch?.id,
  });

  const handleLoadPreset = (data: any) => {
    if (data.patchId) {
      dmxService.getPatchById(data.patchId).then((patch) => {
        if (patch) setCurrentPatch(patch);
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 px-4 pb-12">
        <div className="max-w-6xl mx-auto glass-panel p-8 text-center">
          <h1 className="text-3xl font-bold gradient-text mb-4">DMX Calculator</h1>
          <p className="text-gray-400 mb-6">
            Sign in to create and manage professional DMX patches with universe visualization
            and console exports.
          </p>
          <Button onClick={() => (window.location.href = "/auth/signin")}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (!currentPatch) {
    return (
      <ToolShell
        toolId="dmx-calculator"
        toolName="DMX Calculator"
        getCurrentState={getCurrentState}
        onLoad={handleLoadPreset}
      >
        <PatchManager userId={user.id} onSelect={handlePatchSelect} />
      </ToolShell>
    );
  }

  return (
    <ToolShell
      toolId="dmx-calculator"
      toolName="DMX Calculator"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPatch(null)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-white">{currentPatch.name}</h2>
              {currentPatch.show_name && (
                <p className="text-sm text-gray-400">
                  {currentPatch.show_name}
                  {currentPatch.venue && ` @ ${currentPatch.venue}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save v{currentPatch.version}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  CSV (Universal)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  PDF Patch Sheet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-400">
                  Console Formats
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExport("ma3")}>
                  GrandMA3 XML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("etc")}>
                  ETC Eos CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("chamsys")}>
                  Chamsys MagicQ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {overlaps.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-semibold mb-1">
                Address Overlap Detected
              </p>
              <p className="text-sm text-gray-300 mb-2">
                {overlaps.length} conflict{overlaps.length > 1 ? "s" : ""} found. These
                fixtures share DMX addresses:
              </p>
              <div className="space-y-1">
                {overlaps.slice(0, 3).map((overlap, i) => (
                  <p key={i} className="text-xs text-gray-400">
                    • {overlap.fixture1.fixture_name} and{" "}
                    {overlap.fixture2.fixture_name} (Universe {overlap.fixture1.universe})
                  </p>
                ))}
                {overlaps.length > 3 && (
                  <p className="text-xs text-gray-400">
                    ...and {overlaps.length - 3} more
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Card className="p-4 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-cyan-500/20">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Fixtures</p>
              <p className="text-2xl font-bold text-white">{fixtures.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Universes</p>
              <p className="text-2xl font-bold gradient-text">{universes.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Channels</p>
              <p className="text-2xl font-bold text-cyan-400">
                {fixtures.reduce((sum, f) => sum + f.channel_count, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <Badge
                variant={overlaps.length > 0 ? "destructive" : "default"}
                className="text-sm"
              >
                {overlaps.length > 0 ? "Has Conflicts" : "Valid"}
              </Badge>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Universe Overview</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoCompress}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Compress
              </Button>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Fixtures
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {universeDistribution.map((dist) => (
              <UniverseBar
                key={dist.universe}
                universeNumber={dist.universe}
                universeName={
                  universes.find((u) => u.universe_number === dist.universe)?.name
                }
                fixtures={dist.fixtures}
                selectedFixtureId={selectedFixtureIds[0]}
                onFixtureClick={(f) => handleFixtureSelect(f.id)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Fixture List</h3>
            {selectedFixtureIds.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedFixtureIds.length})
              </Button>
            )}
          </div>

          <FixtureTable
            fixtures={fixtures}
            overlaps={overlaps}
            selectedFixtureIds={selectedFixtureIds}
            onFixtureSelect={handleFixtureSelect}
            onFixtureSelectAll={handleFixtureSelectAll}
            onFixtureEdit={(f) => {/* TODO: Implement fixture editing */}}
            onFixtureDelete={handleFixtureDelete}
          />
        </div>

        <AddFixtureDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          patchId={currentPatch.id}
          universes={universes}
          nextAvailableAddress={nextAvailableAddress}
          onFixturesAdded={loadPatchData}
        />
      </div>
    </ToolShell>
  );
}
