import * as Markdown from 'front-end/lib/pages/markdown/components/markdown';

export const component = Markdown.component('B.C. Government Website Privacy Statement', 'privacy');

export type Params = Markdown.Params;

export type Msg = Markdown.Msg;

export type State = Markdown.State;

export const init = component.init;

export const update = component.update;

export const view = component.view;
