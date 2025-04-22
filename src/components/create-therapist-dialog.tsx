'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Define Therapist type (could be shared)
type Therapist = {
  id: string;
  name: string;
  personality: number;
  // Add other fields if needed by the form
};

// Define props if needed, e.g., function to call after successful creation
interface CreateTherapistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTherapistCreated?: () => void; // For insert
  onTherapistEdited?: () => void;  // For update
  therapistToEdit?: Therapist | null; // Therapist data for editing
}

export function CreateTherapistDialog({
  open,
  onOpenChange,
  onTherapistCreated,
  onTherapistEdited,
  therapistToEdit,
}: CreateTherapistDialogProps) {
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState(0.5); // Default to middle
  const [isLoading, setIsLoading] = useState(false);

  // Determine if we are in edit mode
  const isEditMode = !!therapistToEdit;

  // Effect to populate form when opening in edit mode or reset when opening in create mode
  useEffect(() => {
    if (open) {
      if (isEditMode) {
        setName(therapistToEdit.name);
        setPersonality(therapistToEdit.personality);
      } else {
        // Reset form for create mode when dialog opens
        setName('');
        setPersonality(0.5);
      }
    }
    // Reset loading state when dialog closes or mode changes
    setIsLoading(false); 
  }, [open, therapistToEdit, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!name.trim()) {
      toast.error("Please enter a name for the therapist.");
      setIsLoading(false);
      return;
    }

    // console.log('Creating therapist:', { name, personality }); // Keep for debugging if needed

    // --- Add Supabase insert logic here ---
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("You must be logged in to create a therapist.");
        setIsLoading(false);
        return;
    }

    let error = null;
    if (isEditMode) {
      // --- UPDATE LOGIC ---
      const { error: updateError } = await supabase
        .from('therapists')
        .update({ name: name.trim(), personality: personality })
        .eq('id', therapistToEdit.id)
        .eq('user_id', user.id);
      error = updateError;
    } else {
      // --- INSERT LOGIC ---
      const { error: insertError } = await supabase
        .from('therapists')
        .insert([{ name: name.trim(), personality: personality, user_id: user.id }]);
      error = insertError;
    }

    setIsLoading(false);

    if (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} therapist:`, error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} therapist: ${error.message}`);
    } else {
      toast.success(`Therapist ${isEditMode ? 'updated' : 'created'}!`);
      // Resetting form is fine here, but let's keep it for now
      // setName(''); 
      // setPersonality(0.5);
      onOpenChange(false); // Close dialog on success
      
      // Call the appropriate callback
      if (isEditMode) {
        onTherapistEdited?.();
      } else {
        onTherapistCreated?.();
      }
    }
    // --- End Supabase Logic ---

  };

  // Handle slider change - expects an array
  const handleSliderChange = (value: number[]) => {
    setPersonality(value[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Trigger is usually outside, handled by parent state */}
      {/* <DialogTrigger asChild>
        <Button variant="outline">Create Therapist</Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Dynamic Title */}
          <DialogTitle>{isEditMode ? 'Edit Therapist' : 'Create New Therapist'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update the name and personality for ${therapistToEdit.name}.` : 'Give your new AI therapist a name and personality.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Dr. Honest"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="personality" className="text-right">
                Personality
              </Label>
              <div className="col-span-3">
                 <Slider
                    id="personality"
                    min={0} // Honest
                    max={1} // Forgiving
                    step={0.01}
                    value={[personality]} // Slider expects an array
                    onValueChange={handleSliderChange}
                    disabled={isLoading}
                    className="my-2" // Add some margin
                 />
                 <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Honest</span>
                    <span>Forgiving</span>
                 </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Therapist')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 