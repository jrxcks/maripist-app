'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Define message type for frontend
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

// Define message type for API (matching backend)
interface ApiMessage {
  role: 'user' | 'assistant'; // Only user/assistant roles needed for history
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state for AI response
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dummy initial message
  useEffect(() => {
    setMessages([
      {
        id: 'initial',
        text: "Hello! I'm here to listen. What's on your mind today?",
        sender: 'ai'
      }
    ]);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => { // Make async
    if (inputMessage.trim() === '' || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(), 
      text: inputMessage,
      sender: 'user'
    };

    // Add user message and clear input
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    // Prepare messages for API (map sender to role, text to content)
    const apiMessages: ApiMessage[] = updatedMessages
      .filter(msg => msg.id !== 'initial') // Exclude initial hardcoded message if needed
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }), // Send the history
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponseText = data.response;

      if (aiResponseText) {
        const aiResponseMessage: Message = {
          id: Date.now().toString(),
          text: aiResponseText,
          sender: 'ai'
        };
        setMessages(prev => [...prev, aiResponseMessage]);
      } else {
        throw new Error("Received empty response from API");
      }

    } catch (error) {
      console.error("Failed to send message or get AI response:", error);
      // Add an error message to the chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `Sorry, I encountered an error. ${error instanceof Error ? error.message : 'Please try again.'}`,
        sender: 'ai' // Show error as an AI message
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-muted/40">
      <Card className="flex flex-col flex-grow overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold">Your Session</CardTitle>
          {/* Could add therapist name/avatar here later */}
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={cn(
                "flex items-start gap-3", 
                message.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src="/placeholder-ai.png" alt="AI" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div 
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm break-words",
                  message.sender === 'user' 
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.text}
              </div>
              {message.sender === 'user' && (
                 <Avatar className="h-8 w-8 border">
                  {/* Add user avatar later if needed */}
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {/* Dummy div to ensure scrolling to bottom */}
          <div ref={messagesEndRef} /> 
        </CardContent>
        <CardFooter className="border-t p-4">
          <div className="flex w-full items-center space-x-2">
            <Textarea
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 resize-none"
              rows={1}
              disabled={isLoading} // Disable textarea while loading
            />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading}>
              {isLoading ? "Sending..." : "Send"} {/* Show loading state on button */}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 