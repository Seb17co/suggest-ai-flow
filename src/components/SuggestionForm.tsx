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
          Beskriv din AI-idé så detaljeret som muligt. Vi hjælper dig med at udvikle den videre!
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Hvilken AI-løsning har du i tankerne? <span className="text-muted-foreground">(f.eks. "Chatbot til kundeservice")</span></Label>
            <Input
              id="title"
              placeholder="Skriv en kort beskrivelse af din AI-idé"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Fortæl mere om din AI-idé <span className="text-muted-foreground">(Hvad skal den gøre? Hvorfor vil det hjælpe? Hvem vil det gavne?)</span></Label>
          <Textarea
            id="description"
            placeholder="Beskriv din AI-løsning i detaljer: Hvilken opgave skal AI hjælpe med? Hvilke problemer vil det løse? Hvordan vil det forbedre arbejdet? Eksempel: 'En chatbot til kundeservice som kan svare på de mest almindelige spørgsmål automatisk, så vores medarbejdere kan fokusere på de mere komplekse henvendelser...'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Hvilken afdeling ville få mest glæde af denne AI-løsning?</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="department" className="w-full">
              <SelectValue placeholder="Vælg den mest relevante afdeling" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salg">Salg - kundehenvendelser og salgsstøtte</SelectItem>
              <SelectItem value="marketing">Marketing - kampagner og kommunikation</SelectItem>
              <SelectItem value="indkøb">Indkøb - leverandørhåndtering og bestillinger</SelectItem>
              <SelectItem value="design">Design - produktudvikling og kreative processer</SelectItem>
              <SelectItem value="lager">Lager - logistik og lagerstyring</SelectItem>
              <SelectItem value="hr">HR - medarbejderprocesser og administration</SelectItem>
              <SelectItem value="økonomi">Økonomi - rapportering og dataanalyse</SelectItem>
              <SelectItem value="it">IT - tekniske processer og systemvedligeholdelse</SelectItem>
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
          {loading ? 'Sender din AI-idé...' : 'Send min AI-idé til vurdering'}
          <Send className="ml-2 w-4 h-4" />
        </Button>
          <p className="text-xs text-muted-foreground text-center">
            🤖 Din AI-idé bliver sendt til eksperter som vurderer mulighederne for implementering
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default SuggestionForm;