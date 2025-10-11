import { Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate(user ? "/dashboard" : "/auth");
  };
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-5"></div>
      
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Your Personal <span className="gradient-hero bg-clip-text text-transparent">Safety Guardian</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-lg">
              Anytime, Anywhere. Real-time SOS alerts, geofencing, community helpers, and instant emergency response for women, students, and vulnerable groups.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gradient-hero shadow-glow text-lg px-8 py-6" onClick={handleButtonClick}>
                <Smartphone className="mr-2 h-5 w-5" />
                {user ? "Launch Dashboard" : "Get Started"}
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-primary">50K+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <p className="text-3xl font-bold text-success">10K+</p>
                <p className="text-sm text-muted-foreground">Lives Protected</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <p className="text-3xl font-bold text-warning">24/7</p>
                <p className="text-sm text-muted-foreground">Monitoring</p>
              </div>
            </div>
          </div>
          
          <div className="relative animate-scale-in">
            <div className="relative z-10 bg-card rounded-3xl shadow-2xl p-8 border">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=800&fit=crop" 
                alt="TriNetra App Interface"
                className="rounded-2xl w-full"
              />
              <div className="absolute -top-4 -right-4 bg-success text-success-foreground rounded-full p-4 shadow-lg animate-pulse">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <div className="absolute inset-0 gradient-hero opacity-20 blur-3xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
