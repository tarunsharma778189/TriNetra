import { Shield, MapPin, Users, Award, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const QuickStats = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: nearbyHelpers } = useQuery({
    queryKey: ['nearby-helpers-count'],
    queryFn: async () => {
      // Get current location and find nearby helpers
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
        return data.count || 0;
      } catch (error) {
        console.error('Error fetching nearby helpers:', error);
        return 0;
      }
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: currentZone } = useQuery({
    queryKey: ['current-zone'],
    queryFn: async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { data, error } = await supabase.functions.invoke('check-geofence', {
          body: { 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
          }
        });

        if (error) throw error;
        return data.data.current_zone?.name || 'Outside Safe Zones';
      } catch (error) {
        console.error('Error checking geofence:', error);
        return 'Unknown';
      }
    },
    enabled: !!user,
    refetchInterval: 60000 // Refresh every minute
  });

  const stats = [
    {
      icon: Shield,
      label: "Safety Status",
      value: currentZone === 'Outside Safe Zones' ? "Alert" : "Secure",
      color: currentZone === 'Outside Safe Zones' ? "text-warning" : "text-success",
      bg: currentZone === 'Outside Safe Zones' ? "bg-warning/10" : "bg-success/10"
    },
    {
      icon: MapPin,
      label: "Current Zone",
      value: currentZone || "Loading...",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: Users,
      label: "Helpers Nearby",
      value: nearbyHelpers?.toString() || "0",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: Award,
      label: "Reward Points",
      value: profile?.reward_points?.toString() || "0",
      color: "text-warning",
      bg: "bg-warning/10"
    }
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {stats.map((stat, index) => (
        <Card 
          key={index}
          className="p-4 hover:shadow-lg transition-smooth"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>
                {stat.value === "Loading..." ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  stat.value
                )}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;
