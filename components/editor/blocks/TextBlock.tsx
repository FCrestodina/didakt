'use client';
import { TextBlock as T } from '@/types';
import { useEditorStore } from '@/store/editorStore';

export function TextBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
      className="text-gray-700 leading-relaxed outline-none min-h-[1.5rem] w-full"
    >
      {block.content}
    </div>
  );
}
