'use client';
import { BlockType } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Type, AlignLeft, Image, Video, HelpCircle, ChevronDown, List, ListOrdered, Quote, Lightbulb, Minus, Plus, Code, CreditCard, GitBranch } from 'lucide-react';
import { useState } from 'react';

const blocks: { type: BlockType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'heading',       label: 'Título',    icon: <Type size={16} />,        color: 'text-gray-700' },
  { type: 'text',          label: 'Texto',     icon: <AlignLeft size={16} />,   color: 'text-gray-700' },
  { type: 'image',         label: 'Imagen',    icon: <Image size={16} />,       color: 'text-blue-600' },
  { type: 'video',         label: 'Video',     icon: <Video size={16} />,       color: 'text-red-600' },
  { type: 'quiz',          label: 'Quiz',      icon: <HelpCircle size={16} />,  color: 'text-indigo-600' },
  { type: 'accordion',     label: 'Acordeón',  icon: <ChevronDown size={16} />, color: 'text-teal-600' },
  { type: 'flashcard',     label: 'Tarjetas',  icon: <CreditCard size={16} />,  color: 'text-purple-600' },
  { type: 'timeline',      label: 'Timeline',  icon: <GitBranch size={16} />,   color: 'text-teal-600' },
  { type: 'code',          label: 'Código',    icon: <Code size={16} />,        color: 'text-gray-700' },
  { type: 'bullet-list',   label: 'Lista',     icon: <List size={16} />,        color: 'text-gray-700' },
  { type: 'numbered-list', label: 'Numerada',  icon: <ListOrdered size={16} />, color: 'text-gray-700' },
  { type: 'quote',         label: 'Cita',      icon: <Quote size={16} />,       color: 'text-purple-600' },
  { type: 'callout',       label: 'Callout',   icon: <Lightbulb size={16} />,   color: 'text-yellow-600' },
  { type: 'divider',       label: 'Divisor',   icon: <Minus size={16} />,       color: 'text-gray-400' },
];

export function BlockToolbar() {
  const addBlock = useEditorStore((s) => s.addBlock);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 mx-auto px-4 py-2 rounded-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm"
      >
        <Plus size={16} /> Agregar bloque
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-10 w-96">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Tipo de bloque</p>
          <div className="grid grid-cols-4 gap-1">
            {blocks.map((b) => (
              <button
                key={b.type}
                onClick={() => { addBlock(b.type); setOpen(false); }}
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className={cn(b.color)}>{b.icon}</span>
                <span className="text-xs text-gray-600">{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
