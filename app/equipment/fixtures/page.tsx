'use client';

import { useState, useEffect } from 'react';
import { EquipmentService, Fixture } from '@/lib/equipment-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FixturesBrowserPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  useEffect(() => {
    setManufacturers(EquipmentService.getManufacturers('fixtures'));
    setTypes(EquipmentService.getTypes('fixtures'));
    loadFixtures();
  }, []);

  useEffect(() => {
    loadFixtures();
  }, [searchQuery, selectedManufacturer, selectedType]);

  const loadFixtures = () => {
    const results = EquipmentService.searchEquipment('fixtures', {
      query: searchQuery,
      manufacturer: selectedManufacturer || undefined,
      type: selectedType || undefined,
    });
    setFixtures(results as Fixture[]);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedManufacturer('');
    setSelectedType('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00E8FF] via-[#9B5CFF] to-[#FF008C] bg-clip-text text-transparent mb-2">
          Fixture Browser
        </h1>
        <p className="text-white/60">Browse {fixtures.length} lighting fixtures</p>
      </div>

      <Card className="mb-6 bg-gradient-to-br from-[#0B0C1A]/80 to-[#121227]/80 backdrop-blur-xl border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search by manufacturer, model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </div>
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturers.map((mfr) => (
                  <SelectItem key={mfr} value={mfr}>
                    {mfr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters} className="border-white/10">
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fixtures.map((fixture) => (
          <Link key={fixture.id} href={`/equipment/fixtures/${fixture.id}`}>
            <Card className="h-full bg-gradient-to-br from-[#0B0C1A]/80 to-[#121227]/80 backdrop-blur-xl border-white/10 hover:border-[#00E8FF]/30 transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg text-[#00E8FF]">
                  {fixture.manufacturer}
                </CardTitle>
                <p className="text-white font-medium">{fixture.model}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Type</span>
                  <Badge variant="secondary">{fixture.type}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Light Source</span>
                  <span className="text-white">{fixture.light_source}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">DMX Channels</span>
                  <span className="text-white">{fixture.dmx_channels}</span>
                </div>
                {fixture.applications && fixture.applications.length > 0 && (
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-1">
                      {fixture.applications.slice(0, 3).map((app, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs border-[#9B5CFF]/30"
                        >
                          {app}
                        </Badge>
                      ))}
                      {fixture.applications.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{fixture.applications.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {fixtures.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/60">No fixtures found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
