import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Ticket, BookOpen, BarChart3, CheckCircle2 } from "lucide-react";

const services = [
  {
    icon: Bot,
    title: "AI Chatbot",
    description: "Intelligent conversational agents that handle customer inquiries around the clock.",
    features: ["24/7 automated support", "FAQ automation", "Lead qualification"],
  },
  {
    icon: MessageSquare,
    title: "Live Chat Integration",
    description: "Seamless handoff between AI and human agents for complex issues.",
    features: ["Human-agent handoff", "Real-time messaging", "Conversation history"],
  },
  {
    icon: Ticket,
    title: "Help Desk Automation",
    description: "Streamlined ticket management with intelligent routing and prioritization.",
    features: ["Automatic ticket creation", "Priority assignment", "Case tracking"],
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Self-service portal powered by AI search and smart recommendations.",
    features: ["AI-powered search", "Self-service articles", "Smart recommendations"],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Comprehensive insights into your support operations and customer satisfaction.",
    features: ["Customer satisfaction tracking", "Agent performance", "Response time reports"],
  },
];

export default function Services() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Our Services</h1>
        <p className="text-lg text-muted-foreground">
          End-to-end AI solutions designed to automate, optimize, and scale your customer support.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.title} className="h-full">
            <CardHeader>
              <service.icon className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{service.title}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}