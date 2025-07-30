import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  suggestion: {
    id: string;
    title: string;
    description: string;
    ai_conversation: Message[];
  };
  onBack: () => void;
  onComplete: () => void;
}

const ChatInterface = ({ suggestion, onBack, onComplete }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `I see you want to work on: "${suggestion.title}". Let me help you refine this idea. ${suggestion.description}

What specific problem does this solve for your company or customers?` },
    ...suggestion.ai_conversation
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: newMessages,
          suggestionId: suggestion.id
        }
      });

      if (error) throw error;

      const aiMessage = { role: 'assistant' as const, content: data.message };
      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);

      // Update the suggestion in the database
      const conversationData = updatedMessages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      await supabase
        .from('suggestions')
        .update({ ai_conversation: conversationData as any })
        .eq('id', suggestion.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const markAsComplete = async () => {
    try {
      setLoading(true);
      
      // Update suggestion status to indicate it's ready for admin review
      const conversationData = messages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      await supabase
        .from('suggestions')
        .update({ 
          ai_conversation: conversationData as any,
          status: 'pending'
        })
        .eq('id', suggestion.id);

      setIsComplete(true);
      toast.success('Great! Your refined suggestion has been submitted for review.');
      
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Error completing suggestion:', error);
      toast.error('Failed to submit suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isComplete) {
    return (
      <Card className="backdrop-blur-sm bg-card/95" style={{ boxShadow: 'var(--shadow-medium)' }}>
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Suggestion Submitted!</h3>
          <p className="text-muted-foreground">
            Your refined idea has been sent to the admin team for review. 
            You'll be notified once a decision is made.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/95" style={{ boxShadow: 'var(--shadow-medium)' }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Collaboration
            </CardTitle>
          </div>
          <Badge variant="secondary">Refining Idea</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground bg-primary-light p-3 rounded-lg">
          <strong>Working on:</strong> {suggestion.title}
        </div>
        
        <ScrollArea className="h-96 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' 
                      ? 'flex-row-reverse' 
                      : 'flex-row'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="p-2 rounded-full bg-muted">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Continue the conversation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="pt-2 border-t">
          <Button 
            onClick={markAsComplete} 
            className="w-full" 
            variant="default"
            disabled={loading || messages.length < 3}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Idea is Complete - Submit for Review
          </Button>
          {messages.length < 3 && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Continue the conversation to refine your idea before submitting
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;