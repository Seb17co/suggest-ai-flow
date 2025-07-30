import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb, Send } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

interface SuggestionFormProps {
  onSubmit: (title: string, description: string, department: string) => void;
  loading?: boolean;
}

const SuggestionForm = ({ onSubmit, loading = false }: SuggestionFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim() && department) {
      onSubmit(title.trim(), description.trim(), department);
      setTitle('');
      setDescription('');
      setDepartment('');
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-card/95" style={{ boxShadow: 'var(--shadow-medium)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">LK</span>
          </div>
          Del din idé
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              placeholder="F.eks. nyt børnetøjsdesign eller produktforbedring"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
          <Textarea
            id="description"
            placeholder="Beskriv din idé. AI hjælper med at forbedre den."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Afdeling</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="department" className="w-full">
              <SelectValue placeholder="Vælg afdeling" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salg">Salg</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="indkøb">Indkøb</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="lager">Lager</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={
            loading || !title.trim() || !description.trim() || !department
          }
        >
          {loading ? 'Opretter forslag...' : 'Start AI-samarbejde'}
          <Send className="ml-2 w-4 h-4" />
        </Button>
          <p className="text-xs text-muted-foreground text-center">
            Dine idéer hjælper os med at forbedre børnetøj
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default SuggestionForm;