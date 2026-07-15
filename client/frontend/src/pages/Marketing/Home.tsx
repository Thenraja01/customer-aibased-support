import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bot,
  MessageSquare,
  Ticket,
  BookOpen,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

const services = [
  {
    icon: Bot,
    title: "AI Chatbot",
    desc: "24/7 automated support, FAQ automation, and lead qualification.",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    desc: "Human-agent handoff, real-time messaging, and conversation history.",
  },
  {
    icon: Ticket,
    title: "Help Desk",
    desc: "Automatic ticket creation, priority assignment, and case tracking.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    desc: "AI-powered search, self-service articles, and smart recommendations.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Customer satisfaction tracking, agent performance, and response time reports.",
  },
];

const features = [
  "AI-powered conversations",
  "Multi-language support",
  "CRM integration",
  "WhatsApp integration",
  "Email automation",
  "Voice support",
  "Sentiment analysis",
  "Secure cloud infrastructure",
  "Custom workflows",
  "Dashboard and reporting",
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="container mx-auto max-w-5xl text-center">
          <Badge className="mb-6" variant="secondary">
            AI-Powered Customer Support
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            AI Customer Support
            <br />
            <span className="text-primary">That Works 24/7</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8 leading-relaxed">
            Deliver instant, intelligent customer support across chat, email, and messaging
            platforms. Reduce response times, increase customer satisfaction, and let your team
            focus on complex issues.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="outline">
              <Link to="/contact">Request a Demo</Link>
            </Button>
            <Button size="lg" variant="ghost" >
              <Link to="/contact">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="ghost" >
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Our Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive AI solutions to automate and enhance your customer support operations.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.title} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <service.icon className="h-10 w-10 text-primary mb-4" />
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  to="/services"
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4">
        <div className="rounded-2xl bg-muted/50 p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Powerful Features for Modern Support
              </h2>
              <p className="text-muted-foreground mb-8">
                Everything you need to deliver exceptional customer experiences at scale.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <Button className="mt-8" asChild>
                <Link to="/features">Explore All Features</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 mt-8">
                <div className="rounded-xl bg-background p-6 shadow-sm border">
                  <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                  <div className="text-2xl font-bold">80%</div>
                  <div className="text-xs text-muted-foreground">Faster Response</div>
                </div>
                <div className="rounded-xl bg-background p-6 shadow-sm border">
                  <Shield className="h-8 w-8 text-green-500 mb-2" />
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-xs text-muted-foreground">Uptime SLA</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-background p-6 shadow-sm border">
                  <Globe className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">50+</div>
                  <div className="text-xs text-muted-foreground">Languages</div>
                </div>
                <div className="rounded-xl bg-background p-6 shadow-sm border">
                  <Bot className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-xs text-muted-foreground">AI Availability</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4">
        <div className="rounded-2xl bg-primary text-primary-foreground p-8 lg:p-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to Transform Your Customer Support?
          </h2>
          <p className="max-w-2xl mx-auto mb-8 text-primary-foreground/90">
            Join hundreds of businesses using SupportAI to deliver faster, smarter customer
            experiences.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contact">Get Started Today</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}