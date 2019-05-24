import { View } from 'front-end/lib/framework';
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  source: string;
  className?: string;
  escapeHtml?: boolean;
  openLinksInNewTabs?: boolean
}

const Markdown: View<Props> = ({ source, className = '', escapeHtml = true, openLinksInNewTabs = false }) => {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown
        source={source}
        escapeHtml={escapeHtml}
        linkTarget={openLinksInNewTabs ? '_blank' : undefined} />
    </div>
  );
};

export default Markdown;
