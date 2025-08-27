import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4"
         style={{ background: 'var(--gradient-subtle)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-4 text-foreground">LUXKIDS Idéplatform</h1>
          <h2 className="text-3xl font-semibold mb-4 text-foreground">Dine idéer skaber fremtiden</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Del dine idéer til produktforbedringer, nye designs og smarte løsninger. 
            Vores AI hjælper dig med at udvikle og forfine dine forslag.
          </p>
        </div>

        {/* Examples Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card/95 backdrop-blur-sm rounded-lg p-6 border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-3 text-foreground">Produktidéer</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Nye børnetøjsdesigns, materialeforslag, funktionaliteter
            </p>
            <div className="text-xs text-muted-foreground">
              <div className="mb-1">• "Jakke med reflekterende detaljer"</div>
              <div className="mb-1">• "Bukser med voksende ben"</div>
              <div>• "Allergivenligt undertøj"</div>
            </div>
          </div>

          <div className="bg-card/95 backdrop-blur-sm rounded-lg p-6 border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <ArrowRight className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-3 text-foreground">Procesforbedringar</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Salgsprocesser, kundeservice, leveringsløsninger
            </p>
            <div className="text-xs text-muted-foreground">
              <div className="mb-1">• "Hurtigere størrelseguide"</div>
              <div className="mb-1">• "Personlige anbefalinger"</div>
              <div>• "Nem ombytning online"</div>
            </div>
          </div>

          <div className="bg-card/95 backdrop-blur-sm rounded-lg p-6 border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-3 text-foreground">Kundeoplevelse</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Marketing, kampagner, kundeengagement
            </p>
            <div className="text-xs text-muted-foreground">
              <div className="mb-1">• "Sæsonkampagner for familier"</div>
              <div className="mb-1">• "Bæredygtighedshistorier"</div>
              <div>• "Loyalitetsprogram for forældre"</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-6">
            <strong>Klar til at dele din idé?</strong> Det tager kun få minutter, og AI hjælper dig undervejs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Kom i gang nu
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Log ind
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Ingen teknisk baggrund nødvendig - bare gode idéer!
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-border/20 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 LUXKIDS Internt værktøj
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
