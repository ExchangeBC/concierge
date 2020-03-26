import * as FileMulti from 'front-end/lib/components/form-field-multi/file';
import * as FormFieldMulti from 'front-end/lib/components/form-field-multi/lib/index';
import * as SelectMulti from 'front-end/lib/components/form-field-multi/select';
import { Component, ComponentView, Dispatch, Immutable, immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as LongText from 'front-end/lib/views/form-field/long-text';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import Link from 'front-end/lib/views/link';
import { get } from 'lodash';
import React from 'react';
import { Col, CustomInput, Label, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import * as FileResource from 'shared/lib/resources/file';
import { CreateRequestBody, CreateValidationErrors, InnovationDefinition, PublicVendorIdeaForProgramStaff, PublicVendorIdeaForVendors } from 'shared/lib/resources/vendor-idea';
import { ADT, Omit } from 'shared/lib/types';
import { getInvalidValue, mapValid, validateCategories, validateIndustrySectors, Validation } from 'shared/lib/validators';
import { validateContactEmail, validateContactName, validateContactPhoneNumber, validateDescriptionSummary, validateDescriptionTitle, validateEligibilityExistingPurchase, validateEligibilityInnovationDefinitionOtherText, validateEligibilityProductOffering } from 'shared/lib/validators/vendor-idea';

export interface Params {
  isEditing: boolean; existingVi?: PublicVendorIdeaForVendors | PublicVendorIdeaForProgramStaff;
}

export type Msg
  = ADT<'onChangeHasExistingPurchase', boolean>
  | ADT<'onChangeExistingPurchaseSummary', string>
  | ADT<'onChangeSearchDeclaration', boolean>
  | ADT<'onChangeProductOffering', string>
  | ADT<'onChangeInnovationDefinitionOtherText', string>
  | ADT<'onChangeInnovationDefinition', [InnovationDefinition, boolean]> // [def, add/remove]
  | ADT<'onChangeTitle', string>
  | ADT<'onChangeSummary', string>
  | ADT<'onChangeContactName', string>
  | ADT<'onChangeEmailAddress', string>
  | ADT<'onChangePhoneNumber', string>
  | ADT<'onChangeIndustrySectors', SelectMulti.Msg>
  | ADT<'onChangeCategories', SelectMulti.Msg>
  | ADT<'onChangeAttachments', FileMulti.Msg>
  | ADT<'validateExistingPurchaseSummary'>
  | ADT<'validateProductOffering'>
  | ADT<'validateInnovationDefinitionOtherText'>
  | ADT<'validateTitle'>
  | ADT<'validateSummary'>
  | ADT<'validateContactName'>
  | ADT<'validateEmailAddress'>
  | ADT<'validatePhoneNumber'>
  | ADT<'toggleHelp', HelpFieldName>;

export interface State {
  isEditing: boolean;
  hasExistingPurchase: boolean;
  existingPurchaseSummary: LongText.State;
  searchDeclaration: boolean;
  productOffering: LongText.State;
  innovationDefinitions: InnovationDefinition[];
  innovationDefinitionOtherText: LongText.State;
  title: ShortText.State;
  summary: LongText.State;
  contactName: ShortText.State;
  emailAddress: ShortText.State;
  phoneNumber: ShortText.State;
  industrySectors: Immutable<SelectMulti.State>;
  categories: Immutable<SelectMulti.State>;
  attachments: Immutable<FileMulti.State>;
}

function getInnovationDefinitionOther(defs: InnovationDefinition[]): ADT<'other', string> | null {
  return defs.reduce((acc: ADT<'other', string> | null, v: InnovationDefinition) => {
    return v.tag === 'other' ? v : acc;
  }, null);
}

function getInnovationDefinitionOtherText(defs: InnovationDefinition[]): string | null {
  const def = getInnovationDefinitionOther(defs);
  return def && def.value;
}

type FormFieldKeys
  = 'existingPurchaseSummary'
  | 'productOffering'
  | 'innovationDefinitionOtherText'
  | 'title'
  | 'summary'
  | 'contactName'
  | 'emailAddress'
  | 'phoneNumber';

type HelpFieldName
  = 'productOffering';

export interface Values extends Omit<CreateRequestBody, 'attachments'> {
  attachments: FileMulti.Value[];
}

export function getValues(state: State): Values {
  return {
    description: {
      title: state.title.value,
      summary: state.summary.value,
      industrySectors: SelectMulti.getValuesAsStrings(state.industrySectors),
      categories: SelectMulti.getValuesAsStrings(state.categories)
    },
    eligibility: {
      existingPurchase: state.hasExistingPurchase ? state.existingPurchaseSummary.value : undefined,
      productOffering: state.productOffering.value,
      innovationDefinitions: state.innovationDefinitions
    },
    contact: {
      name: state.contactName.value,
      email: state.emailAddress.value,
      phoneNumber: state.phoneNumber.value
    },
    attachments: FileMulti.getValues(state.attachments)
  };
}

export const init: Init<Params, State> = async ({ isEditing, existingVi }) => {
  const getVi = (kp: string[], fallback: any) => get(existingVi, ['latestVersion', ...kp], fallback);
  const existingIndustrySectorFields = getVi(['description', 'industrySectors'], [])
    .map((value: string): FormFieldMulti.Field<SelectMulti.Value> => {
      return {
        value: { label: value, value },
        errors: []
      };
    });
  const existingCategoryFields = getVi(['description', 'categories'], [])
    .map((value: string): FormFieldMulti.Field<SelectMulti.Value> => {
      return {
        value: { label: value, value },
        errors: []
      };
    });
  return {
    isEditing,
    hasExistingPurchase: !!getVi(['eligibility', 'existingPurchase'], undefined),
    existingPurchaseSummary: LongText.init({
      id: 'vi-existing-purchase',
      required: true,
      label: 'Identify which product or service the Province of BC has purchased before, and explain how your product or service is different or a significant improvement from the previous purchase(s).',
      placeholder: 'Please limit your response to 300 words.',
      value: getVi(['eligibility', 'existingPurchase'], '')
    }),
    searchDeclaration: existingVi ? !getVi(['eligibility', 'existingPurchase'], undefined) : false,
    productOffering: LongText.init({
      id: 'vi-product-offering',
      required: true,
      label: 'Benefit to Province',
      placeholder: 'Please limit your response to 500 words.',
      value: getVi(['eligibility', 'productOffering'], ''),
      help: {
        //text: 'If the Province has purchased the product or service before, or the product or service is not a vast improvement on what has been purchased before, and/or the public sector need has not been demonstrated, the Unsolicited Proposal does not meet the requirements of the Program.',
        text: 'Provide high-level information about how this Unsolicited Proposal would be beneficial for a potential Public Sector Buyer. This is not detailed business case-level information; if your idea is screen in, you can provide that analysis later.',
        show: false
      }
    }),
    innovationDefinitionOtherText: LongText.init({
      id: 'vi-innovation-definition-other-text',
      required: true,
      label: '',
      placeholder: 'Please limit your response to 50 words.',
      value: getInnovationDefinitionOtherText(getVi(['eligibility', 'innovationDefinitions'], [])) || ''
    }),
    innovationDefinitions: getVi(['eligibility', 'innovationDefinitions'], []),
    title: ShortText.init({
      id: 'vi-title',
      required: true,
      type: 'text',
      label: 'Title',
      placeholder: 'Please limit your response to 75 characters.',
      value: getVi(['description', 'title'], '')
    }),
    summary: LongText.init({
      id: 'vi-summary',
      required: true,
      label: 'Brief Description of your Unsolicited Proposal',
      placeholder: 'Please limit your response to 200 words.',
      value: getVi(['description', 'summary'], '')
    }),
    industrySectors: immutable(await SelectMulti.init({
      options: AVAILABLE_INDUSTRY_SECTORS.toJS().map(value => ({ label: value, value })),
      placeholder: 'Select Industry Sector',
      isCreatable: true,
      formFieldMulti: {
        idNamespace: 'vi-industry-sectors',
        label: 'Identify the industry sector(s) that apply to the good or service.',
        required: true,
        minFields: 1,
        fields: existingIndustrySectorFields.length ? existingIndustrySectorFields : SelectMulti.DEFAULT_SELECT_MULTI_FIELDS
      }
    })),
    categories: immutable(await SelectMulti.init({
      options: AVAILABLE_CATEGORIES.toJS().map(value => ({ label: value, value })),
      placeholder: 'Select Area of Interest',
      isCreatable: true,
      formFieldMulti: {
        idNamespace: 'rfi-categories',
        label: 'Identify the area(s) of interest that apply to the good or service.',
        required: true,
        minFields: 1,
        fields: existingCategoryFields.length ? existingCategoryFields : SelectMulti.DEFAULT_SELECT_MULTI_FIELDS
      }
    })),
    contactName: ShortText.init({
      id: 'vi-contact-name',
      required: true,
      type: 'text',
      label: 'Contact Name',
      placeholder: 'Contact Name',
      value: getVi(['contact', 'name'], '')
    }),
    emailAddress: ShortText.init({
      id: 'vi-email-address',
      required: true,
      type: 'email',
      label: 'Email Address',
      placeholder: 'Email Address',
      value: getVi(['contact', 'email'], '')
    }),
    phoneNumber: ShortText.init({
      id: 'vi-phone-number',
      required: false,
      type: 'text',
      label: 'Phone Number',
      placeholder: 'Phone Number',
      value: getVi(['contact', 'phoneNumber'], '')
    }),
    attachments: immutable(await FileMulti.init({
      formFieldMulti: {
        idNamespace: 'vi-attachments',
        label: 'Section 1: Attachment(s)',
        description: 'Please attach the completed "Unsolicited Proposal - Detailed Information" document. You may also attach additional relevant documents (e.g. drawings or schematics) that you wish to be considered as part of your Unsolicited Proposal.',
        required: false,
        fields: getVi(['attachments'], [])
          .map((attachment: FileResource.PublicFile) => {
            return {
              value: FileMulti.makeExistingValue(attachment),
              errors: []
            };
          })
      }
    }))
  };
};

function onChangeInnovationDefinition(state: Immutable<State>, change: [InnovationDefinition, boolean]): Immutable<State> {
  // Remove the associated innovation definition.
  state = state.set('innovationDefinitions', state.innovationDefinitions.filter(value => {
    return value.tag !== change[0].tag;
  }));
  // Add the innovation definition to list if required.
  if (change[1]) {
    state = state.set('innovationDefinitions', state.innovationDefinitions.concat([change[0]]));
  } else if (change[0].tag === 'other' && !change[1]) {
    state = state.setIn(['innovationDefinitionOtherText', 'errors'], []);
  }
  return state;
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeHasExistingPurchase':
      return [state.set('hasExistingPurchase', msg.value)];
    case 'onChangeExistingPurchaseSummary':
      return [updateValue(state, 'existingPurchaseSummary', msg.value)];
    case 'onChangeSearchDeclaration':
      return [state.set('searchDeclaration', msg.value)];
    case 'onChangeProductOffering':
      return [updateValue(state, 'productOffering', msg.value)];
    case 'onChangeInnovationDefinitionOtherText':
      return [updateValue(state, 'innovationDefinitionOtherText', msg.value)];
    case 'onChangeInnovationDefinition':
      return [onChangeInnovationDefinition(state, msg.value)];
    case 'onChangeTitle':
      return [updateValue(state, 'title', msg.value)];
    case 'onChangeSummary':
      return [updateValue(state, 'summary', msg.value)];
    case 'onChangeContactName':
      return [updateValue(state, 'contactName', msg.value)];
    case 'onChangeEmailAddress':
      return [updateValue(state, 'emailAddress', msg.value)];
    case 'onChangePhoneNumber':
      return [updateValue(state, 'phoneNumber', msg.value)];
    case 'onChangeIndustrySectors':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'onChangeIndustrySectors', value }),
        childStatePath: ['industrySectors'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      const validatedIndustrySectors = validateIndustrySectors(SelectMulti.getValuesAsStrings(state.industrySectors));
      state = state.set('industrySectors', SelectMulti.setErrors(state.industrySectors, getInvalidValue(validatedIndustrySectors, [])));
      return [state];
    case 'onChangeCategories':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'onChangeCategories', value }),
        childStatePath: ['categories'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      const validatedCategories = validateCategories(SelectMulti.getValuesAsStrings(state.categories), 'Area of Interest');
      state = state.set('categories', SelectMulti.setErrors(state.categories, getInvalidValue(validatedCategories, [])));
      return [state];
    case 'onChangeAttachments':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'onChangeAttachments', value }),
        childStatePath: ['attachments'],
        childUpdate: FileMulti.update,
        childMsg: msg.value
      })[0];
      // No need to validate attachments as FileMulti
      // is fairly 'intelligent' about file names,
      // and handles file size constraint validation as-is.
      return [state];
    case 'validateExistingPurchaseSummary':
    return [validateValue(state, 'existingPurchaseSummary', v => mapValid(validateEligibilityExistingPurchase(v), u => u || ''))];
    case 'validateProductOffering':
      return [validateValue(state, 'productOffering', validateEligibilityProductOffering)];
    case 'validateInnovationDefinitionOtherText':
    state = validateValue(state, 'innovationDefinitionOtherText', validateEligibilityInnovationDefinitionOtherText);
    state = onChangeInnovationDefinition(state, [
      { tag: 'other', value: state.innovationDefinitionOtherText.value },
      true
    ]);
    return [state];
    case 'validateTitle':
      return [validateValue(state, 'title', validateDescriptionTitle)];
    case 'validateSummary':
      return [validateValue(state, 'summary', validateDescriptionSummary)];
    case 'validateContactName':
      return [validateValue(state, 'contactName', validateContactName)];
    case 'validateEmailAddress':
      return [validateValue(state, 'emailAddress', validateContactEmail)];
    case 'validatePhoneNumber':
      return [validateValue(state, 'phoneNumber', v => mapValid(validateContactPhoneNumber(v), u => u || ''))];
    case 'toggleHelp':
      return [(() => {
        switch (msg.value) {
          case 'productOffering':
            return state.setIn(['productOffering', 'help', 'show'], !state.getIn(['productOffering', 'help', 'show']));
        }
      })()];
    default:
      return [state];
  }
};

function updateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, validate: (value: State[K]['value']) => Validation<State[K]['value']>): Immutable<State> {
  const validation = validate(state.getIn([key, 'value']));
  return state.setIn([key, 'errors'], getInvalidValue(validation, []));
}

export function setErrors(state: Immutable<State>, errors: CreateValidationErrors): Immutable<State> {
  const getErrors = (kp: string[]) => get(errors, kp, []);
  return state
    .setIn(['existingPurchaseSummary', 'errors'], getErrors(['eligibility', 'existingPurchase']))
    .setIn(['productOffering', 'errors'], getErrors(['eligibility', 'productOffering']))
    .setIn(['innovationDefinitionOtherText', 'errors'], getErrors(['eligibility', 'innovationDefinitions']).reduce((acc: string[], v: string[][], i: number) => {
      const def = state.innovationDefinitions[i];
      if (def && def.tag === 'other') {
        return v;
      }
      return acc;
    }, []))
    .setIn(['title', 'errors'], getErrors(['description', 'title']))
    .setIn(['summary', 'errors'], getErrors(['description', 'summary']))
    .setIn(['contactName', 'errors'], getErrors(['contact', 'name']))
    .setIn(['emailAddress', 'errors'], getErrors(['contact', 'email']))
    .setIn(['phoneNumber', 'errors'], getErrors(['contact', 'phoneNumber']))
    .set('industrySectors', SelectMulti.setErrors(state.industrySectors, getErrors(['description', 'industrySectors'])))
    .set('categories', SelectMulti.setErrors(state.categories, getErrors(['description', 'categories'])))
    .set('attachments', FileMulti.setErrors(state.attachments, getErrors(['attachments'])));
}

export function hasProvidedRequiredFields(state: State): boolean {
  const {
    hasExistingPurchase,
    existingPurchaseSummary,
    searchDeclaration,
    productOffering,
    innovationDefinitions,
    title,
    summary,
    contactName,
    emailAddress,
    attachments
  } = state;
  const existingPurchaseIsOk = !hasExistingPurchase || !!(hasExistingPurchase && existingPurchaseSummary.value);
  const searchDeclarationIsOk = hasExistingPurchase || (!hasExistingPurchase && searchDeclaration);
  const innovationDefinitionOtherText = getInnovationDefinitionOtherText(innovationDefinitions);
  const innovationDefinitionOtherTextIsOk = innovationDefinitionOtherText === null || !!innovationDefinitionOtherText;
  return !!(existingPurchaseIsOk && searchDeclarationIsOk && productOffering.value && innovationDefinitions.length && innovationDefinitionOtherTextIsOk && title.value && summary.value && contactName.value && emailAddress.value && attachments.formFieldMulti.fields.length);
}

export function hasValidationErrors(state: State): boolean {
  const {
    hasExistingPurchase,
    existingPurchaseSummary,
    productOffering,
    innovationDefinitionOtherText,
    title,
    summary,
    contactName,
    emailAddress,
    phoneNumber,
    industrySectors,
    categories,
    attachments
  } = state;
  const existingPurchaseErrors = hasExistingPurchase && !!existingPurchaseSummary.errors.length;
  const errors = !!(existingPurchaseErrors || productOffering.errors.length || title.errors.length || summary.errors.length || contactName.errors.length || emailAddress.errors.length || phoneNumber.errors.length || innovationDefinitionOtherText.errors.length);
  return errors || !SelectMulti.isValid(industrySectors) || !SelectMulti.isValid(categories) || !FileMulti.isValid(attachments);
}

