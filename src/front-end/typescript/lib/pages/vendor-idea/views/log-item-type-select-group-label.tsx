import { View } from 'front-end/lib/framework';
import { OptionGroup } from 'front-end/lib/views/form-field/select';
import React from 'react';

const LogItemTypeSelectGroupLabel: View<OptionGroup> = ({ label }) => {
  return (
    <div className='small text-secondary font-weight-bolder'>{label}</div>
  );
};

export default LogItemTypeSelectGroupLabel;
