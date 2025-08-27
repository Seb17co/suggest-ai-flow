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
        <p className="text-sm text-muted-foreground">
          Beskriv din idé så detaljeret som muligt. Vi hjælper dig med at udvikle den videre!
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Hvad er din idé? <span className="text-muted-foreground">(f.eks. "Reflekterende vinterjakke")</span></Label>
            <Input
              id="title"
              placeholder="Skriv en kort, beskrivende titel for din idé"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Fortæl mere om din idé <span className="text-muted-foreground">(Hvad? Hvorfor? Hvem vil det hjælpe?)</span></Label>
          <Textarea
            id="description"
            placeholder="Beskriv din idé i detaljer: Hvad skal produktet/løsningen kunne? Hvilket problem løser det? Hvorfor er det en god idé? Eksempel: 'Jeg tænker på en vinterjakke med reflekterende striber, fordi mange børn går til skole i mørke. Det vil gøre dem mere synlige for bilister...'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Hvilken afdeling kan bedst hjælpe med at realisere idéen?</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="department" className="w-full">
              <SelectValue placeholder="Vælg den mest relevante afdeling" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salg">Salg - kundevendte løsninger og salgsstrategi</SelectItem>
              <SelectItem value="marketing">Marketing - kampagner og kommunikation</SelectItem>
              <SelectItem value="indkøb">Indkøb - leverandører og materialer</SelectItem>
              <SelectItem value="design">Design - produktudvikling og udseende</SelectItem>
              <SelectItem value="lager">Lager - logistik og distribution</SelectItem>
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
          {loading ? 'Sender din idé...' : 'Send min idé til udvikling'}
          <Send className="ml-2 w-4 h-4" />
        </Button>
          <p className="text-xs text-muted-foreground text-center">
            🚀 Din idé bliver sendt til eksperter som hjælper med at udvikle den videre
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default SuggestionForm;