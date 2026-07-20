import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Bot, Settings, Activity } from "lucide-react";

export default function AdminChatbotPage() {
  const [testMessage, setTestMessage] = useState("");
  const [response, setResponse] = useState("");

  const handleTest = () => {
    setResponse(`Simulated AI response for: "${testMessage}"`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Chatbot Configuration</h1>
        <Badge variant="secondary" className="text-sm">Org Admin</Badge>
      </div>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test"><MessageSquare className="mr-2 h-4 w-4" /> Test Playground</TabsTrigger>
          <TabsTrigger value="config"><Settings className="mr-2 h-4 w-4" /> Configuration</TabsTrigger>
          <TabsTrigger value="monitor"><Activity className="mr-2 h-4 w-4" /> Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="test">
          <Card>
            <CardHeader><CardTitle>Test the AI Chatbot</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a test message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTest()}
                />
                <Button onClick={handleTest}><Bot className="mr-2 h-4 w-4" /> Send</Button>
              </div>
              {response && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">Response:</p>
                  <p className="mt-1 text-muted-foreground">{response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader><CardTitle>Model Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Model</label>
                  <Select defaultValue="llama3-70b">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llama3-70b">Llama 3 70B</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature</label>
                  <Select defaultValue="0.7">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.1">0.1 (Precise)</SelectItem>
                      <SelectItem value="0.5">0.5 (Balanced)</SelectItem>
                      <SelectItem value="0.7">0.7 (Creative)</SelectItem>
                      <SelectItem value="1.0">1.0 (Very Creative)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button>Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor">
          <Card>
            <CardHeader><CardTitle>Live Chat Monitoring</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Active chat sessions will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