export function isValid(state: State): boolean {
  return hasProvidedRequiredFields(state) && !hasValidationErrors(state);
}

const Attachments: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const dispatchAttachments: Dispatch<FileMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'onChangeAttachments' as const, value }));
  return (
    <div className='mb-5'>
      <Row>
        <Col xs='12' md='10' lg='8'>
          <FileMulti.view
            state={state.attachments}
            dispatch={dispatchAttachments}
            disabled={isDisabled}
            labelClassName='h3'
            labelWrapperClassName='mb-4'
            formGroupClassName='col-xs-12 px-0 col-md-9 pl-md-0'
            className='mb-0' />
        </Col>
      </Row>
    </div>
  );
};

const FieldLabel: View<{ text: string, className?: string, required?: boolean }> = ({ text, className, required = false }) => {
  return (
    <Label className={`${required ? 'font-weight-bold' : ''} ${className || ''}`}>
      <span>
        {text}
        {required ? (<span className='text-info ml-1'>*</span>) : null }
      </span>
    </Label>
  );
};

interface CheckboxProps {
  id: string;
  radio?: boolean;
  inline?: boolean;
  className?: string;
  label: string;
  disabled: boolean;
  checked: boolean;
  onChange(value: boolean): void;
}

const Checkbox: View<CheckboxProps> = ({ id, radio = false, label, disabled, checked, onChange, inline = false, className }) => {
  const props = {
    id,
    label,
    disabled,
    inline,
    className,
    type: radio ? 'radio' as const : 'checkbox' as const,
    checked
    //checked: radio ? undefined : checked,
    //selected: radio ? checked : undefined
  };
  return (
    <CustomInput onChange={event => onChange(event.currentTarget.checked)} {...props} />
  );
};

