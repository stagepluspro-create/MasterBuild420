'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EquipmentService, Console } from '@/lib/equipment-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function ConsoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [console, setConsole] = useState<Console | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConsole = async () => {
      const id = params.id as string;
      const data = EquipmentService.getEquipmentById('consoles', id);
      setConsole(data as Console);

      if (user && data) {
        const favorited = await EquipmentService.isFavorited(
          user.id,
          'consoles',
          id
        );
        setIsFavorited(favorited);
      }

      setLoading(false);
    };

    loadConsole();
  }, [params.id, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    const id = params.id as string;

    if (isFavorited) {
      const result = await EquipmentService.removeFromFavorites(
        user.id,
        'consoles',
        id
      );
      if (result.success) {
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        toast.error('Failed to remove favorite');
      }
    } else {
      const result = await EquipmentService.addToFavorites(
        user.id,
        'consoles',
        id
      );
      if (result.success) {
        setIsFavorited(true);
        toast.success('Added to favorites');
      } else {
        toast.error('Failed to add favorite');
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${console?.manufacturer} ${console?.model}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!console) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Console not found</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-[#0B0C1A]/80 to-[#121227]/80 backdrop-blur-xl border-white/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl bg-gradient-to-r from-[#00E8FF] via-[#9B5CFF] to-[#FF008C] bg-clip-text text-transparent">
                    {console.manufacturer} {console.model}
                  </CardTitle>
                  <p className="text-white/60 mt-2">{console.type}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleFavorite}
                    className={isFavorited ? 'text-[#FF008C]' : ''}
                  >
                    <Heart
                      className="h-5 w-5"
                      fill={isFavorited ? 'currentColor' : 'none'}
                    />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-white/60 text-sm">Channels</p>
                  <p className="text-white font-medium">{console.channels}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Faders</p>
                  <p className="text-white font-medium">{console.faders}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Bus Count</p>
                  <p className="text-white font-medium">{console.bus_count}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Effects</p>
                  <p className="text-white font-medium">{console.effects}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Weight</p>
                  <p className="text-white font-medium">{console.weight}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Dimensions</p>
                  <p className="text-white font-medium">{console.dimensions}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-white/60 text-sm mb-2">Connectivity</p>
                <div className="flex flex-wrap gap-2">
                  {console.connectivity.map((conn, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-[#00E8FF]/30"
                    >
                      {conn}
                    </Badge>
                  ))}
                </div>
              </div>

              {console.notes && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-white/60 text-sm mb-2">Notes</p>
                  <p className="text-white">{console.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-[#0B0C1A]/80 to-[#121227]/80 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {console.applications.map((app, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gradient-to-r from-[#00E8FF]/10 to-[#9B5CFF]/10 border-[#00E8FF]/20"
                  >
                    {app}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
