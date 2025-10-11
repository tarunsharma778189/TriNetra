import { UserPlus, MapPinned, AlertCircle, Headphones } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Register & Setup",
    description: "Create your account, add emergency contacts, and customize your safety preferences in minutes."
  },
  {
    icon: MapPinned,
    number: "02",
    title: "Set Safe Zones",
    description: "Mark your safe locations on the map - home, work, school. Get alerts when you enter or leave these zones."
  },
  {
    icon: AlertCircle,
    number: "03",
    title: "Activate SOS / Auto Alert",
    description: "Trigger instant SOS with one tap or let automatic alerts activate when you leave safe zones unexpectedly."
  },
  {
    icon: Headphones,
    number: "04",
    title: "Help Arrives Fast",
    description: "Emergency contacts, nearby helpers, and authorities receive your location instantly. Community responds in real-time."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How TriNetra Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple 4-step process to complete safety in your pocket
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
              )}
              
              <div className="relative bg-card rounded-2xl p-6 border-2 hover:border-primary transition-smooth hover:shadow-lg">
                <div className="inline-flex p-4 rounded-xl gradient-hero mb-4">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                
                <div className="text-6xl font-bold text-primary/10 absolute top-4 right-4">
                  {step.number}
                </div>
                
                <h3 className="text-xl font-bold mb-2 relative z-10">{step.title}</h3>
                <p className="text-muted-foreground relative z-10">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
