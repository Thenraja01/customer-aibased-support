import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Clock, MapPin, Send } from "lucide-react";

const contactItems = [
  { icon: Mail, label: "support@company.com" },
  { icon: Phone, label: "+91 XXXXX XXXXX" },
  { icon: Clock, label: "Monday\u2013Friday, 9:00 AM\u20136:00 PM" },
  { icon: MapPin, label: "Available globally with 24/7 AI support" },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-4">Get in Touch</h1>
        <p className="text-lg text-muted-foreground">
          Have questions or want a personalized demo? We'd love to hear from you.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-6"
        >
          <motion.div variants={itemVariant}>
            <Card className="dark:bg-card/50 dark:border-white/[0.06] dark:shadow-lg dark:shadow-black/10">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactItems.map((item) => (
                  <motion.div key={item.label} variants={itemVariant} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span>{item.label}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="dark:bg-card/50 dark:border-white/[0.06] dark:shadow-lg dark:shadow-black/10">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center py-8"
                >
                  <div className="h-12 w-12 bg-gradient-to-br from-primary/15 to-secondary/10 dark:from-primary/20 dark:to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">
                    Thank you for reaching out. We'll get back to you shortly.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input required placeholder="Your name" className="dark:border-white/[0.06] dark:focus:border-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" required placeholder="your@email.com" className="dark:border-white/[0.06] dark:focus:border-primary/40" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input placeholder="Your company" className="dark:border-white/[0.06] dark:focus:border-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input type="tel" placeholder="+91 XXXXX XXXXX" className="dark:border-white/[0.06] dark:focus:border-primary/40" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea required rows={5} placeholder="How can we help you?" className="dark:border-white/[0.06] dark:focus:border-primary/40" />
                  </div>
                  <Button type="submit" className="w-full dark:bg-primary dark:hover:bg-primary/90 dark:shadow-lg dark:shadow-primary/20">
                    Send Message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
