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
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--gradient-subtle)' }}>
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 text-foreground">Forslagsplatform</h1>

        <h2 className="text-3xl font-semibold mb-2 text-foreground">Velkommen</h2>

        <p className="text-xl text-muted-foreground mb-4">
          Del dine idéer til børnetøj og lad AI hjælpe med at gøre dem til konkrete forslag.
        </p>

        <p className="text-lg text-muted-foreground mb-8">
          Hjælp os med at forbedre børnetøj på tværs af vores mærker.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Tilmeld dig
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-border/20">
          <p className="text-sm text-muted-foreground">
            © 2025 Internt værktøj
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
