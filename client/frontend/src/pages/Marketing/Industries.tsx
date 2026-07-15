import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  Landmark,
  Heart,
  GraduationCap,
  Plane,
  Smartphone,
  CloudCog,
  Building2,
  Home,
  Briefcase,
} from "lucide-react";

const industries = [
  { icon: ShoppingCart, name: "E-commerce", desc: "Handle order inquiries, returns, and support at scale." },
  { icon: Landmark, name: "Banking & Finance", desc: "Secure, compliant support for financial services." },
  { icon: Heart, name: "Healthcare", desc: "Appointment scheduling and patient support automation." },
  { icon: GraduationCap, name: "Education", desc: "Student support and administrative query handling." },
  { icon: Plane, name: "Travel & Hospitality", desc: "Booking support and real-time travel assistance." },
  { icon: Smartphone, name: "Telecommunications", desc: "Technical support and billing inquiry automation." },
  { icon: CloudCog, name: "SaaS", desc: "Onboarding, troubleshooting, and user retention." },
  { icon: Building2, name: "Government", desc: "Citizen services and public inquiry management." },
  { icon: Home, name: "Real Estate", desc: "Property inquiries and client communication." },
  { icon: Briefcase, name: "Enterprise", desc: "Custom solutions for large organizations." },
];

export default function Industries() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Industries We Serve</h1>
        <p className="text-lg text-muted-foreground">
          Tailored AI support solutions for businesses across every sector.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {industries.map((industry) => (
          <Card key={industry.name} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <industry.icon className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">{industry.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{industry.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}