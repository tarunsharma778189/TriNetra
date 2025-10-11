import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NearbyHelpersRequest {
  latitude: number;
  longitude: number;
  radius_km?: number;
}

// Simple distance calculation using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
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

    // Verify user is authenticated
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

    const { latitude, longitude, radius_km = 5 }: NearbyHelpersRequest = await req.json();

    console.log('Finding helpers near:', latitude, longitude, 'within', radius_km, 'km');

    // Get all available helpers
    const { data: helpers, error: helpersError } = await supabaseClient
      .from('helpers')
      .select('*, profiles!helpers_user_id_fkey(full_name, phone, avatar_url)')
      .eq('is_available', true);

    if (helpersError) {
      console.error('Error fetching helpers:', helpersError);
      throw helpersError;
    }

    // Filter helpers by distance
    const nearbyHelpers = helpers
      ?.map((helper) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(helper.latitude),
          parseFloat(helper.longitude)
        );
        return {
          ...helper,
          distance_km: parseFloat(distance.toFixed(2)),
          distance_m: Math.round(distance * 1000)
        };
      })
      .filter((helper) => helper.distance_km <= radius_km)
      .sort((a, b) => a.distance_km - b.distance_km) || [];

    console.log(`Found ${nearbyHelpers.length} helpers within ${radius_km}km`);

    return new Response(
      JSON.stringify({
        success: true,
        count: nearbyHelpers.length,
        helpers: nearbyHelpers,
        search_params: {
          latitude,
          longitude,
          radius_km
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in nearby-helpers function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});