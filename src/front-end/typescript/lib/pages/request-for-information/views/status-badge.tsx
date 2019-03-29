import { View } from 'front-end/lib/framework';
import { BootstrapColor } from 'front-end/lib/types';
import { CSSProperties, default as React } from 'react';
import { Badge as BootstrapBadge } from 'reactstrap';
import { PublicRfi, rfiToRfiStatus } from 'shared/lib/resources/request-for-information';
import { RfiStatus, rfiStatusToTitleCase } from 'shared/lib/types';

interface Props {
  rfi?: PublicRfi;
  status?: RfiStatus;
  className?: string;
  style?: CSSProperties;
}

export function rfiStatusToColor(s: RfiStatus): BootstrapColor {
  switch (s) {
    case RfiStatus.Open:
      return 'success';
    case RfiStatus.Closed:
    case RfiStatus.Expired:
      return 'danger';
  }
}

export const Badge: View<Props> = props => {
  const { rfi, className = '', style = {} } = props;
  const rfiStatus = props.status || (rfi && rfiToRfiStatus(rfi));
  let text = 'Unknown';
  let color: BootstrapColor = 'secondary';
  if (rfiStatus) {
    text = rfiStatusToTitleCase(rfiStatus);
    color = rfiStatusToColor(rfiStatus);
  }
  return (
    <BootstrapBadge color={color} className={`${className} text-uppercase`} style={style || {}}>
      {text}
    </BootstrapBadge>
  );
};

export default Badge;
