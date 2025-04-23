'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Calendar as CalendarIcon, Star, BookOpen, Users, Bot,
  MessageSquare, Settings, Search, Bell,
  Menu
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import ProfileSettingsModal from '@/components/profile-settings-modal';

// SidebarLink component (can be kept here or moved to its own file)
function SidebarLink({ href, icon: Icon, children }: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  // TODO: Add active state based on current route
  return (
    <Button variant="ghost" className="justify-start" asChild>
      <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <Icon className="h-4 w-4" />
        {children}
      </Link>
    </Button>
  );
}

// Context Definition (should be here)
interface ProfileModalContextType {
  isProfileModalOpen: boolean;
  toggleProfileModal: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextType | undefined>(undefined);

// Custom hook for easy context usage (optional, can remove if not used externally)
export const useProfileModal = () => {
  const context = useContext(ProfileModalContext);
  if (context === undefined) {
    throw new Error('useProfileModal must be used within a ProfileModalProvider');
  }
  return context;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch user data on layout mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
       setUser(session?.user ?? null);
       if (event === 'SIGNED_OUT') {
         router.push('/auth/login');
       }
     });
     return () => {
       authListener?.subscription?.unsubscribe();
     };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Derive user details for header
  const userNickname = user?.user_metadata?.nickname;
  const userEmail = user?.email;
  const avatarFallback = userNickname ? userNickname.slice(0, 2).toUpperCase() : (userEmail ? userEmail.slice(0, 2).toUpperCase() : 'U');

  const toggleProfileModal = () => {
    setIsProfileModalOpen(prev => !prev);
  };

  // Define navigation items centrally
  const mainNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/goals", label: "Goals", icon: Star },
    { href: "/therapists", label: "Therapists", icon: Bot },
    { href: "/education", label: "Education", icon: BookOpen },
    { href: "/specialists", label: "Specialists", icon: Users },
  ];

  const secondaryNavItems = [
    { href: "/support", label: "Support", icon: MessageSquare },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <ProfileModalContext.Provider value={{ isProfileModalOpen, toggleProfileModal }}>
      <div className={cn("flex h-dvh w-full bg-muted/40")}>
        {/* --- Sidebar (Desktop) --- */}
        <aside className="hidden w-60 flex-col border-r bg-background p-4 sm:flex">
          <div className="mb-6 flex h-16 items-center justify-start px-2">
            <Link href="/" className="flex items-center gap-2 font-semibold">
               <span className="">Maripist</span>
            </Link>
          </div>
          {/* Use map for main nav */}
          <nav className="flex flex-1 flex-col gap-1">
             {mainNavItems.map(item => (
               <SidebarLink key={item.href} href={item.href} icon={item.icon}>
                 {item.label}
               </SidebarLink>
             ))}
          </nav>
          {/* Use map for secondary nav */}
          <nav className="mt-auto flex flex-col gap-1">
            {secondaryNavItems.map(item => (
              <SidebarLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </SidebarLink>
            ))}
          </nav>
        </aside>

        {/* --- Main content area --- */}
        <div className="flex flex-1 flex-col">
          {/* --- Header --- */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
            {/* Hamburger Menu Trigger (Mobile) */}
             <div className="sm:hidden mr-2">
               <Sheet>
                 <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 sm:hidden" // Show only on small screens
                    >
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                 </SheetTrigger>
                 <SheetContent side="left" className="flex flex-col">
                   {/* Add Screen-Reader Only Title */}
                   <SheetTitle className="sr-only">Navigation Menu</SheetTitle> 
                   {/* Mobile Navigation inside Sheet */}
                    <nav className="grid gap-4 text-lg font-medium">
                      <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-semibold mb-4 pt-4 pl-3" 
                      >
                        <span>Maripist</span>
                      </Link>
                      {/* Map over main items */}
                      {mainNavItems.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                          <item.icon className="h-5 w-5" /> 
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                    {/* Map over secondary items */}
                    <nav className="mt-auto grid gap-4 text-lg font-medium">
                       {secondaryNavItems.map(item => (
                         <Link
                           key={item.href}
                           href={item.href}
                           className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                         >
                           <item.icon className="h-5 w-5" /> 
                           {item.label}
                         </Link>
                       ))}
                    </nav>
                 </SheetContent>
               </Sheet>
             </div>

            {/* Search Input (keep its relative positioning) */}
            <div className="relative flex-1 md:grow-0 sm:ml-4"> {/* Added margin for spacing */} 
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search something..."
                className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>

            {/* Right-side Header Items (Notifications, User Dropdown) */}
            <div className="ml-auto flex items-center gap-4"> {/* Use ml-auto to push to the right */} 
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Toggle notifications</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   {/* Use Button for better trigger behavior than wrapping Avatar directly */}
                   <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder-user.jpg"} alt="User avatar" />
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{userEmail || 'My Account'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={toggleProfileModal}>
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/support')}>
                    <span>Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut}>
                     <span>Sign out</span>
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content Rendered Here - Remove ALL padding */}
          <main className="flex-1 overflow-y-auto hide-scrollbar">
              {children}
          </main>
          <ProfileSettingsModal 
            open={isProfileModalOpen} 
            onOpenChange={setIsProfileModalOpen} 
          />
        </div>
      </div>
    </ProfileModalContext.Provider>
  );
} 