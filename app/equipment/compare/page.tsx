'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EquipmentService, Equipment, EquipmentType } from '@/lib/equipment-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CompareEquipmentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('microphones');

  useEffect(() => {
    const type = searchParams.get('type') as EquipmentType;
    const ids = searchParams.get('ids')?.split(',') || [];

    if (type && ids.length > 0) {
      setEquipmentType(type);
      const items = EquipmentService.compareEquipment(type, ids);
      setEquipment(items);
    }
  }, [searchParams]);

  const removeItem = (id: string) => {
    const remainingIds = equipment
      .filter((item) => item.id !== id)
      .map((item) => item.id);

    if (remainingIds.length === 0) {
      router.back();
    } else {
      router.push(
        `/equipment/compare?type=${equipmentType}&ids=${remainingIds.join(',')}`
      );
    }
  };

  if (equipment.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No equipment to compare</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const getComparisonFields = (type: EquipmentType) => {
    switch (type) {
      case 'microphones':
        return [
          { key: 'type', label: 'Type' },
          { key: 'pattern', label: 'Pattern' },
          { key: 'frequency_response', label: 'Frequency Response' },
          { key: 'impedance', label: 'Impedance' },
          { key: 'sensitivity', label: 'Sensitivity' },
          { key: 'max_spl', label: 'Max SPL' },
          { key: 'phantom_power', label: 'Phantom Power' },
          { key: 'connector', label: 'Connector' },
        ];
      case 'speakers':
        return [
          { key: 'type', label: 'Type' },
          { key: 'wattage', label: 'Wattage' },
          { key: 'impedance', label: 'Impedance' },
          { key: 'frequency_range', label: 'Frequency Range' },
          { key: 'spl', label: 'SPL' },
          { key: 'coverage', label: 'Coverage' },
          { key: 'weight', label: 'Weight' },
          { key: 'dimensions', label: 'Dimensions' },
        ];
      case 'consoles':
        return [
          { key: 'type', label: 'Type' },
          { key: 'channels', label: 'Channels' },
          { key: 'faders', label: 'Faders' },
          { key: 'bus_count', label: 'Bus Count' },
          { key: 'effects', label: 'Effects' },
          { key: 'weight', label: 'Weight' },
          { key: 'dimensions', label: 'Dimensions' },
        ];
      case 'fixtures':
        return [
          { key: 'type', label: 'Type' },
          { key: 'wattage', label: 'Wattage' },
          { key: 'light_source', label: 'Light Source' },
          { key: 'color_temp', label: 'Color Temperature' },
          { key: 'beam_angle', label: 'Beam Angle' },
          { key: 'dmx_channels', label: 'DMX Channels' },
          { key: 'weight', label: 'Weight' },
          { key: 'dimensions', label: 'Dimensions' },
        ];
      default:
        return [];
    }
  };

  const fields = getComparisonFields(equipmentType);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00E8FF] via-[#9B5CFF] to-[#FF008C] bg-clip-text text-transparent">
          Compare {equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)}
        </h1>
        <p className="text-white/60 mt-2">
          Comparing {equipment.length} item{equipment.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${equipment.length}, minmax(300px, 1fr))` }}>
            {equipment.map((item) => (
              <Card
                key={item.id}
                className="bg-gradient-to-br from-[#0B0C1A]/80 to-[#121227]/80 backdrop-blur-xl border-white/10"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg bg-gradient-to-r from-[#00E8FF] to-[#9B5CFF] bg-clip-text text-transparent">
                        {item.manufacturer}
                      </CardTitle>
                      <p className="text-white font-medium mt-1">{item.model}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-white/60 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.key}>
                      <p className="text-white/60 text-sm">{field.label}</p>
                      <p className="text-white font-medium">
                        {(item as any)[field.key] || 'N/A'}
                      </p>
                    </div>
                  ))}
                  <div>
                    <p className="text-white/60 text-sm mb-2">Applications</p>
                    <div className="flex flex-wrap gap-1">
                      {item.applications?.map((app, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-gradient-to-r from-[#00E8FF]/10 to-[#9B5CFF]/10 border-[#00E8FF]/20"
                        >
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
