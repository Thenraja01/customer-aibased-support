import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Globe,
  Save,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Image,
  Type,
  ListOrdered,
  Quote,
  CheckCircle2,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useAuth } from "@/hooks/useAuth";

interface ContentSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  items: { title: string; description: string; price?: string }[];
}

interface ContentData {
  hero: ContentSection;
  features: ContentSection;
  pricing: ContentSection;
  testimonials: ContentSection;
}

const DEFAULT_CONTENT: ContentData = {
  hero: {
    id: "hero",
    title: "AI-Powered Customer Support",
    subtitle: "Revolutionize your support workflow",
    description:
      "Intelligent document processing, semantic search, and automated responses powered by cutting-edge AI.",
    features: ["24/7 automated support", "Multi-language", "Smart escalation"],
    items: [],
  },
  features: {
    id: "features",
    title: "Powerful Features",
    subtitle: "Everything you need",
    description:
      "From document ingestion to real-time AI conversations, we provide a complete suite of tools.",
    features: [
      "RAG-powered document Q&A",
      "Knowledge graph analysis",
      "Multi-tenant architecture",
      "Role-based access control",
      "Real-time conversation monitoring",
      "Audit logging & compliance",
    ],
    items: [],
  },
  pricing: {
    id: "pricing",
    title: "Simple, Transparent Pricing",
    subtitle: "Choose the plan that fits your needs",
    description: "No hidden fees. Scale as you grow.",
    features: [],
    items: [
      { title: "Starter", description: "Perfect for small teams", price: "$29/mo" },
      { title: "Professional", description: "For growing businesses", price: "$99/mo" },
      { title: "Enterprise", description: "Custom solutions at scale", price: "$299/mo" },
    ],
  },
  testimonials: {
    id: "testimonials",
    title: "Trusted by Industry Leaders",
    subtitle: "What our customers say",
    description: "Join hundreds of organizations transforming their customer support.",
    features: [],
    items: [
      { title: "Sarah K., VP Support", description: "Reduced response time by 80%. Game changer for our team." },
      { title: "Mike T., CTO", description: "The AI accuracy is remarkable. Our customers love it." },
      { title: "Lisa R., Director", description: "Seamless integration. Deployed in under a week." },
    ],
  },
};

