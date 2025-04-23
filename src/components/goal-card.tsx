'use client';

import React from 'react';
// Assuming Goal type is in lib/types.ts or defined elsewhere accessible
import { Goal } from '@/lib/types'; 
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; 
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"; 

interface GoalCardProps {
  goal: Goal;
  onUpdateStatus: (id: string, newStatus: Goal['status']) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export function GoalCard({ goal, onUpdateStatus, onEdit, onDelete }: GoalCardProps) {

  const getStatusColorClasses = (status: Goal['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'To Do':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
    }
  };

  return (
    <div 
      className={cn(
        "border p-4 rounded-md shadow-sm bg-card flex flex-col gap-2 relative",
        goal.status === 'Completed' ? 'opacity-60' : '' // Dim completed goals
      )}
    >
      {/* Main content area */}
      <div className="flex-grow flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold break-words mr-2">{goal.title}</h3>
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()} > 
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 flex-shrink-0 absolute top-2 right-2 opacity-50 hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Goal Actions</span>
              </Button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}> 
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(goal)} className="text-red-600 focus:text-red-700 focus:bg-red-100/50 dark:focus:text-red-300 dark:focus:bg-red-900/50">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {goal.description && (
          <p className="text-sm text-muted-foreground break-words">
            {goal.description}
          </p>
        )}
      </div>

      {/* Footer with status, due date, and complete button */}
      <div className="flex justify-between items-center mt-auto pt-2 text-xs">
        <div className="flex items-center gap-2">
          <span 
            className={cn("px-2 py-0.5 rounded-full font-medium", getStatusColorClasses(goal.status))}
          >
            {goal.status}
          </span>
           {/* Add Check Button Here */}
          {goal.status !== 'Completed' && (
             <Button 
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100/50 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-900/30"
                onClick={(e) => {
                   e.stopPropagation(); 
                   onUpdateStatus(goal.id, 'Completed');
                }}
                title="Mark as Completed"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="sr-only">Mark as Completed</span>
              </Button>
           )}
        </div>
        {goal.due_date && (
          <span className="text-muted-foreground">
            Due: {new Date(goal.due_date + 'T00:00:00').toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
} 