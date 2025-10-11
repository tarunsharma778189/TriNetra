import { Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <Shield className="h-20 w-20 mx-auto text-primary animate-pulse" />
          
          <h2 className="text-4xl md:text-5xl font-bold">
            Join 50,000+ Indians Who Feel Safer Every Day
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Download TriNetra now and experience peace of mind. Your safety is our priority, and it's completely free to start.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" className="gradient-hero shadow-glow text-lg px-10 py-6">
              <Download className="mr-2 h-5 w-5" />
              Download for Android
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-10 py-6">
              <Download className="mr-2 h-5 w-5" />
              Download for iOS
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              Free Forever
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              No Credit Card
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              Privacy First
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
