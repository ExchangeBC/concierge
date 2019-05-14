export type BootstrapColor = 'body' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'muted' | 'white';

export type TextColor = BootstrapColor;

export type ButtonColor
  = Exclude<BootstrapColor, 'body' | 'white' | 'muted'>
  | 'link';
