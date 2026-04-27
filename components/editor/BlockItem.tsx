'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { HeadingBlockEditor } from './blocks/HeadingBlock';
import { TextBlockEditor } from './blocks/TextBlock';
import { ImageBlockEditor } from './blocks/ImageBlock';
import { VideoBlockEditor } from './blocks/VideoBlock';
import { QuizBlockEditor } from './blocks/QuizBlock';
import { AccordionBlockEditor } from './blocks/AccordionBlock';
import { ListBlockEditor } from './blocks/ListBlock';
import { QuoteBlockEditor } from './blocks/QuoteBlock';
import { CalloutBlockEditor } from './blocks/CalloutBlock';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function BlockContent({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading': return <HeadingBlockEditor block={block} />;
    case 'text': return <TextBlockEditor block={block} />;
    case 'image': return <ImageBlockEditor block={block} />;
    case 'video': return <VideoBlockEditor block={block} />;
    case 'quiz': return <QuizBlockEditor block={block} />;
    case 'accordion': return <AccordionBlockEditor block={block} />;
    case 'bullet-list':
    case 'numbered-list': return <ListBlockEditor block={block} />;
    case 'quote': return <QuoteBlockEditor block={block} />;
    case 'callout': return <CalloutBlockEditor block={block} />;
    case 'divider': return <hr className="border-gray-200" />;
  }
}

export function BlockItem({ block }: { block: Block }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const { selectedBlockId, selectBlock, deleteBlock } = useEditorStore();
  const isSelected = selectedBlockId === block.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectBlock(block.id)}
      className={cn(
        'group relative rounded-lg border-2 p-4 bg-white transition-colors',
        isSelected ? 'border-indigo-400 shadow-sm' : 'border-transparent hover:border-gray-200'
      )}
    >
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      </div>
      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
          className="absolute right-2 top-2 p-1 text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )}
      <BlockContent block={block} />
    </div>
  );
}
