'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingInfoPage() {
  const [ageRange, setAgeRange] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageRange) {
      toast.error("Please select an age range.");
      return;
    }
    setIsLoading(true);
    toast.dismiss();

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error(sessionError?.message || "Could not get user session. Please log in again.");
      }
      const userId = session.user.id;

      const { error: updateError } = await supabase
        .from('users')
        .update({ age_range: ageRange })
        .eq('id', userId);

      if (updateError) {
        console.error("Error updating user profile:", updateError);
        throw new Error(`Failed to save age range: ${updateError.message}`);
      }

      toast.success("Age range saved!");
      router.push('/onboarding/background');

    } catch (error) {
      console.error("Onboarding submit error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl sm:text-3xl font-semibold">A Little About You</CardTitle>
            <CardDescription>This helps us understand you better.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="font-medium text-left block">How old are you?</Label>
              <RadioGroup
                value={ageRange}
                onValueChange={setAgeRange}
                className="flex flex-col space-y-1"
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="under-18" id="r1" disabled={isLoading}/>
                  <Label htmlFor="r1">Under 18</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="18-24" id="r2" disabled={isLoading}/>
                  <Label htmlFor="r2">18-24</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="25-34" id="r3" disabled={isLoading}/>
                  <Label htmlFor="r3">25-34</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="35-44" id="r4" disabled={isLoading}/>
                  <Label htmlFor="r4">35-44</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="45+" id="r5" disabled={isLoading}/>
                  <Label htmlFor="r5">45+</Label>
                </div>
              </RadioGroup>
            </div>
            <p className="text-sm text-muted-foreground text-center pt-4">
              Next, you&apos;ll have an optional space to share a bit about your background.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              type="submit"
              className="w-full"
              disabled={!ageRange || isLoading}
              size="lg"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Saving...' : 'Next: Background Info'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 