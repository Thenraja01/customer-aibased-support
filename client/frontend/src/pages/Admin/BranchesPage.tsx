import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Building2, MapPin, Phone, Mail, FileText, Save, X } from "lucide-react";
import BranchAPI from "@/api/branch.api.js";
import { useToast } from "@/components/ui/toast";

export default function BranchesPage() {
  const toast = useToast();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await BranchAPI.getAll();
      if (res.data.success) {
        setBranches(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      toast.error("Error", "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim()) {
      BranchAPI.search(q)
        .then((res) => {
          if (res.data.success) setBranches(res.data.data || []);
        })
        .catch(() => {});
    } else {
      fetchBranches();
    }
  };

  const openCreateDialog = () => {
    setEditingBranch(null);
    setFormData({});
    setShowDialog(true);
  };

  const openEditDialog = (branch: any) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      description: branch.description,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      toast.error("Validation", "Branch name is required");
      return;
    }
    try {
      if (editingBranch) {
        await BranchAPI.update(editingBranch._id, formData);
        toast.success("Success", "Branch updated");
      } else {
        await BranchAPI.create(formData);
        toast.success("Success", "Branch created");
      }
      setShowDialog(false);
      fetchBranches();
    } catch (error: any) {
      toast.error("Error", error?.response?.data?.message || "Failed to save branch");
    }
  };

  const handleDelete = async (branch: any) => {
    if (!window.confirm(`Delete ${branch.name}? This cannot be undone.`)) return;
    try {
      await BranchAPI.remove(branch._id);
      toast.success("Success", "Branch deleted");
      fetchBranches();
    } catch (error: any) {
      toast.error("Error", error?.response?.data?.message || "Failed to delete branch");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="text-primary" size={28} />
            Branches
          </h1>
          <p className="text-muted-foreground mt-1">Manage organization branches and assign support teams.</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus size={16} />
          Add Branch
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search branches..."
          value={searchQuery}
          onChange={handleSearch}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading branches...</div>
      ) : branches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 size={48} className="mx-auto mb-3 opacity-20" />
          <p>No branches found. Create your first branch to get started.</p>
        </div>
      ) : (
        <div className="border border-border dark:border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b dark:border-white/[0.06]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch._id} className="border-b dark:border-white/[0.06]">
                  <td className="px-4 py-3">
                    <div className="font-medium flex items-center gap-2">
                      <Building2 size={14} className="text-primary" />
                      {branch.name}
                    </div>
                    {branch.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{branch.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{branch.code || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {branch.phone && (
                        <span className="flex items-center gap-1 text-xs">
                          <Phone size={12} />{branch.phone}
                        </span>
                      )}
                      {branch.email && (
                        <span className="flex items-center gap-1 text-xs">
                          <Mail size={12} />{branch.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      branch.status === "active"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                    }`}>
                      {branch.status || "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditDialog(branch)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(branch)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border dark:border-white/[0.06] rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b dark:border-white/[0.06]">
              <h2 className="text-lg font-semibold">{editingBranch ? "Edit Branch" : "Create Branch"}</h2>
              <button onClick={() => setShowDialog(false)} className="p-1 rounded-lg hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Downtown Branch"
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. DT01"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">
                  <FileText size={14} className="inline mr-1" />
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this branch"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">
                    <Phone size={14} className="inline mr-1" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">
                    <Mail size={14} className="inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="branch@company.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">
                  <MapPin size={14} className="inline mr-1" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status || "active"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/[0.06]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 border-t dark:border-white/[0.06]">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                <X size={14} className="mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save size={14} className="mr-1" />
                {editingBranch ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
