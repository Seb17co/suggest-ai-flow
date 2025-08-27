import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Send, Bot, User, CheckCircle, ArrowLeft, Clock, FileText, Image, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileUpload, AttachmentPreview } from '@/components/FileUpload';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
  }>;
}

interface ChatInterfaceProps {
  suggestion: {
    id: string;
    title: string;
    description: string;
    department: string;
    ai_conversation: Message[];
  };
  onBack: () => void;
  onComplete: () => void;
}

const MAX_ROUNDS = 5;

const ChatInterface = ({ suggestion, onBack, onComplete }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(
    suggestion.ai_conversation.length > 0
      ? [...suggestion.ai_conversation]
      : [
          {
            role: 'assistant',
            content:
              'Hej! Jeg er din idéassistent. Beskriv din idé i helt almindeligt sprog, så hjælper jeg dig videre.',
          },
        ]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [conversationRound, setConversationRound] = useState(() => {
    // Count existing user messages to determine current round
    const userMessages = suggestion.ai_conversation.filter(msg => msg.role === 'user');
    return userMessages.length;
  });
  const [pendingAttachments, setPendingAttachments] = useState<Array<{
    url: string;
    name: string;
    type: string;
  }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFileUploaded = (fileUrl: string, fileName: string, fileType: string) => {
    setPendingAttachments(prev => [...prev, { url: fileUrl, name: fileName, type: fileType }]);
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && pendingAttachments.length === 0) || loading || conversationRound >= MAX_ROUNDS) return;

    const messageContent = input.trim() || (pendingAttachments.length > 0 ? 'Har vedhæftet filer til gennemgang' : '');
    const userMessage: Message = { 
      role: 'user' as const, 
      content: messageContent,
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setPendingAttachments([]);
    setLoading(true);

    try {
      // Create context for AI including attachments info
      const messageForAI = {
        role: 'user' as const,
        content: pendingAttachments.length > 0 
          ? `${messageContent}\n\nVedhæftede filer: ${pendingAttachments.map(att => att.name).join(', ')}`
          : messageContent
      };

      // Send the actual conversation messages to the AI function. Since
      // our messages array only contains user/assistant roles we can send
      // it directly without additional filtering.
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [...messages, messageForAI],
          suggestionId: suggestion.id
        }
      });

      if (error) throw error;

      const aiMessage: Message = { role: 'assistant' as const, content: data.message };
      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);
      setConversationRound(data.conversationRound || conversationRound + 1);

      // Update the suggestion in the database
      await supabase
        .from('suggestions')
        .update({
          ai_conversation: updatedMessages.map(({ role, content, attachments }) => ({
            role,
            content,
            attachments
          }))
        })
        .eq('id', suggestion.id);

      // Auto-suggest completion after max rounds
      if (data.conversationRound >= MAX_ROUNDS) {
        setTimeout(() => {
          toast.info('Samtalen er nu færdig! Du kan indsende din forbedrede idé.');
        }, 1000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Kunne ikke sende beskeden. Prøv igen.');
    } finally {
      setLoading(false);
    }
  }, [input, pendingAttachments, loading, conversationRound, messages, suggestion.id]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const markAsComplete = useCallback(async () => {
    try {
      setLoading(true);
      
      // Update suggestion status to indicate it's ready for admin review
      const conversationData: Message[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments
      }));

      await supabase
        .from('suggestions')
        .update({
          ai_conversation: conversationData,
          status: 'pending'
        })
        .eq('id', suggestion.id);

      setIsComplete(true);
      toast.success('Fint! Dit forbedrede forslag er sendt til gennemgang.');
      
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Error completing suggestion:', error);
      toast.error('Kunne ikke indsende forslaget. Prøv igen.');
    } finally {
      setLoading(false);
    }
  }, [messages, suggestion.id, onComplete]);

  const renderAttachment = (attachment: { url: string; name: string; type: string }) => {
    const isImage = attachment.type.startsWith('image/');
    
    return (
      <div key={attachment.url} className="mt-2 max-w-xs">
        {isImage ? (
          <div className="relative">
            <img 
              src={attachment.url} 
              alt={attachment.name}
              className="rounded-lg max-w-full h-auto max-h-48 object-cover"
            />
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Image className="w-3 h-3" />
              <span className="truncate">{attachment.name}</span>
            </div>
          </div>
        ) : (
          <Card className="p-2 bg-muted/30 border-dashed">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{attachment.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={() => window.open(attachment.url, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // Add effect to get initial AI greeting if no conversation exists
  useEffect(() => {
    if (suggestion.ai_conversation.length === 0) {
      // Send initial empty message to get AI's personalized greeting
      const getInitialGreeting = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: {
              messages: [], // Empty messages array for initial greeting
              suggestionId: suggestion.id
            }
          });

          if (error) throw error;

          const aiMessage: Message = { role: 'assistant' as const, content: data.message };
          setMessages([aiMessage]);
          setConversationRound(0);
        } catch (error) {
          console.error('Error getting initial greeting:', error);
          // Fallback to a generic message if AI fails
          setMessages([{
            role: 'assistant',
            content: `Hej! Lad os arbejde sammen med dit forslag. Hvad vil du gerne forbedre eller uddybe?`
          }]);
        } finally {
          setLoading(false);
        }
      };

      getInitialGreeting();
    }
  }, [suggestion.id, suggestion.ai_conversation.length]);

  if (isComplete) {
    return (
      <Card className="backdrop-blur-sm bg-card/95" style={{ boxShadow: 'var(--shadow-medium)' }}>
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Forslag indsendt!</h3>
          <p className="text-muted-foreground">
            Din forbedrede idé er sendt til admin-teamet til gennemgang.
            Du får besked, når der er truffet en beslutning.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.min((conversationRound / MAX_ROUNDS) * 100, 100);
  const isConversationComplete = conversationRound >= MAX_ROUNDS;

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
              AI-samarbejde
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isConversationComplete && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {conversationRound}/{MAX_ROUNDS} spørgsmål
              </Badge>
            )}
            {isConversationComplete && (
              <Badge variant="default">Klar til indsendelse</Badge>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Samtale fremgang</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground bg-primary-light p-3 rounded-lg">
          <strong>Arbejder med:</strong> {suggestion.title} ({suggestion.department})
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
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment, attIndex) => (
                          <div key={attIndex}>
                            {renderAttachment(attachment)}
                          </div>
                        ))}
                      </div>
                    )}
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

        <div className="space-y-2">
          {/* Pending attachments preview */}
          {pendingAttachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Vedhæftede filer:</p>
              <div className="space-y-1">
                {pendingAttachments.map((attachment, index) => (
                  <AttachmentPreview
                    key={index}
                    fileName={attachment.name}
                    fileType={attachment.type}
                    fileUrl={attachment.url}
                    onRemove={() => removePendingAttachment(index)}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder={
                isConversationComplete
                  ? "Samtale afsluttet - indsend idé"
                  : "Skriv din besked her..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading || isConversationComplete}
            />
            <FileUpload
              onFileUploaded={handleFileUploaded}
              disabled={loading || isConversationComplete}
            />
            <Button 
              onClick={sendMessage} 
              disabled={loading || (!input.trim() && pendingAttachments.length === 0) || isConversationComplete}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {isConversationComplete && (
            <div className="text-xs text-muted-foreground text-center">
              Samtalen er afsluttet efter {MAX_ROUNDS} spørgsmål. Din idé er nu klar til indsendelse.
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <Button 
            onClick={markAsComplete} 
            className="w-full" 
            variant="default"
            disabled={loading || conversationRound < 2}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Idéen er færdig - indsend til vurdering
          </Button>
          {conversationRound < 2 && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Fortsæt samtalen for at forbedre idéen før indsendelse (mindst 2 spørgsmål)
            </p>
          )}
          {conversationRound >= 2 && conversationRound < MAX_ROUNDS && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Du kan indsende nu eller fortsætte samtalen for yderligere forbedringer
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;