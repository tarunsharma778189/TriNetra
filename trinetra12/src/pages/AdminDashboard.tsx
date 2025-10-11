import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: contacts } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('emergency_contacts').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: safeZones } = useQuery({
    queryKey: ['admin-safezones'],
    queryFn: async () => {
      const { data, error } = await supabase.from('safe_zones').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: sosLogs } = useQuery({
    queryKey: ['admin-sos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sos_logs').select('*');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="profiles">
        <TabsList>
          <TabsTrigger value="profiles">Users ({profiles?.length || 0})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts?.length || 0})</TabsTrigger>
          <TabsTrigger value="zones">Safe Zones ({safeZones?.length || 0})</TabsTrigger>
          <TabsTrigger value="sos">SOS Logs ({sosLogs?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">User Profiles</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Phone</th>
                    <th className="border p-2">Helper Available</th>
                    <th className="border p-2">Reward Points</th>
                    <th className="border p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles?.map((profile) => (
                    <tr key={profile.id}>
                      <td className="border p-2">{profile.full_name}</td>
                      <td className="border p-2">{profile.phone}</td>
                      <td className="border p-2">{profile.is_helper_available ? 'Yes' : 'No'}</td>
                      <td className="border p-2">{profile.reward_points}</td>
                      <td className="border p-2">{new Date(profile.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Emergency Contacts</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2">User ID</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Phone</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts?.map((contact) => (
                    <tr key={contact.id}>
                      <td className="border p-2">{contact.user_id.slice(0, 8)}...</td>
                      <td className="border p-2">{contact.name}</td>
                      <td className="border p-2">{contact.phone}</td>
                      <td className="border p-2">{contact.email}</td>
                      <td className="border p-2">{contact.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="zones">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Safe Zones</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2">User ID</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Address</th>
                    <th className="border p-2">Coordinates</th>
                    <th className="border p-2">Radius</th>
                    <th className="border p-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {safeZones?.map((zone) => (
                    <tr key={zone.id}>
                      <td className="border p-2">{zone.user_id.slice(0, 8)}...</td>
                      <td className="border p-2">{zone.name}</td>
                      <td className="border p-2">{zone.address}</td>
                      <td className="border p-2">{zone.latitude}, {zone.longitude}</td>
                      <td className="border p-2">{zone.radius_meters}m</td>
                      <td className="border p-2">{zone.is_active ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sos">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">SOS Alerts</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2">User ID</th>
                    <th className="border p-2">Location</th>
                    <th className="border p-2">Trigger Type</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {sosLogs?.map((log) => (
                    <tr key={log.id}>
                      <td className="border p-2">{log.user_id.slice(0, 8)}...</td>
                      <td className="border p-2">{log.latitude}, {log.longitude}</td>
                      <td className="border p-2">{log.trigger_type}</td>
                      <td className="border p-2">{log.status}</td>
                      <td className="border p-2">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;