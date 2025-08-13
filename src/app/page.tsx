import { Navbar } from "@/components/Navbar";
import Hero from "@/components/Hero";
import Feature3 from "@/components/mvpblocks/feature-3";
import SimplePricing from "@/components/mvpblocks/simple-pricing";
import Faq3 from "@/components/mvpblocks/faq-3";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Feature3 />
      <SimplePricing />
      <Faq3 />
    </main>
  );
}
