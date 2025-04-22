'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Import next/image
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { GalleryVerticalEnd } from 'lucide-react'; // Removed unused import
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
// import { toast } from 'sonner';
import { LoginForm } from '@/components/login-form'; // Import the new form component
// Remove unused imports from previous version
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent, email: string, password: string) => {
    // e is already prevented default in the form component
    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    console.log('Login attempt finished.');
    console.log('Supabase error object:', error);

    if (error) {
      console.log('Login error branch entered.');
      console.error('Supabase Login Error:', error);
      setErrorMessage(error.message);
    } else {
      console.log('Login success branch entered.');
      console.log("SUCCESS: Redirecting to /dashboard NOW!");
      
      // Login successful. Explicitly redirect to the dashboard.
      router.push('/dashboard');
      // router.refresh(); // Temporarily remove router.refresh()
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-xs">
           {/* Pass the handler and state to the LoginForm */}
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
           {/* Add link to Sign Up page */}
           <div className="mt-4 text-center text-sm">
             Don&apos;t have an account?{" "}
             <Link href="/auth/signup" className="underline underline-offset-4">
               Sign up
             </Link>
           </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {/* Replace img with Image */}
        <Image
          src="/placeholder.svg" // Keep src as is for now
          alt="Image"
          width="1920" // Provide width
          height="1080" // Provide height
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
} 