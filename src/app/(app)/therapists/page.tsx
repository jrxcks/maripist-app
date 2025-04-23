'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, Send, MoreHorizontal, Trash2, Pencil, ChevronLeft, Mic } from 'lucide-react';
import { CreateTherapistDialog } from '@/components/create-therapist-dialog';
import { supabase } from '@/lib/supabase/client';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

// Define a type for the therapist data
type Therapist = {
  id: string;
  name: string;
  personality: number;
  created_at: string;
  user_id: string;
};

// Define message type for frontend
interface DisplayMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

// Define message type for API (matching existing API)
interface ApiMessage {
  role: 'user' | 'assistant'; 
  content: string;
}

interface TherapistListProps {
  selectedTherapist: Therapist | null;
  onSelectTherapist: (therapist: Therapist | null) => void;
}

function TherapistList({ selectedTherapist, onSelectTherapist }: TherapistListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const fetchTherapists = useCallback(async () => {
    console.log("[fetchTherapists] Starting fetch...");
    setIsLoadingList(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[fetchTherapists] User not logged in");
      setIsLoadingList(false);
      return;
    }
    
    console.log("[fetchTherapists] Fetching from Supabase for user:", user.id);
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
      
    console.log("[fetchTherapists] Supabase response:", { data, error });
      
    if (error) {
      console.error("[fetchTherapists] Error fetching therapists:", error);
      setTherapists([]);
    } else {
      const fetchedTherapists = data || [];
      console.log("[fetchTherapists] Fetched therapists count:", fetchedTherapists.length);
      setTherapists(fetchedTherapists);
      
      // REMOVED: Don't set dialog state directly within the fetch function
      // if (fetchedTherapists.length === 0) {
      //   console.log("[fetchTherapists] Therapist count is 0, attempting to open dialog...");
      //   setIsCreateDialogOpen(true);
      // }
    }
    setIsLoadingList(false);
  }, []);

  useEffect(() => {
    fetchTherapists();
  }, [fetchTherapists]);

  // ADDED: Effect to open dialog after initial load if no therapists exist
  useEffect(() => {
    // Only run after the initial loading is complete
    if (!isLoadingList && therapists.length === 0) {
      console.log("[Effect] Loading finished, therapist count is 0. Opening create dialog.");
      setIsCreateDialogOpen(true);
    }
  }, [isLoadingList, therapists]); // Depend on loading state and therapists array

  const handleTherapistCreated = () => {
    fetchTherapists();
  };

  console.log("[TherapistList Render] isCreateDialogOpen:", isCreateDialogOpen);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold">Your Therapists</h2>
        <Button size="sm" variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create
        </Button>
      </div>
      <ScrollArea className="flex-grow pr-1">
        <div className="space-y-2">
          {isLoadingList ? (
            <>
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </>
          ) : therapists.length === 0 ? (
             <p className="text-sm text-muted-foreground p-3 text-center">No therapists created yet.</p>
          ) : (
            therapists.map((therapist) => {
              const avatarUrl = `https://api.dicebear.com/8.x/bottts/svg?seed=${therapist.id}`;
              return (
                <div
                  key={therapist.id}
                  onClick={() => onSelectTherapist(therapist)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/80 text-sm w-full",
                    selectedTherapist?.id === therapist.id ? "bg-muted font-medium" : "bg-muted/50"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={avatarUrl} alt={`${therapist.name} avatar`} />
                    <AvatarFallback>{therapist.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="flex-grow truncate">{therapist.name}</span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      <CreateTherapistDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTherapistCreated={handleTherapistCreated}
      />
    </div>
  );
}

interface ChatAreaProps {
  selectedTherapist: Therapist | null;
  messages: DisplayMessage[];
  isLoadingMessages: boolean;
  onMessagesUpdate: (newMessages: DisplayMessage[]) => void;
  onTherapistDeleted: (therapistId: string) => void;
  onTherapistEdited: () => void;
  onBackClick: () => void;
}

function ChatArea({
  selectedTherapist, messages, isLoadingMessages, 
  onMessagesUpdate, onTherapistDeleted, onTherapistEdited, onBackClick
}: ChatAreaProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // --- State and Refs for Speech Recognition ---
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // --- State for TTS Voices ---
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  // --- End State for TTS Voices ---

  // --- Effect to Load Voices ---
  useEffect(() => {
    const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
            console.log("[TTS Voices] Available:", availableVoices.map(v => v.name));
            setVoices(availableVoices);
        }
    };
    
    // Initial load attempt
    loadVoices();
    
    // Listen for changes (voices might load asynchronously)
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Cleanup listener
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []); // Run only once on mount
  // --- End Effect to Load Voices ---

  // --- Text-to-Speech Function (Updated to use selected voice) ---
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window && voices.length > 0) {
      window.speechSynthesis.cancel(); 
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // --- Voice Selection Logic --- 
      // Try to find a preferred voice (Example: Google US English)
      let selectedVoice = voices.find(voice => voice.name === 'Google US English');
      // Fallback: Try any English voice
      if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
      }
      // Fallback: Use the first available voice if still nothing found
      if (!selectedVoice) {
          selectedVoice = voices[0];
      }
      
      if (selectedVoice) {
         console.log("[TTS] Using voice:", selectedVoice.name);
         utterance.voice = selectedVoice;
      } else {
          console.log("[TTS] Using default voice.");
      }
      // --- End Voice Selection Logic ---
      
      // Optional: Configure rate, pitch
      // utterance.rate = 1;
      // utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
      console.log("[TTS] Speaking:", text);
    } else {
      if (voices.length === 0) console.warn("[TTS] No voices loaded yet.");
      else console.warn("Text-to-Speech (SpeechSynthesis) not supported.");
    }
  // Include voices in dependency array
  }, [voices]); 
  // --- End Text-to-Speech Function ---

  // --- handleSendMessage (Moved Up) ---
  const handleSendMessage = useCallback(async (e?: React.FormEvent | null, textToSend?: string) => {
    e?.preventDefault(); 
    const messageText = textToSend ?? inputMessage;
    if (!selectedTherapist || messageText.trim() === '' || isLoadingResponse) return;

    setIsLoadingResponse(true);
    if (!textToSend) { setInputMessage(''); }

    const newUserMessage: DisplayMessage = {
      id: 'pending-' + Date.now().toString(),
      text: messageText,
      sender: 'user'
    };
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not found, cannot save message");
        setIsLoadingResponse(false);
        // Optionally show error toast
        return;
    }

    onMessagesUpdate([...messages, newUserMessage]); // Optimistic UI update

    const { data: insertedUserData, error: userInsertError } = await supabase
        .from('chat_messages')
        .insert({ user_id: user.id, therapist_id: selectedTherapist.id, sender: 'user', content: messageText })
        .select('id').single();

    let finalUserMessage = newUserMessage;
    if (userInsertError || !insertedUserData) {
        console.error("Error saving user message:", userInsertError);
        // Update UI to show error state for the message?
        const errorMsg = {...newUserMessage, id: 'error-user-' + newUserMessage.id, text: newUserMessage.text + " (Error saving)" };
        onMessagesUpdate([...messages, errorMsg]); 
        setIsLoadingResponse(false);
        return; // Stop if user message didn't save
    } else {
       finalUserMessage = { ...newUserMessage, id: insertedUserData.id };
    }
    
    const messagesWithRealUserId = [...messages, finalUserMessage];
    onMessagesUpdate(messagesWithRealUserId); // Update parent with real ID

    const apiMessages: ApiMessage[] = messagesWithRealUserId
      .filter(msg => !msg.id.startsWith('initial-') && !msg.id.startsWith('pending-') && !msg.id.startsWith('error-')) // Filter out temporary/error IDs
      .map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, therapistId: selectedTherapist.id, personality: selectedTherapist.personality }),
      });

      if (!response.ok) { throw new Error((await response.json()).error || `API Error`); }

      const data = await response.json();
      const aiResponseText = data.response;

      if (aiResponseText) {
        const aiPendingMessage: DisplayMessage = { id: 'pending-ai-' + Date.now().toString(), text: aiResponseText, sender: 'ai' }; // Temp ID
        
        // --- Insert AI Message to DB --- 
        const { data: insertedAiData, error: aiInsertError } = await supabase
          .from('chat_messages')
          .insert({ user_id: user.id, therapist_id: selectedTherapist.id, sender: 'ai', content: aiPendingMessage.text })
          .select('id')
          .single();

        let finalAiMessage = aiPendingMessage;
        if (aiInsertError || !insertedAiData) {
           console.error("Error saving AI message:", aiInsertError);
           // Create an error version of the message
           finalAiMessage = {...aiPendingMessage, id: 'error-ai-' + aiPendingMessage.id, text: aiPendingMessage.text + " (Error saving)" };
        } else {
           // Update with real ID from DB
           finalAiMessage = { ...aiPendingMessage, id: insertedAiData.id };
        }
        // --- End Insert AI Message --- 

        // Update parent state with final AI message (real or error ID)
        onMessagesUpdate([...messagesWithRealUserId, finalAiMessage]); 
        
        // --- Speak the AI response --- 
        speakText(finalAiMessage.text); 
        // ------------------------------
        
      } else { throw new Error("Empty API response"); }

    } catch (error) {
      console.error("Chat API error:", error);
      const errorDisplayMessage: DisplayMessage = { id: Date.now().toString() + '-err', text: `API Error: ${error instanceof Error ? error.message : 'Unknown'}`, sender: 'ai' };
      // Save error message to DB? Probably not. Just show in UI.
      onMessagesUpdate([...messagesWithRealUserId, errorDisplayMessage]); // Show API error after user message
      // --- Speak the error message? --- 
      // speakText(errorDisplayMessage.text); // Optional: Speak errors too
      // --------------------------------
    } finally {
      setIsLoadingResponse(false);
    }
  }, [selectedTherapist, isLoadingResponse, inputMessage, messages, onMessagesUpdate, speakText]); 
  // --- End handleSendMessage ---

  // ... useEffect for scroll ...
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Speech Recognition Setup Effect (Now after handleSendMessage) ---
  useEffect(() => {
    // Check for browser support (prefixed for Safari)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        setSpeechRecognitionSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Listen for a single utterance
        recognition.lang = 'en-US'; // Set language
        recognition.interimResults = false; // We only want the final result

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            console.log("Speech recognized:", transcript);
            if (transcript) {
                 handleSendMessage(null, transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            toast.error(`Speech recognition error: ${event.error}`);
            setIsListening(false); // Ensure listening state is reset on error
        };

        recognition.onend = () => {
            console.log("Speech recognition ended.");
            setIsListening(false); // Reset listening state when recognition ends
        };

        recognitionRef.current = recognition;
    } else {
        console.warn("Speech Recognition not supported by this browser.");
        setSpeechRecognitionSupported(false);
    }

    // Cleanup function to stop recognition if component unmounts while listening
    return () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };
  }, [handleSendMessage, isListening]); 
  // --- End Speech Recognition Setup Effect ---

  const handleDeleteTherapist = async () => {
    if (!selectedTherapist) return;

    const therapistIdToDelete = selectedTherapist.id;
    const therapistName = selectedTherapist.name;

    const { error } = await supabase
      .from('therapists')
      .delete()
      .eq('id', therapistIdToDelete);

    setIsDeleteDialogOpen(false); 

    if (error) {
      console.error("Error deleting therapist:", error);
      toast.error(`Failed to delete therapist: ${error.message}`);
    } else {
      toast.success(`Therapist "${therapistName}" deleted.`);
      onTherapistDeleted(therapistIdToDelete); // Notify parent
    }
  };

  // --- Speech Recognition Toggle Function ---
  const handleToggleListen = () => {
    if (!speechRecognitionSupported) {
        toast.error("Speech recognition is not supported by your browser.");
        return;
    }
    if (!recognitionRef.current) {
        console.error("SpeechRecognition instance not available.");
        return;
    }

    if (isListening) {
        console.log("Stopping speech recognition...");
        recognitionRef.current.stop();
        // onend handler will set isListening to false
    } else {
        console.log("Starting speech recognition...");
        try {
           // Ask for permission and start listening
           recognitionRef.current.start();
           setIsListening(true);
        } catch (error) {
           console.error("Error starting speech recognition:", error);
           toast.error("Could not start microphone. Check permissions?");
           setIsListening(false); // Reset if start fails
        }
    }
  };
  // --- End Speech Recognition Toggle Function ---

  if (!selectedTherapist) {
    return (
      <div className="flex flex-col h-full p-4 items-center justify-center">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Select a therapist to start chatting or create a new one.
        </p>
      </div>
    );
  }

  const selectedAvatarUrl = `https://api.dicebear.com/8.x/bottts/svg?seed=${selectedTherapist.id}`;

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 pb-4 pt-2 border-b flex items-center justify-between flex-shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2 sm:hidden"
          onClick={onBackClick}
        >
           <ChevronLeft className="h-5 w-5" />
           <span className="sr-only">Back to list</span>
         </Button>
        <h3 className="font-semibold flex-grow truncate">{selectedTherapist.name}</h3>
        <div className="ml-2 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon" className="h-8 w-8">
                 <MoreHorizontal className="h-4 w-4" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ScrollArea className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
           {isLoadingMessages && (
             <div className="flex justify-center items-center h-full">
               <p className="text-muted-foreground">Loading messages...</p>
             </div>
           )}
           {!isLoadingMessages && messages.map((message) => (
            <div 
              key={message.id}
              className={cn("flex items-start gap-3", message.sender === 'user' ? "justify-end" : "justify-start")}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8 border flex-shrink-0">
                  <AvatarImage src={selectedAvatarUrl} alt={`${selectedTherapist.name} avatar`} />
                  <AvatarFallback>{selectedTherapist.name.slice(0,1)}</AvatarFallback>
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
                 <Avatar className="h-8 w-8 border flex-shrink-0">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} /> 
         </div>
       </ScrollArea>

      <footer className="p-4 border-t flex-shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-start gap-2"
        >
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
            className="flex-grow resize-none min-h-[40px] max-h-[120px] overflow-y-auto"
          />
          {/* Microphone Button */}
          {speechRecognitionSupported && (
            <Button 
              type="button" 
              variant={isListening ? "destructive" : "outline"} // Change appearance when listening
              size="icon" 
              onClick={handleToggleListen}
              disabled={isLoadingResponse || isLoadingMessages} // Disable if sending/loading
            >
              <Mic className="h-4 w-4" />
              <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
            </Button>
          )}
          {/* Send Button */}
          <Button 
            type="submit" 
            size="icon" 
            disabled={!inputMessage.trim() || isLoadingResponse || isLoadingMessages}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </footer>

      <CreateTherapistDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        therapistToEdit={selectedTherapist} 
        onTherapistEdited={onTherapistEdited}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the therapist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTherapist}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TherapistsPage() {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [chatHistories, setChatHistories] = useState<{ [key: string]: DisplayMessage[] }>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const listRefresher = useRef(0);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedTherapist) return;

      if (chatHistories[selectedTherapist.id]) {
        return; 
      }

      setIsLoadingMessages(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoadingMessages(false); return; }

      const { data: dbMessages, error } = await supabase
        .from('chat_messages')
        .select('id, sender, content, created_at')
        .eq('user_id', user.id)
        .eq('therapist_id', selectedTherapist.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        setChatHistories(prev => ({ ...prev, [selectedTherapist.id]: [] }));
      } else {
        const displayMessages: DisplayMessage[] = dbMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender as 'user' | 'ai'
        }));

        if (displayMessages.length === 0) {
           displayMessages.push({
             id: 'initial-' + selectedTherapist.id,
             text: `Hello! I'm ${selectedTherapist.name}. What's on your mind today?`,
             sender: 'ai'
           });
        }
        
        setChatHistories(prev => ({ ...prev, [selectedTherapist.id]: displayMessages }));
      }
      setIsLoadingMessages(false);
    };

    loadMessages();

  }, [selectedTherapist, chatHistories]);

  const handleMessagesUpdate = (newMessages: DisplayMessage[]) => {
    if (selectedTherapist) {
      setChatHistories(prev => ({
        ...prev,
        [selectedTherapist.id]: newMessages
      }));
    }
  };

  const handleTherapistDeleted = useCallback(async (therapistId: string) => {
    setChatHistories(prev => ({
      ...prev,
      [therapistId]: []
    }));
    setSelectedTherapist(null);
    listRefresher.current += 1;
  }, []);

  const handleTherapistEdited = useCallback(async () => {
    listRefresher.current += 1;
    if (selectedTherapist) {
      const { data: updatedTherapist, error } = await supabase
        .from('therapists')
        .select('*')
        .eq('id', selectedTherapist.id)
        .single();
      
      if (error) {
        console.error("[TherapistsPage] Error refetching edited therapist:", error);
        toast.error("Couldn't refresh therapist details.");
      } else if (updatedTherapist) {
        setSelectedTherapist(updatedTherapist);
      } else {
        console.warn("[TherapistsPage] Refetch returned no data or therapist was deleted?");
      }
    } else {
        console.warn("[TherapistsPage] handleTherapistEdited called but no therapist was selected.");
    }
  }, [selectedTherapist]);

  const handleBackClick = () => {
    setSelectedTherapist(null);
  };

  const currentMessages = selectedTherapist ? chatHistories[selectedTherapist.id] || [] : [];

  return (
    <div className="relative h-full">

      <div 
        className={cn(
          "sm:hidden",
          selectedTherapist 
            ? "absolute inset-0 flex flex-col overflow-hidden bg-background z-20"
            : "h-full"
        )}
      > 
        {selectedTherapist ? (
          <ChatArea 
             selectedTherapist={selectedTherapist} 
             messages={currentMessages}
             isLoadingMessages={isLoadingMessages}
             onMessagesUpdate={handleMessagesUpdate}
             onTherapistDeleted={handleTherapistDeleted} 
             onTherapistEdited={handleTherapistEdited}
             onBackClick={handleBackClick}
           />
        ) : (
          <TherapistList 
             key={`mobile-${listRefresher.current}`}
             selectedTherapist={selectedTherapist}
             onSelectTherapist={setSelectedTherapist}
           />
        )}
      </div>

      <div className="h-full hidden sm:flex"> 
        <ResizablePanelGroup 
          direction="horizontal" 
          className="flex-grow min-h-0 rounded-lg border"
        >
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <TherapistList 
               key={`desktop-${listRefresher.current}`} 
               selectedTherapist={selectedTherapist}
               onSelectTherapist={setSelectedTherapist}
             />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75}>
            {selectedTherapist ? (
              <ChatArea 
                selectedTherapist={selectedTherapist} 
                messages={currentMessages}
                isLoadingMessages={isLoadingMessages}
                onMessagesUpdate={handleMessagesUpdate}
                onTherapistDeleted={handleTherapistDeleted} 
                onTherapistEdited={handleTherapistEdited}
                onBackClick={handleBackClick} 
              />
             ) : (
               <div className="flex flex-col h-full p-4 items-center justify-center">
                 <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">
                   Select a therapist to start chatting or create a new one.
                 </p>
               </div>
             )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

    </div>
  );
} 