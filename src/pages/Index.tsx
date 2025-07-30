import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight, ExternalLink } from 'lucide-react';

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
        {/* Luxkids Branded Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-3xl">LK</span>
          </div>
        </div>
        
        {/* Luxkids Brand Name and Link */}
        <a 
          href="https://luxkids.dk" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 hover:opacity-80 transition-opacity mb-4"
        >
          <h1 className="text-5xl font-bold" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LUXKIDS
          </h1>
          <ExternalLink className="w-6 h-6 text-muted-foreground" />
        </a>
        
        <h2 className="text-3xl font-semibold mb-2 text-foreground">Suggestion Platform</h2>
        
        <p className="text-xl text-muted-foreground mb-4">
          Share your ideas for børnetøj and let AI help you refine them into actionable proposals
        </p>
        
        <p className="text-lg text-muted-foreground mb-8">
          Help improve children's clothing across all our brands: mikk-line, THE NEW, soft gallery, and more
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Join LUXKIDS Platform
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          
          <a 
            href="https://luxkids.dk" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg">
              Shop Collections
              <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
          </a>
        </div>
        
        {/* Brand Footer */}
        <div className="mt-12 pt-8 border-t border-border/20">
          <p className="text-sm text-muted-foreground">
            © 2025 LUXKIDS ApS • Børnetøj for alle aldre
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
