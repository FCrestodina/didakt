'use client';
import { VideoBlock as T } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { Input } from '@/components/ui/input';
import { getYoutubeEmbedUrl } from '@/lib/utils';
import { VideoIcon } from 'lucide-react';

export function VideoBlockEditor({ block }: { block: T }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const embedUrl = getYoutubeEmbedUrl(block.url);

  return (
    <div className="space-y-2">
      <Input
        placeholder="URL de YouTube"
        defaultValue={block.url}
        onBlur={(e) => updateBlock(block.id, { url: e.target.value })}
      />
      {embedUrl ? (
        <div className="aspect-video w-full rounded-lg overflow-hidden">
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen />
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
          <VideoIcon size={40} />
        </div>
      )}
      <Input
        placeholder="Descripción / caption"
        defaultValue={block.caption}
        onBlur={(e) => updateBlock(block.id, { caption: e.target.value })}
      />
    </div>
  );
}
