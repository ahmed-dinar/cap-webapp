'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import React, { useEffect, useRef, useState } from 'react';
import '@pixi/unsafe-eval';

import Timeline from '@/components/studio/timeline';
import useStudioStore from '@/lib/store/useStudioStore';
import StudioDesign from '@/components/studio/studio-design';
import StudioMotion from '@/components/studio/studio-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BringToFront, Palette, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PointXY, ZOOM_SCALES, zoomConfigData } from '@/components/studio/studio.types';
import useVideoStore from '@/lib/store/useVideoStore';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import VideoEditor from '@/components/studio/VideoEditor';
import useExportStore from '@/lib/store/useExportStore';

const initialHeight = 600;

const StudioEditor = () => {
  const exportConfig = useExportStore((state) => state.settings);
  const doExport = useExportStore((state) => state.doExport);
  const setDoExport = useExportStore((state) => state.setDoExport);
  const activeMenu = useStudioStore((state) => state.activeMenu);
  const setActiveMenu = useStudioStore((state) => state.setActiveMenu);
  const activeSegmentId = useStudioStore((state) => state.activeSegmentId);
  const setActiveSegmentId = useStudioStore((state) => state.setActiveSegmentId);
  const segments = useStudioStore((state) => state.segments);
  const fitOnResize = useStudioStore((state) => state.fitOnResize);
  const segmentsRef = useRef(segments);
  const activeSegmentIdRef = useRef(activeSegmentId);
  const updateSegment = useStudioStore((state) => state.updateSegment);
  const deleteSegment = useStudioStore((state) => state.deleteSegment);
  const isPlaying = useStudioStore((state) => state.isPlaying);
  const setIsPlaying = useStudioStore((state) => state.setIsPlaying);

  const backgroundConfig = useStudioStore((state) => state.backgroundConfig);
  const backgroundConfigRef = useRef(backgroundConfig);

  const isMute = useStudioStore((state) => state.isMute);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const videoUrl = useVideoStore((state) => state.videoUrl);
  const setVideoUrl = useVideoStore((state) => state.setVideoUrl);
  // const durationSeconds = useVideoStore((state) => state.durationSeconds);
  const setDuration = useVideoStore((state) => state.setDurationSeconds);
  const setCurrentTime = useStudioStore((state) => state.setCurrentTime);
  // // const currentTime = useStudioStore((state) => state.currentTime);
  // const mouseSegments = useVideoStore((state) => state.mouseSegments);
  // const clickSegments = useVideoStore((state) => state.clickSegments);
  const aspectRatio = useStudioStore((state) => state.aspectRatio);

  const [exporting, setExporting] = useState<boolean>(false);
  const [exportPercent, setExportPercent] = useState<number>(0);

  const editorRef = useRef<VideoEditor>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !containerRef.current || !videoUrl?.length) {
      return;
    }

    function updateSegmentZoomPoint(xy: PointXY) {
      console.log('updateSegmentZoomPoint ', xy, ' activeSegmentId ', activeSegmentIdRef.current);
      if (!activeSegmentIdRef.current) {
        return;
      }

      const segment = segmentsRef.current.find((segment) => segment.id === activeSegmentIdRef.current);
      if (!segment) {
        return;
      }

      updateSegment(segment.id, { xy });
    }

    console.log('app && videoRef.current');

    function videoReady() {
      console.log('video ready');
      editorRef.current = new VideoEditor(canvasRef.current!, containerRef.current!, videoRef.current!);

      editorRef.current.on('timeUpdated', (time) => setCurrentTime(time));
      editorRef.current.on('duration', (duration) => setDuration(duration));
      editorRef.current.on('zoomPointUpdated', updateSegmentZoomPoint);

      const animate = () => {
        if (editorRef.current) {
          editorRef.current.render();
          requestAnimationFrame(animate);
        }
      };

      animate();
      setIsPlaying(true);
    }

    videoRef.current.addEventListener('loadedmetadata', () => videoReady());
  }, [setCurrentTime, setDuration, setIsPlaying, updateSegment, videoUrl]);

  useEffect(() => {
    console.log();
    if (aspectRatio && editorRef.current) {
      editorRef.current.resize({ selectedAspectRatio: aspectRatio, isFit: fitOnResize });
    }
  }, [aspectRatio, fitOnResize]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    async function handleExport() {
      console.log('handleExport');

      if (!editorRef.current || !videoRef.current) {
        return;
      }

      videoRef.current.pause();
      videoRef.current.currentTime = 0;

      setExportPercent(0);
      setExporting(true);

      try {
        await editorRef.current.encode(exportConfig, (progress) => setExportPercent(progress.progress));
        console.log('done export');
      } catch (e) {
        console.log('err ', e);
      } finally {
        setExporting(false);
        setExportPercent(0);
      }
    }

    if (doExport && !exporting) {
      handleExport();
    }
  }, [doExport, exporting, setDoExport, exportConfig]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  function onTimeUpdate(time: number) {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = time;
      setIsPlaying(false);
    }
    if (editorRef.current) {
      editorRef.current.setCurrentTime(time);
    }
  }

  useEffect(() => {
    console.log('segments ', segments);
    segmentsRef.current = segments;
    if (editorRef.current) {
      editorRef.current.setSegments(segments);
    }
  }, [segments]);

  useEffect(() => {
    console.log('activeSegmentId ', activeSegmentId);
    activeSegmentIdRef.current = activeSegmentId;
  }, [activeSegmentId]);

  useEffect(() => {
    console.log('backgroundConfig ', backgroundConfig);
    backgroundConfigRef.current = backgroundConfig;
    if (editorRef.current) {
      editorRef.current.setBackgroundConfig(backgroundConfig);
    }
  }, [backgroundConfig]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMute;
    }
  }, [isMute]);

  const activeSegment = segments.find((segment) => segment.id === activeSegmentId);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    if (activeSegment) {
      editorRef.current.setZoomEditing(true, previewCanvasRef.current);
    } else {
      editorRef.current.setZoomEditing(false);
    }
  }, [activeSegment]);

  return (
    <>
      {exporting && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-20 flex items-center justify-center z-50">
          <div className="w-1/2 p-1 flex flex-col gap-6 items-center justify-center">
            <h3 className="text-4xl text-white font-bold select-none bg-black bg-opacity-20 pb-2 pt-1 px-3 rounded-xl">
              Exporting
            </h3>
            <div className="w-full bg-black bg-opacity-20 rounded-2xl py-2 px-3">
              <Progress
                value={exportPercent}
                max={100}
                className="w-full h-6 bg-primary/20 text-lime-400 border border-primary/20"
                progressClassName="bg-primary"
              />
            </div>
          </div>
        </div>
      )}

      <ResizablePanelGroup direction="vertical" className="">
        <ResizablePanel>
          <ResizablePanelGroup direction="horizontal" className="">
            <ResizablePanel>
              <div className={`relative flex flex-col h-full items-center p-2`}>
                <div
                  ref={containerRef}
                  className={`${!videoUrl?.length && 'bg-muted'} flex flex-col items-center justify-center relative rounded-lg border border-border`}
                  style={{
                    height: `${initialHeight}px`,
                    width: '1080px',
                  }}
                >
                  {!videoUrl?.length && (
                    <div className="absolute top-1/2 left-0 w-full flex flex-row gap-3 items-center justify-center -translate-y-1/2">
                      <div className="flex w-[270px] h-[160px] bg-background rounded-xl justify-center items-center shadow-lg">
                        <Input
                          type="file"
                          className="bg-white h-full w-full text-center items-center justify-center rounded-xl cursor-pointer"
                          accept="video/*"
                          onChange={handleFileChange}
                        />
                      </div>
                      <div className="flex p-16 bg-background rounded-xl cursor-pointer shadow-lg">
                        <p className="text-2xl">Record screen</p>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} className={`w-full h-full border border-border rounded`} />
                </div>
                <video ref={videoRef} src={videoUrl} className="hidden" />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle={false} />
            <ResizablePanel defaultSize={25} minSize={2} maxSize={40}>
              {activeSegment ? (
                <div className="flex flex-col px-3 w-full pt-3 h-full overflow-y-auto">
                  <div
                    onClick={() => setActiveSegmentId()}
                    className="flex flex-row items-center gap-3 mb-10 cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                    <h3 className="font-medium text-sm ">Close zoom editor</h3>
                  </div>

                  <div className="flex flex-col gap-10">
                    <div className="flex items-center flex-row gap-3 text-sm">
                      <Switch
                        checked={activeSegment.active}
                        onCheckedChange={(active) => {
                          updateSegment(activeSegment?.id, { active });
                        }}
                        id="airplane-mode"
                      />{' '}
                      Active
                    </div>

                    <div className="flex flex-col gap-3">
                      <h3 className="font-normal text-sm text-muted-foreground">Zoom level</h3>

                      <Select
                        value={activeSegment.data.toString()}
                        onValueChange={(value) =>
                          updateSegment(activeSegment.id, { data: Number(value) as ZOOM_SCALES })
                        }
                      >
                        <SelectTrigger className="w-[70%] text-foreground rounded-xl">
                          <SelectValue placeholder="zoom level" />
                        </SelectTrigger>
                        <SelectContent className="text-muted-foreground rounded-xl border-none">
                          {Object.keys(zoomConfigData).map((zoomKey) => {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-expect-error
                            const zoomScale = zoomConfigData[zoomKey];
                            return (
                              <SelectItem key={zoomKey} value={zoomKey}>
                                {zoomScale.name} ({zoomKey}x)
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col w-full items-center px-3">
                      <canvas
                        className="border border-border rounded-md"
                        ref={previewCanvasRef}
                        width={640}
                        height={360}
                        style={{
                          width: '100%',
                        }}
                      ></canvas>
                    </div>

                    <div className="flex flex-col w-[60%]">
                      <Button
                        onClick={() => deleteSegment(activeSegment.id)}
                        variant="secondary"
                        size="default"
                        className=" hover:bg-red-400 hover:text-white"
                      >
                        <Trash2 /> Remove zoom
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-row gap-1 py-0 w-full">
                  <div className="flex h-full flex-col gap-6 flex-1">
                    <div className="flex flex-col px-4 pb-4 w-full overflow-y-auto custom-scroll">
                      {activeMenu === 'Design' && <StudioDesign />}
                      {activeMenu === 'Motion' && <StudioMotion />}
                    </div>
                  </div>
                  <div className="flex flex-col h-full py-2">
                    <div className="flex flex-col gap-1 border border-border rounded-xl mr-1 shadow-md">
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              onClick={() => setActiveMenu('Design')}
                              className={`${activeMenu === 'Design' ? 'bg-secondary' : 'bg-transparent'} rounded-0 border-0 text-xs [&_svg]:size-5`}
                              variant="ghost"
                              size="icon"
                            >
                              <Palette />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Design</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              onClick={() => setActiveMenu('Motion')}
                              className={`${activeMenu === 'Motion' ? 'bg-secondary' : 'bg-transparent'} rounded-0 border-0 text-xs [&_svg]:size-5`}
                              variant="ghost"
                              size="icon"
                            >
                              <BringToFront />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Motion</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle={false} />
        <ResizablePanel minSize={2} maxSize={30}>
          <div className="flex w-full h-full">
            <Timeline onTimeUpdate={onTimeUpdate} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
};

export default StudioEditor;
