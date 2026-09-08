"use client";

import { AVATARS } from "./avatars";
import { cn } from "@/lib/billetera/cn";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function AvatarPicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATARS.map((av) => (
        <button
          key={av.id}
          type="button"
          onClick={() => onSelect(av.id)}
          aria-label={av.label}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl p-2 text-3xl transition-all",
            "min-h-[56px] min-w-[56px] border-2",
            selected === av.id
              ? "border-blue-500 bg-blue-50 scale-110 shadow-md"
              : "border-transparent bg-gray-100 hover:bg-gray-200"
          )}
        >
          {av.emoji}
        </button>
      ))}
    </div>
  );
}
