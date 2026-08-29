import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sliders,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  RefreshCw,
  Paperclip,
  CheckSquare,
  Square,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import AxiosInstance from "@/api/axiosInstance";

interface FormFieldConfig {
  field_key: string;
  label: string;
  enabled: boolean;
  required: boolean;
  order: number;
}

const DEFAULT_FIELDS: FormFieldConfig[] = [
  { field_key: "subject", label: "Subject", enabled: true, required: true, order: 1 },
  { field_key: "description", label: "Description", enabled: true, required: true, order: 2 },
  { field_key: "category", label: "Category", enabled: true, required: true, order: 3 },
  { field_key: "priority", label: "Priority", enabled: true, required: false, order: 4 },
  { field_key: "attachment", label: "Attachment", enabled: true, required: false, order: 5 },
  { field_key: "phone", label: "Phone Number", enabled: false, required: false, order: 6 },
  { field_key: "order_id", label: "Order ID", enabled: false, required: false, order: 7 },
];

export default function TicketFormCustomizationPage() {
  const toast = useToast();
  const [fields, setFields] = useState<FormFieldConfig[]>(DEFAULT_FIELDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customFieldLabel, setCustomFieldLabel] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadFormConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("/admin/v1/settings");
      if (res.data?.success && Array.isArray(res.data.data?.ticket_form_config) && res.data.data.ticket_form_config.length > 0) {
        setFields(res.data.data.ticket_form_config.sort((a: any, b: any) => a.order - b.order));
      }
    } catch {
      // fallback to default fields
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFormConfig();
  }, [loadFormConfig]);

  const handleToggleRequired = (key: string) => {
    setFields((prev) =>
      prev.map((f) => (f.field_key === key ? { ...f, required: !f.required } : f))
    );
  };

  const handleToggleEnabled = (key: string) => {
    setFields((prev) =>
      prev.map((f) => (f.field_key === key ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleLabelChange = (key: string, newLabel: string) => {
    setFields((prev) =>
      prev.map((f) => (f.field_key === key ? { ...f, label: newLabel } : f))
    );
  };

  const handleAddField = () => {
    if (!customFieldLabel.trim()) return;
    const key = `custom_${customFieldLabel.toLowerCase().replace(/\s+/g, "_")}`;
    const newField: FormFieldConfig = {
      field_key: key,
      label: customFieldLabel.trim(),
      enabled: true,
      required: false,
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
    setCustomFieldLabel("");
    setShowAddModal(false);
    toast.success("Field Added", `Added custom field "${customFieldLabel}"`);
  };

  const handleRemoveField = (key: string) => {
    setFields((prev) => prev.filter((f) => f.field_key !== key));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await AxiosInstance.put("/admin/v1/settings", {
        ticket_form_config: fields,
      });
      if (res.data?.success) {
        toast.success("Changes Saved", "Ticket submission form layout updated.");
      }
    } catch (err: any) {
      toast.error("Save Failed", err.response?.data?.message || "Failed to update form layout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            Ticket Form Customization
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure customer ticket submission form fields with side-by-side live rendering.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-sm">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Side-by-Side Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: FORM FIELDS */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-card p-5 rounded-xl border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                FORM FIELDS
              </h3>
              <span className="text-xs text-muted-foreground">Required / Optional / Enabled</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                Loading form configuration...
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <motion.div
                    key={field.field_key}
                    layout
                    className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                      field.enabled ? "bg-card border-border" : "bg-muted/30 border-border/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}.</span>
                      <Input
                        value={field.label}
                        onChange={(e) => handleLabelChange(field.field_key, e.target.value)}
                        className="h-8 text-sm font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Required Check Toggle */}
                      <button
                        onClick={() => handleToggleRequired(field.field_key)}
                        title={field.required ? "Required Field" : "Optional Field"}
                        className={`p-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                          field.required
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {field.required ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        <span className="text-xs">{field.required ? "Req" : "Opt"}</span>
                      </button>

                      {/* Enabled Switch Toggle */}
                      <button
                        onClick={() => handleToggleEnabled(field.field_key)}
                        className={`w-11 h-6 rounded-full p-1 transition-colors relative ${
                          field.enabled ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            field.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>

                      {/* Remove Custom Field if starts with custom_ */}
                      {field.field_key.startsWith("custom_") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveField(field.field_key)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="w-full gap-2 border-dashed"
              >
                <Plus className="h-4 w-4" />
                Add Custom Field
              </Button>
            </div>
          </div>
        </div>

        {/* Right Pane: LIVE PREVIEW */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-card p-5 rounded-xl border border-border space-y-4 shadow-sm sticky top-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                LIVE PREVIEW
              </h3>
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Real-Time Customer Render
              </span>
            </div>

            <div className="bg-muted/20 border border-border rounded-xl p-5 space-y-4">
              <div>
                <h4 className="font-bold text-base text-foreground">Submit a Support Ticket</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Fill in the required details below.</p>
              </div>

              <div className="space-y-3.5">
                {fields
                  .filter((f) => f.enabled)
                  .map((field) => (
                    <div key={field.field_key} className="space-y-1">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-rose-500">*</span>}
                      </Label>

                      {field.field_key === "description" ? (
                        <textarea
                          rows={3}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="w-full bg-card border border-border rounded-md text-xs p-2.5 text-foreground placeholder:text-muted-foreground/50"
                        />
                      ) : field.field_key === "category" ? (
                        <select className="w-full bg-card border border-border rounded-md text-xs px-2.5 py-2 text-foreground">
                          <option value="">Select category...</option>
                          <option value="technical">Technical Support</option>
                          <option value="billing">Billing & Payment</option>
                          <option value="general">General Inquiry</option>
                        </select>
                      ) : field.field_key === "priority" ? (
                        <select className="w-full bg-card border border-border rounded-md text-xs px-2.5 py-2 text-foreground">
                          <option value="medium">Medium</option>
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                        </select>
                      ) : field.field_key === "attachment" ? (
                        <div className="border border-dashed border-border rounded-lg p-3 text-center bg-card">
                          <Paperclip className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">Attach images or files (Optional)</p>
                        </div>
                      ) : (
                        <Input
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="h-8 text-xs bg-card"
                        />
                      )}
                    </div>
                  ))}
              </div>

              <Button className="w-full mt-2 h-9 text-xs font-semibold" disabled>
                Submit Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="font-semibold text-foreground">Add Custom Field</h3>
            <div>
              <Label className="text-xs">Field Label</Label>
              <Input
                placeholder="e.g. Serial Number, Account ID"
                value={customFieldLabel}
                onChange={(e) => setCustomFieldLabel(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddField}>
                Add Field
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
