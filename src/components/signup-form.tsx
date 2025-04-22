'use client';

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupFormProps extends Omit<React.ComponentPropsWithoutRef<"form">, 'onSubmit'> {
  onSubmit: (email: string, password: string, nickname: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  className?: string;
}

export function SignupForm({
  className,
  onSubmit,
  isLoading,
  errorMessage,
  ...props
}: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, nickname);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your details below to create your account
        </p>
      </div>
      <div className="grid gap-4">
         <div className="grid gap-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            placeholder="Your preferred name"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
           <Label htmlFor="password">Password</Label>
           <Input
             id="password"
             type="password"
             required
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             disabled={isLoading}
           />
        </div>
         {errorMessage && (
           <p className="text-sm text-red-600 text-center">{errorMessage}</p>
         )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </div>
    </form>
  );
} 