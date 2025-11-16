"use client";

import { useState } from "react";
import { DMXFixture } from "@/lib/dmx-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FixtureTableProps {
  fixtures: DMXFixture[];
  overlaps: Array<{ fixture1: DMXFixture; fixture2: DMXFixture }>;
  selectedFixtureIds: string[];
  onFixtureSelect: (fixtureId: string) => void;
  onFixtureSelectAll: (selected: boolean) => void;
  onFixtureEdit: (fixture: DMXFixture) => void;
  onFixtureDelete: (fixtureId: string) => void;
}

export function FixtureTable({
  fixtures,
  overlaps,
  selectedFixtureIds,
  onFixtureSelect,
  onFixtureSelectAll,
  onFixtureEdit,
  onFixtureDelete,
}: FixtureTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUniverse, setFilterUniverse] = useState<number | "all">("all");
  const [filterGroup, setFilterGroup] = useState<string | "all">("all");

  const hasOverlap = (fixtureId: string) => {
    return overlaps.some(
      (o) => o.fixture1.id === fixtureId || o.fixture2.id === fixtureId
    );
  };

  const filteredFixtures = fixtures.filter((f) => {
    if (
      searchQuery &&
      !f.fixture_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (filterUniverse !== "all" && f.universe !== filterUniverse) {
      return false;
    }
    if (filterGroup !== "all" && f.group_name !== filterGroup) {
      return false;
    }
    return true;
  });

  const universes = Array.from(new Set(fixtures.map((f) => f.universe))).sort(
    (a, b) => a - b
  );
  const groups = Array.from(
    new Set(fixtures.map((f) => f.group_name).filter(Boolean))
  ).sort();

  const allSelected =
    filteredFixtures.length > 0 &&
    filteredFixtures.every((f) => selectedFixtureIds.includes(f.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search fixtures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />

        <select
          value={filterUniverse}
          onChange={(e) =>
            setFilterUniverse(
              e.target.value === "all" ? "all" : parseInt(e.target.value)
            )
          }
          className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-white"
        >
          <option value="all">All Universes</option>
          {universes.map((u) => (
            <option key={u} value={u}>
              Universe {u}
            </option>
          ))}
        </select>

        {groups.length > 0 && (
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-white"
          >
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}

        {selectedFixtureIds.length > 0 && (
          <Badge variant="secondary">
            {selectedFixtureIds.length} selected
          </Badge>
        )}
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onFixtureSelectAll}
                  />
                </TableHead>
                <TableHead>Fixture</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Universe</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFixtures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-400 py-8">
                    {searchQuery || filterUniverse !== "all" || filterGroup !== "all"
                      ? "No fixtures match your filters"
                      : "No fixtures added yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFixtures.map((fixture) => {
                  const isSelected = selectedFixtureIds.includes(fixture.id);
                  const hasError = hasOverlap(fixture.id);

                  return (
                    <TableRow
                      key={fixture.id}
                      className={cn(
                        "cursor-pointer hover:bg-white/5",
                        isSelected && "bg-cyan-500/10",
                        hasError && "bg-red-500/10"
                      )}
                      onClick={() => onFixtureSelect(fixture.id)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onFixtureSelect(fixture.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {hasError && (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="font-medium">{fixture.fixture_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {fixture.fixture_type || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{fixture.universe}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {fixture.start_address}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {fixture.end_address}
                      </TableCell>
                      <TableCell className="text-cyan-400 font-mono text-sm">
                        {fixture.channel_count}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {fixture.mode_name || "-"}
                      </TableCell>
                      <TableCell>
                        {fixture.group_name && (
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: fixture.group_color,
                              color: fixture.group_color,
                            }}
                          >
                            {fixture.group_name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFixtureEdit(fixture);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFixtureDelete(fixture.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
