import { Shield, MapPin, Users, Award, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://i.postimg.cc/W4z7VwzW/Gemini-Generated-Image-hczaojhczaojhcza-1.png" alt="TriNetra Logo" className="h-20 w-20" />
            <span className="text-xl font-bold">TriNetra</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-smooth">Features</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-smooth">How It Works</a>
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gradient-hero">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>

      <footer className="bg-muted py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="https://i.postimg.cc/W4z7VwzW/Gemini-Generated-Image-hczaojhczaojhcza-1.png" alt="TriNetra Logo" className="h-16 w-16" />
                <span className="font-bold">TriNetra</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Personal Safety Guardian – Anytime, Anywhere
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-smooth">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-smooth">How It Works</a></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-smooth">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-smooth">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Emergency</h3>
              <p className="text-sm text-muted-foreground mb-2">India Emergency Numbers:</p>
              <p className="text-sm font-semibold text-destructive">Police: 100</p>
              <p className="text-sm font-semibold text-destructive">Women Helpline: 1091</p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 TriNetra. Built for India's Safety. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
