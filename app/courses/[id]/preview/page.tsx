'use client';
import { use, useEffect, useState } from 'react';
import { Course, Lesson } from '@/types';
import { BlockRenderer } from '@/components/preview/BlockRenderer';
import { cn } from '@/lib/utils';
import { BookOpen, ArrowLeft, ArrowRight, Edit } from 'lucide-react';
import Link from 'next/link';

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then((r) => r.json())
      .then(setCourse);
  }, [id]);

  if (!course) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
    </div>
  );

  const lesson: Lesson | undefined = course.lessons[activeIdx];
  const primary = course.theme?.primaryColor ?? '#6366f1';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10" style={{ borderBottomColor: primary + '33' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <BookOpen size={20} style={{ color: primary }} />
          <h1 className="font-bold text-gray-900 flex-1 truncate">{course.title}</h1>
          <Link href={`/courses/${id}/edit`} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <Edit size={14} /> Editar
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full flex-1 flex">
        {/* Sidebar lecciones */}
        <nav className="w-56 shrink-0 py-6 pr-4 hidden md:block">
          {course.lessons.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors',
                i === activeIdx
                  ? 'font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
              style={i === activeIdx ? { backgroundColor: primary + '15', color: primary } : {}}
            >
              <span className="text-xs text-gray-400 mr-2">{i + 1}.</span>
              {l.title}
            </button>
          ))}
        </nav>

        {/* Contenido */}
        <main className="flex-1 py-8 px-6">
          {lesson ? (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{lesson.title}</h2>
              {lesson.blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">Este curso no tiene lecciones todavía.</div>
          )}

          {/* Nav lección */}
          {course.lessons.length > 1 && (
            <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
              <button
                onClick={() => setActiveIdx((p) => Math.max(0, p - 1))}
                disabled={activeIdx === 0}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition"
              >
                <ArrowLeft size={16} /> Anterior
              </button>
              <span className="text-sm text-gray-400">{activeIdx + 1} / {course.lessons.length}</span>
              <button
                onClick={() => setActiveIdx((p) => Math.min(course.lessons.length - 1, p + 1))}
                disabled={activeIdx === course.lessons.length - 1}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition"
              >
                Siguiente <ArrowRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
