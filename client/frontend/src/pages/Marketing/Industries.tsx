import { motion } from "framer-motion";
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

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <h1 className="text-4xl font-bold  mb-4">Industries We Serve</h1>
        <p className="text-lg text-muted-foreground">
          Tailored AI support solutions for businesses across every sector.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {industries.map((industry) => (
          <motion.div key={industry.name} variants={cardVariant}>
            <Card
              className="hover:border-primary/50 transition-all duration-300 dark:bg-card/50 dark:border-white/[0.06] dark:hover:border-primary/20 hover:-translate-y-0.5 dark:shadow-lg dark:shadow-black/10 h-full"
            >
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mb-2">
                  <industry.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{industry.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{industry.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
