import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Users, Heart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const HelperToggle = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('is_helper_available')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const toggleHelper = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      if (!user) throw new Error('User not authenticated');
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_helper_available: isAvailable })
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      if (isAvailable) {
        // Get current location and add to helpers table
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        // First delete any existing helper record
        await supabase
          .from('helpers')
          .delete()
          .eq('user_id', user.id);

        // Then insert new helper record
        const { error: helperError } = await supabase
          .from('helpers')
          .insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            is_available: true,
            last_location_update: new Date().toISOString()
          });

        if (helperError) throw helperError;
      } else {
        // Remove from helpers table
        const { error: helperError } = await supabase
          .from('helpers')
          .delete()
          .eq('user_id', user.id);

        if (helperError) throw helperError;
      }
    },
    onSuccess: (isAvailable) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(isAvailable ? 'You are now available to help others!' : 'Helper mode disabled');
    },
    onError: (error: any) => {
      console.error('Helper toggle error:', error);
      toast.error('Failed to update helper status: ' + error.message);
    }
  });

  const handleToggle = (checked: boolean) => {
    console.log('Toggle clicked:', checked);
    toggleHelper.mutate(checked);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Label htmlFor="helper-toggle" className="font-semibold">
              Be a Helper
            </Label>
            <p className="text-sm text-muted-foreground">
              Help others in emergencies nearby
            </p>
          </div>
        </div>
        <Switch
          id="helper-toggle"
          checked={profile?.is_helper_available || false}
          onCheckedChange={handleToggle}
          disabled={toggleHelper.isPending}
        />
      </div>
    </Card>
  );
};

export default HelperToggle;