'use client';
import { QuoteBlock as T } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function QuoteBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  return (
    <div className="border-l-4 border-indigo-400 pl-4 space-y-2">
      <Textarea
        defaultValue={block.content}
        onBlur={(e) => updateBlock(block.id, { content: e.target.value } as any)}
        placeholder="Cita..."
        rows={3}
        className="text-lg italic text-gray-700"
      />
      <Input
        defaultValue={block.author}
        onBlur={(e) => updateBlock(block.id, { author: e.target.value } as any)}
        placeholder="— Autor (opcional)"
        className="text-sm text-gray-500"
      />
    </div>
  );
}
