'use client';
import { CalloutBlock as T } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const variants = {
  info: { bg: 'bg-blue-50 border-blue-300', label: 'ℹ️ Info', text: 'text-blue-800' },
  warning: { bg: 'bg-yellow-50 border-yellow-300', label: '⚠️ Atención', text: 'text-yellow-800' },
  success: { bg: 'bg-green-50 border-green-300', label: '✅ Éxito', text: 'text-green-800' },
  tip: { bg: 'bg-purple-50 border-purple-300', label: '💡 Tip', text: 'text-purple-800' },
};

export function CalloutBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const v = variants[block.variant];

  return (
    <div className={cn('border-l-4 rounded-r-lg p-4 space-y-2', v.bg)}>
      <div className="flex gap-2 mb-2">
        {(Object.keys(variants) as T['variant'][]).map((k) => (
          <button
            key={k}
            onClick={() => updateBlock(block.id, { variant: k } as any)}
            className={cn('text-xs px-2 py-0.5 rounded border', block.variant === k ? 'bg-white font-semibold' : 'opacity-50')}
          >
            {variants[k].label}
          </button>
        ))}
      </div>
      <Textarea
        defaultValue={block.content}
        onBlur={(e) => updateBlock(block.id, { content: e.target.value } as any)}
        placeholder="Escribí el contenido del callout..."
        rows={2}
        className={cn('bg-transparent border-0 focus:ring-0', v.text)}
      />
    </div>
  );
}
