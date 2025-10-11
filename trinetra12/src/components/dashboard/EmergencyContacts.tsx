import { Plus, Phone, Mail, Edit, Trash2, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AddContactForm from "@/components/forms/AddContactForm";

const EmergencyContacts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contacts, isLoading, error: queryError } = useQuery({
    queryKey: ['emergency-contacts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });
      
      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      console.log('Contacts data:', data);
      return data || [];
    },
    enabled: !!user
  });

  if (queryError) {
    console.error('Emergency contacts query error:', queryError);
  }

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      console.log('Deleting contact:', contactId, 'User:', user?.id);
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.id);
      
      const { data, error, count } = await supabase
        .from('emergency_contacts')
        .delete({ count: 'exact' })
        .eq('id', contactId);
      
      console.log('Delete result:', { data, error, count });
      if (error) throw error;
      return { data, count };
    },
    onSuccess: async (result) => {
      console.log('Delete successful:', result);
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts', user?.id] });
      toast.success(`Contact deleted successfully (${result.count} rows affected)`);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete contact: ' + error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Emergency Contacts</h3>
        <AddContactForm />
      </div>
      
      <div className="space-y-3">
        {contacts && contacts.length > 0 ? contacts.map((contact) => (
          <div 
            key={contact.id}
            className="bg-muted rounded-lg p-4 border hover:border-primary transition-smooth"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{contact.name}</h4>
                    {contact.priority === "high" && (
                      <Star className="h-4 w-4 text-warning fill-warning" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteContact.mutate(contact.id)}
                  disabled={deleteContact.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No emergency contacts added yet</p>
            <p className="text-sm">Add contacts to receive alerts during emergencies</p>
          </div>
        )}
      </div>
      
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">Alert Methods</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• SMS + Push Notification (Instant)</li>
          <li>• Phone Call (If no response in 30s)</li>
          <li>• Email (Backup notification)</li>
        </ul>
      </div>
    </div>
  );
};

export default EmergencyContacts;
