import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, Lightbulb, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SuggestionForm from '@/components/SuggestionForm';
import ChatInterface from '@/components/ChatInterface';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_conversation: any[];
  created_at: string;
  admin_notes?: string;
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

  const createSuggestion = async (title: string, description: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          title,
          description,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-light text-success-foreground';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-warning-light text-warning-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (activeSuggestion) {
    return (
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-subtle)' }}>
        <div className="max-w-4xl mx-auto">
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
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--gradient-subtle)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {profile?.full_name || user?.email}!
            </h1>
            <p className="text-muted-foreground">Share your ideas and let AI help you refine them</p>
          </div>
          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && (
              <Button variant="outline" onClick={() => window.location.href = '/admin'}>
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Suggestion Form */}
          <div className="lg:col-span-1">
            <SuggestionForm onSubmit={createSuggestion} loading={loading} />
          </div>

          {/* Suggestions List */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-sm bg-card/95" style={{ boxShadow: 'var(--shadow-medium)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Your Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No suggestions yet. Create your first idea to get started!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => suggestion.status === 'pending' && suggestion.ai_conversation.length === 0 
                          ? setActiveSuggestion(suggestion)
                          : null
                        }
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{suggestion.title}</h3>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(suggestion.status)}
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(suggestion.status)}
                            >
                              {suggestion.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {suggestion.description}
                        </p>
                        {suggestion.admin_notes && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Admin Notes:</p>
                            <p className="text-sm text-muted-foreground">{suggestion.admin_notes}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>
                            Created: {new Date(suggestion.created_at).toLocaleDateString()}
                          </span>
                          {suggestion.status === 'pending' && suggestion.ai_conversation.length === 0 && (
                            <Button size="sm" variant="outline">
                              Continue with AI
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;