import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb, Send } from 'lucide-react';

interface SuggestionFormProps {
  onSubmit: (title: string, description: string) => void;
  loading?: boolean;
}

const SuggestionForm = ({ onSubmit, loading = false }: SuggestionFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onSubmit(title.trim(), description.trim());
      setTitle('');
      setDescription('');
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-card/95" style={{ boxShadow: 'var(--shadow-medium)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">LK</span>
          </div>
          Share Your LUXKIDS Idea
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Suggestion Title</Label>
            <Input
              id="title"
              placeholder="E.g., New børnetøj design idea, product improvement..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your idea for LUXKIDS børnetøj brands (mikk-line, THE NEW, soft gallery, etc.). Our AI will help you refine it!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !title.trim() || !description.trim()}
          >
            {loading ? 'Creating suggestion...' : 'Start AI Collaboration'}
            <Send className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Your ideas help improve børnetøj across all LUXKIDS brands
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default SuggestionForm;