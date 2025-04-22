'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation'; // Import useRouter

// Sample issues - replace with actual data and icons later
const issues = [
  { id: 'anxiety', label: 'Anxiety', icon: '😟' },
  { id: 'stress', label: 'Stress', icon: '🤯' },
  { id: 'relationships', label: 'Relationships', icon: '💔' },
  { id: 'depression', label: 'Depression', icon: '😞' },
  { id: 'focus', label: 'Focus', icon: '🎯' },
  { id: 'sleep', label: 'Sleep', icon: '😴' },
  { id: 'other', label: 'Something Else', icon: '❓' },
];

export default function IssueSelectionPage() {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const router = useRouter(); // Initialize router

  const toggleIssue = (issueId: string) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId) 
        : [...prev, issueId]
    );
  };

  const handleNext = () => {
    console.log('Selected issues:', selectedIssues);
    // TODO: Save selected issues
    router.push('/chat'); // Navigate to chat page
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <form onSubmit={handleNext} className="w-full max-w-lg">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">What&apos;s been on your mind?</h1>
              <p className="text-sm text-muted-foreground">Select any areas you&apos;d like to focus on. You can change these later.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {issues.map((issue) => (
                <Card 
                  key={issue.id}
                  onClick={() => toggleIssue(issue.id)}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedIssues.includes(issue.id) ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"
                  )}
                >
                  <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6">
                    <div className="text-4xl mb-2">{issue.icon}</div>
                    <p className="text-sm sm:text-base font-medium text-center">{issue.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              type="submit"
              disabled={selectedIssues.length === 0} 
              className="w-full"
            >
              Start Session
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 