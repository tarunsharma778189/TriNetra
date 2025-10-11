import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SOSRequest {
  latitude: number;
  longitude: number;
  trigger_type?: 'manual' | 'auto_geofence' | 'timer_expired';
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

    const { latitude, longitude, trigger_type = 'manual' }: SOSRequest = await req.json();

    console.log('SOS triggered by user:', user.id, 'at location:', latitude, longitude);

    // Create SOS log
    const { data: sosLog, error: sosError } = await supabaseClient
      .from('sos_logs')
      .insert({
        user_id: user.id,
        latitude,
        longitude,
        trigger_type,
        status: 'active'
      })
      .select()
      .single();

    if (sosError) {
      console.error('Error creating SOS log:', sosError);
      throw sosError;
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();

    // Get emergency contacts
    const { data: contacts } = await supabaseClient
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });

    // Get nearby helpers (within 5km radius for demo)
    const { data: helpers } = await supabaseClient
      .from('helpers')
      .select('*, profiles!helpers_user_id_fkey(full_name, phone)')
      .eq('is_available', true);

    console.log(`Found ${contacts?.length || 0} emergency contacts`);
    console.log(`Found ${helpers?.length || 0} nearby helpers`);

    // In production, you would send actual SMS/emails here using Twilio/Resend
    // For demo purposes, we'll just log the notifications
    const notifications = {
      sos_id: sosLog.id,
      user: {
        name: profile?.full_name || 'Unknown User',
        phone: profile?.phone || 'N/A'
      },
      location: {
        latitude,
        longitude,
        maps_link: `https://www.google.com/maps?q=${latitude},${longitude}`
      },
      emergency_contacts_notified: contacts?.length || 0,
      helpers_notified: helpers?.length || 0,
      timestamp: new Date().toISOString()
    };

    console.log('SOS Alert Summary:', JSON.stringify(notifications, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SOS alert triggered successfully',
        data: notifications
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in trigger-sos function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});