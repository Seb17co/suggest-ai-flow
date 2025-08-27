import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SuggestionForm from '@/components/SuggestionForm';
import ChatInterface from '@/components/ChatInterface';
import { useNavigate } from 'react-router-dom';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
  }>;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_conversation: AIMessage[];
  created_at: string;
  admin_notes?: string;
  prd?: string | null;
  archived?: boolean;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'user' | 'admin';
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData as Profile);

      // Fetch user suggestions
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('suggestions')
        .select('*')
        .eq('user_id', user.id)
        
        .order('created_at', { ascending: false });

      if (suggestionsError) throw suggestionsError;
      setSuggestions((suggestionsData || []) as Suggestion[]);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const generateTitle = (description: string) => {
    const words = description.trim().split(/\s+/).slice(0, 5);
    return words.join(' ') + (words.length === 5 ? '...' : '');
  };

  const createSuggestion = async (
    description: string,
    department: string
  ) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          title: generateTitle(description),
          description,
          department,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Suggestion created! Let\'s refine it with AI.');
      setActiveSuggestion(data as Suggestion);
      
    } catch (error) {
      console.error('Error creating suggestion:', error);
      toast.error('Failed to create suggestion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Indlæser oversigt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--gradient-subtle)' }}>
      {/* Sidebar */}
      <div className="w-64 border-r bg-card/50 flex flex-col">
        <div className="p-4 border-b">
          <Button className="w-full" onClick={() => setActiveSuggestion(null)}>
            Ny idé
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {suggestions.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Ingen forslag endnu.
            </p>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-3 cursor-pointer text-sm hover:bg-accent ${
                  activeSuggestion?.id === suggestion.id ? 'bg-accent' : ''
                }`}
                onClick={() => setActiveSuggestion(suggestion)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate flex-1">{suggestion.title}</span>
                  {getStatusIcon(suggestion.status)}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t space-y-2">
          {profile?.role === 'admin' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/admin')}
            >
              <Settings className="w-4 h-4 mr-2" /> Admin
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Log ud
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {activeSuggestion ? (
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto h-full">
              <ChatInterface
                suggestion={activeSuggestion}
                onBack={() => setActiveSuggestion(null)}
                onComplete={() => {
                  setActiveSuggestion(null);
                  fetchUserData();
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Start en ny idé
              </h2>
              <SuggestionForm onSubmit={createSuggestion} loading={loading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;