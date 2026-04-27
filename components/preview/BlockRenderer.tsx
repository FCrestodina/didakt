'use client';
import { Block, QuizBlock } from '@/types';
import { getYoutubeEmbedUrl } from '@/lib/utils';
import { useState } from 'react';
import { cn } from '@/lib/utils';

function QuizRenderer({ block }: { block: QuizBlock }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const check = () => { if (selected) setAnswered(true); };
  const selectedOpt = block.options.find((o) => o.id === selected);

  return (
    <div className="bg-indigo-50 rounded-xl p-6 space-y-4">
      <p className="font-semibold text-gray-800 text-lg">{block.question}</p>
      <div className="space-y-2">
        {block.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => !answered && setSelected(opt.id)}
            disabled={answered}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg border-2 transition-all',
              answered && opt.isCorrect ? 'border-green-400 bg-green-50' :
              answered && opt.id === selected && !opt.isCorrect ? 'border-red-400 bg-red-50' :
              opt.id === selected ? 'border-indigo-400 bg-indigo-50' :
              'border-gray-200 bg-white hover:border-indigo-200'
            )}
          >
            {opt.text}
          </button>
        ))}
      </div>
      {!answered ? (
        <button
          onClick={check}
          disabled={!selected}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          Verificar
        </button>
      ) : (
        <div className={cn('rounded-lg px-4 py-3 text-sm font-medium', selectedOpt?.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
          {selectedOpt?.isCorrect ? block.feedback.correct : block.feedback.incorrect}
        </div>
      )}
    </div>
  );
}

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3';
      const cls = { 1: 'text-4xl font-bold', 2: 'text-2xl font-bold', 3: 'text-xl font-semibold' }[block.level];
      return <Tag className={cn(cls, 'text-gray-900')}>{block.content}</Tag>;
    }
    case 'text':
      return <p className="text-gray-700 leading-relaxed">{block.content}</p>;
    case 'image':
      return block.url ? (
        <figure>
          <img src={block.url} alt={block.alt} className="w-full rounded-xl object-cover" />
          {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-2">{block.caption}</figcaption>}
        </figure>
      ) : null;
    case 'video': {
      const embed = getYoutubeEmbedUrl(block.url);
      return embed ? (
        <figure>
          <div className="aspect-video rounded-xl overflow-hidden">
            <iframe src={embed} className="w-full h-full" allowFullScreen />
          </div>
          {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-2">{block.caption}</figcaption>}
        </figure>
      ) : null;
    }
    case 'quiz':
      return <QuizRenderer block={block} />;
    case 'accordion': {
      return (
        <div className="space-y-2">
          {block.items.map((item) => (
            <details key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <summary className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-50 select-none">
                {item.title}
              </summary>
              <div className="px-4 py-3 text-gray-700 border-t border-gray-100">{item.content}</div>
            </details>
          ))}
        </div>
      );
    }
    case 'bullet-list':
      return (
        <ul className="list-disc pl-6 space-y-1 text-gray-700">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'numbered-list':
      return (
        <ol className="list-decimal pl-6 space-y-1 text-gray-700">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      );
    case 'quote':
      return (
        <blockquote className="border-l-4 border-indigo-400 pl-6 py-2">
          <p className="text-lg italic text-gray-700">{block.content}</p>
          {block.author && <cite className="text-sm text-gray-500 mt-2 block">— {block.author}</cite>}
        </blockquote>
      );
    case 'callout': {
      const styles = {
        info: 'bg-blue-50 border-blue-300 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
        success: 'bg-green-50 border-green-300 text-green-800',
        tip: 'bg-purple-50 border-purple-300 text-purple-800',
      };
      const icons = { info: 'ℹ️', warning: '⚠️', success: '✅', tip: '💡' };
      return (
        <div className={cn('border-l-4 rounded-r-xl p-4 flex gap-3', styles[block.variant])}>
          <span>{icons[block.variant]}</span>
          <p>{block.content}</p>
        </div>
      );
    }
    case 'divider':
      return <hr className="border-gray-200" />;
  }
}
