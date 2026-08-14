import { useState, useEffect, useCallback } from "react";
import { Save, Palette, Globe, LogIn, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";

type Tab = "marketing" | "branding" | "login" | "legal";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "marketing", label: "Marketing", icon: Globe },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "login", label: "Login Page", icon: LogIn },
  { id: "legal", label: "Legal", icon: FileText },
];

export default function AppSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("marketing");
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await AdminAPI.getGlobalSettings();
      if (res.data.success) {
        const data = res.data.data;
        setForm({
          app_name: data.app_name || "SupportAI",
          logo: data.logo || { url: "", public_id: "" },
          favicon_url: data.favicon_url || "",
          brand_colors: data.brand_colors || { primary: "#2563eb", secondary: "#7c3aed", accent: "#f59e0b" },
          marketing: {
            hero_title: data.marketing?.hero_title || "AI-Powered Customer Support",
            hero_subtitle: data.marketing?.hero_subtitle || "",
            hero_cta_text: data.marketing?.hero_cta_text || "Get Started",
            features_title: data.marketing?.features_title || "Powerful Features",
            features: data.marketing?.features?.length ? data.marketing.features : [],
            footer_text: data.marketing?.footer_text || "",
          },
          login_page: {
            title: data.login_page?.title || "Welcome Back",
            subtitle: data.login_page?.subtitle || "Sign in to your account",
          },
          legal: {
            about_text: data.legal?.about_text || "",
            privacy_policy: data.legal?.privacy_policy || "",
            terms_of_service: data.legal?.terms_of_service || "",
          },
        });
      }
    } catch {
      toast.error("Error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    
    try {
      const res = await AdminAPI.updateGlobalSettings(form);
      if (res.data.success) {
        toast.success("Success", "Settings saved successfully");
      }
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [form]);

  const updateField = (path: string, value: any) => {
    setForm((prev: any) => {
      const keys = path.split(".");
      const newForm = { ...prev };
      let obj: any = newForm;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newForm;
    });
  };

  const addFeature = () => {
    const features = [...(form.marketing?.features || []), { title: "", description: "", icon: "bot" }];
    updateField("marketing.features", features);
  };

  const removeFeature = (index: number) => {
    const features = (form.marketing?.features || []).filter((_: any, i: number) => i !== index);
    updateField("marketing.features", features);
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const features = [...(form.marketing?.features || [])];
    features[index] = { ...features[index], [field]: value };
    updateField("marketing.features", features);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold ">Application Settings</h1>
          <p className="text-muted-foreground">Manage global app branding, marketing content, and legal pages.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-1" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>



      <div className="flex gap-1 border-b dark:border-white/[0.06] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors shrink-0 ${
              activeTab === tab.id
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card dark:bg-card/50 dark:border-white/[0.06] p-5 sm:p-6">
        {activeTab === "marketing" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe size={18} className="text-primary" />
                Marketing Page Content
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Content displayed on the public landing page before login.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>App Name</Label>
                <Input value={form.app_name} onChange={(e) => updateField("app_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Favicon URL</Label>
                <Input value={form.favicon_url} onChange={(e) => updateField("favicon_url", e.target.value)} placeholder="https://example.com/favicon.ico" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Logo URL</Label>
                <Input value={form.logo?.url || ""} onChange={(e) => updateField("logo.url", e.target.value)} placeholder="https://example.com/logo.png" />
              </div>
            </div>

            <div className="border-t dark:border-white/[0.06] pt-6">
              <h4 className="text-sm font-semibold mb-4">Hero Section</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Hero Title</Label>
                  <Input value={form.marketing?.hero_title || ""} onChange={(e) => updateField("marketing.hero_title", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Hero Subtitle</Label>
                  <textarea
                    value={form.marketing?.hero_subtitle || ""}
                    onChange={(e) => updateField("marketing.hero_subtitle", e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y dark:border-white/[0.06]"
                  />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <Label>CTA Button Text</Label>
                  <Input value={form.marketing?.hero_cta_text || ""} onChange={(e) => updateField("marketing.hero_cta_text", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="border-t dark:border-white/[0.06] pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">Features</h4>
                <Button variant="outline" size="sm" onClick={addFeature}>
                  <Plus size={14} className="mr-1" /> Add Feature
                </Button>
              </div>
              <div className="space-y-1.5 mb-4">
                <Label>Features Section Title</Label>
                <Input value={form.marketing?.features_title || ""} onChange={(e) => updateField("marketing.features_title", e.target.value)} />
              </div>
              {(form.marketing?.features || []).map((feature: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 mb-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={feature.title || ""}
                      onChange={(e) => updateFeature(index, "title", e.target.value)}
                      placeholder="Feature title"
                    />
                    <textarea
                      value={feature.description || ""}
                      onChange={(e) => updateFeature(index, "description", e.target.value)}
                      rows={2}
                      placeholder="Feature description"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y dark:border-white/[0.06]"
                    />
                  </div>
                  <button onClick={() => removeFeature(index)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive mt-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t dark:border-white/[0.06] pt-6">
              <h4 className="text-sm font-semibold mb-3">Footer</h4>
              <div className="space-y-1.5">
                <Label>Footer Text</Label>
                <textarea
                  value={form.marketing?.footer_text || ""}
                  onChange={(e) => updateField("marketing.footer_text", e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y dark:border-white/[0.06]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "branding" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette size={18} className="text-primary" />
                Global Brand Colors
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Brand colors used across the public-facing application.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["primary", "secondary", "accent"] as const).map((color) => (
                <div key={color} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brand_colors?.[color] || "#000000"}
                    onChange={(e) => updateField(`brand_colors.${color}`, e.target.value)}
                    className="w-10 h-10 rounded-md border cursor-pointer"
                  />
                  <div className="flex-1">
                    <Label className="capitalize text-xs">{color}</Label>
                    <Input
                      value={form.brand_colors?.[color] || ""}
                      onChange={(e) => updateField(`brand_colors.${color}`, e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "login" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <LogIn size={18} className="text-primary" />
                Login Page Content
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Text displayed on the login/sign-in page.
              </p>
            </div>
            <div className="space-y-3 max-w-lg">
              <div className="space-y-1.5">
                <Label>Login Title</Label>
                <Input value={form.login_page?.title || ""} onChange={(e) => updateField("login_page.title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Login Subtitle</Label>
                <Input value={form.login_page?.subtitle || ""} onChange={(e) => updateField("login_page.subtitle", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "legal" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Legal Content
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage about, privacy policy, and terms of service content.
              </p>
            </div>
            {(["about_text", "privacy_policy", "terms_of_service"] as const).map((field) => (
              <div key={field} className="space-y-1.5">
                <Label className="capitalize">{field.replace(/_/g, " ")}</Label>
                <textarea
                  value={form.legal?.[field] || ""}
                  onChange={(e) => updateField(`legal.${field}`, e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono dark:border-white/[0.06]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save size={16} className="mr-1" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
