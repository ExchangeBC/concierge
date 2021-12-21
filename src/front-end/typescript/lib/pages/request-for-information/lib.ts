import { UpdateState } from 'front-end/lib';
import router from 'front-end/lib/app/router';
import { Route } from 'front-end/lib/app/types';
import { GlobalComponentMsg, Immutable, UpdateReturnValue } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import { formatDateAndTime } from 'shared/lib';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export function publishedDateToString(date?: Date): string {
  return date ? `Published: ${formatDateAndTime(date, true)}` : 'DRAFT';
}

export function updatedDateToString(date: Date): string {
  return `Last Updated: ${formatDateAndTime(date, true)}`;
}

export async function makeRequestBody(state: RfiForm.State): Promise<ValidOrInvalid<RfiResource.CreateRequestBody, RfiResource.CreateValidationErrors>> {
  const values = RfiForm.getValues(state);
  const uploadedFiles = await api.uploadFiles(values.attachments, {
    tag: 'any',
    value: undefined
  });
  switch (uploadedFiles.tag) {
    case 'valid':
      return valid({
        rfiNumber: values.rfiNumber,
        title: values.title,
        publicSectorEntity: values.publicSectorEntity,
        description: values.description,
        discoveryDay: values.discoveryDay,
        closingDate: values.closingDate,
        closingTime: values.closingTime,
        gracePeriodDays: values.gracePeriodDays,
        buyerContact: values.buyerContact,
        programStaffContact: values.programStaffContact,
        categories: values.categories,
        attachments: uploadedFiles.value,
        addenda: values.addenda
      });
    case 'invalid':
      return invalid({
        attachments: uploadedFiles.value
      });
  }
}

interface CreateAndShowPreviewParams<State> {
  state: Immutable<State>;
  startLoading: UpdateState<State>;
  stopLoading: UpdateState<State>;
  getRfiForm(state: Immutable<State>): Immutable<RfiForm.State> | undefined;
  setRfiForm(state: Immutable<State>, rfiForm: Immutable<RfiForm.State>): Immutable<State>;
}

export function createAndShowPreview<State, InnerMsg>(params: CreateAndShowPreviewParams<State>): UpdateReturnValue<State, GlobalComponentMsg<InnerMsg, Route>> {
  const { state, startLoading, stopLoading, getRfiForm, setRfiForm } = params;
  return [
    startLoading(state),
    async (state: Immutable<State>) => {
      const rfiForm = getRfiForm(state);
      if (!rfiForm) {
        return null;
      }
      const fail = (state: Immutable<State>, errors: RfiResource.CreateValidationErrors) => {
        state = stopLoading(state);
        return setRfiForm(state, RfiForm.setErrors(rfiForm, errors));
      };
      const requestBody = await makeRequestBody(rfiForm);
      switch (requestBody.tag) {
        case 'valid':
          const result = await api.createRfiPreview(requestBody.value);
          switch (result.tag) {
            case 'valid':
              window.open(
                router.routeToUrl({
                  tag: 'requestForInformationPreview',
                  value: {
                    rfiId: result.value._id
                  }
                })
              );
              state = stopLoading(state);
              break;
            case 'invalid':
              state = fail(state, result.value);
              break;
          }
          break;
        case 'invalid':
          state = fail(state, requestBody.value);
          break;
      }
      return state;
    }
  ];
}
