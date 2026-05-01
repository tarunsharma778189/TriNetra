// BACKUP OF ORIGINAL GOOGLE MAPS IMPLEMENTATION
// To rollback: copy this file content to MapView.tsx
// Also restore index.html Google Maps script tag:
// <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBkAmK6LihzxQgcApeEw4_e2xhnEwNE-pE&libraries=places"></script>

import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MapView = () => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState("Loading...");

  const { data: safeZones } = useQuery({
    queryKey: ['safe-zones', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('safe_zones')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 15,
        center: { lat: 28.6139, lng: 77.2090 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      setMap(newMap);
    }
  }, [map]);

  useEffect(() => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(pos);
          map.setCenter(pos);
          new google.maps.Marker({
            position: pos, map, title: "Your Location",
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/></svg>`),
              scaledSize: new google.maps.Size(24, 24),
            },
          });
          new google.maps.Circle({ strokeColor: '#22c55e', strokeOpacity: 0.8, strokeWeight: 3, fillColor: '#22c55e', fillOpacity: 0.1, map, center: pos, radius: 500 });
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: pos }, (results, status) => {
            if (status === 'OK' && results?.[0]) setCurrentAddress(results[0].formatted_address);
          });
        },
        () => console.error('Error getting location')
      );
    }
  }, [map]);

  useEffect(() => {
    if (map && safeZones) {
      safeZones.forEach((zone) => {
        new google.maps.Circle({ strokeColor: '#10b981', strokeOpacity: 0.8, strokeWeight: 2, fillColor: '#10b981', fillOpacity: 0.15, map, center: { lat: zone.latitude, lng: zone.longitude }, radius: zone.radius_meters });
        new google.maps.Marker({ position: { lat: zone.latitude, lng: zone.longitude }, map, title: zone.name });
      });
    }
  }, [map, safeZones]);

  const centerOnUser = () => { if (userLocation && map) { map.setCenter(userLocation); map.setZoom(16); } };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Live Location Map</h3>
        <Button variant="outline" size="sm" onClick={centerOnUser}><Navigation className="h-4 w-4 mr-2" />Center on Me</Button>
      </div>
      <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute top-4 right-4 bg-card rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-success animate-pulse"></div><span className="text-sm font-medium">Status: Safe</span></div>
          <p className="text-xs text-muted-foreground mt-1">Last updated: Just now</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-success/10 border border-success/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Current Location</p>
          <p className="font-medium text-sm mt-1">{currentAddress === "Loading..." ? <Loader2 className="h-4 w-4 animate-spin" /> : (currentAddress.length > 30 ? currentAddress.substring(0, 30) + "..." : currentAddress)}</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Safe Zones</p>
          <p className="font-medium text-sm mt-1">{safeZones?.length || 0} Active</p>
        </div>
      </div>
    </div>
  );
};

export default MapView;
