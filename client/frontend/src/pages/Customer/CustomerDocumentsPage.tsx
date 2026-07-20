import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, X } from "lucide-react";
import { DocumentList } from "@/components/customer/Documents/DocumentList";
import { DocumentUpload } from "@/components/customer/Documents/DocumentUpload";
import { DocumentAPI } from "@/api";
import { toast } from "sonner";

export default function CustomerDocumentsPage() {
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // A refresh trigger for the DocumentList
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpload = async (file: File, title: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("is_knowledge_base", "true"); // Uploading for RAG processing

      await DocumentAPI.upload(formData);
      toast.success("Document uploaded successfully");
      setShowUpload(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage your documents for AI context.</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} variant={showUpload ? "outline" : "default"}>
          {showUpload ? (
            <>
              <X className="mr-2 h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </>
          )}
        </Button>
      </div>

      {showUpload && (
        <Card className="border-primary/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Upload New Document</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUpload onUpload={handleUpload} uploading={uploading} />
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList key={refreshKey} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
