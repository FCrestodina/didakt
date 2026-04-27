import { create } from 'zustand';
import { Block, BlockType, Course, Lesson } from '@/types';

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultBlock(type: BlockType): Block {
  switch (type) {
    case 'heading':      return { id: newId(), type, content: 'Nuevo título', level: 2 };
    case 'text':         return { id: newId(), type, content: 'Escribí tu contenido acá.' };
    case 'image':        return { id: newId(), type, url: '', caption: '', alt: '' };
    case 'video':        return { id: newId(), type, url: '', caption: '' };
    case 'quiz':         return { id: newId(), type, question: '¿Cuál es la respuesta correcta?', options: [{ id: newId(), text: 'Opción A', isCorrect: true }, { id: newId(), text: 'Opción B', isCorrect: false }], feedback: { correct: '¡Correcto!', incorrect: 'Intentá de nuevo.' } };
    case 'accordion':    return { id: newId(), type, items: [{ id: newId(), title: 'Sección 1', content: 'Contenido...' }] };
    case 'divider':      return { id: newId(), type };
    case 'bullet-list':  return { id: newId(), type, items: ['Ítem 1', 'Ítem 2'] };
    case 'numbered-list':return { id: newId(), type, items: ['Primer paso', 'Segundo paso'] };
    case 'quote':        return { id: newId(), type, content: 'Una cita inspiradora.', author: '' };
    case 'callout':      return { id: newId(), type, variant: 'info', content: 'Nota importante.' };
    case 'code':         return { id: newId(), type, code: '// Escribí tu código acá\nconsole.log("Hola mundo");', language: 'javascript' };
    case 'flashcard':    return { id: newId(), type, items: [{ id: newId(), front: '¿Pregunta?', back: 'Respuesta' }] };
    case 'timeline':     return { id: newId(), type, items: [{ id: newId(), date: '2024', title: 'Primer hito', description: 'Descripción del evento.' }, { id: newId(), date: '2025', title: 'Segundo hito', description: 'Descripción del evento.' }] };
  }
}

interface EditorState {
  course: Course | null;
  activeLessonId: string | null;
  selectedBlockId: string | null;
  saving: boolean;
  dirty: boolean;
  settingsOpen: boolean;

  setCourse: (course: Course) => void;
  setActiveLesson: (id: string) => void;
  selectBlock: (id: string | null) => void;
  setSettingsOpen: (v: boolean) => void;

  updateCourseField: (field: keyof Course, value: any) => void;
  updateTheme: (key: string, value: string) => void;

  addLesson: () => void;
  updateLesson: (lessonId: string, title: string) => void;
  deleteLesson: (lessonId: string) => void;
  reorderLessons: (from: number, to: number) => void;

  addBlock: (type: BlockType) => void;
  updateBlock: (blockId: string, data: Partial<Block>) => void;
  deleteBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  reorderBlocks: (from: number, to: number) => void;

  setSaving: (v: boolean) => void;
  markClean: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  course: null,
  activeLessonId: null,
  selectedBlockId: null,
  saving: false,
  dirty: false,
  settingsOpen: false,

  setCourse: (course) => set({ course, activeLessonId: course.lessons[0]?.id ?? null }),
  setActiveLesson: (id) => set({ activeLessonId: id, selectedBlockId: null }),
  selectBlock: (id) => set({ selectedBlockId: id }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),

  updateCourseField: (field, value) => set((s) => ({
    course: s.course ? { ...s.course, [field]: value } : null,
    dirty: true,
  })),

  updateTheme: (key, value) => set((s) => ({
    course: s.course ? { ...s.course, theme: { ...s.course.theme, [key]: value } } : null,
    dirty: true,
  })),

  addLesson: () => set((s) => {
    if (!s.course) return {};
    const lesson: Lesson = { id: newId(), title: 'Nueva lección', blocks: [] };
    return { course: { ...s.course, lessons: [...s.course.lessons, lesson] }, activeLessonId: lesson.id, dirty: true };
  }),

  updateLesson: (lessonId, title) => set((s) => ({
    course: s.course ? { ...s.course, lessons: s.course.lessons.map((l) => l.id === lessonId ? { ...l, title } : l) } : null,
    dirty: true,
  })),

  deleteLesson: (lessonId) => set((s) => {
    if (!s.course) return {};
    const lessons = s.course.lessons.filter((l) => l.id !== lessonId);
    return { course: { ...s.course, lessons }, activeLessonId: lessons[0]?.id ?? null, dirty: true };
  }),

  reorderLessons: (from, to) => set((s) => {
    if (!s.course) return {};
    const lessons = [...s.course.lessons];
    const [item] = lessons.splice(from, 1);
    lessons.splice(to, 0, item);
    return { course: { ...s.course, lessons }, dirty: true };
  }),

  addBlock: (type) => set((s) => {
    if (!s.course || !s.activeLessonId) return {};
    const block = defaultBlock(type);
    return {
      course: { ...s.course, lessons: s.course.lessons.map((l) => l.id === s.activeLessonId ? { ...l, blocks: [...l.blocks, block] } : l) },
      selectedBlockId: block.id,
      dirty: true,
    };
  }),

  updateBlock: (blockId, data) => set((s) => {
    if (!s.course) return {};
    return {
      course: { ...s.course, lessons: s.course.lessons.map((l) => ({ ...l, blocks: l.blocks.map((b) => b.id === blockId ? { ...b, ...data } as Block : b) })) },
      dirty: true,
    };
  }),

  deleteBlock: (blockId) => set((s) => {
    if (!s.course) return {};
    return {
      course: { ...s.course, lessons: s.course.lessons.map((l) => ({ ...l, blocks: l.blocks.filter((b) => b.id !== blockId) })) },
      selectedBlockId: null,
      dirty: true,
    };
  }),

  duplicateBlock: (blockId) => set((s) => {
    if (!s.course || !s.activeLessonId) return {};
    const lesson = s.course.lessons.find((l) => l.id === s.activeLessonId);
    if (!lesson) return {};
    const idx = lesson.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return {};
    const copy = { ...lesson.blocks[idx], id: newId() };
    const blocks = [...lesson.blocks];
    blocks.splice(idx + 1, 0, copy);
    return {
      course: { ...s.course, lessons: s.course.lessons.map((l) => l.id === s.activeLessonId ? { ...l, blocks } : l) },
      selectedBlockId: copy.id,
      dirty: true,
    };
  }),

  reorderBlocks: (from, to) => set((s) => {
    if (!s.course || !s.activeLessonId) return {};
    return {
      course: {
        ...s.course,
        lessons: s.course.lessons.map((l) => {
          if (l.id !== s.activeLessonId) return l;
          const blocks = [...l.blocks];
          const [item] = blocks.splice(from, 1);
          blocks.splice(to, 0, item);
          return { ...l, blocks };
        }),
      },
      dirty: true,
    };
  }),

  setSaving: (v) => set({ saving: v }),
  markClean: () => set({ dirty: false }),
}));
