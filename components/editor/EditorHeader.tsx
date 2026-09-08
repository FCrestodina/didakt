'use client';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, ArrowLeft, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';

interface Props {
  courseId: string;
  onSave: () => Promise<void>;
}

export function EditorHeader({ courseId, onSave }: Props) {
  const { course, saving, dirty, setSettingsOpen } = useEditorStore();

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0">
      <Link href="/admin" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        <ArrowLeft size={18} />
      </Link>
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 truncate">{course?.title || 'Sin título'}</h1>
      </div>
      <Badge variant={course?.status ?? 'draft'}>
        {course?.status === 'published' ? 'Publicado' : 'Borrador'}
      </Badge>
      {saving && <span className="text-xs text-indigo-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Guardando...</span>}
      {!saving && dirty && <span className="text-xs text-amber-500">● Sin guardar</span>}
      {!saving && !dirty && <span className="text-xs text-green-500">✓ Guardado</span>}
      <button
        onClick={() => setSettingsOpen(true)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        title="Configuración"
      >
        <Settings size={18} />
      </button>
      <Link href={`/courses/${courseId}/preview`} target="_blank">
        <Button variant="secondary" size="sm">
          <Eye size={14} /> Preview
        </Button>
      </Link>
      <Button onClick={onSave} disabled={saving || !dirty} size="sm">
        <Save size={14} /> Guardar
      </Button>
    </header>
  );
}
