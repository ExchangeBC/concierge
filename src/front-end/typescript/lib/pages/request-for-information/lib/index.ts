import { UpdateState } from 'front-end/lib';
import router from 'front-end/lib/app/router';
import { Route } from 'front-end/lib/app/types';
import * as FileMulti from 'front-end/lib/components/input/file-multi';
import { Dispatch, GlobalComponentMsg, Immutable, UpdateReturnValue } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import { formatDateAndTime } from 'shared/lib';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ArrayValidation, invalid, valid, validateArrayAsync, ValidOrInvalid } from 'shared/lib/validators';

export function publishedDateToString(date: Date): string {
  return `Published: ${formatDateAndTime(date, true)}`;
}

export function updatedDateToString(date: Date): string {
  return `Last Updated: ${formatDateAndTime(date, true)}`;
}

/**
 * Uploads a set of files to the back-end and returns
 * a promise of their `_id`s.
 */

export async function uploadFiles(files: FileMulti.Value[]): Promise<ArrayValidation<string>> {
  return validateArrayAsync(files, async file => {
    switch (file.tag) {
      case 'existing':
        return valid(file.value._id);
      case 'new':
        const result = await api.createFile(file.value);
        return result.tag === 'valid' ? valid(result.value._id) : result;
    }
  });
}

export async function makeRequestBody(state: RfiForm.State): Promise<ValidOrInvalid<api.CreateRfiRequestBody, RfiResource.CreateValidationErrors>> {
  const values = RfiForm.getValues(state);
  const uploadedFiles = await uploadFiles(values.attachments);
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
    async (state: Immutable<State>, dispatch: Dispatch<GlobalComponentMsg<InnerMsg, Route>>) => {
      const rfiForm = getRfiForm(state);
      if (!rfiForm) { return state; }
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
              window.open(router.routeToUrl({
                tag: 'requestForInformationPreview',
                value: {
                  rfiId: result.value._id
                }
              }));
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
