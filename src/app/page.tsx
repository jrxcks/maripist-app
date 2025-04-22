import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Maripist</h1>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/auth/login">Sign In / Sign Up</Link>
        </Button>
      </div>
    </main>
  );
}
