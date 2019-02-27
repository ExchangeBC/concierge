import { Page } from 'front-end/lib/app/types';
import * as SelectMulti from 'front-end/lib/components/input/select-multi';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import { reduce } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import { ADT } from 'shared/lib/types';
import { BusinessType, parseBusinessType, parsePhoneType, PhoneType, VendorProfile } from 'shared/lib/types';
import { ValidOrInvalid } from 'shared/lib/validators';
import { validateVendorProfile, VendorProfileValidationErrors } from 'shared/lib/validators/vendor-profile';

export type ValidationErrors = VendorProfileValidationErrors;

export interface State {
  validationErrors: ValidationErrors;
  businessName: ShortText.State;
  businessType: Select.State;
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
  contactPhoneType: Select.State;
  industrySectors: Immutable<SelectMulti.State>;
  areasOfExpertise: Immutable<SelectMulti.State>;
}

export function getValues(state: Immutable<State>): VendorProfile {
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
    industrySectors: SelectMulti.getValues(state.industrySectors),
    areasOfExpertise: SelectMulti.getValues(state.areasOfExpertise)
  };
}

export function setValues(state: Immutable<State>, profile: VendorProfile): Immutable<State> {
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
    .set('industrySectors', SelectMulti.setValues(state.industrySectors, profile.industrySectors || []))
    .set('areasOfExpertise', SelectMulti.setValues(state.areasOfExpertise, profile.areasOfExpertise || []));
}

export function setErrors(state: Immutable<State>, errors: ValidationErrors): Immutable<State> {
  return state
    .set('validationErrors', errors)
    .setIn(['businessName', 'errors'], errors.businessName || [])
    .setIn(['businessType', 'errors'], errors.businessType || [])
    .setIn(['businessNumber', 'errors'], errors.businessNumber || [])
    .setIn(['businessStreetAddress', 'errors'], errors.businessStreetAddress || [])
    .setIn(['businessCity', 'errors'], errors.businessCity || [])
    .setIn(['businessProvince', 'errors'], errors.businessProvince || [])
    .setIn(['businessPostalCode', 'errors'], errors.businessPostalCode || [])
    .setIn(['businessCountry', 'errors'], errors.businessCountry || [])
    .setIn(['contactName', 'errors'], errors.contactName || [])
    .setIn(['contactPositionTitle', 'errors'], errors.contactPositionTitle || [])
    .setIn(['contactEmail', 'errors'], errors.contactEmail || [])
    .setIn(['contactPhoneNumber', 'errors'], errors.contactPhoneNumber || [])
    .setIn(['contactPhoneCountryCode', 'errors'], errors.contactPhoneCountryCode || [])
    .setIn(['contactPhoneType', 'errors'], errors.contactPhoneType || [])
    .set('industrySectors', SelectMulti.setErrors(state.industrySectors, errors.industrySectors || []))
    .set('areasOfExpertise', SelectMulti.setErrors(state.areasOfExpertise, errors.areasOfExpertise || []));
}

export function isValid(state: Immutable<State>): boolean {
  return reduce(state.validationErrors, (acc: boolean, v: string[] | string[][] | undefined, k: string) => {
    return acc && (!v || !v.length);
  }, true);
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
  | ADT<'industrySectors', SelectMulti.Msg>
  | ADT<'areasOfExpertise', SelectMulti.Msg>;

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
    businessType: Select.init({
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
      placeholder: 'e.g. 888-888-8888'
    }),
    contactPhoneCountryCode: ShortText.init({
      id: 'vendor-profile-contact-country-code',
      type: 'text',
      required: false,
      label: 'Country Code',
      placeholder: 'e.g. 1'
    }),
    contactPhoneType: Select.init({
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
      options: AVAILABLE_INDUSTRY_SECTORS.toJS().map(value => ({ label: value, value })),
      unselectedLabel: 'Select Industry Sector',
      formFieldMulti: {
        idNamespace: 'vendor-industry-sectors',
        label: 'Industry Sector(s)',
        labelClassName: 'h3 mb-3',
        fields: []
      }
    })),
    areasOfExpertise: immutable(await SelectMulti.init({
      options: AVAILABLE_CATEGORIES.toJS().map(value => ({ label: value, value })),
      unselectedLabel: 'Select Area of Expertise',
      formFieldMulti: {
        idNamespace: 'vendor-areas-of-expertise',
        label: 'Area(s) of Expertise',
        labelClassName: 'h3 mb-3',
        fields: []
      }
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
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'industrySectors', value }),
        childStatePath: ['industrySectors'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateAndUpdate(state)];
    case 'areasOfExpertise':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'areasOfExpertise', value }),
        childStatePath: ['areasOfExpertise'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateAndUpdate(state)];
    default:
      return [state];
  }
};

function validateAndUpdate(state: Immutable<State>, key?: string, value?: string): Immutable<State> {
  if (key && value !== undefined) {
    state = state.setIn([key, 'value'], value);
  }
  const validation = validateVendorProfile(getValues(state));
  return persistValidations(state, validation);
}

function persistValidations(state: Immutable<State>, validation: ValidOrInvalid<VendorProfile, ValidationErrors>): Immutable<State> {
  switch (validation.tag) {
    case 'valid':
      state = setValues(state, validation.value);
      return setErrors(state, {});
    case 'invalid':
      return setErrors(state, validation.value);
  }
}

export const BusinessInformation: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <div className='mt-3 mt-md-0'>
      <FormSectionHeading text='Business Information (Optional)' />
      <Row>
        <Col xs='12'>
          <ShortText.view
            state={state.businessName}
            onChange={onChangeShortText('onChangeBusinessName')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6'>
          <Select.view
            state={state.businessType}
            onChange={onChangeSelect('onChangeBusinessType')} />
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
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <div className='mt-3'>
      <FormSectionHeading text='Contact Information (Optional)' />
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
          <Select.view
            state={state.contactPhoneType}
            onChange={onChangeSelect('onChangeContactPhoneType')} />
        </Col>
      </Row>
    </div>
  );
};

export const IndustrySectors: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchIndustrySectors: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'industrySectors' as 'industrySectors', value }));
  return (
    <Row className='mt-3'>
      <Col xs='12' md='8'>
        <SelectMulti.view state={state.industrySectors} dispatch={dispatchIndustrySectors} />
      </Col>
    </Row>
  );
};

export const AreasOfExpertise: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchAreasOfExpertise: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'areasOfExpertise' as 'areasOfExpertise', value }));
  return (
    <Row className='mt-3'>
      <Col xs='12' md='8'>
        <SelectMulti.view state={state.areasOfExpertise} dispatch={dispatchAreasOfExpertise} />
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
