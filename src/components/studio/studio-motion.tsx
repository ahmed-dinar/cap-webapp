'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import useStudioStore from '@/lib/store/useStudioStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zoomConfigData } from '@/components/studio/studio.types';

const StudioMotion = () => {
  const applyZoom = useStudioStore((state) => state.applyZoom);
  const setApplyZoom = useStudioStore((state) => state.setApplyZoom);

  return (
    <Accordion type="multiple" defaultValue={['zoom', 'click']} className="w-full">
      <AccordionItem value="zoom" className="border-none">
        <AccordionTrigger className="">
          <h3 className="font-medium text-sm">Zoom</h3>
        </AccordionTrigger>
        <AccordionContent>
          <div className="w-full flex flex-col gap-6 text-xs pt-4">
            <div className="flex items-center flex-row gap-3">
              <Switch checked={applyZoom} onCheckedChange={setApplyZoom} id="airplane-mode" /> Apply Zoom
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <h3 className="font-normal text-sm text-muted-foreground">Default zoom level</h3>
              <Select>
                <SelectTrigger className="w-[70%] text-foreground rounded-xl">
                  <SelectValue placeholder="Default zoom level" />
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
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="click" className="border-none">
        <AccordionTrigger className="">
          <h3 className="font-medium text-sm">Click Effect</h3>
        </AccordionTrigger>
        <AccordionContent></AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default StudioMotion;
