import { supabase } from "@/integrations/supabase/client";

export class LocationService {
  private watchId: number | null = null;
  private lastKnownPosition: GeolocationPosition | null = null;

  async startLocationTracking(userId: string) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    // Request permission first
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    if (permission.state === 'denied') {
      throw new Error('Geolocation permission denied');
    }

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.lastKnownPosition = position;
        this.handleLocationUpdate(userId, position);
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );
  }

  stopLocationTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private async handleLocationUpdate(userId: string, position: GeolocationPosition) {
    const { latitude, longitude } = position.coords;

    try {
      // Update helper location if user is available as helper
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_helper_available')
        .eq('id', userId)
        .single();

      if (profile?.is_helper_available) {
        await supabase
          .from('helpers')
          .upsert({
            user_id: userId,
            latitude,
            longitude,
            is_available: true,
            last_location_update: new Date().toISOString()
          });
      }

      // Check geofence
      await this.checkGeofence(latitude, longitude);
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  private async checkGeofence(latitude: number, longitude: number) {
    try {
      const { data, error } = await supabase.functions.invoke('check-geofence', {
        body: { latitude, longitude }
      });

      if (error) throw error;

      // The geofence function will automatically trigger SOS if needed
      return data.data;
    } catch (error) {
      console.error('Geofence check error:', error);
      return null;
    }
  }

  async getCurrentLocation(): Promise<GeolocationPosition> {
    if (this.lastKnownPosition) {
      return this.lastKnownPosition;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  }
}

export const locationService = new LocationService();