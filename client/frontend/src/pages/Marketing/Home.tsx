import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/hooks/useAppSettings";
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

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

const statCards = [
  { icon: Zap, value: "80%", label: "Faster Response" },
  { icon: Shield, value: "99.9%", label: "Uptime SLA" },
  { icon: Globe, value: "50+", label: "Languages" },
  { icon: Bot, value: "24/7", label: "AI Availability" },
];

export default function Home() {
  const { settings } = useAppSettings();
  const m = settings?.marketing || {};
  const appName = settings?.app_name || "SupportAI";

  return (
    <div className="flex flex-col gap-16 pb-16">
    
      <section
        className="relative overflow-hidden px-4 pt-16 pb-24 lg:pt-32 lg:pb-40 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/src/bg-aimodel.jpg')",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-background/75 dark:bg-background/80 -z-0" />

        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          <div className="container mx-auto max-w-5xl text-center">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge className="mb-6 dark:bg-primary/15 dark:text-primary dark:border-primary/20" variant="secondary">
                {m.hero_title || "AI-Powered Customer Support"}
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-extrabold  sm:text-5xl md:text-6xl lg:text-7xl mb-6"
            >
              {appName}
              <br />
              <span className="text-primary bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text dark:text-transparent dark:bg-[length:200%_auto] dark:animate-gradient-x">
                That Works 24/7
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              {m.hero_subtitle || "Deliver instant, intelligent customer support across chat, email, and messaging platforms."}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" variant="outline" className="dark:border-primary/30 dark:hover:bg-primary/10 dark:hover:border-primary/50 dark:shadow-lg dark:shadow-primary/10">
                <Link to="/contact">{m.hero_cta_text || "Request a Demo"}</Link>
              </Button>
              <Button size="lg" variant="ghost" className="dark:hover:bg-primary/10">
                <Link to="/contact">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="ghost" className="dark:hover:bg-primary/10">
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold  mb-4">
            Our Services
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive AI solutions to automate and enhance your customer support operations.
          </motion.p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => (
            <motion.div key={service.title} variants={cardVariant}>
              <Card
                className="group hover:shadow-lg transition-all duration-300 px-12 py-6 dark:bg-card/50 dark:hover:shadow-primary/5 dark:hover:border-primary/20 dark:backdrop-blur-sm hover:-translate-y-0.5 h-full"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    to="/services"
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline group/link"
                  >
                    Learn more <ArrowRight className="ml-1 h-4 w-4 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="rounded-lg bg-muted/50 dark:bg-gradient-to-br dark:from-card/80 dark:via-card/40 dark:to-card/80 dark:border dark:border-white/[0.06] p-8 lg:p-12 dark:shadow-xl dark:shadow-black/10"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp} custom={0}>
              <h2 className="text-3xl font-bold  mb-4">
                {m.features_title || "Powerful Features for Modern Support"}
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
              <Link to="/features" className={buttonVariants({ className: "mt-8 dark:bg-primary dark:hover:bg-primary/90 dark:shadow-lg dark:shadow-primary/20" })}>
                Explore All Features
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 gap-4">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="p-6"
                >
                  <stat.icon className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-lg bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 lg:p-16 text-center dark:shadow-2xl dark:shadow-primary/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] dark:opacity-100 opacity-0" />
          <div className="relative">
            <h2 className="text-3xl font-bold  mb-4">
              Ready to Transform Your Customer Support?
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-primary-foreground/90">
              Join hundreds of businesses using {appName} to deliver faster, smarter customer
              experiences.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact" className={buttonVariants({ size: "lg", variant: "secondary", className: "dark:bg-white dark:text-primary dark:hover:bg-white/90 dark:shadow-lg" })}>
                Get Started Today
              </Link>
              <Link
                to="/pricing"
                className={buttonVariants({ size: "lg", variant: "outline", className: "border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 dark:border-white/30 dark:hover:bg-white/10" })}
              >
                View Pricing
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
