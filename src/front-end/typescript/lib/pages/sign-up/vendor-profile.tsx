import { Page } from 'front-end/lib/app/types';
import * as SelectMulti from 'front-end/lib/components/input/select-multi';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateChild } from 'front-end/lib/framework';
import * as Dropdown from 'front-end/lib/views/input/dropdown';
import * as ShortText from 'front-end/lib/views/input/short-text';
import { reduce } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';
import { BusinessType, parseBusinessType, parsePhoneType, PhoneType, VendorProfile } from 'shared/lib/types';
import { ValidOrInvalid } from 'shared/lib/validators';
import { validateVendorProfile, VendorProfileValidationErrors } from 'shared/lib/validators/vendor-profile';

export type ValidationErrors = VendorProfileValidationErrors;

const validationErrorNameMap: Record<string, string> = {
  businessName: 'Business Name',
  businessType: 'Business Type',
  businessNumber: 'Business Number',
  businessStreetAddress: 'Business Street Address',
  businessCity: 'Business City',
  businessProvince: 'Business Province',
  businessPostalCode: 'Business Postal Code',
  businessCountry: 'Business Country',
  contactName: 'Contact Name',
  contactPositionTitle: 'Contact Position Title',
  contactEmail: 'Contact Email',
  contactPhoneNumber: 'Contact Phone Number',
  contactPhoneCountryCode: 'Contact Country Code',
  contactPhoneType: 'Contact Phone Type',
  industrySectors: 'Industry Sectors',
  areasOfExpertise: 'Areas of Expertise'
};

export function getValidationErrors(state: State): string[] {
  return reduce(state.validationErrors, (acc: string[], v: string[] | undefined, k: string) => {
    const name = validationErrorNameMap[k] || 'Other';
    const errors = v || [];
    return acc.concat(errors.map(msg => `${name}: ${msg}`));
  }, []);
}

export interface State {
  validationErrors: ValidationErrors;
  businessName: ShortText.State;
  businessType: Dropdown.State;
  businessNumber: ShortText.State;
  businessStreetAddress: ShortText.State;
  businessCity: ShortText.State;
  businessProvince: ShortText.State;
  businessPostalCode: ShortText.State;
  businessCountry: ShortText.State;
  contactName: ShortText.State;
  contactPositionTitle: ShortText.State;
  contactEmail: ShortText.State;
  contactPhoneNumber: ShortText.State;
  contactPhoneCountryCode: ShortText.State;
  contactPhoneType: Dropdown.State;
  industrySectors: Immutable<SelectMulti.State>;
  // areasOfExpertise?: string[];
}

