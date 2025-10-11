import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, MapPin } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AddSafeZoneForm = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius_meters: "500"
  });

  const addSafeZone = useMutation({
    mutationFn: async (zoneData: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('safe_zones')
        .insert({
          user_id: user.id,
          name: zoneData.name,
          address: zoneData.address,
          latitude: parseFloat(zoneData.latitude),
          longitude: parseFloat(zoneData.longitude),
          radius_meters: parseInt(zoneData.radius_meters),
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safe-zones', user.id] });
      toast.success('Safe zone added successfully');
      setOpen(false);
      setFormData({ name: "", address: "", latitude: "", longitude: "", radius_meters: "500" });
    },
    onError: (error: any) => {
      toast.error('Failed to add safe zone: ' + error.message);
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
    addSafeZone.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-hero">
          <Plus className="h-4 w-4 mr-2" />
          Add Zone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Safe Zone</DialogTitle>
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
          <Button type="submit" className="w-full" disabled={addSafeZone.isPending}>
            {addSafeZone.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Safe Zone
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSafeZoneForm;