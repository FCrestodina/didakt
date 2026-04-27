'use client';
import { TimelineBlock as T } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

function newId() { return Math.random().toString(36).slice(2, 10); }

export function TimelineBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateItem = (itemId: string, data: Partial<T['items'][0]>) => {
    updateBlock(block.id, { items: block.items.map((i) => i.id === itemId ? { ...i, ...data } : i) } as any);
  };
  const addItem = () => updateBlock(block.id, { items: [...block.items, { id: newId(), date: '', title: 'Nuevo hito', description: '' }] } as any);
  const deleteItem = (itemId: string) => updateBlock(block.id, { items: block.items.filter((i) => i.id !== itemId) } as any);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">Línea de tiempo</p>
      {block.items.map((item) => (
        <div key={item.id} className="flex gap-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
          <Input defaultValue={item.date} onBlur={(e) => updateItem(item.id, { date: e.target.value })} placeholder="Fecha" className="w-24 shrink-0 text-sm" />
          <div className="flex-1 space-y-1">
            <Input defaultValue={item.title} onBlur={(e) => updateItem(item.id, { title: e.target.value })} placeholder="Título del hito" className="font-medium" />
            <Textarea defaultValue={item.description} onBlur={(e) => updateItem(item.id, { description: e.target.value })} placeholder="Descripción..." rows={2} />
          </div>
          <button onClick={() => deleteItem(item.id)} className="p-1 text-gray-300 hover:text-red-400 shrink-0">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addItem}><Plus size={14} /> Agregar hito</Button>
    </div>
  );
}
