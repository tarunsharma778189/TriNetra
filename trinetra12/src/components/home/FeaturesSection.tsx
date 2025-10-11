import { Shield, MapPin, Users, Award, Clock, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "SOS Emergency Alert",
    description: "One-tap emergency button sends instant alerts to your contacts, nearby helpers, and emergency services with your exact location.",
    gradient: "gradient-danger"
  },
  {
    icon: MapPin,
    title: "Smart Geofencing",
    description: "Set safe zones and get automatic alerts when you enter or leave designated areas. Auto-trigger SOS if you deviate from safe routes.",
    gradient: "gradient-hero"
  },
  {
    icon: Users,
    title: "Community Helpers Network",
    description: "Connect with verified helpers within 500m radius. Build a safety network of trusted community members ready to assist.",
    gradient: "gradient-safe"
  },
  {
    icon: Clock,
    title: "Timer Check-In",
    description: "Set safety timers for your journeys. Auto-alert contacts if you don't check-in on time with PIN or face verification.",
    gradient: "gradient-hero"
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description: "Instant push notifications, SMS, and calls to emergency contacts. Multi-channel alerts ensure help arrives fast.",
    gradient: "gradient-danger"
  },
  {
    icon: Award,
    title: "Rewards for Helpers",
    description: "Earn reward points for helping others in need. Redeem points for exclusive benefits and recognition in the community.",
    gradient: "gradient-safe"
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful Safety Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive protection tools designed specifically for India's safety needs
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-lg transition-smooth hover:-translate-y-1 animate-fade-in border-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.gradient} mb-4`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
