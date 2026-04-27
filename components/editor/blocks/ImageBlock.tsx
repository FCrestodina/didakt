'use client';
import { ImageBlock as T } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Input } from '@/components/ui/input';
import { ImageIcon } from 'lucide-react';

export function ImageBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  return (
    <div className="space-y-2">
      <Input
        placeholder="URL de la imagen"
        defaultValue={block.url}
        onBlur={(e) => updateBlock(block.id, { url: e.target.value })}
      />
      {block.url ? (
        <img src={block.url} alt={block.alt || 'imagen'} className="w-full rounded-lg object-cover max-h-80" />
      ) : (
        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
          <ImageIcon size={40} />
        </div>
      )}
      <Input
        placeholder="Descripción / caption"
        defaultValue={block.caption}
        onBlur={(e) => updateBlock(block.id, { caption: e.target.value })}
      />
    </div>
  );
}
