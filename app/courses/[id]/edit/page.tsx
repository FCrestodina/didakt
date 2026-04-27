'use client';
import { useEffect, use } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { LessonSidebar } from '@/components/editor/LessonSidebar';
import { BlockList } from '@/components/editor/BlockList';
import { Course } from '@/types';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { course, setCourse, setSaving, markClean } = useEditorStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then((r) => r.json())
      .then((data: Course & { _id: string }) => {
        setCourse({ ...data, _id: data._id?.toString() });
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!course) return;
    setSaving(true);
    await fetch(`/api/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    setSaving(false);
    markClean();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <EditorHeader courseId={id} onSave={handleSave} />
      <div className="flex-1 flex overflow-hidden">
        <LessonSidebar />
        <BlockList />
      </div>
    </div>
  );
}
