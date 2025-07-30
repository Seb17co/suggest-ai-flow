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
        <div className="flex items-center justify-center mb-8">
          <div className="p-4 rounded-full bg-primary/10">
            <Lightbulb className="w-16 h-16 text-primary" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-6" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Suggestions Platform
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Share your ideas with your team and let AI help you refine them into actionable proposals
        </p>
        <Button size="lg" onClick={() => navigate('/auth')}>
          Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
