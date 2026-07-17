import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

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
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!validateEmail(email)) errs.email = "Please enter a valid email";
    if (!message.trim()) errs.message = "Message is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitting(false);
    setSubmitted(true);
    window.alert(
      `Thank you, ${name}! Your message has been sent successfully. We'll get back to you at ${email} shortly.`
    );
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setCompany("");
    setPhone("");
    setMessage("");
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Get in Touch
        </h1>
        <p className="text-lg text-muted-foreground">
          Have questions or want a personalized demo? We'd love to hear from
          you.
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
                  <motion.div
                    key={item.label}
                    variants={itemVariant}
                    className="flex items-center gap-3"
                  >
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
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Thank you for reaching out. We'll get back to you shortly.
                  </p>
                  <Button variant="outline" onClick={resetForm}>
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors({ ...errors, name: "" });
                        }}
                        placeholder="Your name"
                        className={`dark:border-white/[0.06] dark:focus:border-primary/40 ${
                          errors.name ? "border-destructive" : ""
                        }`}
                      />
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-destructive flex items-center gap-1"
                        >
                          <AlertCircle size={12} />
                          {errors.name}
                        </motion.p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: "" });
                        }}
                        placeholder="your@email.com"
                        className={`dark:border-white/[0.06] dark:focus:border-primary/40 ${
                          errors.email ? "border-destructive" : ""
                        }`}
                      />
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-destructive flex items-center gap-1"
                        >
                          <AlertCircle size={12} />
                          {errors.email}
                        </motion.p>
                      )}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Your company"
                        className="dark:border-white/[0.06] dark:focus:border-primary/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="dark:border-white/[0.06] dark:focus:border-primary/40"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (errors.message)
                          setErrors({ ...errors, message: "" });
                      }}
                      rows={5}
                      placeholder="How can we help you?"
                      className={`dark:border-white/[0.06] dark:focus:border-primary/40 ${
                        errors.message ? "border-destructive" : ""
                      }`}
                    />
                    {errors.message && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-destructive flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        {errors.message}
                      </motion.p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full dark:bg-primary dark:hover:bg-primary/90 dark:shadow-lg dark:shadow-primary/20"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send size={16} />
                        Send Message
                      </span>
                    )}
                  </Button>
                </motion.form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
