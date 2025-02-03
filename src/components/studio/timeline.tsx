'use client';

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, DragOverlay, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ResizingSide, SegmentType, TimelineSegment } from '@/components/studio/studio.types';
import useStudioStore from '@/lib/store/useStudioStore';
import { Button } from '@/components/ui/button';
import { ScanSearch, Volume2, VolumeOff } from 'lucide-react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core/dist/types';
import Triangle from '@/assets/icons/triangle.svg';
import Playhead from '@/assets/icons/playhead.svg';
import { formatDuration } from '@/components/studio/studio.utils';
import DraggableSegment from '@/components/studio/draggable-segment';
import useVideoStore from '@/lib/store/useVideoStore';
import { Minus, Pause, Play, Plus, SkipBack, SkipForward } from '@phosphor-icons/react';
import { Slider } from '@/components/ui/slider';

const ROW_HEIGHT = 50;
type ZOOM_LEVEL = 100 | 90 | 80 | 70 | 60 | 50 | 40 | 30 | 20 | 10 | 0;
const timelineZoomStep = 10;
const timelineSegments: { [K in ZOOM_LEVEL]: { seconds: number; width: number } } = {
  100: { seconds: 1, width: 150 },
  90: { seconds: 3, width: 150 },
  80: { seconds: 5, width: 150 },
  70: { seconds: 10, width: 150 },
  60: { seconds: 15, width: 150 },
  50: { seconds: 30, width: 150 },
  40: { seconds: 45, width: 150 },
  30: { seconds: 60, width: 150 },
  20: { seconds: 3 * 60, width: 150 },
  10: { seconds: 5 * 60, width: 150 },
  0: { seconds: 10 * 60, width: 150 },
};

type Props = {
  onTimeUpdate: (time: number) => void;
};

