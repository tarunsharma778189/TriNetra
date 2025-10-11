import { Clock, Play, Square, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TimerCheckIn = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [displayTime, setDisplayTime] = useState({ minutes: 30, seconds: 0 });
  const [customTime, setCustomTime] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

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

  const startTimer = useMutation({
    mutationFn: async (durationMinutes: number) => {
      if (!user) throw new Error('User not authenticated');
      
      const startTime = new Date();
      const expectedCheckinTime = new Date(startTime.getTime() + durationMinutes * 60000);
      
      const { error } = await supabase
        .from('timer_checkins')
        .insert({
          user_id: user.id,
          duration_minutes: durationMinutes,
          start_time: startTime.toISOString(),
          expected_checkin_time: expectedCheckinTime.toISOString(),
          status: 'active'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timer'] });
      setIsActive(true);
      toast.success('Safety timer started');
    },
    onError: (error: any) => {
      toast.error('Failed to start timer: ' + error.message);
    }
  });

  const stopTimer = useMutation({
    mutationFn: async () => {
      if (!activeTimer) throw new Error('No active timer found');
      
      const { error } = await supabase
        .from('timer_checkins')
        .update({ 
          status: 'completed',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', activeTimer.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timer'] });
      setIsActive(false);
      toast.success('Timer completed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to stop timer: ' + error.message);
    }
  });

  // Update timer display based on active timer
  useEffect(() => {
    if (activeTimer) {
      setIsActive(true);
    } else {
      setIsActive(false);
      setTimeRemaining(selectedDuration);
      setDisplayTime({ minutes: selectedDuration, seconds: 0 });
    }
  }, [activeTimer, selectedDuration]);

  // Real-time countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && activeTimer) {
      interval = setInterval(() => {
        const expectedTime = new Date(activeTimer.expected_checkin_time);
        const now = new Date();
        const remainingMs = Math.max(0, expectedTime.getTime() - now.getTime());
        
        const totalSeconds = Math.floor(remainingMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        setDisplayTime({ minutes, seconds });
        setTimeRemaining(minutes);
        
        // Auto-trigger SOS when timer expires
        if (remainingMs <= 0) {
          clearInterval(interval);
          // Timer expired - this will be handled by useTimerCheckIn hook
        }
      }, 1000);
    } else if (!isActive) {
      setDisplayTime({ minutes: selectedDuration, seconds: 0 });
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, activeTimer, selectedDuration]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Safety Timer
        </h3>
      </div>
      
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
        <div className="text-center space-y-4">
          <div className="text-6xl font-bold text-primary">
            {String(displayTime.minutes).padStart(2, '0')}:{String(displayTime.seconds).padStart(2, '0')}
          </div>
          <p className="text-sm text-muted-foreground">
            {isActive ? "Check-in required in" : "Set timer for your journey"}
          </p>
          
          <div className="flex gap-3">
            {!isActive ? (
              <Button 
                onClick={() => startTimer.mutate(selectedDuration)}
                className="flex-1 gradient-hero"
                size="lg"
                disabled={startTimer.isPending}
              >
                {startTimer.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Timer
              </Button>
            ) : (
              <Button 
                onClick={() => stopTimer.mutate()}
                variant="outline"
                className="flex-1"
                size="lg"
                disabled={stopTimer.isPending}
              >
                {stopTimer.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Check In
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {!isActive && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSelectedDuration(mins);
                  setTimeRemaining(mins);
                  setDisplayTime({ minutes: mins, seconds: 0 });
                  setShowCustomInput(false);
                }}
                className={`p-3 rounded-lg border transition-smooth ${
                  selectedDuration === mins && !showCustomInput
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted hover:border-primary"
                }`}
              >
                <p className="text-lg font-bold">{mins}</p>
                <p className="text-xs">mins</p>
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`p-3 rounded-lg border transition-smooth ${
                showCustomInput
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted hover:border-primary"
              }`}
            >
              <p className="text-lg font-bold">⚙️</p>
              <p className="text-xs">Custom</p>
            </button>
          </div>
          
          {showCustomInput && (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Custom Timer (minutes)</label>
                  <Input
                    type="number"
                    placeholder="Enter minutes (1-120)"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    min="1"
                    max="120"
                    className="text-center"
                  />
                </div>
                <Button
                  onClick={() => {
                    const minutes = parseInt(customTime);
                    if (minutes >= 1 && minutes <= 120) {
                      setSelectedDuration(minutes);
                      setTimeRemaining(minutes);
                      setDisplayTime({ minutes, seconds: 0 });
                    }
                  }}
                  disabled={!customTime || parseInt(customTime) < 1 || parseInt(customTime) > 120}
                  size="sm"
                >
                  Set
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Enter a custom time between 1-120 minutes
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">How Timer Check-In Works</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Set timer before starting your journey</li>
              <li>• Check-in using PIN or Face ID before timer ends</li>
              <li>• Auto SOS triggered if you miss check-in</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerCheckIn;
