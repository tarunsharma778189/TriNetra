import { Users, Loader2, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NearbyHelpers = () => {
  const { user } = useAuth();

  const { data: nearbyHelpers, isLoading } = useQuery({
    queryKey: ['nearby-helpers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { data, error } = await supabase.functions.invoke('nearby-helpers', {
          body: { 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude,
            radius_km: 5
          }
        });

        if (error) throw error;
        return data.helpers || [];
      } catch (error) {
        console.error('Error fetching nearby helpers:', error);
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  return (
    <div className="bg-card rounded-xl border p-6 animate-fade-in">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Nearby Helpers
      </h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {nearbyHelpers && nearbyHelpers.length > 0 ? (
            nearbyHelpers.slice(0, 3).map((helper: any, i: number) => (
              <div key={helper.id || i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">
                    {helper.profiles?.full_name || `Helper ${i + 1}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {helper.distance_m ? `${helper.distance_m}m away` : 'Distance unknown'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  helper.is_available 
                    ? "bg-success/10 text-success" 
                    : "bg-warning/10 text-warning"
                }`}>
                  {helper.is_available ? "Available" : "Busy"}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No helpers nearby</p>
              <p className="text-sm">Helpers will appear when they're within 5km</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NearbyHelpers;