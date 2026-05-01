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
      await this.checkGeofence(userId, latitude, longitude);
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  private lastGeofenceStatus: boolean | null = null;

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async checkGeofence(userId: string, latitude: number, longitude: number) {
    try {
      const { data: safeZones, error } = await supabase
        .from('safe_zones')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error || !safeZones || safeZones.length === 0) return;

      const insideSafeZone = safeZones.some((zone) =>
        this.calculateDistance(latitude, longitude, parseFloat(zone.latitude), parseFloat(zone.longitude)) <= zone.radius_meters
      );

      // Only alert when transitioning from inside -> outside
      if (this.lastGeofenceStatus === true && !insideSafeZone) {
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('⚠️ Safe Zone Alert', {
            body: 'You have left your safe zone!',
            icon: '/favicon.ico'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification('⚠️ Safe Zone Alert', {
                body: 'You have left your safe zone!',
                icon: '/favicon.ico'
              });
            }
          });
        }

        // Toast via custom event (picked up in Dashboard)
        window.dispatchEvent(new CustomEvent('geofence-exit'));
      }

      this.lastGeofenceStatus = insideSafeZone;
    } catch (error) {
      console.error('Geofence check error:', error);
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