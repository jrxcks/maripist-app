'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, TrendingUp, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      console.log("[Dashboard] Fetched user metadata nickname:", session?.user?.user_metadata?.nickname);
    };
    fetchUser();
  }, []);

  const userNickname = user?.user_metadata?.nickname || 'there';

  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return 'morning';
    } else if (currentHour < 17) {
      return 'today';
    } else {
      return 'this evening';
    }
  };

  const timeGreeting = getTimeBasedGreeting();

  return (
    <div className="space-y-6">
      <Card className="bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-green-900 dark:text-green-100">
            How do you feel, {timeGreeting} {userNickname}?
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">Please, mark your mood today</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => router.push('/therapists')}
            className="bg-lime-300 hover:bg-lime-400 text-lime-900 font-semibold"
          >
            Mark now
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mood chart</CardTitle>
              <CardDescription>Track your mood easily</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              <TrendingUp className="h-16 w-16" />
              <p className="ml-4">Mood chart data will appear here.</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Daily goals</CardDescription>
                <CardTitle className="text-4xl">65%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={65} aria-label="65% complete" />
              </CardContent>
              <CardFooter>
                 <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground">View details</Button>
               </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                 <CardDescription>Daily reading</CardDescription>
                 <CardTitle>7 min</CardTitle>
               </CardHeader>
               <CardContent className="flex justify-center items-center">
                 <CheckCircle className="h-10 w-10 text-green-500"/>
               </CardContent>
             </Card>
             <Card>
               <CardHeader>
                 <CardDescription>Daily meditation</CardDescription>
                 <CardTitle>5 min</CardTitle>
               </CardHeader>
               <CardContent className="flex justify-center items-center">
                 <Button variant="outline" size="icon">
                   <PlayCircle className="h-6 w-6" />
                 </Button>
               </CardContent>
             </Card>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-0 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled</CardTitle>
              <CardDescription>Upcoming sessions and activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-muted rounded-lg p-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Session with a psychologist</p>
                  <p className="text-xs text-muted-foreground">17 June 2022 | 10:00 - 11:00</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="bg-muted rounded-lg p-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Webinar &quot;Find a confidence&quot;</p>
                  <p className="text-xs text-muted-foreground">20 June 2022 | 17:00 - 18:00</p>
                </div>
              </div>
            </CardContent>
             <CardFooter>
               <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground w-full justify-end">View all</Button>
             </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 