import { View } from 'front-end/lib/framework';
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  source: string;
  escapeHtml?: boolean;
  className?: string;
}

const Markdown: View<Props> = ({ source, escapeHtml = true, className = '' }) => {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown source={source} escapeHtml={escapeHtml} />
    </div>
  );
};

export default Markdown;
