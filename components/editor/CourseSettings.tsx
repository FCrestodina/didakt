'use client';
import { useEditorStore } from '@/store/editorStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Settings } from 'lucide-react';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#64748b'];

export function CourseSettings() {
  const { course, settingsOpen, setSettingsOpen, updateCourseField, updateTheme } = useEditorStore();
  if (!course || !settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <Settings size={18} className="text-indigo-500" /> Configuración del curso
          </div>
          <button onClick={() => setSettingsOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Título</label>
          <Input
            defaultValue={course.title}
            onBlur={(e) => updateCourseField('title', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Descripción</label>
          <Textarea
            defaultValue={course.description}
            onBlur={(e) => updateCourseField('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Imagen de portada (URL)</label>
          <Input
            defaultValue={course.coverImage ?? ''}
            onBlur={(e) => updateCourseField('coverImage', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Color principal</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => updateTheme('primaryColor', c)}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c, outline: course.theme.primaryColor === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: '2px' }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Estado</label>
          <div className="flex gap-2">
            {(['draft', 'published'] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateCourseField('status', s)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${course.status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {s === 'draft' ? 'Borrador' : 'Publicado'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
