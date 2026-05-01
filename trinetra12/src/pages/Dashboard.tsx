import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Shield, MapPin, Users, Clock, Phone, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SOSButton from "@/components/dashboard/SOSButton";
import MapView from "@/components/dashboard/MapView";
import SafeZonePanel from "@/components/dashboard/SafeZonePanel";
import EmergencyContacts from "@/components/dashboard/EmergencyContacts";
import TimerCheckIn from "@/components/dashboard/TimerCheckIn";
import QuickStats from "@/components/dashboard/QuickStats";
import NearbyHelpers from "@/components/dashboard/NearbyHelpers";
import HelperToggle from "@/components/dashboard/HelperToggle";
import { locationService } from "@/services/locationService";
import { useTimerCheckIn } from "@/hooks/useTimerCheckIn";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"map" | "contacts" | "timer" | "zones">("map");
  const { user, signOut } = useAuth();
  
  // Initialize timer check-in monitoring
  const { showAlert, alertCountdown, pin, setPin, attempts, verifyPin, showSecurityAlert, setShowSecurityAlert } = useTimerCheckIn();

  // Start location tracking when user is authenticated
  useEffect(() => {
    if (user) {
      locationService.startLocationTracking(user.id).catch(error => {
        console.error('Failed to start location tracking:', error);
      });

      // Listen for geofence exit event
      const handleGeofenceExit = () => {
        toast.warning('⚠️ Safe Zone Alert', {
          description: 'You have left your safe zone!',
          duration: 8000,
        });
      };
      window.addEventListener('geofence-exit', handleGeofenceExit);
      return () => {
        locationService.stopLocationTracking();
        window.removeEventListener('geofence-exit', handleGeofenceExit);
      };
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="bg-card border-b sticky top-0 z-40">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://i.postimg.cc/W4z7VwzW/Gemini-Generated-Image-hczaojhczaojhcza-1.png" alt="TriNetra Logo" className="h-20 w-20" />
            <span className="text-xl font-bold">TriNetra</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">TriNetra Dashboard</h1>
          <p className="text-muted-foreground">Manage your safety settings and monitor your protection status</p>
        </div>

        <QuickStats />

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border overflow-hidden animate-fade-in">
              <div className="border-b bg-muted/30">
                <div className="flex items-center gap-2 p-4">
                  <button
                    onClick={() => setActiveTab("map")}
                    className={`px-4 py-2 rounded-lg transition-smooth ${
                      activeTab === "map"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Map View
                  </button>
                  <button
                    onClick={() => setActiveTab("zones")}
                    className={`px-4 py-2 rounded-lg transition-smooth ${
                      activeTab === "zones"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Shield className="h-4 w-4 inline mr-2" />
                    Safe Zones
                  </button>
                  <button
                    onClick={() => setActiveTab("contacts")}
                    className={`px-4 py-2 rounded-lg transition-smooth ${
                      activeTab === "contacts"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Phone className="h-4 w-4 inline mr-2" />
                    Contacts
                  </button>
                  <button
                    onClick={() => setActiveTab("timer")}
                    className={`px-4 py-2 rounded-lg transition-smooth ${
                      activeTab === "timer"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Clock className="h-4 w-4 inline mr-2" />
                    Timer
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === "map" && <MapView />}
                {activeTab === "zones" && <SafeZonePanel />}
                {activeTab === "contacts" && <EmergencyContacts />}
                {activeTab === "timer" && <TimerCheckIn />}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <SOSButton />
            
            <HelperToggle />
            
            <NearbyHelpers />
          </div>
        </div>
      </main>

      <SOSButton floating />
      
      {/* Timer Expiry PIN Alert */}
      <AlertDialog open={showAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              ⏰ Timer Expired!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Enter your 4-digit PIN to confirm you are safe.
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {Math.floor(alertCountdown / 60)}:{String(alertCountdown % 60).padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  SOS will be triggered automatically if PIN not entered
                </p>
              </div>
              <div className="mt-4">
                <Input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 4))}
                  maxLength={4}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
                {attempts > 0 && (
                  <p className="text-sm text-destructive mt-2">
                    {attempts}/3 failed attempts
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              onClick={verifyPin} 
              className="w-full gradient-hero"
              disabled={pin.length !== 4}
            >
              Verify PIN
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Security Alert */}
      <AlertDialog open={showSecurityAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              🚨 Security Alert Activated
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                <p className="font-semibold text-destructive">
                  Emergency Response Triggered
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your emergency contacts have been notified and authorities may be dispatched to your location.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              onClick={() => setShowSecurityAlert(false)} 
              className="w-full"
              variant="outline"
            >
              Acknowledge
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
