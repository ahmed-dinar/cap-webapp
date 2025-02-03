import dynamic from 'next/dynamic';
import React from 'react';

// eslint-disable-next-line
const NoSSRWrapper = (props: any) => <React.Fragment>{props.children}</React.Fragment>;

export default dynamic(() => Promise.resolve(NoSSRWrapper), {
  ssr: false,
});
