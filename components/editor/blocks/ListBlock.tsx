'use client';
import { BulletListBlock, NumberedListBlock } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

type T = BulletListBlock | NumberedListBlock;

export function ListBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateItem = (i: number, value: string) => {
    const items = [...block.items];
    items[i] = value;
    updateBlock(block.id, { items } as any);
  };

  const addItem = () => updateBlock(block.id, { items: [...block.items, ''] } as any);

  const deleteItem = (i: number) => {
    updateBlock(block.id, { items: block.items.filter((_, idx) => idx !== i) } as any);
  };

  return (
    <div className="space-y-1">
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-gray-400 w-5 text-center text-sm shrink-0">
            {block.type === 'bullet-list' ? '•' : `${i + 1}.`}
          </span>
          <Input
            defaultValue={item}
            onBlur={(e) => updateItem(i, e.target.value)}
            placeholder={`Ítem ${i + 1}`}
          />
          <Button variant="ghost" size="icon" onClick={() => deleteItem(i)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addItem}>
        <Plus size={14} /> Agregar ítem
      </Button>
    </div>
  );
}
