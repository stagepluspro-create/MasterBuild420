"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase-browser"

const supabase = createClient();
import { Search, Lightbulb, Zap, Weight } from "lucide-react";

interface Fixture {
  id: string;
  brand: string;
  model: string;
  type: string;
  use_case: string | null;
  power_w: number | null;
  lumen: number | null;
  cct_native: number | null;
  cri: number | null;
  weight_kg: number | null;
  ip_rating: string | null;
  zoom: boolean;
}

export function FixtureBrowser() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [useCaseFilter, setUseCaseFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);

  useEffect(() => {
    loadFixtures();
  }, []);

  const loadFixtures = async () => {
    try {
      const { data, error } = await supabase
        .from("fixtures")
        .select("*")
        .order("brand")
        .order("model");

      if (error) throw error;
      setFixtures(data || []);
    } catch (error) {
      console.error("Failed to load fixtures:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFixtures = useMemo(() => {
    return fixtures.filter((fixture) => {
      const matchesSearch =
        searchQuery === "" ||
        fixture.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fixture.model.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || fixture.type === typeFilter;
      const matchesUseCase =
        useCaseFilter === "all" || fixture.use_case === useCaseFilter;

      return matchesSearch && matchesType && matchesUseCase;
    });
  }, [fixtures, searchQuery, typeFilter, useCaseFilter]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Loading fixture library...</p>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <Card className="glass-panel border-white/10">
        <CardContent className="py-12 text-center">
          <Lightbulb className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No fixtures in database yet.</p>
          <p className="text-sm text-gray-500">
            Sample fixture data will be available after initial setup.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by brand or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("all")}
          >
            All Types
          </Button>
          <Button
            variant={typeFilter === "LED" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("LED")}
          >
            LED
          </Button>
          <Button
            variant={typeFilter === "discharge" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("discharge")}
          >
            Discharge
          </Button>
          <Button
            variant={typeFilter === "tungsten" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("tungsten")}
          >
            Tungsten
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFixtures.map((fixture) => (
          <Card
            key={fixture.id}
            className="glass-panel border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
            onClick={() => setSelectedFixture(fixture)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{fixture.brand}</CardTitle>
                  <p className="text-gray-400 text-sm">{fixture.model}</p>
                </div>
                <Badge variant="outline">{fixture.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {fixture.use_case && (
                <div className="flex items-center gap-2 text-sm">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300 capitalize">
                    {fixture.use_case.replace("_", " ")}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {fixture.power_w && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">{fixture.power_w}W</span>
                  </div>
                )}
                {fixture.lumen && (
                  <div className="text-gray-300">{fixture.lumen}lm</div>
                )}
                {fixture.cct_native && (
                  <div className="text-gray-300">{fixture.cct_native}K</div>
                )}
                {fixture.cri && (
                  <div className="text-gray-300">CRI {fixture.cri}</div>
                )}
              </div>
              {fixture.zoom && (
                <Badge variant="secondary" className="text-xs">
                  Zoom
                </Badge>
              )}
              {fixture.ip_rating && (
                <Badge variant="secondary" className="text-xs">
                  {fixture.ip_rating}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFixtures.length === 0 && (
        <Card className="glass-panel border-white/10">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">No fixtures match your filters.</p>
          </CardContent>
        </Card>
      )}

      {selectedFixture && (
        <Card className="glass-panel border-cyan-500/30 border-2">
          <CardHeader>
            <CardTitle className="text-2xl">
              {selectedFixture.brand} {selectedFixture.model}
            </CardTitle>
            <div className="flex gap-2">
              <Badge>{selectedFixture.type}</Badge>
              {selectedFixture.use_case && (
                <Badge variant="outline" className="capitalize">
                  {selectedFixture.use_case.replace("_", " ")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Power & Output
                </h3>
                <div className="space-y-2 text-sm">
                  {selectedFixture.power_w && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Power</span>
                      <span className="text-white">{selectedFixture.power_w}W</span>
                    </div>
                  )}
                  {selectedFixture.lumen && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lumen Output</span>
                      <span className="text-white">{selectedFixture.lumen}lm</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Color Quality
                </h3>
                <div className="space-y-2 text-sm">
                  {selectedFixture.cct_native && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">CCT</span>
                      <span className="text-white">{selectedFixture.cct_native}K</span>
                    </div>
                  )}
                  {selectedFixture.cri && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">CRI</span>
                      <span className="text-white">{selectedFixture.cri}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Physical
                </h3>
                <div className="space-y-2 text-sm">
                  {selectedFixture.weight_kg && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weight</span>
                      <span className="text-white">{selectedFixture.weight_kg}kg</span>
                    </div>
                  )}
                  {selectedFixture.ip_rating && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP Rating</span>
                      <span className="text-white">{selectedFixture.ip_rating}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Features
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Zoom</span>
                    <span className="text-white">{selectedFixture.zoom ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={() => setSelectedFixture(null)}>
              Close Details
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
