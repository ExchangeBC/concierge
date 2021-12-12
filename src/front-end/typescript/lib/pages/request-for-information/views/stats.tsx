import { View } from 'front-end/lib/framework';
import { BootstrapColor } from 'front-end/lib/types';
import React, { CSSProperties, ReactElement } from 'react';

interface Stat {
  count: number;
  label: string | ReactElement;
  color: BootstrapColor;
}

interface BaseProps {
  className?: string;
  style?: CSSProperties;
}

interface StatsProps extends BaseProps {
  children: ReactElement[];
}

export const Stats: View<StatsProps> = ({ className, style, children }) => {
  return (
    <div className={`d-flex flex-nowrap align-items-stretch ${className || ''}`} style={{ overflowY: 'hidden', overflowX: 'auto', ...style }}>
      {children.reduce((acc: Array<ReactElement | null>, child, i) => {
        return [...acc, child, i === children.length - 1 ? null : <div className="pl-4 border-right mr-4" key={`stats-separator-${i}`}></div>];
      }, [])}
    </div>
  );
};

type BigStatProps = BaseProps & Stat;

export const BigStat: View<BigStatProps> = ({ className, style, count, label, color }) => {
  return (
    <div className={`d-flex flex-nowrap align-items-center text-center ${className || ''}`} style={style}>
      <div className={`text-${color} font-weight-bold mr-3 text-nowrap`} style={{ fontSize: '2.5rem', lineHeight: '1' }}>
        {count}
      </div>
      <div className="small font-weight-bold text-secondary text-uppercase text-nowrap">{label}</div>
    </div>
  );
};

interface SmallStatsProps extends BaseProps {
  a: Stat;
  b: Stat;
}

export const SmallStats: View<SmallStatsProps> = ({ a, b, className, style }) => {
  return (
    <div className={`d-flex flex-nowrap align-items-center font-weight-bold small ${className || ''}`} style={style}>
      <div className="d-flex flex-column align-items-stretch text-center mr-2 text-nowrap">
        <div className={`text-${a.color}`}>{a.count}</div>
        <div className={`text-${b.color}`}>{b.count}</div>
      </div>
      <div className="d-flex flex-column align-items-stretch text-left text-secondary text-uppercase text-nowrap">
        <div>{a.label}</div>
        <div>{b.label}</div>
      </div>
    </div>
  );
};
