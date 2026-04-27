'use client';
import { Course } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit, Eye, Trash2, GraduationCap, Copy } from 'lucide-react';
import Link from 'next/link';

interface Props {
  course: Course & { _id: string; updatedAt: string; lessons: any[] };
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export function CourseCard({ course, onDelete, onDuplicate }: Props) {
  const lessonCount = course.lessons?.length ?? 0;
  const blockCount = course.lessons?.reduce((acc: number, l: any) => acc + (l.blocks?.length || 0), 0) || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
      <div
        className="h-32 flex items-center justify-center relative"
        style={{ backgroundColor: (course.theme?.primaryColor || '#6366f1') + '22' }}
      >
        {course.coverImage ? (
          <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <GraduationCap size={40} style={{ color: course.theme?.primaryColor ?? '#6366f1' }} />
        )}
        <button
          onClick={() => onDuplicate(course._id)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
          title="Duplicar"
        >
          <Copy size={14} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{course.title}</h3>
          <Badge variant={course.status}>{course.status === 'published' ? 'Publicado' : 'Borrador'}</Badge>
        </div>
        {course.description && <p className="text-sm text-gray-500 line-clamp-2 mb-2">{course.description}</p>}
        <div className="flex gap-3 text-xs text-gray-400 mt-auto mb-3">
          <span className="flex items-center gap-1"><BookOpen size={12} /> {lessonCount} lección{lessonCount !== 1 ? 'es' : ''}</span>
          <span>{blockCount} bloques</span>
          {course.updatedAt && <span className="ml-auto">{timeAgo(course.updatedAt)}</span>}
        </div>
        <div className="flex gap-2">
          <Link href={`/courses/${course._id}/edit`} className="flex-1">
            <Button variant="default" size="sm" className="w-full"><Edit size={12} /> Editar</Button>
          </Link>
          <Link href={`/courses/${course._id}/preview`} target="_blank">
            <Button variant="secondary" size="icon"><Eye size={14} /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => onDelete(course._id)} className="text-gray-300 hover:text-red-400">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
