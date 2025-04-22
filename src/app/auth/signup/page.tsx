'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Import Image for optimized images
import { supabase } from '@/lib/supabase/client';
import { SignupForm } from '@/components/signup-form'; // Use the correct form component
// Removed unused Gallery icon import if logo is removed
// import { GalleryVerticalEnd } from 'lucide-react';

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (email: string, password: string, nickname: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Store nickname in metadata
        data: { nickname: nickname }
      },
    });

    setIsLoading(false);

    if (error) {
      console.error('Supabase Signup Error:', error);
      setErrorMessage(error.message);
    } else if (data.user) {
      // Sign up successful (and user is logged in because email confirmation is off)
      // Redirect to onboarding
      router.push('/onboarding/info');
      router.refresh();
    } else {
       console.error('Supabase Signup Success but no user data:', data);
       setErrorMessage('Signup failed unexpectedly. Please try again.');
    }
  };

  return (
    // Removed min-h-svh from grid
    <div className="grid lg:grid-cols-2">
       {/* Reduced padding, removed logo block */}
      <div className="flex flex-col gap-4 p-6 min-h-screen justify-center"> {/* Use justify-center */}
         {/* Removed Logo block */}
         {/* <div className="flex justify-center gap-2 md:justify-start"> ... </div> */}

         <div className="flex flex-col items-center justify-center"> {/* Center form container */}
          <div className="w-full max-w-xs">
            <SignupForm
              onSubmit={handleSignup}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
         {/* Make sure shrek-face.jpg is in /public */}
        <Image
          src="/shrek-face.jpg"
          alt="Cover image"
          layout="fill" // Use layout="fill" for absolute positioning
          objectFit="cover" // Cover the container
          className="dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
} 