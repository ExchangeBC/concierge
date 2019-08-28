import { BootstrapColor } from 'front-end/lib/types';
import { LogItemType } from 'shared/lib/resources/vendor-idea/log-item';
import { ADT } from 'shared/lib/types';

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
