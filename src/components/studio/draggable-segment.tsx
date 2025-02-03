'use client';

import { ResizingSide, TimelineSegment } from '@/components/studio/studio.types';
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import useStudioStore from '@/lib/store/useStudioStore';

interface DraggableSegmentProps {
  className?: string;
  segment: TimelineSegment;
  rowHeight: number;
  onResize: (e: React.MouseEvent, segmentId: string, side: ResizingSide) => void;
  leftPadding: (atSecond: number) => number;
}

const DraggableSegment = ({ segment, rowHeight, onResize, className, leftPadding }: DraggableSegmentProps) => {
  const activeSegmentId = useStudioStore((state) => state.activeSegmentId);
  const setActiveSegmentId = useStudioStore((state) => state.setActiveSegmentId);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: segment.id,
    data: segment,
  });

  const leftPaddingPixel = leftPadding(segment.startTime);
  const widthPixel = leftPadding(segment.startTime + segment.duration) - leftPaddingPixel;

  const style = {
    transform: CSS.Transform.toString(transform),
    left: `${leftPaddingPixel}px`,
    width: `${widthPixel}px`,
    top: `${segment.row * rowHeight + 7}px`,
  };

  const isFocused = activeSegmentId === segment.id;
  const isDisabled = !isFocused && !segment.active;

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveSegmentId(isFocused ? undefined : segment.id);
      }}
      className={cn(
        `${isFocused ? 'bg-teal-400 hover:bg-teal-500' : 'bg-amber-500 hover:bg-amber-400'} ${isDisabled && 'opacity-40'} absolute h-9 rounded-xl cursor-move transition-colors select-none group`,
        className,
      )}
      style={style}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`text-white w-full h-full relative items-center justify-center flex text-[10px]`}
      >
        {segment.type}
      </div>
      <div
        onMouseDown={(e) => onResize(e, segment.id, 'left')}
        className={`${activeSegmentId === segment.id ? 'bg-teal-700' : 'bg-amber-600'} group-hover:block hidden absolute left-0 top-1.5 w-1.5 h-[70%] cursor-w-resize rounded-tl-xl rounded-bl-xl`}
      />
      <div
        onMouseDown={(e) => onResize(e, segment.id, 'right')}
        className={`${activeSegmentId === segment.id ? 'bg-teal-700' : 'bg-amber-600'} group-hover:block hidden absolute right-0 top-1.5 w-1.5 h-[70%] cursor-e-resize rounded-tr-xl rounded-br-xl`}
      />
    </div>
  );
};

export default DraggableSegment;
