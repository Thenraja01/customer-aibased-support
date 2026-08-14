import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Users } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const cards = [
  {
    icon: Users,
    iconColor: "text-primary",
    gradientFrom: "from-primary/15 to-primary/5",
    darkGradientFrom: "dark:from-primary/20 dark:to-primary/5",
    hoverBorder: "dark:hover:border-primary/20",
    title: "Who We Are",
    desc: "We help businesses transform customer service with AI-powered automation. Our platform combines conversational AI with human support to deliver fast, accurate, and personalized customer experiences.",
  },
  {
    icon: Target,
    iconColor: "text-secondary",
    gradientFrom: "from-secondary/15 to-secondary/5",
    darkGradientFrom: "dark:from-secondary/20 dark:to-secondary/5",
    hoverBorder: "dark:hover:border-secondary/20",
    title: "Our Mission",
    desc: "To make customer support faster, smarter, and available anytime.",
  },
  {
    icon: Eye,
    iconColor: "text-primary",
    gradientFrom: "from-primary/15 to-secondary/10",
    darkGradientFrom: "dark:from-primary/20 dark:to-secondary/10",
    hoverBorder: "dark:hover:border-primary/20",
    title: "Our Vision",
    desc: "To empower every business with intelligent customer service solutions that improve efficiency and customer loyalty.",
  },
];

export default function About() {
  const { settings } = useAppSettings();
  const aboutText = settings?.legal?.about_text;

  if (aboutText) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold  mb-8">About Us</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {aboutText.split("\n").map((paragraph, i) => (
            paragraph.trim() ? <p key={i} className="text-muted-foreground mb-4">{paragraph}</p> : null
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <h1 className="text-4xl font-bold  mb-4">About Us</h1>
        <p className="text-lg text-muted-foreground">
          We help businesses transform customer service with AI-powered automation.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid md:grid-cols-3 gap-8 mb-16"
      >
        {cards.map((card) => (
          <motion.div key={card.title} variants={cardVariant}>
            <Card className={`dark:bg-card/50 px-12 py-6 dark:border-white/[0.06] ${card.hoverBorder} transition-all duration-300 hover:-translate-y-0.5 dark:shadow-lg dark:shadow-black/10 h-full`}>
              <CardContent className="pt-6 text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradientFrom} ${card.darkGradientFrom} flex items-center justify-center mx-auto mb-4`}>
                  <card.icon className={`h-8 w-8 ${card.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-muted-foreground">{card.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