type InnerMsg
  = ADT<'onChangeBusinessName', string>
  | ADT<'onChangeBusinessType', string>
  | ADT<'onChangeBusinessNumber', string>
  | ADT<'onChangeBusinessStreetAddress', string>
  | ADT<'onChangeBusinessCity', string>
  | ADT<'onChangeBusinessProvince', string>
  | ADT<'onChangeBusinessPostalCode', string>
  | ADT<'onChangeBusinessCountry', string>
  | ADT<'onChangeContactName', string>
  | ADT<'onChangeContactPositionTitle', string>
  | ADT<'onChangeContactEmail', string>
  | ADT<'onChangeContactPhoneNumber', string>
  | ADT<'onChangeContactPhoneCountryCode', string>
  | ADT<'onChangeContactPhoneType', string>
  | ADT<'industrySectors', SelectMulti.Msg>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export const init: Init<undefined, State> = async () => {
  return {
    validationErrors: {},
    businessName: ShortText.init({
      id: 'vendor-profile-business-name',
      type: 'text',
      required: false,
      label: 'Name',
      placeholder: 'Name'
    }),
    businessType: Dropdown.init({
      id: 'vendor-profile-business-type',
      value: '',
      required: false,
      label: 'Business Type',
      unselectedLabel: 'Select Type',
      options: [
        { value: BusinessType.Corporation, label: 'Corporation' },
        { value: BusinessType.LimitedLiabilityCompany, label: 'Limited Liability Company' },
        { value: BusinessType.Partnership, label: 'Partnership' },
        { value: BusinessType.SoleProprietor, label: 'Sole Proprietor' }
      ]
    }),
    businessNumber: ShortText.init({
      id: 'vendor-profile-business-number',
      type: 'text',
      required: false,
      label: 'Business Number',
      placeholder: 'Business Number'
    }),
    businessStreetAddress: ShortText.init({
      id: 'vendor-profile-business-street-address',
      type: 'text',
      required: false,
      label: 'Street Address',
      placeholder: 'Street Address'
    }),
    businessCity: ShortText.init({
      id: 'vendor-profile-business-city',
      type: 'text',
      required: false,
      label: 'City',
      placeholder: 'City'
    }),
    businessProvince: ShortText.init({
      id: 'vendor-profile-business-province',
      type: 'text',
      required: false,
      label: 'Province',
      placeholder: 'Province'
    }),
    businessPostalCode: ShortText.init({
      id: 'vendor-profile-business-postal-code',
      type: 'text',
      required: false,
      label: 'Postal/Zip Code',
      placeholder: 'Postal/Zip Code'
    }),
    businessCountry: ShortText.init({
      id: 'vendor-profile-business-country',
      type: 'text',
      required: false,
      label: 'Country',
      placeholder: 'Country'
    }),
    contactName: ShortText.init({
      id: 'vendor-profile-contact-name',
      type: 'text',
      required: false,
      label: 'Name',
      placeholder: 'Name'
    }),
    contactPositionTitle: ShortText.init({
      id: 'vendor-profile-contact-position-title',
      type: 'text',
      required: false,
      label: 'Position Title',
      placeholder: 'Position Title'
    }),
    contactEmail: ShortText.init({
      id: 'vendor-profile-contact-email',
      type: 'email',
      required: false,
      label: 'Email Address',
      placeholder: 'Email Address'
    }),
    contactPhoneNumber: ShortText.init({
      id: 'vendor-profile-contact-phone-number',
      type: 'text',
      required: false,
      label: 'Phone Number',
      placeholder: '888-888-8888'
    }),
    contactPhoneCountryCode: ShortText.init({
      id: 'vendor-profile-contact-country-code',
      type: 'text',
      required: false,
      label: 'Country Code',
      placeholder: '+1'
    }),
    contactPhoneType: Dropdown.init({
      id: 'vendor-profile-contact-phone-type',
      value: '',
      required: false,
      label: 'Phone Type',
      unselectedLabel: 'Select Type',
      options: [
        { value: PhoneType.Office, label: 'Office' },
        { value: PhoneType.CellPhone, label: 'Cell Phone' }
      ]
    }),
    industrySectors: immutable(await SelectMulti.init({
      idNamespace: 'vendor-industry-sectors',
      label: 'Industry Sectors',
      labelClassName: 'h3',
      fields: []
    }))
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'onChangeBusinessName':
      return [validateAndUpdate(state, 'businessName', msg.value)];
    case 'onChangeBusinessType':
      return [validateAndUpdate(state, 'businessType', msg.value)];
    case 'onChangeBusinessNumber':
      return [validateAndUpdate(state, 'businessNumber', msg.value)];
    case 'onChangeBusinessStreetAddress':
      return [validateAndUpdate(state, 'businessStreetAddress', msg.value)];
    case 'onChangeBusinessCity':
      return [validateAndUpdate(state, 'businessCity', msg.value)];
    case 'onChangeBusinessProvince':
      return [validateAndUpdate(state, 'businessProvince', msg.value)];
    case 'onChangeBusinessPostalCode':
      return [validateAndUpdate(state, 'businessPostalCode', msg.value)];
    case 'onChangeBusinessCountry':
      return [validateAndUpdate(state, 'businessCountry', msg.value)];
    case 'onChangeContactName':
      return [validateAndUpdate(state, 'contactName', msg.value)];
    case 'onChangeContactPositionTitle':
      return [validateAndUpdate(state, 'contactPositionTitle', msg.value)];
    case 'onChangeContactEmail':
      return [validateAndUpdate(state, 'contactEmail', msg.value)];
    case 'onChangeContactPhoneNumber':
      return [validateAndUpdate(state, 'contactPhoneNumber', msg.value)];
    case 'onChangeContactPhoneCountryCode':
      return [validateAndUpdate(state, 'contactPhoneCountryCode', msg.value)];
    case 'onChangeContactPhoneType':
      return [validateAndUpdate(state, 'contactPhoneType', msg.value)];
    case 'industrySectors':
      return updateChild({
        state,
        childStatePath: ['industrySectors'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

function validateAndUpdate(state: Immutable<State>, key: string, value: string): Immutable<State> {
  state = state.setIn([key, 'value'], value);
  const validation = validateVendorProfile(getVendorProfile(state));
  return persistValidations(state, validation);
}

function getVendorProfile(state: Immutable<State>): VendorProfile {
  return {
    type: 'vendor' as 'vendor',
    businessName: state.businessName.value || undefined,
    businessType: parseBusinessType(state.businessType.value) || undefined,
    businessNumber: state.businessNumber.value || undefined,
    businessStreetAddress: state.businessStreetAddress.value || undefined,
    businessCity: state.businessCity.value || undefined,
    businessProvince: state.businessProvince.value || undefined,
    businessPostalCode: state.businessPostalCode.value || undefined,
    businessCountry: state.businessCountry.value || undefined,
    contactName: state.contactName.value || undefined,
    contactPositionTitle: state.contactPositionTitle.value || undefined,
    contactEmail: state.contactEmail.value || undefined,
    contactPhoneNumber: state.contactPhoneNumber.value || undefined,
    contactPhoneCountryCode: state.contactPhoneCountryCode.value || undefined,
    contactPhoneType: parsePhoneType(state.contactPhoneType.value) || undefined,
    industrySectors: SelectMulti.getValues(state.industrySectors)
    // areasOfExpertise: state.areasOfExpertise.value || undefined
  };
}

function persistValidations(state: Immutable<State>, validation: ValidOrInvalid<VendorProfile, ValidationErrors>): Immutable<State> {
  switch (validation.tag) {
    case 'valid':
      state = persistValues(state, validation.value);
      return persistErrors(state, {});
    case 'invalid':
      return persistErrors(state, validation.value);
  }
}

function persistValues(state: Immutable<State>, profile: VendorProfile): Immutable<State> {
  return state
    .setIn(['businessName', 'value'], profile.businessName || '')
    .setIn(['businessType', 'value'], profile.businessType || '')
    .setIn(['businessNumber', 'value'], profile.businessNumber || '')
    .setIn(['businessStreetAddress', 'value'], profile.businessStreetAddress || '')
    .setIn(['businessCity', 'value'], profile.businessCity || '')
    .setIn(['businessProvince', 'value'], profile.businessProvince || '')
    .setIn(['businessPostalCode', 'value'], profile.businessPostalCode || '')
    .setIn(['businessCountry', 'value'], profile.businessCountry || '')
    .setIn(['contactName', 'value'], profile.contactName || '')
    .setIn(['contactPositionTitle', 'value'], profile.contactPositionTitle || '')
    .setIn(['contactEmail', 'value'], profile.contactEmail || '')
    .setIn(['contactPhoneNumber', 'value'], profile.contactPhoneNumber || '')
    .setIn(['contactPhoneCountryCode', 'value'], profile.contactPhoneCountryCode || '')
    .setIn(['contactPhoneType', 'value'], profile.contactPhoneType || '')
    .set('industrySectors', SelectMulti.setValues(state.industrySectors, profile.industrySectors || []));
}

function persistErrors(state: Immutable<State>, errors: ValidationErrors): Immutable<State> {
  const isValid = (v?: any[]): boolean => !v || !v.length;
  return state
    .set('validationErrors', errors)
    .setIn(['businessName', 'invalid'], !isValid(errors.businessName))
    .setIn(['businessType', 'invalid'], !isValid(errors.businessType))
    .setIn(['businessNumber', 'invalid'], !isValid(errors.businessNumber))
    .setIn(['businessStreetAddress', 'invalid'], !isValid(errors.businessStreetAddress))
    .setIn(['businessCity', 'invalid'], !isValid(errors.businessCity))
    .setIn(['businessProvince', 'invalid'], !isValid(errors.businessProvince))
    .setIn(['businessPostalCode', 'invalid'], !isValid(errors.businessPostalCode))
    .setIn(['businessCountry', 'invalid'], !isValid(errors.businessCountry))
    .setIn(['contactName', 'invalid'], !isValid(errors.contactName))
    .setIn(['contactPositionTitle', 'invalid'], !isValid(errors.contactPositionTitle))
    .setIn(['contactEmail', 'invalid'], !isValid(errors.contactEmail))
    .setIn(['contactPhoneNumber', 'invalid'], !isValid(errors.contactPhoneNumber))
    .setIn(['contactPhoneCountryCode', 'invalid'], !isValid(errors.contactPhoneCountryCode))
    .setIn(['contactPhoneType', 'invalid'], !isValid(errors.contactPhoneType))
    .setIn(['industrySectors', 'invalid'], !isValid(errors.industrySectors));
}

export const BusinessInformation: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeDropdown = (tag: any) => Dropdown.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <div>
      <Row>
        <Col xs='12'>
          <h3>Business Information (Optional)</h3>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <ShortText.view
            state={state.businessName}
            onChange={onChangeShortText('onChangeBusinessName')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6'>
          <Dropdown.view
            state={state.businessType}
            onChange={onChangeDropdown('onChangeBusinessType')} />
        </Col>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.businessNumber}
            onChange={onChangeShortText('onChangeBusinessNumber')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <ShortText.view
            state={state.businessStreetAddress}
            onChange={onChangeShortText('onChangeBusinessStreetAddress')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.businessCity}
            onChange={onChangeShortText('onChangeBusinessCity')} />
        </Col>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.businessProvince}
            onChange={onChangeShortText('onChangeBusinessProvince')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.businessPostalCode}
            onChange={onChangeShortText('onChangeBusinessPostalCode')} />
        </Col>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.businessCountry}
            onChange={onChangeShortText('onChangeBusinessCountry')} />
        </Col>
      </Row>
    </div>
  );
};

export const ContactInformation: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeDropdown = (tag: any) => Dropdown.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <div className='mt-3'>
      <Row>
        <Col xs='12'>
          <h3>Contact Information (Optional)</h3>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.contactName}
            onChange={onChangeShortText('onChangeContactName')} />
        </Col>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.contactPositionTitle}
            onChange={onChangeShortText('onChangeContactPositionTitle')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <ShortText.view
            state={state.contactEmail}
            onChange={onChangeShortText('onChangeContactEmail')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.contactPhoneNumber}
            onChange={onChangeShortText('onChangeContactPhoneNumber')} />
        </Col>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.contactPhoneCountryCode}
            onChange={onChangeShortText('onChangeContactPhoneCountryCode')} />
        </Col>
        <Col xs='12' md='4'>
          <Dropdown.view
            state={state.contactPhoneType}
            onChange={onChangeDropdown('onChangeContactPhoneType')} />
        </Col>
      </Row>
    </div>
  );
};

export const IndustrySectors: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchIndustrySectors: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'industrySectors' as 'industrySectors', value }));
  return (
    <Row className='mt-3'>
      <Col xs='12' md='7'>
        <SelectMulti.view state={state.industrySectors} dispatch={dispatchIndustrySectors} />
      </Col>
    </Row>
  );
};

export const AreasOfExpertise: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <Row className='mt-3'>
      <Col xs='12' md='7'>
        Areas of Expertise
      </Col>
    </Row>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <BusinessInformation {...props} />
      <ContactInformation {...props} />
      <IndustrySectors {...props} />
      <AreasOfExpertise {...props} />
    </div>
  );
};

export const component: Component<undefined, State, Msg> = {
  init,
  update,
  view
};