const Eligibility: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const onChangeHasExistingPurchase = (value: boolean) => dispatch({ tag: 'onChangeHasExistingPurchase', value });
  const hasInnovationDefinition = (def: InnovationDefinition) => !!state.innovationDefinitions.filter(({ tag }) => tag === def.tag).length;
  const onChangeInnovationDefinition = (def: InnovationDefinition) => (checked: boolean) => dispatch({
    tag: 'onChangeInnovationDefinition',
    value: [def, checked]
  });
  const toggleHelp = (value: HelpFieldName) => () => dispatch({ tag: 'toggleHelp', value });
  const onChangeLongText = (tag: any) => LongText.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
  const InnovationDefinitionCheckbox: View<{ def: InnovationDefinition, label: string }> = ({ def, label }) => (
    <Checkbox id={`vi-innovation-definition-${def.tag}`} disabled={isDisabled} checked={hasInnovationDefinition(def)} onChange={onChangeInnovationDefinition(def)} label={label} className='mb-2' />
  );
  return (
    <div className='mb-5'>
      <Row className='mb-4'>
        <Col xs='12' md='10' lg='8'>
          <h3 className='mb-4'>Section 3: Eligibility</h3>
          <p className='mb-0'>The information provided in this section will be used by Program Staff to assess if the Unsolicited Proposal meets the Eligibility Criteria.</p>
        </Col>
      </Row>
      <Row className='mb-4'>
        <Col xs='12' md='10' lg='8'>
          <FieldLabel required text='Has this, or a similar product or service, been sold to the Province of BC before?' className='pt-0' />
          <div>
            <Checkbox radio id='vi-has-existing-purchase-yes' label='Yes' disabled={isDisabled} checked={state.hasExistingPurchase} onChange={v => v && onChangeHasExistingPurchase(true)} inline />
            <Checkbox radio id='vi-has-existing-purchase-no' label='No' disabled={isDisabled} checked={!state.hasExistingPurchase} onChange={v => v && onChangeHasExistingPurchase(false)} inline />
          </div>
        </Col>
      </Row>
      <Row className='mb-4'>
        <Col xs='12' md='10' lg='8'>
          {state.hasExistingPurchase
            ? (<LongText.view
                style={{ minHeight: '240px' }}
                state={state.existingPurchaseSummary}
                disabled={isDisabled}
                onChangeDebounced={onChangeDebounced('validateExistingPurchaseSummary')}
                onChange={onChangeLongText('onChangeExistingPurchaseSummary')} />)
            : (<div>
              <Checkbox id='vi-search-declaration' disabled={isDisabled} checked={state.searchDeclaration} onChange={value => dispatch({ tag: 'onChangeSearchDeclaration', value })} className='font-weight-bold mb-2' label='You have searched, and a similar product and/or service cannot be found in any of the following websites: *' />
                <ul className='mb-0'>
                  <li><Link newTab href='http://www.bcbid.gov.bc.ca/open.dll/welcome?language=En'>BC Bid</Link></li>
                  <li><Link newTab href='https://www2.gov.bc.ca/gov/content/employment-business/business/business-government/respond-to-opportunities/contract-opportunities'>Contract Opportunities – Advance Notice</Link></li>
                  <li><Link newTab href='https://www2.gov.bc.ca/gov/content/employment-business/business/business-government/vendor-user-of-bc-bid/view-contract-awards'>Contract Award Summaries</Link></li>
                  <li><Link newTab href='http://www2.gov.bc.ca/gov/content/governments/services-for-government/bc-bid-resources/goods-and-services-catalogue'>Goods and Services Catalogue</Link></li>
                  <li><Link newTab href='https://www2.gov.bc.ca/gov/content/governments/about-the-bc-government/open-government/open-information/directly-awarded-contracts'>Directly-Awarded Contracts</Link></li>
                </ul>
              </div>)}
        </Col>
      </Row>
      <Row className='mb-4'>
        <Col xs='12' md='10' lg='8'>
          <LongText.view
            style={{ minHeight: '240px' }}
            state={state.productOffering}
            disabled={isDisabled}
            toggleHelp={toggleHelp('productOffering')}
            onChangeDebounced={onChangeDebounced('validateProductOffering')}
            onChange={onChangeLongText('onChangeProductOffering')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10' lg='8'>
          <FieldLabel required text='Use the checkboxes below to indicate how your Unsolicited Proposal is unique and/or innovative. Please select at least one and all that apply:' />
          <div>
            <InnovationDefinitionCheckbox def={{ tag: 'newTechnology', value: undefined }} label='An invention, new technology or new process that is not currently available in the marketplace.' />
            <InnovationDefinitionCheckbox def={{ tag: 'newApplicationOfExistingTechnology', value: undefined }} label='A new application of an existing product, service, technology or process.' />
            <InnovationDefinitionCheckbox def={{ tag: 'existingTechnologyNotPurchased', value: undefined }} label='Goods or services that are available in the marketplace that the government has not yet purchased.' />
            <InnovationDefinitionCheckbox def={{ tag: 'improvementToExistingTechnology', value: undefined }} label='A significant improvement in functionality, cost or performance over an existing good or service that could be considered state-of-the-art or the current industry best practice.' />
            <InnovationDefinitionCheckbox def={{ tag: 'other', value: state.innovationDefinitionOtherText.value }} label='Other' />
            <div className='pl-4'>
              <LongText.view
                style={{ minHeight: '100px' }}
                state={state.innovationDefinitionOtherText}
                disabled={isDisabled || !getInnovationDefinitionOther(state.innovationDefinitions)}
                onChangeDebounced={onChangeDebounced('validateInnovationDefinitionOtherText')}
                onChange={onChangeLongText('onChangeInnovationDefinitionOtherText')}
                className='mb-0' />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

const Description: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeLongText = (tag: any) => LongText.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
  const dispatchCategories: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'onChangeCategories' as const, value }));
  const dispatchIndustrySectors: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'onChangeIndustrySectors' as const, value }));
  return (
    <div className='mb-5'>
      <Row className='mb-4'>
        <Col xs='12' md='10' lg='8'>
          <h3 className='mb-4'>Section 2: Description</h3>
          <p className='mb-0'>If your Unsolicited Proposal is accepted into the Procurement Concierge Program, please note that information about the Unsolicited Proposal will be anonymously made available to potential Public Sector Buyers via the Procurement Concierge Program's web application. Therefore, ensure that the information below is understandable without company information and/or proprietary trademarks.</p>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10' lg='8'>
          <ShortText.view
            state={state.title}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateTitle')}
            onChange={onChangeShortText('onChangeTitle')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10' lg='8'>
          <LongText.view
            style={{ minHeight: '120px' }}
            state={state.summary}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateSummary')}
            onChange={onChangeLongText('onChangeSummary')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10' lg='8'>
          <SelectMulti.view
            state={state.industrySectors}
            dispatch={dispatchIndustrySectors}
            disabled={isDisabled}
            formGroupClassName='col-xs-12 px-0 col-md-9 pl-md-0' />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10' lg='8'>
          <SelectMulti.view
            state={state.categories}
            dispatch={dispatchCategories}
            disabled={isDisabled}
            className='mb-0'
            formGroupClassName='col-xs-12 px-0 col-md-9 pl-md-0' />
        </Col>
      </Row>
    </div>
  );
};

const Contact: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
  return (
    <div>
      <Row className='mb-4'>
        <Col xs='12' md='10' lg='8'>
          <h3 className='mb-4'>Section 4: Contact Information</h3>
          <p className='mb-0'>Please provide contact information and identify a representative for this Unsolicited Proposal. The contact person named in this section will be the primary point-of-contact for all of the program's activites related to this Unsolicited Proposal. This information will only be visible to the Procurement Concierge program's staff.</p>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='5' lg='4'>
          <ShortText.view
            state={state.contactName}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateContactName')}
            onChange={onChangeShortText('onChangeContactName')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='5' lg='4'>
          <ShortText.view
            state={state.emailAddress}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateEmailAddress')}
            onChange={onChangeShortText('onChangeEmailAddress')} />
        </Col>
        <Col xs='12' md='5' lg='4'>
          <ShortText.view
            state={state.phoneNumber}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validatePhoneNumber')}
            onChange={onChangeShortText('onChangePhoneNumber')} />
        </Col>
      </Row>
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Attachments {...props} />
      <Description {...props} />
      <Eligibility {...props} />
      <Contact {...props} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
