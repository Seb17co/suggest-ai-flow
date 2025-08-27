import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  prd: string | null;
}

const CreateIdea = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        toast.error('Access denied. Admin only.');
        navigate('/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('suggestions')
        .select('id, title, description, prd')
        .eq('id', id)
        .single();

      if (error || !data) {
        toast.error('Failed to load suggestion');
        navigate('/admin');
        return;
      }

      setSuggestion(data as Suggestion);
      setLoading(false);
    };

    fetchData();
  }, [id, user, navigate]);

  const createIdea = async () => {
    if (!suggestion) return;
    try {
      // Type generation does not yet include the ideas table
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('ideas' as any)
        .insert({
          suggestion_id: suggestion.id,
          title: suggestion.title,
          description: suggestion.description,
          prd: suggestion.prd
        });

      if (error) throw error;
      toast.success('Idea created');
      navigate('/admin');
    } catch (err) {
      console.error('Error creating idea:', err);
      toast.error('Failed to create idea');
    }
  };

  if (loading || !suggestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!suggestion.prd) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No PRD available for this suggestion.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-subtle)' }}>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Create Idea from "{suggestion.title}"</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Generated PRD</h4>
            <Textarea className="h-64" readOnly value={suggestion.prd || ''} />
          </div>
          <Button className="w-full" onClick={createIdea}>
            Create Idea
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateIdea;

