import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  Languages,
  Database,
  MessageCircle,
  Mail,
  Headphones,
  HeartPulse,
  Cloud,
  Workflow,
  LayoutDashboard,
} from "lucide-react";

const features = [
  { icon: Brain, title: "AI-powered conversations", desc: "Natural language understanding for human-like interactions." },
  { icon: Languages, title: "Multi-language support", desc: "Communicate with customers in their preferred language." },
  { icon: Database, title: "CRM integration", desc: "Sync with popular CRM platforms for unified customer data." },
  { icon: MessageCircle, title: "WhatsApp integration", desc: "Reach customers on their favorite messaging app." },
  { icon: Mail, title: "Email automation", desc: "Smart email responses and automated follow-ups." },
  { icon: Headphones, title: "Voice support", desc: "AI-powered voice assistance for phone support." },
  { icon: HeartPulse, title: "Sentiment analysis", desc: "Detect customer emotions and respond appropriately." },
  { icon: Cloud, title: "Secure cloud infrastructure", desc: "Enterprise-grade security and compliance." },
  { icon: Workflow, title: "Custom workflows", desc: "Build automation tailored to your business processes." },
  { icon: LayoutDashboard, title: "Dashboard and reporting", desc: "Real-time insights and comprehensive analytics." },
];

export default function Features() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Features</h1>
        <p className="text-lg text-muted-foreground">
          A complete toolkit for modern, AI-driven customer support.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <feature.icon className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}