'use client';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  courseId: string;
  onSave: () => Promise<void>;
}

export function EditorHeader({ courseId, onSave }: Props) {
  const { course, saving, dirty } = useEditorStore();

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0">
      <Link href="/" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        <ArrowLeft size={18} />
      </Link>
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 truncate">{course?.title || 'Sin título'}</h1>
      </div>
      <Badge variant={course?.status ?? 'draft'}>
        {course?.status === 'published' ? 'Publicado' : 'Borrador'}
      </Badge>
      {dirty && <span className="text-xs text-amber-500">● Sin guardar</span>}
      <Link href={`/courses/${courseId}/preview`} target="_blank">
        <Button variant="secondary" size="sm">
          <Eye size={14} /> Preview
        </Button>
      </Link>
      <Button onClick={onSave} disabled={saving || !dirty} size="sm">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Guardar
      </Button>
    </header>
  );
}
