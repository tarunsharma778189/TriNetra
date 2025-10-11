import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface SOSButtonProps {
  floating?: boolean;
}

const SOSButton = ({ floating = false }: SOSButtonProps) => {
  const [triggering, setTriggering] = useState(false);
  const { user } = useAuth();

  const { data: contactsCount } = useQuery({
    queryKey: ['contacts-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('emergency_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user
  });

  const { data: helpersCount } = useQuery({
    queryKey: ['helpers-count'],
    queryFn: async () => {
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
        return 0;
      }
    },
    enabled: !!user && !floating,
    refetchInterval: 30000
  });

  const handleSOS = async () => {
    if (triggering || !user) return;
    
    setTriggering(true);
    
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Get emergency contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      // Create SOS log
      const { data: sosLog, error } = await supabase
        .from('sos_logs')
        .insert({
          user_id: user.id,
          latitude,
          longitude,
          trigger_type: 'manual',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Make calls to emergency contacts
      if (contacts && contacts.length > 0) {
        contacts.forEach((contact, index) => {
          setTimeout(() => {
            window.open(`tel:${contact.phone}`, '_self');
          }, index * 2000); // 2 second delay between calls
        });
      }

      toast.error("🚨 SOS ALERT TRIGGERED!", {
        description: `Emergency alert sent! Calling ${contacts?.length || 0} contacts. Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        duration: 8000,
      });
    } catch (error: any) {
      console.error('SOS trigger error:', error);
      toast.error("Failed to trigger SOS", {
        description: error.message || "Please try again",
      });
    } finally {
      setTriggering(false);
    }
  };

  if (floating) {
    return (
      <button
        onClick={handleSOS}
        className="fixed bottom-8 right-8 h-20 w-20 rounded-full gradient-danger shadow-sos animate-pulse-sos flex items-center justify-center z-50 hover:scale-110 transition-smooth"
        aria-label="Emergency SOS"
      >
        <AlertCircle className="h-10 w-10 text-white" />
      </button>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-6 animate-fade-in">
      <div className="text-center space-y-4">
        <h3 className="font-bold text-lg">Emergency SOS</h3>
        <p className="text-sm text-muted-foreground">
          Press and hold for 3 seconds to trigger emergency alert
        </p>
        <button
          onClick={handleSOS}
          className="w-full h-32 rounded-2xl gradient-danger shadow-sos flex items-center justify-center hover:scale-105 transition-smooth"
        >
          <div className="text-center text-white">
            <AlertCircle className="h-16 w-16 mx-auto mb-2" />
            <p className="text-xl font-bold">SOS ALERT</p>
          </div>
        </button>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Contacts Alerted</p>
            <p className="text-lg font-bold text-primary">
              {contactsCount !== undefined ? contactsCount : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Helpers Nearby</p>
            <p className="text-lg font-bold text-success">
              {helpersCount !== undefined ? helpersCount : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSButton;
