import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small teams getting started with AI support.",
    features: ["AI chatbot", "Email support", "Basic analytics"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "Advanced features for growing support teams.",
    features: [
      "Everything in Starter",
      "CRM integration",
      "Multi-channel support",
      "Advanced reporting",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large organizations.",
    features: [
      "Custom AI models",
      "Dedicated account manager",
      "API access",
      "Enterprise security",
      "SLA support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-4">Pricing</h1>
        <p className="text-lg text-muted-foreground">
          Simple, transparent pricing for businesses of all sizes.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
      >
        {plans.map((plan) => (
          <motion.div key={plan.name} variants={cardVariant}>
            <Card
              className={`relative flex flex-col transition-all duration-300 ${
                plan.popular
                  ? "border-primary shadow-lg scale-105 dark:shadow-primary/20 dark:border-primary/50 dark:bg-gradient-to-b dark:from-primary/5 dark:to-card"
                  : "dark:bg-card/50 dark:border-white/[0.06]"
              } ${!plan.popular ? "hover:-translate-y-0.5 dark:hover:border-primary/20" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg shadow-primary/25">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className={buttonVariants({
                    className: `w-full ${plan.popular ? "dark:shadow-lg dark:shadow-primary/20" : "dark:border-white/[0.06] dark:hover:bg-primary/10"}`,
                    variant: plan.popular ? "default" : "outline",
                  })}
                >
                  {plan.cta}
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
