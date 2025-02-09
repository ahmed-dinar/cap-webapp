'use client';

import { useEffect, useState } from 'react';

import { ModeToggle } from '@/components/ModeToggle';
import StudioExport from '@/components/studio/studio-export';
import { RECORDING_PARAM } from '@/lib/constants';
import { useSearchParams } from 'next/navigation';
import useVideoStore from '@/lib/store/useVideoStore';
import StudioLayout from '@/components/studio/studio-layout';
import StudioLanding from '@/components/studio/studio-landing';

const Studio = () => {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);

  const videoUrl = useVideoStore((state) => state.data.videoUrl);

  const setVideoSourceData = useVideoStore((state) => state.setVideoSourceData);

  useEffect(() => {
    async function getRecording() {
      const id = searchParams.get(RECORDING_PARAM);
      console.log('id ', id);

      if (!id) {
        return;
      }

      const recordingId = Number(id);
      if (isNaN(recordingId)) {
        return;
      }

      await new Promise((resolve) => {
        try {
          console.log('sending to chrome.runtime ');
          chrome.runtime.sendMessage(
            'pipelcpkffdhejlmnokfpmkbdijhopcn',
            { type: 'getRecordingData', recordingId },
            (response: any) => {
              console.log('response ', response);
              if (response?.success) {
                const { base64, duration, clickSegments, mouseSegments, screenWidth, screenHeight } =
                  response.recording;

                const base64Data = base64.split(',')[1];
                const binaryString = window.atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);

                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }

                // Get mime type from the data URL
                const mimeType = base64.split(';')[0].split(':')[1];
                const blob = new Blob([bytes], { type: mimeType });
                const url = URL.createObjectURL(blob);

                setVideoSourceData({
                  videoUrl: url,
                  durationSeconds: duration,
                  clickSegments: clickSegments,
                  mouseSegments: mouseSegments,
                  screenDimension: { width: screenWidth, height: screenHeight },
                });
              } else {
                /* empty */
              }

              resolve('');
            },
          );
        } catch (error) {
          console.log('e ', error);
          resolve('');
        }
      });
    }

    getRecording().finally(() => setLoading(false));
  }, [searchParams, setVideoSourceData]);

  return (
    <div className="w-full h-screen m-0 p-0 flex flex-col bg-background text-foreground">
      {loading && <p>Loading</p>}
      <div className="flex flex-col w-full h-auto bg-muted">
        <div className="flex flex-row w-full h-full py-1 px-16 mx-auto justify-between items-center">
          <div className="flex flex-row items-center">
            <ModeToggle />
          </div>
          <div className="flex flex-row items-center gap-3"></div>
          <StudioExport />
        </div>
      </div>

      <div className="flex flex-row flex-1">{!videoUrl?.length ? <StudioLanding /> : <StudioLayout />}</div>
    </div>
  );
};

export default Studio;
