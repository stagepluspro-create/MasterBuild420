'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { EquipmentService, Speaker } from '@/lib/equipment-service';
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

export default function SpeakersBrowserPage() {
  const { user } = useAuth();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setManufacturers(EquipmentService.getManufacturers('speakers'));
      setTypes(EquipmentService.getTypes('speakers'));
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load equipment metadata:', err);
      setError(err.message || 'Failed to load equipment data');
      setLoading(false);
    }
  }, []);

  const loadSpeakers = useCallback(() => {
    try {
      const results = EquipmentService.searchEquipment('speakers', {
        query: searchQuery,
        manufacturer: selectedManufacturer || undefined,
        type: selectedType || undefined,
      });
      setSpeakers(results as Speaker[]);
      setError(null);
    } catch (err: any) {
      console.error('Failed to search speakers:', err);
      setError(err.message || 'Failed to search equipment');
      setSpeakers([]);
    }
  }, [searchQuery, selectedManufacturer, selectedType]);

  useEffect(() => {
    loadSpeakers();
  }, [loadSpeakers]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedManufacturer('');
    setSelectedType('');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E8FF] mx-auto mb-4"></div>
            <p className="text-white/60">Loading speakers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#00E8FF] hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00E8FF] via-[#9B5CFF] to-[#FF008C] bg-clip-text text-transparent mb-2">
          Speaker Browser
        </h1>
        <p className="text-white/60">Browse {speakers.length} professional speakers</p>
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
        {speakers.map((speaker) => (
          <Link key={speaker.id} href={`/equipment/speakers/${speaker.id}`}>
            <Card className="h-full bg-gradient-to-br from-[#0B0C1A]/80 to-[#121227]/80 backdrop-blur-xl border-white/10 hover:border-[#00E8FF]/30 transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg text-[#00E8FF]">
                  {speaker.manufacturer}
                </CardTitle>
                <p className="text-white font-medium">{speaker.model}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Type</span>
                  <Badge variant="secondary">{speaker.type}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Wattage</span>
                  <span className="text-white">{speaker.wattage}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">SPL</span>
                  <span className="text-white">{speaker.spl}</span>
                </div>
                {speaker.applications && speaker.applications.length > 0 && (
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-1">
                      {speaker.applications.slice(0, 3).map((app, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs border-[#9B5CFF]/30"
                        >
                          {app}
                        </Badge>
                      ))}
                      {speaker.applications.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{speaker.applications.length - 3}
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

      {speakers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/60">No speakers found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
