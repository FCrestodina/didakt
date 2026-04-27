'use client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEditorStore } from '@/store/editorStore';
import { BlockItem } from './BlockItem';
import { BlockToolbar } from './BlockToolbar';

export function BlockList() {
  const { course, activeLessonId, reorderBlocks } = useEditorStore();
  const lesson = course?.lessons.find((l) => l.id === activeLessonId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !lesson) return;
    const from = lesson.blocks.findIndex((b) => b.id === active.id);
    const to = lesson.blocks.findIndex((b) => b.id === over.id);
    reorderBlocks(from, to);
  };

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Seleccioná una lección para editar</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={lesson.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {lesson.blocks.map((block) => (
              <BlockItem key={block.id} block={block} />
            ))}
          </SortableContext>
        </DndContext>
        {lesson.blocks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Esta lección está vacía</p>
            <p className="text-sm">Agregá bloques desde la barra de abajo</p>
          </div>
        )}
        <BlockToolbar />
      </div>
    </div>
  );
}
