import { View } from 'front-end/lib/framework';
import { BootstrapColor } from 'front-end/lib/types';
import React from 'react';

export type AvailableIcons
  = 'calendar'
  | 'check'
  | 'help-circle'
  | 'trash'
  | 'file'
  | 'message';

interface Props {
  name: AvailableIcons;
  color: BootstrapColor;
  width?: number;
  height?: number;
}

const IconContents: View<Props> = ({ name }) => {
  switch (name) {
    case 'calendar':
      return (<g><rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line></g>);
    case 'check':
      return (<polyline points='20 6 9 17 4 12'></polyline>);
    case 'help-circle':
      return (<g><circle cx='12' cy='12' r='10'></circle><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'></path><line x1='12' y1='17' x2='12' y2='17'></line></g>);
    case 'trash':
      return (<g><polyline points='3 6 5 6 21 6'></polyline><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'></path><line x1='10' y1='11' x2='10' y2='17'></line><line x1='14' y1='11' x2='14' y2='17'></line></g>);
    case 'file':
      return (<g><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path><polyline points='14 2 14 8 20 8'></polyline><line x1='16' y1='13' x2='8' y2='13'></line><line x1='16' y1='17' x2='8' y2='17'></line><polyline points='10 9 9 9 8 9'></polyline></g>);
    case 'message':
      return (<g><path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'></path></g>);
  }
}

const Icon: View<Props> = props => {
  const { color, width = 24, height = 24 } = props;
  return (
    <svg xmlns='http://www.w3.org/2000/svg' style={{ width, height }} viewBox='0 0 24 24' fill='none' stroke='currentColor' className={`icon text-${color}`} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      <IconContents {...props} />
    </svg>
  );
};

export default Icon;
