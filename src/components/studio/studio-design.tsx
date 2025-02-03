'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GalleryHorizontalEnd, Images, Palette } from 'lucide-react';
import React from 'react';
import useStudioStore from '@/lib/store/useStudioStore';
import { COLOR_PALETTE } from '@/components/studio/colors';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { aspectRatioList } from '@/components/studio/studio.data';
import { Checkbox } from '@/components/ui/checkbox';
import { BackgroundBlur, backgroundBlurs, BackgroundSize, backgroundSizes } from '@/components/studio/studio.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Resize, SelectionBackground, Subtract, XCircle } from '@phosphor-icons/react';
import { Switch } from '@/components/ui/switch';

const StudioDesign = () => {
  const aspectRatio = useStudioStore((state) => state.aspectRatio);
  const setAspectRatio = useStudioStore((state) => state.setAspectRatio);
  const fitOnResize = useStudioStore((state) => state.fitOnResize);
  const setFitOnResize = useStudioStore((state) => state.setFitOnResize);
  const { backgroundType, background, backgroundSize, backgroundBlur, applyBorder, applyShadow } = useStudioStore(
    (state) => state.backgroundConfig,
  );
  const updateBackgroundConfig = useStudioStore((state) => state.updateBackgroundConfig);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateBackgroundConfig({ backgroundType: 'Image', background: url });
    }
  };

  return (
    <Accordion type="multiple" defaultValue={['patten']} className="w-full">
      <AccordionItem value="size" className="border-none">
        <AccordionTrigger className="">
          <h3 className="font-normal text-base flex flex-row items-center gap-2">
            <Resize size={20} className="font-semibold text-muted-foreground" /> Size
          </h3>
        </AccordionTrigger>
        <AccordionContent>
          <div className="w-full flex flex-col gap-6">
            <div className="w-full flex flex-col items-center">
              <div className="w-full flex flex-wrap gap-1">
                <TooltipProvider delayDuration={500}>
                  {aspectRatioList.map((ratio) => (
                    <Tooltip key={ratio.label}>
                      <TooltipTrigger className="w-24">
                        <div
                          onClick={() => setAspectRatio(ratio)}
                          key={ratio.label}
                          aria-label={ratio.label}
                          className={`${aspectRatio?.label === ratio.label && 'bg-accent'} flex flex-col items-center w-full h-full py-1 gap-1 bg-secondary rounded-xl justify-center cursor-pointer`}
                        >
                          <div className="w-12 h-8 flex items-center justify-center">
                            <div
                              className={`${aspectRatio?.label === ratio.label ? 'bg-blue-400' : 'bg-secondary-foreground/20'} rounded`}
                              style={{
                                width: `${Math.min(32, 24 * ratio.value)}px`,
                                height: '24px',
                              }}
                            />
                          </div>

                          <span className="text-[10px] font-normal text-center">{ratio.name}</span>

                          <span className="text-xs text-muted-foreground text-center font-semibold">{ratio.label}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{ratio.desc}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </div>

            <div className="w-full flex flex-col gap-5">
              <div className="items-top flex space-x-2">
                <Checkbox id="terms1" checked={fitOnResize} onCheckedChange={setFitOnResize} />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms1"
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Fit Content on Resize
                  </label>
                  <p className="text-xs text-muted-foreground">Content will scale with the size change</p>
                </div>
              </div>

              <div className="items-top flex space-x-2">
                <Checkbox id="terms2" checked={!fitOnResize} onCheckedChange={() => setFitOnResize(!fitOnResize)} />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms2"
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Static Content
                  </label>
                  <p className="text-xs text-muted-foreground">Content will be in same on</p>
                </div>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="patten" className="border-none">
        <AccordionTrigger>
          <h3 className="font-normal text-base flex-row flex items-center gap-2">
            <SelectionBackground size={20} className="font-semibold text-muted-foreground" /> Background
          </h3>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-8 mt-3">
            <div className="flex flex-col gap-3">
              <h3 className="font-normal text-sm text-muted-foreground">Background Size</h3>

              <Select
                value={backgroundSize}
                onValueChange={(value) => updateBackgroundConfig({ backgroundSize: value as BackgroundSize })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(backgroundSizes).map((bgSize) => (
                    <SelectItem key={bgSize} value={bgSize}>
                      {bgSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-normal text-sm text-muted-foreground">Background Blur</h3>

              <Select
                value={backgroundBlur}
                onValueChange={(value) => updateBackgroundConfig({ backgroundBlur: value as BackgroundBlur })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(backgroundBlurs).map((blur) => (
                    <SelectItem key={blur} value={blur}>
                      {blur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue={backgroundType} className="w-full">
              <TabsList className="">
                <TabsTrigger value="Pattern">
                  <GalleryHorizontalEnd className="w-4 mr-2" /> Pattern
                </TabsTrigger>
                <TabsTrigger value="Color">
                  <Palette className="w-4 mr-2" /> Color
                </TabsTrigger>
                <TabsTrigger value="Image">
                  <Images className="w-4 mr-2" /> Image
                </TabsTrigger>
              </TabsList>
              <TabsContent value="Pattern"></TabsContent>
              <TabsContent value="Color">
                <div className="flex flex-col w-full gap-2 pt-2">
                  <div className="flex flex-col w-full gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <div key={color.name} className="flex flex-row gap-2 w-full items-center">
                        {color.palette.map((palette) => (
                          <Button
                            onClick={() => {
                              updateBackgroundConfig({ backgroundType: 'Color', background: palette.hex });
                            }}
                            key={palette.weight}
                            variant="ghost"
                            className="hover:bg-inherit"
                            style={{
                              backgroundColor: palette.hex,
                            }}
                          ></Button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="Image">
                <div className="flex flex-col w-full gap-8 pt-6">
                  <Input id="picture" accept="image/*" type="file" onChange={handleFileChange} />
                  {background && backgroundType === 'Image' && (
                    <div className="rounded-md border border-border relative w-[90%]">
                      <img src={background} className="w-full" />
                      <Button
                        onClick={() => {
                          updateBackgroundConfig({ backgroundType: 'Pattern', background: undefined });
                        }}
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 -top-4 [&_svg]:size-5 h-6 w-6 hover:bg-transparent hover:text-red-500"
                      >
                        <XCircle />
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="shadow" className="border-none">
        <AccordionTrigger>
          <h3 className="font-normal text-base flex-row flex items-center gap-2">
            <Subtract size={20} className="font-semibold text-muted-foreground" /> Shadow & Border
          </h3>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-8 mt-4">
            <div className="flex flex-row gap-3 items-center w-[80%]">
              <Switch
                checked={applyBorder}
                onCheckedChange={(active) => {
                  updateBackgroundConfig({ applyBorder: active });
                }}
                id="applyBorder"
                className=""
              />
              <p>Apply Border</p>
            </div>
            <div className="flex flex-row gap-3 items-center w-[80%]">
              <Switch
                checked={applyShadow}
                onCheckedChange={(active) => {
                  updateBackgroundConfig({ applyShadow: active });
                }}
                id="applyShadow"
              />
              <p>Apply Shadow</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default StudioDesign;
