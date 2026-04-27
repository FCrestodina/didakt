'use client';
import { useEffect, useState } from 'react';
import { Course } from '@/types';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { NewCourseModal } from '@/components/dashboard/NewCourseModal';
import { Button } from '@/components/ui/button';
import { GraduationCap, Plus, Loader2 } from 'lucide-react';

type CourseWithId = Course & { _id: string; updatedAt: string };

export default function DashboardPage() {
  const [courses, setCourses] = useState<CourseWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/courses')
      .then((r) => r.json())
      .then((data) => { setCourses(data); setLoading(false); });
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta secuencia?')) return;
    await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    setCourses((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <GraduationCap size={24} className="text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">Didakt</span>
            <span className="text-xs text-gray-400 ml-2 hidden sm:block">Secuencias didácticas</span>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Nueva secuencia
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <GraduationCap size={56} className="text-gray-200 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-700">Todavía no hay secuencias</h2>
            <p className="text-gray-400">Creá tu primera secuencia didáctica para empezar</p>
            <Button onClick={() => setShowModal(true)} size="lg" className="mt-2">
              <Plus size={16} /> Crear primera secuencia
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-700">
                {courses.length} secuencia{courses.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} onDelete={handleDelete} />
              ))}
              <button
                onClick={() => setShowModal(true)}
                className="rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all min-h-[200px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-500"
              >
                <Plus size={28} />
                <span className="text-sm font-medium">Nueva secuencia</span>
              </button>
            </div>
          </>
        )}
      </main>

      {showModal && <NewCourseModal onClose={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
