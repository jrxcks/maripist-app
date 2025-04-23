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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Goal } from '@/lib/types';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalSaved: () => void;
  goalToEdit?: Goal | null;
}

export function CreateGoalDialog({ open, onOpenChange, onGoalSaved, goalToEdit }: CreateGoalDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'To Do' | 'In Progress' | 'Completed'>('To Do');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (goalToEdit && open) {
      setTitle(goalToEdit.title);
      setDescription(goalToEdit.description || '');
      setStatus(goalToEdit.status);
      setDueDate(goalToEdit.due_date ? new Date(goalToEdit.due_date + 'T00:00:00') : undefined);
    } else if (!goalToEdit) {
      setTitle('');
      setDescription('');
      setStatus('To Do');
      setDueDate(undefined);
    }
  }, [goalToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a goal title.');
      return;
    }

    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to save a goal.');
      setIsLoading(false);
      return;
    }

    const formattedDueDate = dueDate ? dueDate.toISOString().split('T')[0] : null;
    const goalData = {
      title: title.trim(),
      description: description.trim() || null,
      status: status,
      due_date: formattedDueDate,
    };
    const goalDataForInsert = { ...goalData, user_id: user.id };

    let error;
    if (goalToEdit) {
      const { error: updateError } = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', goalToEdit.id)
        .eq('user_id', user.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('goals')
        .insert(goalDataForInsert);
      error = insertError;
    }

    setIsLoading(false);

    if (error) {
      console.error("Error saving goal:", error);
      toast.error(`Failed to ${goalToEdit ? 'update' : 'create'} goal: ${error.message}`);
    } else {
      toast.success(`Goal ${goalToEdit ? 'updated' : 'created'} successfully!`);
      onGoalSaved();
      onOpenChange(false);
    }
  };

  const dialogTitle = goalToEdit ? "Edit Goal" : "Create New Goal";
  const dialogDescription = goalToEdit ? "Update the details of your goal." : "Define your new goal here. Click save when you&apos;re done.";
  const buttonText = goalToEdit ? "Save Changes" : "Save Goal";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-1">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="(Optional) Add more details..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={(value: 'To Do' | 'In Progress' | 'Completed') => setStatus(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due-date" className="text-right">
                Due Date
              </Label>
              <DatePicker 
                date={dueDate} 
                onSelect={setDueDate} 
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Saving...' : buttonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 