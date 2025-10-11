import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeofenceCheckRequest {
  latitude: number;
  longitude: number;
}

// Simple distance calculation using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { latitude, longitude }: GeofenceCheckRequest = await req.json();

    console.log('Checking geofence for user:', user.id, 'at location:', latitude, longitude);

    // Get all active safe zones for the user
    const { data: safeZones, error: zonesError } = await supabaseClient
      .from('safe_zones')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (zonesError) {
      console.error('Error fetching safe zones:', zonesError);
      throw zonesError;
    }

    // Check if user is within any safe zone
    let insideSafeZone = false;
    let currentZone = null;

    for (const zone of safeZones || []) {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(zone.latitude),
        parseFloat(zone.longitude)
      );

      console.log(`Distance to ${zone.name}: ${distance}m (radius: ${zone.radius_meters}m)`);

      if (distance <= zone.radius_meters) {
        insideSafeZone = true;
        currentZone = {
          id: zone.id,
          name: zone.name,
          address: zone.address,
          distance_meters: Math.round(distance)
        };
        break;
      }
    }

    // If user is outside all safe zones, this could trigger an auto-SOS
    const result = {
      inside_safe_zone: insideSafeZone,
      current_zone: currentZone,
      total_safe_zones: safeZones?.length || 0,
      location: {
        latitude,
        longitude
      },
      should_trigger_sos: !insideSafeZone && (safeZones?.length || 0) > 0,
      timestamp: new Date().toISOString()
    };

    console.log('Geofence check result:', JSON.stringify(result, null, 2));

    // If user is outside safe zones and has safe zones configured, auto-trigger SOS
    if (result.should_trigger_sos) {
      console.log('User is outside all safe zones - auto-triggering SOS');
      
      // Create auto-triggered SOS log
      const { error: sosError } = await supabaseClient
        .from('sos_logs')
        .insert({
          user_id: user.id,
          latitude,
          longitude,
          trigger_type: 'auto_geofence',
          status: 'active'
        });

      if (sosError) {
        console.error('Error creating auto-SOS log:', sosError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in check-geofence function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});