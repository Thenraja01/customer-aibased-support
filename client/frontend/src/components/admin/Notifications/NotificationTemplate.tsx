import { useState } from 'react';
import { Input } from '@/components/common/Forms/Input';
import { Textarea } from '@/components/common/Forms/Textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function NotificationTemplate() {
  const [templates, setTemplates] = useState<{ title: string; message: string }[]>([]);
  const [current, setCurrent] = useState({ title: '', message: '' });

  const addTemplate = () => {
    if (!current.title || !current.message) return;
    setTemplates((prev) => [...prev, current]);
    setCurrent({ title: '', message: '' });
  };

  const removeTemplate = (index: number) => {
    setTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Notification Templates</h3>
      <Card>
        <CardContent className="p-4 space-y-3">
          <Input
            placeholder="Template title"
            value={current.title}
            onChange={(e) => setCurrent({ ...current, title: e.target.value })}
          />
          <Textarea
            placeholder="Template message"
            value={current.message}
            onChange={(e) => setCurrent({ ...current, message: e.target.value })}
            rows={3}
          />
          <Button onClick={addTemplate} size="sm">
            <Plus size={14} className="mr-1" /> Add Template
          </Button>
        </CardContent>
      </Card>
      {templates.map((t, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.message}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeTemplate(i)}>
              <Trash2 size={14} className="text-destructive" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
