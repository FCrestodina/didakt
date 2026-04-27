'use client';
import { QuizBlock as T, QuizOption } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

function newId() { return Math.random().toString(36).slice(2, 10); }

export function QuizBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateOption = (optId: string, data: Partial<QuizOption>) => {
    updateBlock(block.id, {
      options: block.options.map((o) => (o.id === optId ? { ...o, ...data } : o)),
    } as any);
  };

  const addOption = () => {
    updateBlock(block.id, {
      options: [...block.options, { id: newId(), text: 'Nueva opción', isCorrect: false }],
    } as any);
  };

  const deleteOption = (optId: string) => {
    updateBlock(block.id, { options: block.options.filter((o) => o.id !== optId) } as any);
  };

  return (
    <div className="space-y-3 bg-indigo-50 rounded-lg p-4">
      <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Quiz</p>
      <Input
        defaultValue={block.question}
        placeholder="Pregunta"
        onBlur={(e) => updateBlock(block.id, { question: e.target.value } as any)}
        className="font-medium text-base"
      />
      <div className="space-y-2">
        {block.options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              type="radio"
              checked={opt.isCorrect}
              onChange={() =>
                updateBlock(block.id, {
                  options: block.options.map((o) => ({ ...o, isCorrect: o.id === opt.id })),
                } as any)
              }
              className="accent-indigo-600"
            />
            <Input
              defaultValue={opt.text}
              onBlur={(e) => updateOption(opt.id, { text: e.target.value })}
              className={opt.isCorrect ? 'border-green-400 bg-green-50' : ''}
            />
            <Button variant="ghost" size="icon" onClick={() => deleteOption(opt.id)}>
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={addOption}>
        <Plus size={14} /> Agregar opción
      </Button>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Feedback correcto</p>
          <Input
            defaultValue={block.feedback.correct}
            onBlur={(e) => updateBlock(block.id, { feedback: { ...block.feedback, correct: e.target.value } } as any)}
            placeholder="¡Correcto!"
          />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Feedback incorrecto</p>
          <Input
            defaultValue={block.feedback.incorrect}
            onBlur={(e) => updateBlock(block.id, { feedback: { ...block.feedback, incorrect: e.target.value } } as any)}
            placeholder="Intentá de nuevo."
          />
        </div>
      </div>
    </div>
  );
}
