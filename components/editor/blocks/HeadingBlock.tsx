'use client';
import { HeadingBlock as T } from '@/types';
import { useEditorStore } from '@/store/editorStore';

export function HeadingBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3';
  const sizes = { 1: 'text-4xl font-bold', 2: 'text-2xl font-bold', 3: 'text-xl font-semibold' };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-1">
        {([1, 2, 3] as const).map((l) => (
          <button
            key={l}
            onClick={() => updateBlock(block.id, { level: l })}
            className={`text-xs px-2 py-0.5 rounded ${block.level === l ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            H{l}
          </button>
        ))}
      </div>
      <Tag
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
        className={`${sizes[block.level]} outline-none w-full`}
      >
        {block.content}
      </Tag>
    </div>
  );
}
