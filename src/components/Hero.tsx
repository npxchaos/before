"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import Beams from "@/components/ui/Beams";

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Beams */}
      <div className="absolute inset-0 -z-10">
        <Beams />
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Transform Your Content with AI-Powered AEO
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Leverage artificial intelligence to optimize your content for AI search engines. 
          Get better rankings, more traffic, and higher engagement with our advanced AEO platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
          ) : (
            <>
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <a href="/signup">Get Started Free</a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <a href="/login">Sign In</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}


