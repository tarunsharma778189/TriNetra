import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Loader2, MapPin } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SafeZone {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

interface EditSafeZoneFormProps {
  zone: SafeZone;
}

const EditSafeZoneForm = ({ zone }: EditSafeZoneFormProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: zone.name,
    address: zone.address,
    latitude: zone.latitude.toString(),
    longitude: zone.longitude.toString(),
    radius_meters: zone.radius_meters.toString()
  });

  const updateSafeZone = useMutation({
    mutationFn: async (zoneData: typeof formData) => {
      const { error } = await supabase
        .from('safe_zones')
        .update({
          name: zoneData.name,
          address: zoneData.address,
          latitude: parseFloat(zoneData.latitude),
          longitude: parseFloat(zoneData.longitude),
          radius_meters: parseInt(zoneData.radius_meters),
        })
        .eq('id', zone.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safe-zones'] });
      toast.success('Safe zone updated successfully');
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update safe zone: ' + error.message);
    }
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
          toast.success('Current location captured');
        },
        (error) => {
          toast.error('Failed to get current location: ' + error.message);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSafeZone.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Safe Zone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Zone Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Home, Office, etc."
              required
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="28.6139"
                required
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="77.2090"
                required
              />
            </div>
          </div>
          <Button type="button" variant="outline" onClick={getCurrentLocation} className="w-full">
            <MapPin className="h-4 w-4 mr-2" />
            Use Current Location
          </Button>
          <div>
            <Label htmlFor="radius">Radius (meters)</Label>
            <Input
              id="radius"
              type="number"
              value={formData.radius_meters}
              onChange={(e) => setFormData({ ...formData, radius_meters: e.target.value })}
              placeholder="500"
              min="100"
              max="2000"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={updateSafeZone.isPending}>
            {updateSafeZone.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Edit className="h-4 w-4 mr-2" />
            )}
            Update Safe Zone
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSafeZoneForm;