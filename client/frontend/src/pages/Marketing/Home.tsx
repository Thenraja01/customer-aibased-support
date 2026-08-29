import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Globe,
  Bot,
  Building2,
  DollarSign,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Headphones,
  Check,
  Star,
  Layers,
  Network,
  Calculator,
} from "lucide-react";

import HeroSection from "./components/HeroSection";
import HybridRagVisualizer from "./components/HybridRagVisualizer";
import AgentCopilotSimulator from "./components/AgentCopilotSimulator";
import TicketIntelligenceDashboard from "./components/TicketIntelligenceDashboard";
import RoleExperienceSelector from "./components/RoleExperienceSelector";
import LiveArchitectureShowcase from "./components/LiveArchitectureShowcase";

function SupportAIWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "http://localhost:3030/widget.js";
    script.dataset.apiKey = "pk_live_c69d6096f676ddc709f2a13956f1c6d476c03956f395f48e04af2a17fff34749";
    script.dataset.theme = "dark";
    script.dataset.position = "bottom-right";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      const widgetContainer =
        document.getElementById("supportai-widget-root") ||
        document.getElementById("supportai-widget-container") ||
        document.getElementById("supportai-chat-bubble");
      if (widgetContainer && document.body.contains(widgetContainer)) {
        widgetContainer.remove();
      }
    };
  }, []);

  return null;
}