const Timeline = ({ onTimeUpdate }: Props) => {
  const segments = useStudioStore((state) => state.segments);
  const addSegment = useStudioStore((state) => state.addSegment);
  const setSegments = useStudioStore((state) => state.setSegments);
  const currentTime = useStudioStore((state) => state.currentTime);
  const setCurrentTime = useStudioStore((state) => state.setCurrentTime);
  const isPlaying = useStudioStore((state) => state.isPlaying);
  const setIsPlaying = useStudioStore((state) => state.setIsPlaying);
  const isMute = useStudioStore((state) => state.isMute);
  const setIsMute = useStudioStore((state) => state.setIsMute);

  const duration = useVideoStore((state) => state.durationSeconds);

  const [timelineWidth, setTimelineWidth] = useState<number>(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayHead, setIsDraggingPlayHead] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [draggingSegment, setDraggingSegment] = useState<string | null>(null);
  const [resizingSide, setResizingSide] = useState<ResizingSide | null>(null);
  const [timelineZoom, setTimelineZoom] = useState<number>(80);

  const segmentZoomLevel = timelineZoom as ZOOM_LEVEL;
  const timelineChunkSeconds = timelineSegments[segmentZoomLevel].seconds;
  const timelineSegmentWidth = timelineSegments[segmentZoomLevel].width;

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const calculateTime = (position: number): number => {
    return Math.max(0, Math.min(duration, (position / timelineWidth) * duration));
  };

  const calculateRow = (y: number): number => {
    return Math.max(0, Math.floor(y / ROW_HEIGHT));
  };

  const checkOverlap = (startTime: number, duration: number, row: number, excludeId?: string): boolean => {
    return segments.some((segment) => {
      if (segment.id === excludeId || segment.row !== row) {
        return false;
      }

      const endTime = startTime + duration;
      const start = segment.startTime;
      const end = segment.startTime + segment.duration;

      return (
        (startTime >= start && startTime < end) ||
        (endTime > start && endTime <= end) ||
        (startTime <= start && endTime >= end)
      );
    });
  };

  const findAvailableRow = (startTime: number, duration: number): number => {
    let row = 0;
    while (checkOverlap(startTime, duration, row)) {
      row++;
    }
    return row;
  };

  const addNewSegment = (segmentType: SegmentType) => {
    let newStartTime = currentTime;
    let newEndTime = newStartTime + timelineChunkSeconds;

    if (newEndTime > duration) {
      newEndTime = duration;
      newStartTime = newEndTime - timelineChunkSeconds;
    }

    console.log('newStartTime ', newStartTime, ' newEndTime ', newEndTime);

    const newSegment: TimelineSegment = {
      id: uuidv4(),
      startTime: newStartTime,
      duration: timelineChunkSeconds,
      endTime: newEndTime,
      row: findAvailableRow(newStartTime, timelineChunkSeconds),
      type: segmentType,
      data: 1.5,
      active: true,
    };
    addSegment(newSegment);
  };

  const handleSegmentResizeMove = (e: React.MouseEvent) => {
    if (!draggingSegment || !timelineRef.current) return;

    // setSegments(
    //   segments.map((segment) => {
    //     if (segment.id !== draggingSegment) return segment;
    //
    //     console.log('resizingSide ', resizingSide, ' segement ', segment);
    //
    //   }),
    // );
  };

  const handleClickTimeline = (e: React.MouseEvent) => {
    if (!timelineRef.current) {
      return;
    }

    if (isDraggingPlayHead || draggingSegment || activeId) {
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, timelineRef.current.scrollWidth));
    const newTime = calculateTime(x);
    onTimeUpdate(newTime);
    setCurrentTime(newTime);
  };

  const handlePlayheadMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) {
      return;
    }

    if (draggingSegment) {
      handleSegmentResizeMove(e);
      return;
    }

    if (isDraggingPlayHead) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, timelineRef.current.scrollWidth));
      const newTime = calculateTime(x);
      onTimeUpdate(newTime);
      setCurrentTime(newTime);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    if (!timelineRef.current) {
      return;
    }

    const { active } = event;
    const y = event.delta.y;

    const curLeftX = active.rect.current?.translated?.left ?? 0;
    const scrollLeftX = timelineContainerRef.current?.scrollLeft ?? 0;
    const offsetLeft = timelineContainerRef.current?.getBoundingClientRect().left ?? 0;
    const segmentLeftX = Math.max(0, curLeftX + scrollLeftX - offsetLeft);

    setSegments(
      segments.map((segment) => {
        if (segment.id === active.id) {
          const currentSegment = segments.find((s) => s.id === active.id);
          if (!currentSegment) {
            return segment;
          }

          let newStartTime = Math.max(0, calculateTime(segmentLeftX) - calculateTime(0));
          let endTime = newStartTime + segment.duration;

          if (endTime > duration) {
            endTime = duration;
            newStartTime = endTime - segment.duration;
          }

          const newRow = calculateRow(segment.row * ROW_HEIGHT + (y < 1 ? y + 15 : y));
          const isOverlap = checkOverlap(newStartTime, segment.duration, newRow, segment.id);

          if (!isOverlap) {
            return {
              ...segment,
              startTime: newStartTime,
              row: newRow,
            };
          }
        }
        return segment;
      }),
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSegmentDrag = (e: React.MouseEvent, segmentId: string, side: 'left' | 'right' | null = null) => {
    e.stopPropagation();
    setDraggingSegment(segmentId);
    setResizingSide(side);
  };

  const handleMouseUp = () => {
    setDraggingSegment(null);
    setResizingSide(null);
    setIsDraggingPlayHead(false);
  };

  const secondSegments = Array.from({ length: Math.ceil(duration / timelineChunkSeconds) });
  const rows = Array.from({ length: Math.max(1, ...segments.map((s) => s.row + 1)) });

  useEffect(() => {
    setTimelineWidth((duration / timelineChunkSeconds) * timelineSegmentWidth);
  }, [duration, timelineChunkSeconds, timelineSegmentWidth]);

  function leftPadding(atSecond: number) {
    return (atSecond / timelineChunkSeconds) * timelineSegmentWidth;
  }

  return (
    <>
      <div className="w-full mx-auto pb-2 h-full flex flex-col gap-1">
        <div className="flex flex-row justify-between items-center pl-20 pr-6 py-[5px] border-b">
          <div className="text-sm">
            <Button
              onClick={() => addNewSegment('Zoom')}
              variant="secondary"
              size="sm"
              className="rounded-xl bg-transparent"
            >
              <ScanSearch /> Zoom
            </Button>
          </div>

          <div className="flex flex-row gap-6 items-center select-none text-sm">
            <div className="flex flex-row items-center gap-1 text-muted-foreground">
              <Button
                onClick={() => {
                  setCurrentTime(0);
                  onTimeUpdate(0);
                }}
                className="flex hover:bg-background"
                size="sm"
                variant="ghost"
              >
                <SkipBack weight="fill" />
              </Button>
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex rounded-full px-2"
                size="sm"
                variant="secondary"
              >
                {isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}
              </Button>
              <Button
                onClick={() => {
                  setCurrentTime(duration);
                  onTimeUpdate(duration);
                }}
                className="flex hover:bg-background"
                size="sm"
                variant="ghost"
              >
                <SkipForward weight="fill" />
              </Button>
            </div>
            <Button onClick={() => setIsMute(!isMute)} className="flex hover:bg-background" size="sm" variant="ghost">
              {isMute ? <VolumeOff /> : <Volume2 />}
            </Button>
            <div className="flex flex-row items-center text-muted-foreground w-[140px]">
              <p className="w-[40%]">{formatDuration(currentTime)}</p>
              <p className="mx-1">/</p>
              <p className="w-[40%]">{formatDuration(duration)}</p>
            </div>
          </div>

          <div className="flex flex-row items-center">
            <div className="flex flex-row items-center gap-1">
              <Button
                onClick={() => setTimelineZoom(Math.max(0, timelineZoom - timelineZoomStep))}
                size="icon"
                variant="ghost"
              >
                <Minus />
              </Button>
              <Slider
                className="w-20"
                value={[timelineZoom]}
                onValueChange={(value) => setTimelineZoom(value[0])}
                min={0}
                max={100}
                step={timelineZoomStep}
              />
              <Button
                onClick={() => setTimelineZoom(Math.min(100, timelineZoom + timelineZoomStep))}
                size="icon"
                variant="ghost"
              >
                <Plus />
              </Button>
            </div>
          </div>
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div
            ref={timelineContainerRef}
            className="relative flex h-full overflow-auto custom-scroll mx-3"
            style={{
              minHeight: `${ROW_HEIGHT}px`,
            }}
            onMouseMove={handlePlayheadMove}
            onMouseUp={() => handleMouseUp()}
            onMouseLeave={() => handleMouseUp()}
          >
            <div
              ref={timelineRef}
              className="h-full text-foreground relative"
              style={{
                width: `${timelineWidth}px`,
              }}
            >
              {/*Row indicators*/}
              {rows.map((_, i) => (
                <div
                  onClick={handleClickTimeline}
                  key={`row-${i}`}
                  className={`absolute w-full bg-muted rounded-md border-b mt-5`}
                  style={{
                    top: `${i * ROW_HEIGHT}px`,
                    height: `${ROW_HEIGHT}px`,
                    width: `${timelineWidth}px`,
                  }}
                />
              ))}

              {/* Time indicators */}
              {secondSegments.map((_, i) => (
                <>
                  <div
                    onClick={handleClickTimeline}
                    key={i}
                    className="absolute top-0 h-5 border-l border-border select-none flex justify-start"
                    style={{ left: `${i * timelineSegmentWidth}px` }}
                  >
                    <span className="text-[11px] font-light text-muted-foreground ml-[2px] mt-0">
                      {formatTime(i * timelineChunkSeconds)}
                    </span>
                  </div>
                </>
              ))}

              {/* Vertical play head */}
              <div
                className={`${duration > 0 ? 'block' : 'hidden'} ${!isDraggingPlayHead ? 'transition-transform duration-300 ease-out' : ''} absolute top-[12px] w-[2px] bg-slate-500 cursor-ew-resize z-20 group hover:shadow-lg`}
                style={{
                  // left: `${leftPadding(currentTime)}px`,
                  transform: `translateX(${leftPadding(currentTime)}px)`,
                  height: `${rows.length * ROW_HEIGHT + 7}px`,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingPlayHead(true);
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3.5 h-auto">
                  <Playhead />
                </div>
              </div>

              {/* Segments */}
              {segments.map((segment) => (
                <DraggableSegment
                  className={`${isDraggingPlayHead && 'select-none pointer-events-none'} mt-5`}
                  key={segment.id}
                  segment={segment}
                  rowHeight={ROW_HEIGHT}
                  onResize={handleSegmentDrag}
                  leftPadding={leftPadding}
                />
              ))}

              {/* Drag Overlay */}
              <DragOverlay>{activeId ? <div className="h-9 bg-amber-400 rounded opacity-50" /> : null}</DragOverlay>
            </div>
          </div>
        </DndContext>
      </div>
    </>
  );
};

export default Timeline;
