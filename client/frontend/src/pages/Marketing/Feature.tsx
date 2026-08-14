import { motion } from "framer-motion";
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

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <h1 className="text-4xl font-bold  mb-4">Features</h1>
        <p className="text-lg text-muted-foreground">
          A complete toolkit for modern, AI-driven customer support.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {features.map((feature, i) => (
          <motion.div key={feature.title} variants={cardVariant} custom={i}>
            <Card
              className="hover:shadow-md transition-all duration-300 dark:bg-card/50 dark:border-white/[0.06] dark:hover:border-primary/20 px-12 py-6 dark:hover:shadow-primary/5 hover:-translate-y-0.5 h-full"
            >
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mb-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
