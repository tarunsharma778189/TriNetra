import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useTimerCheckIn = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(120);
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const correctPin = "1234";

  const { data: activeTimer } = useQuery({
    queryKey: ['active-timer', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('timer_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  // Auto-trigger SOS when timer expires
  useEffect(() => {
    if (activeTimer) {
      const expectedTime = new Date(activeTimer.expected_checkin_time);
      const now = new Date();
      const timeUntilExpiry = expectedTime.getTime() - now.getTime();

      if (timeUntilExpiry > 0) {
        // Clear any existing timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        // Set new timer
        timerRef.current = setTimeout(() => {
          // Show PIN alert when timer expires
          setShowAlert(true);
          setAlertCountdown(120);
          
          // Start 2-minute countdown
          alertTimerRef.current = setInterval(() => {
            setAlertCountdown(prev => {
              if (prev <= 1) {
                // Hide PIN alert and show security alert
                setShowAlert(false);
                triggerAutoSOS(activeTimer.id);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }, timeUntilExpiry);
      }
    } else {
      // Clear timer if no active timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (alertTimerRef.current) {
        clearInterval(alertTimerRef.current);
      }
    };
  }, [activeTimer, queryClient]);

  const triggerAutoSOS = async (timerId: string) => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { error } = await supabase.functions.invoke('trigger-sos', {
        body: { 
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          trigger_type: 'timer_expired'
        }
      });

      if (error) throw error;

      await supabase
        .from('timer_checkins')
        .update({ status: 'expired' })
        .eq('id', timerId);

      setShowAlert(false);
      setShowSecurityAlert(true);
      queryClient.invalidateQueries({ queryKey: ['active-timer'] });
      
      if (alertTimerRef.current) {
        clearInterval(alertTimerRef.current);
      }
    } catch (error) {
      console.error('Auto-SOS trigger failed:', error);
      toast.error('Failed to trigger SOS. Please trigger manually.');
    }
  };

  const verifyPin = async () => {
    if (pin === correctPin) {
      if (activeTimer) {
        await supabase
          .from('timer_checkins')
          .update({ 
            status: 'completed',
            checked_in_at: new Date().toISOString()
          })
          .eq('id', activeTimer.id);
        
        queryClient.invalidateQueries({ queryKey: ['active-timer'] });
      }
      
      setShowAlert(false);
      setPin("");
      setAttempts(0);
      if (alertTimerRef.current) {
        clearInterval(alertTimerRef.current);
      }
      
      toast.success('Timer check-in completed successfully!');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin("");
      
      if (newAttempts >= 3) {
        setShowAlert(false);
        if (alertTimerRef.current) {
          clearInterval(alertTimerRef.current);
        }
        triggerAutoSOS(activeTimer?.id || "");
      } else {
        toast.error(`Wrong PIN. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  return { 
    activeTimer, 
    showAlert, 
    alertCountdown, 
    pin, 
    setPin, 
    attempts, 
    verifyPin,
    showSecurityAlert,
    setShowSecurityAlert
  };
};