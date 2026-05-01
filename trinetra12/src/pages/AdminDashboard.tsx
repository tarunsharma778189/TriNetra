import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Shield, Users, AlertCircle, LogOut, X, MapPin, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState } from "react";

const ADMIN_EMAIL = "ts7621085@gmail.com";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();

  // Admin check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20">
        <Card className="p-8 text-center space-y-4">
          <Shield className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Not Logged In</h2>
          <p className="text-muted-foreground">Please login to access this page.</p>
          <Link to="/auth">
            <Button className="w-full gradient-hero">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20">
        <Card className="p-8 text-center space-y-4">
          <Shield className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
          <Link to="/dashboard">
            <Button variant="outline" className="w-full">Go to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return <AdminContent onSignOut={signOut} />;
};

const AdminContent = ({ onSignOut }: { onSignOut: () => void }) => {
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: sosLogs, isLoading: loadingSos } = useQuery({
    queryKey: ["admin-sos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sos_logs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateLog = useMutation({
    mutationFn: async ({ id, is_resolved, admin_remark }: { id: string; is_resolved?: boolean; admin_remark?: string }) => {
      const updates: any = {};
      if (is_resolved !== undefined) updates.is_resolved = is_resolved;
      if (admin_remark !== undefined) updates.admin_remark = admin_remark;
      const { error } = await supabase.from("sos_logs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-sos"] }),
  });

  const statusColor = (status: string) => {
    if (status === "active") return "bg-destructive/10 text-destructive border border-destructive/20";
    if (status === "resolved") return "bg-success/10 text-green-700 border border-success/20";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://i.postimg.cc/W4z7VwzW/Gemini-Generated-Image-hczaojhczaojhcza-1.png" alt="TriNetra Logo" className="h-10 w-10" />
            <span className="text-xl font-bold">TriNetra</span>
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Admin</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onSignOut} title="Sign Out">
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor users and SOS activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{profiles?.length || 0}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total SOS Alerts</p>
              <p className="text-2xl font-bold">{sosLogs?.length || 0}</p>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Registered Users</h2>
          </div>
          {loadingProfiles ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : profiles?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">#</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Phone</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Helper</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles?.map((profile, index) => (
                    <tr key={profile.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 text-muted-foreground">{index + 1}</td>
                      <td className="py-3 px-2 font-medium">{profile.full_name}</td>
                      <td className="py-3 px-2">{profile.phone || "—"}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${profile.is_helper_available ? "bg-success/10 text-green-700 border border-success/20" : "bg-muted text-muted-foreground"}`}>
                          {profile.is_helper_available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(profile.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* SOS Logs Table */}
        <Card className="p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-bold">SOS Logs</h2>
          </div>
          {loadingSos ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : sosLogs?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No SOS logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">#</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">User ID</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Location</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Trigger</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Resolved</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Remark</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Time</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {sosLogs?.map((log, index) => (
                    <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 text-muted-foreground">{index + 1}</td>
                      <td className="py-3 px-2 font-mono text-xs">{log.user_id.slice(0, 8)}...</td>
                      <td className="py-3 px-2 text-xs max-w-[150px] truncate" title={log.location_address || ""}>
                        {log.location_address ? log.location_address.substring(0, 30) + "..." : `${log.latitude}, ${log.longitude}`}
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {log.trigger_type}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={log.is_resolved || false}
                          onChange={(e) => updateLog.mutate({ id: log.id, is_resolved: e.target.checked })}
                          className="h-4 w-4 cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Input
                            placeholder="Add remark..."
                            defaultValue={log.admin_remark || ""}
                            onChange={(e) => setRemarks((prev) => ({ ...prev, [log.id]: e.target.value }))}
                            className="h-7 text-xs w-32"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2"
                            onClick={() => updateLog.mutate({ id: log.id, admin_remark: remarks[log.id] ?? log.admin_remark })}
                          >
                            Save
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedLog(log)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                SOS Log Details
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">User ID</p>
                  <p className="font-mono text-xs">{selectedLog.user_id}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(selectedLog.status)}`}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
                <p className="text-xs">{selectedLog.location_address || "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedLog.latitude}, {selectedLog.longitude}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Zap className="h-3 w-3" /> Trigger Type</p>
                  <p className="font-medium">{selectedLog.trigger_type}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Timestamp</p>
                  <p className="text-xs">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Resolved</p>
                <p className="font-medium">{selectedLog.is_resolved ? "✅ Yes" : "❌ No"}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Admin Remark</p>
                <p className="text-sm">{selectedLog.admin_remark || "No remark added"}</p>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
