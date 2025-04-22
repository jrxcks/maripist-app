'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Removed DialogTrigger as it's handled externally
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Use default export for consistency or named export if preferred
export default function ProfileSettingsModal({ open, onOpenChange }: ProfileSettingsModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');

  // Fetch user data when the modal is opened
  useEffect(() => {
    if (open) {
      const fetchUserData = async () => {
        setIsLoading(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          setEmail(currentUser.email || '');
          setNickname(currentUser.user_metadata?.nickname || '');
        } else {
          toast.error("User not found. Please log in again.");
          onOpenChange(false); // Close modal if user fetch fails
        }
        setIsLoading(false);
      };
      fetchUserData();
    } else {
        setIsLoading(true); 
    }
  }, [open, onOpenChange]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    
    // Define type for updates object, including data property
    const updates: { email?: string; data?: Record<string, unknown> } = {}; 
    let emailChanged = false;

    if (email !== user.email) {
      updates.email = email;
      emailChanged = true;
    }

    const currentNickname = user.user_metadata?.nickname || '';
    if (nickname !== currentNickname) {
      // Ensure data object exists and assign metadata with correct type
      if (!updates.data) {
          updates.data = { ...(user.user_metadata as Record<string, unknown>) }; 
      }
      updates.data.nickname = nickname;
    }

    if (Object.keys(updates).length === 0) {
      toast.info("No changes to save.");
      setIsSaving(false);
      return;
    }

    // Remove unused 'data' destructuring
    const { error } = await supabase.auth.updateUser(updates);

    setIsSaving(false);

    if (error) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error.message}`);
    } else {
      if (updates.data) {
        setUser(prevUser => prevUser ? { ...prevUser, user_metadata: { ...prevUser.user_metadata, ...updates.data } } : null);
      }
      toast.success("Profile updated successfully!");
      if (emailChanged) {
        toast.info("Please check both your old and new email addresses to confirm the change.");
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Update your profile details here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
        ) : (
            <form onSubmit={handleProfileUpdate}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">Email changes require confirmation.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input 
                    id="nickname" 
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="How should we call you?"
                    disabled={isSaving}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 