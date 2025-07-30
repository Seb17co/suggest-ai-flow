import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Clock, CheckCircle, XCircle, Eye, User, Bot, Shield, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
  admin_notes?: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

interface Profile {
  role: string;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error || !profileData || profileData.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
        return;
      }

      setProfile(profileData);
      await fetchSuggestions();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      // First, get all suggestions
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (suggestionsError) throw suggestionsError;

      // Then get all profiles for the users who made suggestions
      const userIds = suggestionsData?.map(s => s.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile for quick lookup
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      // Combine the data
      const typedSuggestions = (suggestionsData || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected',
        ai_conversation: (item.ai_conversation as any) || [],
        profiles: profilesMap.get(item.user_id) || null,
        department: item.department
      }));
      
      setSuggestions(typedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to load suggestions');
    }
  };

  const updateSuggestionStatus = async (suggestionId: string, status: 'approved' | 'rejected', notes: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({
          status,
          admin_notes: notes.trim() || null,
          admin_id: user?.id
        })
        .eq('id', suggestionId);

      if (error) throw error;

      toast.success(`Suggestion ${status} successfully`);
      await fetchSuggestions();
      setSelectedSuggestion(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast.error('Failed to update suggestion');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const reviewedSuggestions = suggestions.filter(s => s.status !== 'pending');

  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--gradient-subtle)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Luxkids Branded Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Forslagsplatform</h1>
            </div>
            <div className="hidden md:block w-px h-12 bg-border"></div>
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Admin-panel
              </h2>
              <p className="text-sm text-muted-foreground">Administrer forslag og idéer</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage til oversigten
          </Button>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">I alt</p>
                  <p className="text-2xl font-bold">{suggestions.length}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Afventer</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingSuggestions.length}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Godkendt</p>
                  <p className="text-2xl font-bold text-green-600">
                    {suggestions.filter(s => s.status === 'approved').length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Afvist</p>
                  <p className="text-2xl font-bold text-red-600">
                    {suggestions.filter(s => s.status === 'rejected').length}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Suggestions */}
        <Card className="backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Afventer gennemgang ({pendingSuggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ingen afventende forslag</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          af {suggestion.profiles?.full_name || 'Ukendt bruger'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2 capitalize">
                          Afdeling: {suggestion.department}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {suggestion.description}
                        </p>
                      </div>
                      <Badge className={getStatusColor(suggestion.status)} variant="outline">
                        {getStatusIcon(suggestion.status)}
                        <span className="ml-1">{suggestion.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedSuggestion(suggestion);
                              setAdminNotes(suggestion.admin_notes || '');
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">LK</span>
                              </div>
                              Gennemse forslag: {suggestion.title}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Suggestion Details */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Oprindeligt forslag</h4>
                                <div className="p-3 bg-muted rounded-lg space-y-2">
                                  <p className="text-sm">{suggestion.description}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    Afdeling: {suggestion.department}
                                  </p>
                                </div>
                              </div>
                              
                              {/* AI Conversation */}
                              <div>
                                <h4 className="font-semibold mb-2">AI-samarbejde</h4>
                                <ScrollArea className="h-64 border rounded-lg p-3">
                                  {suggestion.ai_conversation.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Ingen AI-samtale endnu</p>
                                  ) : (
                                    <div className="space-y-3">
                                      {suggestion.ai_conversation.map((message, index) => (
                                        <div key={index} className="flex gap-2">
                                          <div className="p-1 rounded-full bg-muted">
                                            {message.role === 'user' ? (
                                              <User className="w-3 h-3" />
                                            ) : (
                                              <Bot className="w-3 h-3" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <p className="text-xs text-muted-foreground mb-1">
                                              {message.role === 'user' ? 'Bruger' : 'AI-assistent'}
                                            </p>
                                            <p className="text-sm">{message.content}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </ScrollArea>
                              </div>
                            </div>
                            
                            {/* Admin Actions */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">Admin-noter</label>
                                <Textarea
                                  placeholder="Tilføj feedback eller noter til brugeren..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  rows={6}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Button
                                  onClick={() => updateSuggestionStatus(suggestion.id, 'approved', adminNotes)}
                                  disabled={actionLoading}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Godkend forslag
                                </Button>
                                <Button
                                  onClick={() => updateSuggestionStatus(suggestion.id, 'rejected', adminNotes)}
                                  disabled={actionLoading}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Afvis forslag
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <span className="text-xs text-muted-foreground">
                        {new Date(suggestion.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviewed Suggestions */}
        <Card className="backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle>Senest gennemgået</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewedSuggestions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Ingen gennemgåede forslag endnu</p>
            ) : (
              <div className="space-y-3">
                {reviewedSuggestions.slice(0, 5).map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{suggestion.title}</p>
                    <p className="text-sm text-muted-foreground">
                      af {suggestion.profiles?.full_name || 'Ukendt bruger'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Afdeling: {suggestion.department}
                    </p>
                  </div>
                    <Badge className={getStatusColor(suggestion.status)} variant="outline">
                      {getStatusIcon(suggestion.status)}
                      <span className="ml-1">{suggestion.status}</span>
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center py-6 border-t">
          <p className="text-sm text-muted-foreground">© 2025 Internt værktøj</p>
        </div>
      </div>
    </div>
  );
};

export default Admin;