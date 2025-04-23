'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CreateGoalDialog } from '@/components/create-goal-dialog'; // Import the dialog
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Goal } from '@/lib/types'; // Add this import back
import { toast } from 'sonner'; 
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { GoalCard } from '@/components/goal-card'; // Ensure this import exists

export default function GoalsPage() {
  // Rename state for clarity now that dialog is reused
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  // State for editing
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("GoalsPage: User not logged in");
      setIsLoading(false);
      setGoals([]); // Clear goals if user logs out
      return;
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }); // Show newest first

    if (error) {
      console.error("Error fetching goals:", error);
      setGoals([]);
    } else {
      setGoals(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Called after create or update
  const handleGoalSaved = () => {
    fetchGoals(); 
    setGoalToEdit(null); // Clear goalToEdit after saving
  };

  // ... handleUpdateStatus function ...
  const handleUpdateStatus = async (id: string, newStatus: Goal['status']) => {
    // Optimistic UI Update
    const originalGoals = [...goals];
    setGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.id === id ? { ...goal, status: newStatus } : goal
      )
    );

    // Update Database
    const { error } = await supabase
      .from('goals')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error("Error updating goal status:", error);
      toast.error(`Failed to update goal status: ${error.message}`);
      setGoals(originalGoals);
    } else {
      toast.success("Goal status updated!");
    }
  };

  // Opens the dialog for editing
  const handleEditGoal = (goal: Goal) => {
    setGoalToEdit(goal);      // Set the goal to edit
    setIsGoalDialogOpen(true); // Open the dialog
  };

  // ... handleRequestDelete function ...
  const handleRequestDelete = (goal: Goal) => {
    setGoalToDelete(goal);
    setIsDeleteDialogOpen(true);
  };

  // ... handleConfirmDelete function ...
  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;
    const goalId = goalToDelete.id;
    const goalTitle = goalToDelete.title;
    setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
    setGoalToDelete(null);
    setIsDeleteDialogOpen(false);
    const { error } = await supabase.from('goals').delete().eq('id', goalId);
    if (error) {
      console.error("Error deleting goal:", error);
      toast.error(`Failed to delete goal: ${error.message}`);
      fetchGoals(); 
    } else {
      toast.success(`Goal "${goalTitle}" deleted.`);
    }
  };

  // Function to close the main dialog and clear goalToEdit
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setGoalToEdit(null); // Clear editing state when dialog closes
    }
    setIsGoalDialogOpen(open);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h1 className="text-2xl font-semibold">Your Goals</h1>
        {/* Ensure this button clears goalToEdit before opening for create */}
        <Button onClick={() => { setGoalToEdit(null); setIsGoalDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Goal
        </Button>
      </div>

      {/* Goals display using GoalCard */}
      <div className="flex-grow overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        ) : goals.length === 0 ? (
          <p className="text-muted-foreground text-center mt-10">
            You haven&apos;t added any goals yet. Click &quot;Add Goal&quot; to start.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onUpdateStatus={handleUpdateStatus}
                onEdit={handleEditGoal}       
                onDelete={handleRequestDelete} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Use the adapted CreateGoalDialog */}
      <CreateGoalDialog
        open={isGoalDialogOpen}        // Use renamed state
        onOpenChange={handleDialogClose} // Use custom close handler
        onGoalSaved={handleGoalSaved}     // Use renamed prop
        goalToEdit={goalToEdit}         // Pass the goal to edit
      />

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the goal
              <span className="font-medium"> &quot;{goalToDelete?.title}&quot;</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGoalToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
} 