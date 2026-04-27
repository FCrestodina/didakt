'use client';
import { AccordionBlock as T, AccordionItem } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

function newId() { return Math.random().toString(36).slice(2, 10); }

export function AccordionBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateItem = (itemId: string, data: Partial<AccordionItem>) => {
    updateBlock(block.id, {
      items: block.items.map((i) => (i.id === itemId ? { ...i, ...data } : i)),
    } as any);
  };

  const addItem = () => {
    updateBlock(block.id, {
      items: [...block.items, { id: newId(), title: 'Nueva sección', content: '' }],
    } as any);
  };

  const deleteItem = (itemId: string) => {
    updateBlock(block.id, { items: block.items.filter((i) => i.id !== itemId) } as any);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Acordeón</p>
      {block.items.map((item, i) => (
        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2">
            <span className="text-xs text-gray-400 font-mono">{i + 1}</span>
            <Input
              defaultValue={item.title}
              onBlur={(e) => updateItem(item.id, { title: e.target.value })}
              className="border-0 bg-transparent font-medium text-sm p-0 h-7"
              placeholder="Título de la sección"
            />
            <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
              <Trash2 size={14} />
            </Button>
          </div>
          <div className="p-3">
            <Textarea
              defaultValue={item.content}
              onBlur={(e) => updateItem(item.id, { content: e.target.value })}
              placeholder="Contenido de la sección..."
              rows={3}
            />
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addItem}>
        <Plus size={14} /> Agregar sección
      </Button>
    </div>
  );
}
