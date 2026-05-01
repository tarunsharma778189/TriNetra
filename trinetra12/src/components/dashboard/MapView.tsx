import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DELHI = { lat: 28.6139, lng: 77.209 };

const MapView = () => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState("Fetching location...");

  const { data: safeZones } = useQuery({
    queryKey: ["safe-zones", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("safe_zones")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [DELHI.lat, DELHI.lng],
      13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(pos);
          map.setView([pos.lat, pos.lng], 15);

          // User location marker
          const userIcon = L.divIcon({
            html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>`,
            className: "",
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([pos.lat, pos.lng], { icon: userIcon })
            .addTo(map)
            .bindPopup("Your Location")
            .openPopup();

          // Geofence circle
          L.circle([pos.lat, pos.lng], {
            radius: 500,
            color: "#22c55e",
            fillColor: "#22c55e",
            fillOpacity: 0.1,
            weight: 2,
          }).addTo(map);

          // Reverse geocode via Nominatim
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`
          )
            .then((r) => r.json())
            .then((d) => setCurrentAddress(d.display_name || "Unknown location"))
            .catch(() => setCurrentAddress("Location found"));
        },
        () => setCurrentAddress("Location access denied")
      );
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Add safe zone markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !safeZones) return;

    safeZones.forEach((zone) => {
      L.circle([zone.latitude, zone.longitude], {
        radius: zone.radius_meters,
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.15,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(zone.name);

      const zoneIcon = L.divIcon({
        html: `<div style="width:12px;height:12px;background:#10b981;border:2px solid white;border-radius:50%"></div>`,
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      L.marker([zone.latitude, zone.longitude], { icon: zoneIcon })
        .addTo(map)
        .bindPopup(zone.name);
    });
  }, [safeZones]);

  const centerOnUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Live Location Map
        </h3>
        <Button variant="outline" size="sm" onClick={centerOnUser}>
          <Navigation className="h-4 w-4 mr-2" />
          Center on Me
        </Button>
      </div>

      <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute top-4 right-4 z-[1000] bg-card rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium">Status: Safe</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Last updated: Just now</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-success/10 border border-success/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Current Location</p>
          <p className="font-medium text-sm mt-1">
            {currentAddress.length > 40
              ? currentAddress.substring(0, 40) + "..."
              : currentAddress}
          </p>
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
