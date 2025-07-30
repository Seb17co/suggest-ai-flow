import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Chat function called');
    const { messages, suggestionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    console.log('Processing AI chat with messages:', messages.length);

    // Count user messages (excluding system message)
    const userMessages = messages.filter(msg => msg.role === 'user');
    const conversationRound = userMessages.length;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du er en venlig AI-assistent der hjælper brugere med at forbedre deres forretningsforslag. Dit mål er at holde samtalen kort og fokuseret - maksimalt 3-5 spørgsmål.

            Nuværende samtale runde: ${conversationRound}/5

            Retningslinjer baseret på samtale runde:
            
            Runde 1-2: Stil 1-2 korte, fokuserede spørgsmål for at forstå kerneidéen bedre
            - Hvad er hovedproblemet der skal løses?
            - Hvem vil have gavn af dette?
            
            Runde 3-4: Hjælp med at forfine og uddybe idéen
            - Hvordan kan idéen implementeres?
            - Hvilke ressourcer skal der til?
            
            Runde 5: Opsummer og afslut samtalen
            - Giv en kort opsummering af den forbedrede idé
            - Foreslå at idéen er klar til indsendelse

            VIGTIGE REGLER:
            - Hold svar korte (max 2-3 sætninger)
            - Stil kun ÉT spørgsmål ad gangen
            - Undgå tekniske termer
            - Vær opmuntrende og konstruktiv
            - Efter runde 5: Opsummer altid og foreslå indsendelse`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 300, // Reduced to keep responses shorter
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      message: aiMessage,
      suggestionId,
      conversationRound: conversationRound + 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});