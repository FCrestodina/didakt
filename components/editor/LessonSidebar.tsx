'use client';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { useState } from 'react';

export function LessonSidebar() {
  const { course, activeLessonId, setActiveLesson, addLesson, updateLesson, deleteLesson } = useEditorStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!course) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <BookOpen size={16} className="text-indigo-500" />
          Lecciones
        </div>
        <button
          onClick={addLesson}
          className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Nueva lección"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {course.lessons.map((lesson, i) => (
          <div
            key={lesson.id}
            onClick={() => setActiveLesson(lesson.id)}
            className={cn(
              'group mx-2 mb-1 rounded-lg px-3 py-2 cursor-pointer transition-colors',
              activeLessonId === lesson.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono w-4">{i + 1}</span>
              {editingId === lesson.id ? (
                <input
                  autoFocus
                  defaultValue={lesson.title}
                  onBlur={(e) => { updateLesson(lesson.id, e.target.value); setEditingId(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-sm bg-white border border-indigo-300 rounded px-1 outline-none"
                />
              ) : (
                <span
                  className="flex-1 text-sm truncate"
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingId(lesson.id); }}
                >
                  {lesson.title}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <p className="text-xs text-gray-400 ml-6 mt-0.5">
              {lesson.blocks.length} bloque{lesson.blocks.length !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
