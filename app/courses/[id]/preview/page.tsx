'use client';
import { use, useEffect, useState } from 'react';
import { Course, Lesson } from '@/types';
import { BlockRenderer } from '@/components/preview/BlockRenderer';
import { cn } from '@/lib/utils';
import { BookOpen, ArrowLeft, ArrowRight, Edit, CheckCircle, Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${id}`).then((r) => r.json()).then(setCourse);
  }, [id]);

  if (!course) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
    </div>
  );

  const lesson: Lesson | undefined = course.lessons[activeIdx];
  const primary = course.theme?.primaryColor ?? '#6366f1';
  const allDone = course.lessons.length > 0 && completed.size === course.lessons.length;
  const progress = course.lessons.length > 0 ? Math.round((completed.size / course.lessons.length) * 100) : 0;

  const markDone = () => setCompleted((prev) => { const s = new Set(prev); s.add(activeIdx); return s; });

  const goTo = (idx: number) => { setActiveIdx(idx); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goNext = () => { if (activeIdx < course.lessons.length - 1) { markDone(); goTo(activeIdx + 1); } else { markDone(); } };

  if (allDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Completaste el curso!</h1>
        <p className="text-gray-500 mb-2">{course.title}</p>
        <p className="text-gray-400 text-sm mb-8">{course.lessons.length} lección{course.lessons.length !== 1 ? 'es' : ''} completadas</p>
        <div className="flex gap-3">
          <button
            onClick={() => { setCompleted(new Set()); setActiveIdx(0); }}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm"
          >
            Volver a empezar
          </button>
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button className="md:hidden p-2 text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <BookOpen size={18} style={{ color: primary }} className="hidden md:block" />
          <h1 className="font-bold text-gray-900 flex-1 truncate text-sm md:text-base">{course.title}</h1>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span>{completed.size}/{course.lessons.length}</span>
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: primary }} />
            </div>
          </div>
          <Link href={`/courses/${id}/edit`} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 hidden sm:flex">
            <Edit size={14} /> Editar
          </Link>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-sm text-gray-700">Lecciones</span>
              <button onClick={() => setSidebarOpen(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              {course.lessons.map((l, i) => <LessonButton key={l.id} lesson={l} index={i} active={i === activeIdx} done={completed.has(i)} primary={primary} onClick={() => goTo(i)} />)}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full flex-1 flex">
        {/* Desktop sidebar */}
        <nav className="w-56 shrink-0 py-6 pr-4 hidden md:block">
          <p className="text-xs text-gray-400 uppercase tracking-wide px-3 mb-2">Lecciones</p>
          {course.lessons.map((l, i) => <LessonButton key={l.id} lesson={l} index={i} active={i === activeIdx} done={completed.has(i)} primary={primary} onClick={() => goTo(i)} />)}
        </nav>

        {/* Content */}
        <main className="flex-1 py-8 px-4 md:px-6 min-w-0">
          {lesson ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Lección {activeIdx + 1} de {course.lessons.length}</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{lesson.title}</h2>
                </div>
                {completed.has(activeIdx) && <CheckCircle size={24} className="mt-1 shrink-0" style={{ color: primary }} />}
              </div>
              {lesson.blocks.map((block) => <BlockRenderer key={block.id} block={block} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">Este curso no tiene lecciones todavía.</div>
          )}

          {/* Nav */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">
            <button onClick={() => goTo(Math.max(0, activeIdx - 1))} disabled={activeIdx === 0}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition">
              <ArrowLeft size={16} /> Anterior
            </button>
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              {activeIdx === course.lessons.length - 1 ? 'Finalizar curso' : 'Siguiente'} <ArrowRight size={16} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function LessonButton({ lesson, index, active, done, primary, onClick }: { lesson: Lesson; index: number; active: boolean; done: boolean; primary: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn('w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors flex items-center gap-2',
        active ? 'font-semibold' : 'text-gray-600 hover:bg-gray-100'
      )}
      style={active ? { backgroundColor: primary + '15', color: primary } : {}}
    >
      {done
        ? <CheckCircle size={14} style={{ color: primary }} className="shrink-0" />
        : <span className="text-xs text-gray-400 w-4 shrink-0">{index + 1}.</span>
      }
      <span className="truncate">{lesson.title}</span>
    </button>
  );
}