function loadContent(): ContentData {
  try {
    const raw = localStorage.getItem("cms_content");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CONTENT;
}

function saveContent(data: ContentData) {
  localStorage.setItem("cms_content", JSON.stringify(data));
}

function getPreviewIcon(section: string) {
  switch (section) {
    case "hero": return Type;
    case "features": return ListOrdered;
    case "pricing": return Image;
    case "testimonials": return Quote;
    default: return Globe;
  }
}

export default function ContentManagementPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin" || user?.role?.name === "super_admin";

  const [content, setContent] = useState<ContentData>(loadContent);
  const [activeTab, setActiveTab] = useState("hero");
  const [editing, setEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(false);

  const handleSave = () => {
    saveContent(content);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePublish = () => {
    saveContent(content);
    setConfirmDialog(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateField = (field: keyof ContentSection, value: string) => {
    setContent((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab as keyof ContentData], [field]: value },
    }));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setContent((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab as keyof ContentData],
        features: [...prev[activeTab as keyof ContentData].features, newFeature.trim()],
      },
    }));
    setNewFeature("");
  };

  const removeFeature = (idx: number) => {
    setContent((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab as keyof ContentData],
        features: prev[activeTab as keyof ContentData].features.filter((_, i) => i !== idx),
      },
    }));
  };

  const addItem = () => {
    if (!newItemTitle.trim()) return;
    setContent((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab as keyof ContentData],
        items: [
          ...prev[activeTab as keyof ContentData].items,
          { title: newItemTitle.trim(), description: newItemDesc.trim(), price: newItemPrice.trim() || undefined },
        ],
      },
    }));
    setNewItemTitle("");
    setNewItemDesc("");
    setNewItemPrice("");
  };

  const removeItem = (idx: number) => {
    setContent((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab as keyof ContentData],
        items: prev[activeTab as keyof ContentData].items.filter((_, i) => i !== idx),
      },
    }));
  };

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">Manage marketing website content sections.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 text-green-500 text-sm">
              <CheckCircle2 size={14} /> Saved
            </motion.div>
          )}
          {!isSuperAdmin && (
            <Badge variant="secondary" className="text-xs">View Only</Badge>
          )}
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="flex items-center gap-2">
        {isSuperAdmin && (
          <>
            {editing ? (
              <>
                <Button size="sm" onClick={() => { handleSave(); }}>
                  <Save size={14} className="mr-1" /> Save Draft
                </Button>
                <Button size="sm" onClick={() => setConfirmDialog(true)}>
                  <Globe size={14} className="mr-1" /> Publish
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil size={14} className="mr-1" /> Edit Content
              </Button>
            )}
          </>
        )}
        <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)}>
          <Eye size={14} className="mr-1" /> {showPreview ? "Hide Preview" : "Preview"}
        </Button>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="hero">
              <Type size={14} className="mr-1" /> Hero
            </TabsTrigger>
            <TabsTrigger value="features">
              <ListOrdered size={14} className="mr-1" /> Features
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <Image size={14} className="mr-1" /> Pricing
            </TabsTrigger>
            <TabsTrigger value="testimonials">
              <Quote size={14} className="mr-1" /> Testimonials
            </TabsTrigger>
          </TabsList>

          {(["hero", "features", "pricing", "testimonials"] as const).map((key) => (
            <TabsContent key={key} value={key}>
              <div className="space-y-4">
                <Card className="dark:bg-card/50 dark:border-white/[0.06]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {(() => { const Icon = getPreviewIcon(key); return <Icon size={18} className="text-primary" />; })()}
                      {content[key].title || "Untitled Section"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        {editing ? (
                          <Input
                            value={content[key].title}
                            onChange={(e) => updateField("title", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                            {content[key].title || "—"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subtitle</label>
                        {editing ? (
                          <Input
                            value={content[key].subtitle}
                            onChange={(e) => updateField("subtitle", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                            {content[key].subtitle || "—"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      {editing ? (
                        <Textarea
                          value={content[key].description}
                          onChange={(e) => updateField("description", e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                          {content[key].description || "—"}
                        </p>
                      )}
                    </div>

                    {content[key].features.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Features List</label>
                        <div className="space-y-1.5">
                          {content[key].features.map((f, i) => (
                            <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                              <span className="text-sm">{f}</span>
                              {editing && (
                                <button onClick={() => removeFeature(i)} className="p-1 hover:bg-destructive/10 rounded">
                                  <Trash2 size={12} className="text-destructive" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {editing && (
                          <div className="flex gap-2">
                            <Input
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              placeholder="Add a feature..."
                              onKeyDown={(e) => e.key === "Enter" && addFeature()}
                            />
                            <Button size="sm" variant="outline" onClick={addFeature}>
                              <Plus size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {content[key].items.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Items</label>
                        <div className="space-y-1.5">
                          {content[key].items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                              <div>
                                <p className="text-sm font-medium">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                {item.price && <p className="text-xs font-medium text-primary">{item.price}</p>}
                              </div>
                              {editing && (
                                <button onClick={() => removeItem(i)} className="p-1 hover:bg-destructive/10 rounded">
                                  <Trash2 size={12} className="text-destructive" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {editing && (
                          <div className="grid gap-2 md:grid-cols-3">
                            <Input
                              value={newItemTitle}
                              onChange={(e) => setNewItemTitle(e.target.value)}
                              placeholder="Item title"
                            />
                            <Input
                              value={newItemDesc}
                              onChange={(e) => setNewItemDesc(e.target.value)}
                              placeholder="Description"
                            />
                            <div className="flex gap-2">
                              <Input
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value)}
                                placeholder="Price (opt)"
                              />
                              <Button size="sm" variant="outline" onClick={addItem}>
                                <Plus size={14} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-8 space-y-12"
        >
          <div className="text-center text-xs text-muted-foreground uppercase tracking-widest font-medium">
            Website Preview
          </div>

          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold">{content.hero.title}</h2>
            <p className="text-lg text-primary font-medium">{content.hero.subtitle}</p>
            <p className="text-muted-foreground">{content.hero.description}</p>
            {content.hero.features.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {content.hero.features.map((f, i) => (
                  <Badge key={i} variant="secondary">{f}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-center mb-6">{content.features.title}</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {content.features.features.map((f, i) => (
                <div key={i} className="rounded-lg border p-4 dark:border-white/[0.06]">
                  <p className="text-sm font-medium">{f}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-center mb-6">{content.pricing.title}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {content.pricing.items.map((item, i) => (
                <div key={i} className="rounded-xl border p-6 text-center dark:border-white/[0.06]">
                  <p className="font-semibold text-lg">{item.title}</p>
                  <p className="text-2xl font-bold my-3">{item.price}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-center mb-6">{content.testimonials.title}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {content.testimonials.items.map((item, i) => (
                <div key={i} className="rounded-xl border p-5 dark:border-white/[0.06]">
                  <p className="text-sm italic mb-3">&quot;{item.description}&quot;</p>
                  <p className="text-xs font-medium text-primary">— {item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="dark:bg-card dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle>Publish Content</DialogTitle>
            <DialogDescription>
              This will publish all content changes to the live website. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish}>
              <Globe size={14} className="mr-1" /> Publish Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
