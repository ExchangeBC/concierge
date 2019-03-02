import { View } from 'front-end/lib/framework';
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  source: string;
  className?: string;
}

const Markdown: View<Props> = ({ source, className = '' }) => {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown source={source} />
    </div>
  );
};

export default Markdown;
