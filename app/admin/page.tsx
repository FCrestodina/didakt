'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Course } from '@/types';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { NewCourseModal } from '@/components/dashboard/NewCourseModal';
import { LogoCrestech } from '@/components/marca/LogoCrestech';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Plus, Loader2, Search, ArrowUpRight } from 'lucide-react';

type CourseWithId = Course & { _id: string; updatedAt: string };

export default function PanelPage() {
  const [courses, setCourses] = useState<CourseWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setError(false);
    fetch('/api/courses')
      .then((r) => {
        if (!r.ok) throw new Error('respuesta no OK');
        return r.json();
      })
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => {
        // Sin base de datos el panel no tiene nada que mostrar, pero tiene que
        // decirlo: antes quedaba el spinner girando para siempre.
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta secuencia?')) return;
    await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    setCourses((prev) => prev.filter((c) => c._id !== id));
  };

  const handleDuplicate = async (id: string) => {
    const original = courses.find((c) => c._id === id);
    if (!original) return;
    const { _id, createdAt, updatedAt, ...body } = original;
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, title: `${body.title} (copia)`, status: 'draft' }),
    });
    const created = await res.json();
    setCourses((prev) => [created, ...prev]);
  };

  const filtered = courses.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2.5 flex-1">
            <LogoCrestech size={24} />
            <span className="text-lg font-bold text-gray-900">Panel</span>
            <span className="text-xs text-gray-400 ml-1 hidden sm:block">
              Secuencias del editor de bloques
            </span>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 items-center gap-1 hidden sm:flex"
          >
            Ver catálogo <ArrowUpRight size={14} />
          </Link>
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
        ) : error ? (
          <div className="text-center py-24 space-y-3">
            <h2 className="text-xl font-semibold text-gray-700">No se pudo leer la base</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              El editor de bloques necesita MongoDB. Revisá que la instancia esté corriendo y que
              <code className="mx-1 text-gray-500">MONGODB_URI</code>
              esté definida.
            </p>
            <Button variant="secondary" onClick={load} className="mt-2">
              Reintentar
            </Button>
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
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <span className="text-sm text-gray-400">{filtered.length} secuencia{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>No hay resultados para <strong>&quot;{search}&quot;</strong></p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((course) => (
                  <CourseCard key={course._id} course={course} onDelete={handleDelete} onDuplicate={handleDuplicate} />
                ))}
                {!search && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all min-h-[200px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-500"
                  >
                    <Plus size={28} />
                    <span className="text-sm font-medium">Nueva secuencia</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {showModal && <NewCourseModal onClose={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
