// src/lib/types.ts

// Define the Goal type based on the database schema
export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'To Do' | 'In Progress' | 'Completed';
  due_date: string | null; 
  created_at: string;
};

// Add other shared types here in the future 