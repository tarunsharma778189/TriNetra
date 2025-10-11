import { Plus, MapPin, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AddSafeZoneForm from "@/components/forms/AddSafeZoneForm";
import EditSafeZoneForm from "@/components/forms/EditSafeZoneForm";

const SafeZonePanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: safeZones, isLoading, error: queryError } = useQuery({
    queryKey: ['safe-zones', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('Fetching safe zones for user:', user.id);
      const { data, error } = await supabase
        .from('safe_zones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Safe zones query result:', { data, error });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  console.log('Safe zones data:', safeZones);
  if (queryError) {
    console.error('Safe zones query error:', queryError);
  }

  const deleteZone = useMutation({
    mutationFn: async (zoneId: string) => {
      const { error } = await supabase
        .from('safe_zones')
        .delete()
        .eq('id', zoneId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safe-zones', user?.id] });
      toast.success('Safe zone deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete safe zone: ' + error.message);
    }
  });

  const toggleZoneStatus = useMutation({
    mutationFn: async ({ zoneId, isActive }: { zoneId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('safe_zones')
        .update({ is_active: !isActive })
        .eq('id', zoneId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safe-zones', user?.id] });
      toast.success('Safe zone status updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update safe zone: ' + error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">My Safe Zones</h3>
        <AddSafeZoneForm />
      </div>
      
      <div className="space-y-3">
        {safeZones && safeZones.length > 0 ? safeZones.map((zone) => (
          <div 
            key={zone.id}
            className="bg-muted rounded-lg p-4 border hover:border-primary transition-smooth"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{zone.name}</h4>
                    <button
                      onClick={() => toggleZoneStatus.mutate({ zoneId: zone.id, isActive: zone.is_active })}
                      className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 ${
                        zone.is_active
                          ? "bg-success/10 text-success"
                          : "bg-muted-foreground/10 text-muted-foreground"
                      }`}
                    >
                      {zone.is_active ? "active" : "inactive"}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{zone.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">Radius: {zone.radius_meters}m</p>
                </div>
              </div>
              <div className="flex gap-2">
                <EditSafeZoneForm zone={zone} />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteZone.mutate(zone.id)}
                  disabled={deleteZone.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No safe zones configured yet</p>
            <p className="text-sm">Add safe zones to monitor your location</p>
          </div>
        )}
      </div>
      
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">How Safe Zones Work</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Get alerted when you enter or leave a safe zone</li>
          <li>• Auto-trigger SOS if you leave unexpectedly</li>
          <li>• Set custom radius for each zone (100m - 2km)</li>
        </ul>
      </div>
    </div>
  );
};

export default SafeZonePanel;
