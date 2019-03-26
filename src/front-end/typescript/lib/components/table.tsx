import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentViewProps, Dispatch, Init, Update, View } from 'front-end/lib/framework';
import { CSSProperties, default as React, ReactElement } from 'react';
import { Table, Tooltip } from 'reactstrap';
import { ADT, Omit } from 'shared/lib/types';

type Children = string | null | ReactElement<any> | Array<ReactElement<any>>;

export interface State<Data> {
  THView: View<THProps>;
  TDView: View<TDProps<Data>>;
  activeTooltipThIndex: number;
  idNamespace: string;
};

export type Params<Data> = Omit<State<Data>, 'activeTooltipThIndex'>;

type InnerMsg
  = ADT<'toggleTooltip', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export function init<Data>(): Init<Params<Data>, State<Data>> {
  return async params => ({
    ...params,
    activeTooltipThIndex: -1
  });
};

export function update<Data>(): Update<State<Data>, Msg> {
  return (state, msg) => {
    switch (msg.tag) {
      case 'toggleTooltip':
        const currentIndex = state.activeTooltipThIndex;
        if (currentIndex === -1) {
          return [state.set('activeTooltipThIndex', msg.value)];
        } else {
          return [state.set('activeTooltipThIndex', -1)];
        }
      default:
        return [state];
    }
  };
};

interface ConditionalTooltipProps {
  data?: {
    text: string;
    isOpen: boolean;
    target: string;
    toggle(): any;
  };
}

const ConditionalTooltip: View<ConditionalTooltipProps> = props => {
  if (props.data) {
    return (
      <Tooltip placement='top' {...props.data}>
        {props.data.text}
      </Tooltip>
    );
  } else {
    return null;
  }
};

export interface THSpec {
  children: Children;
  tooltipText?: string;
}

export interface THProps extends THSpec {
  dispatch: Dispatch<Msg>;
  index: number;
  tooltipIsOpen: boolean;
  id: string;
}

export const DefaultTHView: View<THProps> = ({ id, children, index, tooltipText, dispatch, tooltipIsOpen }) => {
  const tooltipData = !tooltipText
    ? undefined
    : {
        text: tooltipText,
        isOpen: tooltipIsOpen,
        target: id,
        toggle: () => dispatch({ tag: 'toggleTooltip', value: index })
      };
  return (
    <th>
      {children}
      <ConditionalTooltip data={tooltipData} />
    </th>
  );
};

export interface TDProps<Data> {
  data: Data;
}

interface THeadProps {
  cells: THProps[];
  THView: View<THProps>;
}

export const THead: View<THeadProps> = ({ cells, THView }) => {
  const children = cells.map((cell, i) => (<THView key={`table-thead-${i}`} {...cell} />));
  return (
    <thead className='text-small text-secondary text-uppercase font-weight-bold bg-light'>
      <tr>
        {children}
      </tr>
    </thead>
  );
};

interface TBodyProps<Data> {
  rows: Array<Array<TDProps<Data>>>;
  TDView: View<TDProps<Data>>;
}

export function makeTBody<Data>(): View<TBodyProps<Data>> {
  return ({ rows, TDView }) => {
    const children = rows.map((row, i) => {
      const cellChildren = row.map((cell, j) => (<TDView key={`table-tbody-${i}-${j}`} {...cell} />));
      return (
        <tr>
          {cellChildren}
        </tr>
      );
    });
    return (
      <tbody>
        {children}
      </tbody>
    );
  };
};

interface ViewProps<Data> extends ComponentViewProps<State<Data>, Msg> {
  headCells: THSpec[];
  bodyRows: Array<Array<TDProps<Data>>>;
  className?: string;
  style?: CSSProperties;
}

export function view<Data>(): View<ViewProps<Data>> {
  const TBody: View<TBodyProps<Data>> = makeTBody();
  return props => {
    const { state, dispatch, className, style, headCells, bodyRows } = props;
    const headProps: THeadProps = {
      THView: state.THView,
      cells: headCells.map((spec, index) => {
        return {
          ...spec,
          index,
          dispatch,
          id: `table-${state.idNamespace}-th-${index}`,
          tooltipIsOpen: index === state.activeTooltipThIndex
        };
      })
    };
    const bodyProps: TBodyProps<Data> = {
      TDView: state.TDView,
      rows: bodyRows
    };
    return (
      <Table className={className} style={style} hover={!!bodyRows.length} responsive>
        <THead {...headProps} />
        <TBody {...bodyProps} />
      </Table>
    );
  };
};

export type TableComponent<Data> = Component<Params<Data>, State<Data>, Msg, ViewProps<Data>>;

export function component<Data>(): TableComponent<Data> {
  return {
    init: init(),
    update: update(),
    view: view()
  };
};
