'use client';
import { useEffect, use, useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { LessonSidebar } from '@/components/editor/LessonSidebar';
import { BlockList } from '@/components/editor/BlockList';
import { CourseSettings } from '@/components/editor/CourseSettings';
import { Course } from '@/types';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { course, dirty, setCourse, setSaving, markClean } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then((r) => r.json())
      .then((data: Course & { id: string }) => {
        setCourse(data);
        setLoading(false);
      });
  }, [id]);

  const save = useCallback(async () => {
    const current = useEditorStore.getState();
    if (!current.course || !current.dirty) return;
    current.setSaving(true);
    await fetch(`/api/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current.course),
    });
    current.setSaving(false);
    current.markClean();
  }, [id]);

  // Autosave debounced 3s
  useEffect(() => {
    if (!dirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(save, 3000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [dirty, course, save]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <EditorHeader courseId={id} onSave={save} />
      <div className="flex-1 flex overflow-hidden">
        <LessonSidebar />
        <BlockList />
      </div>
      <CourseSettings />
    </div>
  );
}