export default function Home() {
  const { settings } = useAppSettings();
  const appName = settings?.app_name || "SupportAI";

  // Interactive ROI Calculator State
  const [monthlyTickets, setMonthlyTickets] = useState<number>(25000);
  const [supportAgents, setSupportAgents] = useState<number>(30);
  const [costPerTicket, setCostPerTicket] = useState<number>(22);

  // ROI Math
  const deflectionRate = 0.74; // 74% automated resolution
  const deflectedTickets = Math.round(monthlyTickets * deflectionRate);
  const monthlyCostSavings = Math.round(deflectedTickets * costPerTicket * 0.85);
  const annualSavings = monthlyCostSavings * 12;
  const hoursSavedPerWeek = Math.round(supportAgents * 40 * 0.45);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <SupportAIWidget />

      {/* 1. Hero Section with Live AI Chat Preview Card */}
      <HeroSection />

      {/* Enterprise Trusted By Ribbon / Marquee */}
      <section className="border-y border-border/40 bg-muted/20 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            Trusted by Engineering & Customer Support Leaders Globally
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 font-black text-base sm:text-lg tracking-tight">
              <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-mono">
                GL
              </div>
              <span>GLOBAL LOGISTICS</span>
            </div>
            <div className="flex items-center gap-2 font-black text-base sm:text-lg tracking-tight">
              <div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center text-xs font-mono">
                FP
              </div>
              <span>FINTECH PRIME</span>
            </div>
            <div className="flex items-center gap-2 font-black text-base sm:text-lg tracking-tight">
              <div className="h-6 w-6 rounded bg-sky-600 text-white flex items-center justify-center text-xs font-mono">
                CS
              </div>
              <span>CLOUDSCALE CORP</span>
            </div>
            <div className="flex items-center gap-2 font-black text-base sm:text-lg tracking-tight">
              <div className="h-6 w-6 rounded bg-purple-600 text-white flex items-center justify-center text-xs font-mono">
                NX
              </div>
              <span>NEXUS DYNAMICS</span>
            </div>
            <div className="flex items-center gap-2 font-black text-base sm:text-lg tracking-tight">
              <div className="h-6 w-6 rounded bg-amber-600 text-white flex items-center justify-center text-xs font-mono">
                HN
              </div>
              <span>HEALTHNEXT</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Feature Matrix: Hybrid RAG & Knowledge Graph Visualizer */}
      <HybridRagVisualizer />

      {/* 3. Autonomous AI Copilot with Interactive HITL Approval Simulator */}
      <AgentCopilotSimulator />

      {/* 4. 11-Dimensional Ticket Intelligence Dashboard Mockup */}
      <TicketIntelligenceDashboard />

      {/* 5. Role-Based Experience Selector */}
      <RoleExperienceSelector />

      {/* 6. Interactive ROI & Business Impact Calculator */}
      <section className="relative py-20 lg:py-28 bg-muted/10 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4 gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-3 py-1">
              <Calculator className="h-3.5 w-3.5" />
              Quantifiable Business Impact
            </Badge>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Enterprise ROI &{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-400 bg-clip-text text-transparent">
                Savings Calculator
              </span>
            </h2>

            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Calculate how much time and operational budget SupportAI's 74% autonomous deflection and
              grounded copilot can save your organization.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-border/80 bg-card/70 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-card/40 p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Sliders Input Area */}
              <div className="space-y-6 lg:col-span-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-foreground">Monthly Support Inquiries:</span>
                    <span className="font-mono text-primary font-bold">{monthlyTickets.toLocaleString()} tickets</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="100000"
                    step="2500"
                    value={monthlyTickets}
                    onChange={(e) => setMonthlyTickets(parseInt(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>5,000</span>
                    <span>50,000</span>
                    <span>100,000+</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-foreground">Current Support Team Size:</span>
                    <span className="font-mono text-primary font-bold">{supportAgents} agents</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={supportAgents}
                    onChange={(e) => setSupportAgents(parseInt(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>5 agents</span>
                    <span>75 agents</span>
                    <span>150 agents</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-foreground">Estimated Cost Per Resolved Ticket:</span>
                    <span className="font-mono text-primary font-bold">${costPerTicket}.00</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="2"
                    value={costPerTicket}
                    onChange={(e) => setCostPerTicket(parseInt(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>$10</span>
                    <span>$30</span>
                    <span>$50</span>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/40 p-4 border border-border/50 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Assumptions & Baseline:</p>
                  <p>• 74% Autonomous Tier-1 RAG resolution with zero hallucination.</p>
                  <p>• 45% reduction in Tier-2/Tier-3 handle time via Copilot suggestions.</p>
                </div>
              </div>

              {/* Real-time Calculation Result Card */}
              <div className="flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 lg:col-span-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Projected Annual Value
                  </span>
                  <div className="mt-2 text-3xl sm:text-4xl font-black text-foreground font-mono">
                    ${annualSavings.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Estimated annual net operational savings</p>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-card p-3 border border-border/50">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Monthly Deflected
                      </span>
                      <span className="text-base font-bold text-primary font-mono">
                        {deflectedTickets.toLocaleString()} tickets
                      </span>
                    </div>

                    <div className="rounded-lg bg-card p-3 border border-border/50">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Hours Saved / Wk
                      </span>
                      <span className="text-base font-bold text-emerald-500 font-mono">
                        {hoursSavedPerWeek} hours
                      </span>
                    </div>

                    <div className="rounded-lg bg-card p-3 border border-border/50">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Avg SLA Adherence
                      </span>
                      <span className="text-base font-bold text-sky-500 font-mono">
                        99.8%
                      </span>
                    </div>

                    <div className="rounded-lg bg-card p-3 border border-border/50">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Payback Period
                      </span>
                      <span className="text-base font-bold text-amber-500 font-mono">
                        &lt; 2.2 Months
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-500/20">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/25" asChild>
                    <Link to="/contact">Get Customized Enterprise ROI Audit</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    
      {/* 7. Live Architecture Showcase: Tech stack, benchmarks, security */}
      <LiveArchitectureShowcase />

      {/* 8. Enterprise Testimonials */}
      <section className="py-20 bg-background border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">
              Customer Success
            </Badge>
            <h3 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Proven Results Across Critical Sectors
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground italic leading-relaxed">
                "SupportAI eliminated 80% of our repetitive SAML SSO and API integration tickets in the first
                two weeks. The citations allow our enterprise customers to self-serve with 100% confidence."
              </p>
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                  DK
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">David Kimball</div>
                  <div className="text-[11px] text-muted-foreground">VP of Customer Engineering, Global Logistics</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground italic leading-relaxed">
                "The Human-In-The-Loop approval gate for SLA refunds and tenant database mutations gave our
                compliance and legal teams complete peace of mind. Truly enterprise-grade."
              </p>
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-xs">
                  SM
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Sophia Morales</div>
                  <div className="text-[11px] text-muted-foreground">Chief Information Security Officer, FinTech Prime</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground italic leading-relaxed">
                "The Neo4j Knowledge Graph reasoning is a game changer. When an upstream service drops,
                SupportAI instantly maps the downstream branch impact and guides agents with zero confusion."
              </p>
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-sky-500/20 flex items-center justify-center font-bold text-sky-400 text-xs">
                  RJ
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Robert Jenkins</div>
                  <div className="text-[11px] text-muted-foreground">Head of SRE & Support, Nexus Dynamics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. High-Conversion Final CTA */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-background via-primary/5 to-background border-t border-border/40 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--primary)/0.15),transparent)]" />

        <div className="container relative mx-auto px-4 max-w-4xl text-center">
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 bg-primary/10 text-primary px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" />
            Get Started with SupportAI Today
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to Deploy Autonomous, Zero-Hallucination AI Support?
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience sub-second Hybrid RAG, Neo4j knowledge graphs, and automated human-in-the-loop copilot
            tailored for your organization.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="rounded-xl bg-primary px-8 text-primary-foreground font-semibold shadow-xl shadow-primary/25 hover:scale-105 transition-all" asChild>
              <Link to="/register">
                Start Free Enterprise Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl border-border bg-background/80 hover:bg-muted" asChild>
              <Link to="/contact">Talk to an AI Architect</Link>
            </Button>
            <Button size="lg" variant="ghost" className="rounded-xl text-muted-foreground hover:text-foreground" asChild>
              <Link to="/pricing">View Enterprise Pricing</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              14-Day Full Enterprise Pilot
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              SOC2 & SAML Ready
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
