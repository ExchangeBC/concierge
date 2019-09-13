import * as api from 'front-end/lib/http/api';
import * as IntakeForm from 'front-end/lib/pages/vendor-idea/components/intake-form';
import { BootstrapColor } from 'front-end/lib/types';
import { Option } from 'front-end/lib/views/form-field/lib/select';
import { CreateRequestBody, CreateValidationErrors } from 'shared/lib/resources/vendor-idea';
import { LogItemType, logItemTypeIsStatus } from 'shared/lib/resources/vendor-idea/log-item';
import { ADT } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

type LogItemTypeCopy
  = ADT<'badge', [BootstrapColor, string]> // [badge color, badge text]
  | ADT<'label', string>
  | ADT<'badgeAndLabel', [BootstrapColor, string, string]>; // [badge color, badge text, label text]

export function logItemTypeToCopy(itemType: LogItemType): LogItemTypeCopy {
  switch (itemType) {
    case LogItemType.ApplicationSubmitted:
      return { tag: 'badge', value: ['info', 'Application Submitted'] };
    case LogItemType.UnderReview:
      return { tag: 'badge', value: ['warning', 'Under Review'] };
    case LogItemType.EditsRequired:
      return { tag: 'badge', value: ['info', 'Edits Required'] };
    case LogItemType.EditsSubmitted:
      return { tag: 'badge', value: ['info', 'Edits Submitted'] };
    case LogItemType.Eligible:
      return { tag: 'badge', value: ['success', 'Eligible'] };
    case LogItemType.Ineligible:
      return { tag: 'badge', value: ['danger', 'Ineligible'] };
    case LogItemType.UnderProcurement:
      return { tag: 'badge', value: ['warning', 'Under Procurement'] };
    case LogItemType.ClosedPurchasedFromVendor:
      return { tag: 'badgeAndLabel', value: ['danger', 'Closed', 'Purchased from Vendor'] };
    case LogItemType.ClosedPurchasedFromAnotherVendor:
      return { tag: 'badgeAndLabel', value: ['danger', 'Closed', 'Purchased from Another Vendor'] };
    case LogItemType.ClosedOther:
      return { tag: 'badgeAndLabel', value: ['danger', 'Closed', 'Other'] };
    case LogItemType.BuyerInitiatedInterest:
      return { tag: 'label', value: 'Buyer Initiated Interest' };
    case LogItemType.MatchInitiated:
      return { tag: 'label', value: 'Match Initiated' };
    case LogItemType.MatchMeetingHeld:
      return { tag: 'label', value: 'Match Meeting Held' };
    case LogItemType.PurchaseDirectAwardWithNoi:
      return { tag: 'label', value: 'Purchase — Direct Award w/ NOI' };
    case LogItemType.PurchaseDirectAwardWithoutNoi:
      return { tag: 'label', value: 'Purchase — Direct Award w/o NOI' };
    case LogItemType.PurchaseSolicitationBcBid:
      return { tag: 'label', value: 'Purchase — Solicitation (BC Bid)' };
    case LogItemType.PurchaseSolicitationSelectedVendors:
      return { tag: 'label', value: 'Purchase — Solicitation (Selected Vendors)' };
    case LogItemType.GeneralNote:
      return { tag: 'label', value: 'General Note' };
  }
}

export function getLogItemTypeDropdownItems(): Array<Option<LogItemType>> {
  const makeItem = (value: LogItemType) => {
    const copy = logItemTypeToCopy(value);
    switch (copy.tag) {
      case 'badge':
        return { value, label: copy.value[1] };
      case 'badgeAndLabel':
        return { value, label: `${copy.value[1]}: ${copy.value[2]}` };
      case 'label':
        return null;
    }
  };
  return [
    LogItemType.ApplicationSubmitted,
    LogItemType.UnderReview,
    LogItemType.EditsRequired,
    LogItemType.EditsSubmitted,
    LogItemType.Eligible,
    LogItemType.Ineligible,
    LogItemType.UnderProcurement,
    LogItemType.ClosedPurchasedFromVendor,
    LogItemType.ClosedPurchasedFromAnotherVendor,
    LogItemType.ClosedOther,
    LogItemType.BuyerInitiatedInterest,
    LogItemType.MatchInitiated,
    LogItemType.MatchMeetingHeld,
    LogItemType.PurchaseDirectAwardWithNoi,
    LogItemType.PurchaseDirectAwardWithoutNoi,
    LogItemType.PurchaseSolicitationBcBid,
    LogItemType.PurchaseSolicitationSelectedVendors,
    LogItemType.GeneralNote
  ].reduce((acc: Array<Option<LogItemType>>, s) => {
    const item = makeItem(s);
    if (!item) { return acc; }
    return acc.concat([item]);
  }, []);
}

export function getLogItemTypeStatusDropdownItems(): Array<Option<LogItemType>> {
  return getLogItemTypeDropdownItems().filter(({ value }) => logItemTypeIsStatus(value));
}

export async function makeRequestBody(state: IntakeForm.State): Promise<ValidOrInvalid<CreateRequestBody, CreateValidationErrors>> {
  const values = IntakeForm.getValues(state);
  const uploadedFiles = await api.uploadFiles(values.attachments);
  switch (uploadedFiles.tag) {
    case 'valid':
      return valid({
        ...values,
        attachments: uploadedFiles.value
      });
    case 'invalid':
      return invalid({
        attachments: uploadedFiles.value
      });
  }
}
