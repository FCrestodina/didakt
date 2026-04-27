'use client';
import { FlashcardBlock as T } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

function newId() { return Math.random().toString(36).slice(2, 10); }

export function FlashcardBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateItem = (itemId: string, key: 'front' | 'back', value: string) => {
    updateBlock(block.id, { items: block.items.map((i) => i.id === itemId ? { ...i, [key]: value } : i) } as any);
  };
  const addItem = () => updateBlock(block.id, { items: [...block.items, { id: newId(), front: 'Frente', back: 'Dorso' }] } as any);
  const deleteItem = (itemId: string) => updateBlock(block.id, { items: block.items.filter((i) => i.id !== itemId) } as any);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Tarjetas</p>
      {block.items.map((item, i) => (
        <div key={item.id} className="grid grid-cols-2 gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div>
            <p className="text-xs text-gray-400 mb-1">Frente</p>
            <Input defaultValue={item.front} onBlur={(e) => updateItem(item.id, 'front', e.target.value)} placeholder="Pregunta o término" />
          </div>
          <div className="relative">
            <p className="text-xs text-gray-400 mb-1">Dorso</p>
            <Input defaultValue={item.back} onBlur={(e) => updateItem(item.id, 'back', e.target.value)} placeholder="Respuesta o definición" />
            <button onClick={() => deleteItem(item.id)} className="absolute -top-1 -right-1 p-0.5 text-gray-300 hover:text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addItem}><Plus size={14} /> Agregar tarjeta</Button>
    </div>
  );
}
