'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CreateGoalDialog } from '@/components/create-goal-dialog'; // Import the dialog
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

// Define the Goal type based on the database schema
export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null; // Can be null
  status: 'To Do' | 'In Progress' | 'Completed'; // Specific statuses
  due_date: string | null; // Using string for date initially, can refine later
  created_at: string;
};

export default function GoalsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleGoalCreated = () => {
    fetchGoals(); // Refetch goals after one is created
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h1 className="text-2xl font-semibold">Your Goals</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Goal
        </Button>
      </div>

      {/* Goals Display Area */}
      <div className="flex-grow overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        ) : goals.length === 0 ? (
          <p className="text-muted-foreground text-center mt-10">
            You haven't added any goals yet. Click "Add Goal" to start.
          </p>
        ) : (
          <div className="space-y-4">
            {/* TODO: Replace with actual Goal Card component */}
            {goals.map((goal) => (
              <div key={goal.id} className="border p-4 rounded-md shadow-sm bg-card">
                 <h3 className="font-semibold">{goal.title}</h3>
                 {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
                 <div className="flex justify-between items-center mt-3 text-xs">
                   <span className={`px-2 py-0.5 rounded-full ${goal.status === 'Completed' ? 'bg-green-100 text-green-800' : goal.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                     {goal.status}
                   </span>
                   {goal.due_date && <span className="text-muted-foreground">Due: {new Date(goal.due_date + 'T00:00:00').toLocaleDateString()}</span>}
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>

      <CreateGoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onGoalCreated={handleGoalCreated}
      />
    </div>
  );
} 