import { View } from 'front-end/lib/framework';
import { logItemTypeToCopy } from 'front-end/lib/pages/vendor-idea/lib';
import { CSSProperties, default as React } from 'react';
import { Badge as BootstrapBadge } from 'reactstrap';
import { LogItemType } from 'shared/lib/resources/vendor-idea/log-item';

interface Props {
  logItemType: LogItemType;
  className?: string;
  style?: CSSProperties;
}

export const LogItemTypeBadge: View<Props> = (props) => {
  const { logItemType, className = '', style = {} } = props;
  const copy = logItemTypeToCopy(logItemType);
  switch (copy.tag) {
    case 'badge':
    case 'badgeAndLabel':
      return (
        <BootstrapBadge color={copy.value[0]} className={`${className} text-uppercase`} style={style || {}}>
          {copy.value[1]}
        </BootstrapBadge>
      );
    case 'label':
      return null;
  }
};

export const LogItemTypeFull: View<Props> = (props) => {
  const { logItemType, className = '', style = {} } = props;
  const copy = logItemTypeToCopy(logItemType);
  switch (copy.tag) {
    case 'badge':
      return (
        <BootstrapBadge color={copy.value[0]} className={`${className} text-uppercase`} style={style || {}}>
          {copy.value[1]}
        </BootstrapBadge>
      );
    case 'label':
      return (
        <div className={className} style={style || {}}>
          {copy.value}
        </div>
      );
    case 'badgeAndLabel':
      return (
        <div className={className} style={style || {}}>
          <BootstrapBadge color={copy.value[0]} className="mb-2 text-uppercase">
            {copy.value[1]}
          </BootstrapBadge>
          <div>{copy.value[2]}</div>
        </div>
      );
  }
};
