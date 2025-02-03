'use client';

import './studio.css';
import NoSSRWrapper from '@/app/NoSSRWrapper';
import Studio from '@/app/studio/studio';

const StudioPage = () => {
  return (
    <NoSSRWrapper>
      <Studio />
    </NoSSRWrapper>
  );
};

export default StudioPage;
