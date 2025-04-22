import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI client
// Make sure to set OPENAI_API_KEY in your .env.local file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the expected message format for the API
interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Helper function to determine system prompt based on personality
function getSystemPrompt(personality: number): string {
  // personality ranges from 0.0 (Honest) to 1.0 (Forgiving)
  if (personality < 0.15) { // Very Honest/Direct
    return 'You are an AI assistant providing direct and truthful feedback. Do not sugarcoat observations. Focus on presenting the reality of the situation clearly and concisely, even if it might be uncomfortable. Avoid excessive emotional language.';
  } else if (personality < 0.4) { // Honest/Neutral
    return 'You are an AI assistant focused on clarity and factual communication. Be direct and honest, maintaining a neutral and objective tone. Provide information straightforwardly.';
  } else if (personality > 0.85) { // Very Forgiving/Understanding
    return 'You are Maripist, an AI therapist focused on understanding and forgiveness. Always try to see the reasons behind actions and feelings. Offer validation and gentle interpretations. Help the user find mitigating factors or alternative perspectives. Emphasize compassion and understanding above all. Keep responses warm and reassuring.';
  } else if (personality > 0.6) { // Forgiving/Supportive
    return 'You are Maripist, a compassionate AI therapist. Listen carefully and respond with empathy and support. Try to understand the user\'s perspective and offer gentle encouragement. Keep responses concise and supportive.';
  } else { // Balanced/Default
    return 'You are Maripist, a helpful AI assistant. Balance honest observations with empathy and understanding. Provide clear insights while being considerate of the user\'s feelings. Keep responses balanced and concise.';
  }
}

export async function POST(req: Request) {
  // Check for API key first
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not found.');
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const messages: ApiMessage[] = body.messages || [];
    // Extract personality, default to 0.5 (balanced)
    const personality: number = typeof body.personality === 'number' ? body.personality : 0.5;
    // const therapistId: string | undefined = body.therapistId; // We have therapistId if needed later

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    // Generate system prompt dynamically based on personality
    const systemPromptContent = getSystemPrompt(personality);
    const systemPrompt: ApiMessage = {
      role: 'system',
      content: systemPromptContent
    };

    console.log(`Using personality: ${personality}, Prompt: ${systemPromptContent}`); // Log for debugging

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Consider gpt-4o-mini for better cost/performance
      messages: [systemPrompt, ...messages], 
      // temperature: 0.7, // Adjust temperature if desired
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;

    if (!aiResponse) {
      console.error('No response content from OpenAI.');
      return NextResponse.json({ error: 'Failed to get response from AI.' }, { status: 500 });
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error('Error processing chat API request:', error);
    // Return a generic error message to the client
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to process chat request: ${errorMessage}` }, { status: 500 });
  }
} 