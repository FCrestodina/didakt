'use client';
import { CodeBlock as T } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'csharp', 'sql', 'html', 'css', 'bash', 'json'];

export function CodeBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">Lenguaje</span>
        <select
          value={block.language}
          onChange={(e) => updateBlock(block.id, { language: e.target.value } as any)}
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <Textarea
        defaultValue={block.code}
        onBlur={(e) => updateBlock(block.id, { code: e.target.value } as any)}
        rows={6}
        className="font-mono text-sm bg-gray-900 text-green-400 border-gray-700 resize-y"
        spellCheck={false}
      />
    </div>
  );
}
