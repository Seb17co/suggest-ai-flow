import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock, CheckCircle, XCircle, Eye, User, Bot, Shield, ExternalLink, Archive, Download, FileText, Info, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_needed';
  ai_conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
  admin_notes?: string;
  prd?: string | null;
  created_at: string;
  archived?: boolean;
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
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    department: ''
  });

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
        status: item.status as 'pending' | 'approved' | 'rejected' | 'more_info_needed',
        ai_conversation: (item.ai_conversation as any) || [],
        profiles: profilesMap.get(item.user_id) || null,
        department: item.department,
        archived: false
      }));
      
      setSuggestions(typedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to load suggestions');
    }
  };

  useEffect(() => {
    filterSuggestions();
  }, [suggestions, statusFilter]);

  const filterSuggestions = () => {
    if (statusFilter === 'all') {
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions(suggestions.filter(s => s.status === statusFilter));
    }
  };

  const updateSuggestionStatus = async (
    suggestion: Suggestion,
    status: 'approved' | 'rejected' | 'more_info_needed',
    notes: string
  ) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({
          status,
          admin_notes: notes.trim() || null,
          admin_id: user?.id
        })
        .eq('id', suggestion.id);

      if (error) throw error;

      if (status === 'approved') {
        try {
          const { data: prdData, error: prdError } = await supabase.functions.invoke('generate-prd', {
            body: {
              title: suggestion.title,
              description: suggestion.description,
              aiConversation: suggestion.ai_conversation
            }
          });

          if (prdError) throw prdError;

          await supabase
            .from('suggestions')
            .update({ 
              prd: prdData.prd as string
            })
            .eq('id', suggestion.id);
        } catch (prdErr) {
          console.error('Error generating PRD:', prdErr);
          toast.error('Failed to generate PRD');
        }
      }

      const statusText = status === 'more_info_needed' ? 'marked as needing more information' : status;
      toast.success(`Suggestion ${statusText} successfully`);
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

  const archiveSuggestion = async (suggestion: Suggestion) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({ archived: true, admin_id: user?.id })
        .eq('id', suggestion.id);

      if (error) throw error;

      toast.success('Suggestion archived');
      await fetchSuggestions();
      setSelectedSuggestion(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error archiving suggestion:', error);
      toast.error('Failed to archive suggestion');
    } finally {
      setActionLoading(false);
    }
  };

  const editSuggestion = async (suggestion: Suggestion) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          department: editForm.department,
          admin_id: user?.id
        })
        .eq('id', suggestion.id);

      if (error) throw error;

      toast.success('Suggestion updated successfully');
      await fetchSuggestions();
      setIsEditing(false);
      // Update the selected suggestion with new data
      setSelectedSuggestion({
        ...suggestion,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        department: editForm.department
      });
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast.error('Failed to update suggestion');
    } finally {
      setActionLoading(false);
    }
  };

  const startEditing = (suggestion: Suggestion) => {
    setEditForm({
      title: suggestion.title,
      description: suggestion.description,
      department: suggestion.department
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({ title: '', description: '', department: '' });
  };

  const downloadPRDAsMarkdown = (suggestion: Suggestion) => {
    if (!suggestion.prd) {
      toast.error('No PRD available for this suggestion');
      return;
    }

    const markdownContent = `# PRD: ${suggestion.title}\n\n${suggestion.prd}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PRD-${suggestion.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('PRD downloaded as Markdown');
  };

  const downloadPRDAsPDF = (suggestion: Suggestion) => {
    if (!suggestion.prd) {
      toast.error('No PRD available for this suggestion');
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - 2 * margin;
    
    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`PRD: ${suggestion.title}`, margin, 30);
    
    // Add content
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(suggestion.prd, maxLineWidth);
    
    let yPosition = 50;
    const lineHeight = 7;
    
    lines.forEach((line: string) => {
      if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
    
    pdf.save(`PRD-${suggestion.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    toast.success('PRD downloaded as PDF');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'more_info_needed':
        return <Info className="w-4 h-4 text-blue-600" />;
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
      case 'more_info_needed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Afventer';
      case 'approved':
        return 'Godkendt';
      case 'rejected':
        return 'Afvist';
      case 'more_info_needed':
        return 'Behov for mere info';
      default:
        return status;
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

  const pendingSuggestions = filteredSuggestions.filter(s => s.status === 'pending');
  const reviewedSuggestions = filteredSuggestions.filter(s => s.status !== 'pending');

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

        {/* Filter Controls */}
        <Card className="backdrop-blur-sm bg-card/95">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filtrer efter status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Vælg status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle forslag</SelectItem>
                  <SelectItem value="pending">Afventer</SelectItem>
                  <SelectItem value="approved">Godkendt</SelectItem>
                  <SelectItem value="rejected">Afvist</SelectItem>
                  <SelectItem value="more_info_needed">Behov for mere info</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                Viser {filteredSuggestions.length} af {suggestions.length} forslag
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <p className="text-2xl font-bold text-yellow-600">{suggestions.filter(s => s.status === 'pending').length}</p>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mere info</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {suggestions.filter(s => s.status === 'more_info_needed').length}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Info className="w-5 h-5 text-blue-600" />
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
                <p className="text-muted-foreground">
                  {statusFilter === 'pending' ? 'Ingen afventende forslag' : 'Ingen forslag matcher filteret'}
                </p>
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
                        <span className="ml-1">{getStatusDisplayName(suggestion.status)}</span>
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
                              setIsEditing(false);
                              setEditForm({ title: '', description: '', department: '' });
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">LK</span>
                                </div>
                                Gennemse forslag: {isEditing ? editForm.title : suggestion.title}
                              </div>
                              {!isEditing ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditing(suggestion)}
                                  disabled={actionLoading}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Rediger
                                </Button>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => editSuggestion(suggestion)}
                                    disabled={actionLoading || !editForm.title.trim() || !editForm.description.trim()}
                                  >
                                    <Save className="w-4 h-4 mr-1" />
                                    Gem
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelEditing}
                                    disabled={actionLoading}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Annuller
                                  </Button>
                                </div>
                              )}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Suggestion Details */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">
                                  {isEditing ? 'Rediger forslag' : 'Oprindeligt forslag'}
                                </h4>
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <div>
                                      <Label htmlFor="edit-title">Titel</Label>
                                      <Input
                                        id="edit-title"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                        placeholder="Titel på forslaget"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-description">Beskrivelse</Label>
                                      <Textarea
                                        id="edit-description"
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                        placeholder="Beskrivelse af forslaget"
                                        rows={4}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-department">Afdeling</Label>
                                      <Select
                                        value={editForm.department}
                                        onValueChange={(value) => setEditForm({...editForm, department: value})}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Vælg afdeling" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="it">IT</SelectItem>
                                          <SelectItem value="hr">HR</SelectItem>
                                          <SelectItem value="marketing">Marketing</SelectItem>
                                          <SelectItem value="sales">Salg</SelectItem>
                                          <SelectItem value="finance">Økonomi</SelectItem>
                                          <SelectItem value="operations">Drift</SelectItem>
                                          <SelectItem value="customer_service">Kundeservice</SelectItem>
                                          <SelectItem value="product">Produkt</SelectItem>
                                          <SelectItem value="other">Andet</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-muted rounded-lg space-y-2">
                                    <h5 className="font-medium">{suggestion.title}</h5>
                                    <p className="text-sm">{suggestion.description}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                      Afdeling: {suggestion.department}
                                    </p>
                                  </div>
                                )}
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
                              {suggestion.prd && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">PRD</h4>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadPRDAsMarkdown(suggestion)}
                                      >
                                        <FileText className="w-4 h-4 mr-1" />
                                        MD
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadPRDAsPDF(suggestion)}
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        PDF
                                      </Button>
                                    </div>
                                  </div>
                                  <ScrollArea className="h-64 border rounded-lg p-3">
                                    <pre className="text-sm whitespace-pre-wrap">
                                      {suggestion.prd}
                                    </pre>
                                  </ScrollArea>
                                </div>
                              )}
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
                                  onClick={() => updateSuggestionStatus(suggestion, 'approved', adminNotes)}
                                  disabled={actionLoading}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Godkend forslag
                                </Button>
                                <Button
                                  onClick={() => updateSuggestionStatus(suggestion, 'more_info_needed', adminNotes)}
                                  disabled={actionLoading}
                                  variant="outline"
                                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Info className="w-4 h-4 mr-2" />
                                  Behov for mere info
                                </Button>
                                <Button
                                  onClick={() => updateSuggestionStatus(suggestion, 'rejected', adminNotes)}
                                  disabled={actionLoading}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Afvis forslag
                                </Button>
                                <Button
                                  onClick={() => archiveSuggestion(suggestion)}
                                  disabled={actionLoading}
                                  variant="outline"
                                  className="w-full"
                                >
                                  <Archive className="w-4 h-4 mr-2" />
                                  Arkiver forslag
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
              <p className="text-center text-muted-foreground py-4">
                {statusFilter === 'all' ? 'Ingen gennemgåede forslag endnu' : 'Ingen forslag matcher filteret'}
              </p>
            ) : (
              <div className="space-y-3">
                {reviewedSuggestions.slice(0, 5).map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{suggestion.title}</p>
                          <p className="text-sm text-muted-foreground">
                            af {suggestion.profiles?.full_name || 'Ukendt bruger'}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            Afdeling: {suggestion.department}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {suggestion.prd && suggestion.status === 'approved' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadPRDAsMarkdown(suggestion)}
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadPRDAsPDF(suggestion)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          <Badge className={getStatusColor(suggestion.status)} variant="outline">
                            {getStatusIcon(suggestion.status)}
                            <span className="ml-1">{getStatusDisplayName(suggestion.status)}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
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