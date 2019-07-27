import { View } from 'front-end/lib/framework';
import Icon, { AvailableIcons } from 'front-end/lib/views/icon';
import Markdown from 'front-end/lib/views/markdown';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { formatDate, formatTime } from 'shared/lib';
import * as RfiResource from 'shared/lib/resources/request-for-information';

const InfoItem: View<{ icon: AvailableIcons, name: string, value: string }> = ({ icon, name, value }) => (
  <div className='d-flex align-items-start mb-3'>
    <Icon name={icon} color='secondary' className='mr-3 flex-shrink-0' width={1.4} height={1.4} />
    <span className='font-weight-bold text-secondary mr-3'>{name}</span>
    <span>{value}</span>
  </div>
);

const DiscoveryDay: View<{ discoveryDay?: RfiResource.PublicDiscoveryDay }> = ({ discoveryDay }) => {
  if (!discoveryDay) { return null; }
  const { description, occurringAt, location } = discoveryDay;
  const Info = () => (
    <Col xs='12'>
      <InfoItem name='Date' value={formatDate(occurringAt)} icon='calendar' />
      <InfoItem name='Time' value={formatTime(occurringAt, true)} icon='clock' />
      <InfoItem name='Location' value={location} icon='map-marker' />
    </Col>
  );
  return (
    <Row>
      {RfiResource.discoveryDayHasPassed(discoveryDay.occurringAt)
        ? (<Col xs='12'><div className='font-weight-bold pb-3'>Please note that this Discovery Day has already taken place.</div></Col>)
        : null}
      <Col xs='12'>
        {description ? (<Markdown source={description} className='pb-3' openLinksInNewTabs />) : null}
      </Col>
      <Info />
    </Row>
  );
}

export default DiscoveryDay;
