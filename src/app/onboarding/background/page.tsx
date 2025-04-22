'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';

export default function OnboardingBackgroundPage() {
  const [backgroundInfo, setBackgroundInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSaveAndContinue = async () => {
    setIsLoading(true);
    toast.dismiss();

    if (!backgroundInfo.trim()) {
       handleSkip();
       return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error(sessionError?.message || "Could not get user session.");
      }
      const userId = session.user.id;

      const { error: updateError } = await supabase
        .from('users')
        .update({ background_info: backgroundInfo.trim() })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to save background info: ${updateError.message}`);
      }

      toast.success("Background info saved!");
      router.push('/onboarding/issues');

    } catch (error) {
      console.error("Background info save error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/issues');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-semibold">Share a Bit More? (Optional)</CardTitle>
          <CardDescription>
            Providing some background can help your AI therapist understand you better,
            but feel free to skip this.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Label htmlFor="background-info" className="font-medium">Your Background</Label>
          <Textarea
            id="background-info"
            placeholder="Anything you'd like your therapist to know? (e.g., past experiences, current challenges, what brings you here...)"
            value={backgroundInfo}
            onChange={(e) => setBackgroundInfo(e.target.value)}
            rows={6}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
             You can always update this later in your profile.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
           <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
              Skip for Now
           </Button>
          <Button onClick={handleSaveAndContinue} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 