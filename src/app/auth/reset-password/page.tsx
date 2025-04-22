'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track if user is authenticated via link
  const router = useRouter();

  // Check for session on mount and listen for SIGNED_IN event
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        setIsAuthenticated(true);
      }
    };

    checkSession(); // Initial check in case already authenticated

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && isMounted) {
        setIsAuthenticated(true);
        // No need to navigate, user is already on the correct page
        toast.info('Authenticated. You can now set a new password.');
      } else if (event === 'PASSWORD_RECOVERY' && isMounted) {
        // This event might fire first, confirming the recovery process started
        setIsAuthenticated(true); // Allow form display
        toast.info('Enter your new password.');
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setIsAuthenticated(false); // If somehow signed out
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Run only on mount

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsError(true);
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      // Enforce minimum length client-side too
      setMessage('Password must be at least 6 characters long.');
      setIsError(true);
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    const { error } = await supabase.auth.updateUser({ password });

    setIsLoading(false);

    if (error) {
      console.error('Password Update Error:', error);
      setMessage(`Error: ${error.message}`);
      setIsError(true);
      toast.error(`Error updating password: ${error.message}`);
    } else {
      setMessage('Password updated successfully! Redirecting to login...');
      setIsError(false);
      toast.success('Password updated successfully!');
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }
  };

  // Only show form if authenticated via magic link
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Verifying authentication...</p>
          <p className="text-sm text-muted-foreground">
            If you didn&apos;t click a password reset link, please request one first.
          </p>
          {/* Optionally add a link back to forgot password page */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Set New Password</h1>
          <p className="text-muted-foreground">Enter your new password below.</p>
        </div>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {message && (
            <p className={`text-sm text-center ${isError ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Set New Password'}
          </Button>
        </form>
      </div>
    </div>
  );
} 