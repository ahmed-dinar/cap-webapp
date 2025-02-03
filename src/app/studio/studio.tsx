'use client';

import { useState } from 'react';

import { ModeToggle } from '@/components/ModeToggle';
import { Button } from '@/components/ui/button';
import { ArrowBigUpDash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BitRates, FrameRates, ResolutionKey } from '@/components/studio/studio.types';
import { BitRateData, Resolutions } from '@/components/studio/studio.data';
import useExportStore from '@/lib/store/useExportStore';
import StudioEditor from '@/components/studio/studio-editor';

const Studio = () => {
  const exportConfig = useExportStore((state) => state.settings);
  const setExportConfig = useExportStore((state) => state.updateSettings);
  const setDoExport = useExportStore((state) => state.setDoExport);
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="w-full h-screen m-0 p-0 flex flex-col bg-background text-foreground">
      <div className="flex flex-col w-full h-auto bg-muted">
        <div className="flex flex-row w-full h-full py-1 px-16 mx-auto justify-between items-center">
          <div className="flex flex-row items-center">
            <ModeToggle />
          </div>
          <div className="flex flex-row items-center gap-3"></div>
          <div className="flex flex-row items-center gap-5">
            <Popover modal={false} open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="ml-4 bg-blue-600 text-white border-none outline-none shadow-none rounded-xl ring-0 text-xs"
                >
                  <ArrowBigUpDash /> Export
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto mr-16 rounded-xl">
                <div className="flex flex-col gap-6 w-full py-2 px-3">
                  <div className="flex flex-col">
                    <h3 className="flex text-base">Export Configuration</h3>
                    <p className="text-xs text-muted-foreground">Settings will affect file size and the quality.</p>
                  </div>

                  {['Resolution', 'Frame Rate', 'Bitrate'].map((key) => (
                    <div key={key} className="flex flex-col gap-2">
                      <h3 className="flex text-sm text-muted-foreground">{key}</h3>
                      <div className="flex">
                        {key === 'Resolution' && (
                          <ToggleGroup
                            value={exportConfig.resolution}
                            onValueChange={(value) => setExportConfig({ resolution: value as ResolutionKey })}
                            type="single"
                            className="border border-border rounded-xl"
                          >
                            {Object.keys(Resolutions).map((resolutionKey) => {
                              const resolution = Resolutions[resolutionKey as ResolutionKey];
                              return (
                                <ToggleGroupItem
                                  key={resolutionKey}
                                  value={resolutionKey}
                                  aria-label={resolutionKey}
                                  className="px-6 text-xs data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 rounded-xl"
                                >
                                  {resolution.name}
                                </ToggleGroupItem>
                              );
                            })}
                          </ToggleGroup>
                        )}

                        {key === 'Frame Rate' && (
                          <ToggleGroup
                            value={exportConfig.frameRate.toString()}
                            onValueChange={(value) => setExportConfig({ frameRate: parseInt(value) as FrameRates })}
                            type="single"
                            className="border border-border rounded-xl"
                          >
                            {([25, 30, 60] as FrameRates[]).map((frameRate) => {
                              return (
                                <ToggleGroupItem
                                  key={frameRate}
                                  value={frameRate.toString()}
                                  aria-label={frameRate.toString()}
                                  className="px-6 text-xs data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 rounded-xl"
                                >
                                  {frameRate}FPS
                                </ToggleGroupItem>
                              );
                            })}
                          </ToggleGroup>
                        )}

                        {key === 'Bitrate' && (
                          <ToggleGroup
                            value={exportConfig.bitRates.toString()}
                            onValueChange={(value) => setExportConfig({ bitRates: parseInt(value) as BitRates })}
                            type="single"
                            className="border border-border rounded-xl"
                          >
                            {Object.keys(BitRateData).map((bitRateKey) => {
                              return (
                                <ToggleGroupItem
                                  key={bitRateKey}
                                  value={bitRateKey.toString()}
                                  aria-label={bitRateKey.toString()}
                                  className="px-6 text-xs data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 rounded-xl"
                                >
                                  {bitRateKey}Mbps
                                </ToggleGroupItem>
                              );
                            })}
                          </ToggleGroup>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex">
                    <Button
                      onClick={() => {
                        setDoExport(true);
                        setTimeout(() => {
                          setDoExport(false);
                          setOpen(false);
                        }, 200);
                      }}
                      variant="default"
                      size="default"
                      className="rounded-xl"
                    >
                      <ArrowBigUpDash /> Export MP4
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/*<DropdownMenu>*/}
            {/*  <DropdownMenuTrigger asChild>*/}
            {/*    <Button variant="ghost" size="icon">*/}
            {/*      <Faders />*/}
            {/*    </Button>*/}
            {/*  </DropdownMenuTrigger>*/}
            {/*  <DropdownMenuContent className="w-56 mr-20 rounded-xl">*/}
            {/*    <DropdownMenuSub>*/}
            {/*      <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>*/}
            {/*      <DropdownMenuPortal>*/}
            {/*        <DropdownMenuSubContent>*/}
            {/*          <DropdownMenuItem>Email</DropdownMenuItem>*/}
            {/*        </DropdownMenuSubContent>*/}
            {/*      </DropdownMenuPortal>*/}
            {/*    </DropdownMenuSub>*/}

            {/*  </DropdownMenuContent>*/}
            {/*</DropdownMenu>*/}
          </div>
        </div>
      </div>

      <div className="flex flex-row flex-1">
        <div className="flex flex-col h-full">{/* Left panel */}</div>
        <div className="flex flex-col h-full flex-1 overflow-hidden">
          <StudioEditor />
        </div>
      </div>
    </div>
  );
};

export default Studio;
