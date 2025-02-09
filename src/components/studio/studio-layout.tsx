'use client';

import StudioEditor from '@/components/studio/studio-editor';

const StudioLayout = () => {
  return (
    <>
      <div className="flex flex-col h-full">{/* Left panel */}</div>
      <div className="flex flex-col h-full flex-1 overflow-hidden">
        <StudioEditor />
      </div>
    </>
  );
};

export default StudioLayout;
