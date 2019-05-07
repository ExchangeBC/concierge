import { Component, ComponentViewProps, Dispatch, Init, Update, View } from 'front-end/lib/framework';
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

export type Msg
  = ADT<'toggleTooltip', number>;

export function init<Data>(): Init<Params<Data>, State<Data>> {
  return async params => ({
    ...params,
    activeTooltipThIndex: -1
  });
};

export function update<Data>(): Update<State<Data>, Msg> {
  return ({ state, msg }) => {
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
      <Tooltip placement='top' autohide={false} boundariesElement='window' {...props.data}>
        {props.data.text}
      </Tooltip>
    );
  } else {
    return null;
  }
};

export interface THSpec {
  children: Children;
  style?: CSSProperties;
  className?: string;
  tooltipText?: string;
}

export interface THProps extends THSpec {
  dispatch: Dispatch<Msg>;
  index: number;
  tooltipIsOpen: boolean;
  id: string;
}

export const DefaultTHView: View<THProps> = ({ id, style, className, children, index, tooltipText, dispatch, tooltipIsOpen }) => {
  const tooltipData = !tooltipText
    ? undefined
    : {
        text: tooltipText,
        isOpen: tooltipIsOpen,
        target: id,
        toggle: () => dispatch({ tag: 'toggleTooltip', value: index })
      };
  return (
    <th key={id} id={id} style={style} className={className}>
      {children}
      <ConditionalTooltip data={tooltipData} />
    </th>
  );
};

interface THeadProps {
  cells: THProps[];
  THView: View<THProps>;
}

export const THead: View<THeadProps> = ({ cells, THView }) => {
  const children = cells.map((cell, i) => (<THView key={`table-thead-${i}`} {...cell} />));
  return (
    <thead className='small text-secondary text-uppercase font-weight-bold bg-light'>
      <tr>
        {children}
      </tr>
    </thead>
  );
};

export interface TDSpec<Data> {
  data: Data;
}

export function makeTDSpec<Data>(data: Data): TDSpec<Data> {
  return { data };
}

export type TDProps<Data> = TDSpec<Data>;

interface TBodyProps<Data> {
  id: string;
  rows: Array<Array<TDProps<Data>>>;
  TDView: View<TDProps<Data>>;
}

export function makeTBody<Data>(): View<TBodyProps<Data>> {
  return ({ id, rows, TDView }) => {
    const children = rows.map((row, i) => {
      const cellChildren = row.map((cell, j) => (<TDView key={`${id}-${i}-${j}`} {...cell} />));
      return (
        <tr key={`${id}-${i}`}>
          {cellChildren}
        </tr>
      );
    });
    return (
      <tbody style={{ fontSize: '0.875rem' }}>
        {children}
      </tbody>
    );
  };
};

interface ViewProps<Data> extends ComponentViewProps<State<Data>, Msg> {
  headCells: THSpec[];
  bodyRows: Array<Array<TDSpec<Data>>>;
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
      id: `table-${state.idNamespace}-tbody`,
      TDView: state.TDView,
      rows: bodyRows
    };
    return (
      <Table className={className} style={style} responsive>
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
