import { PublicUser } from 'shared/lib/resources/user';

export enum LogItemType {
  // Statuses
  ApplicationSubmitted = 'APPLICATION_SUBMITTED',
  UnderReview = 'UNDER_REVIEW',
  EditsRequired = 'EDITS_REQUIRED',
  EditsSubmitted = 'EDITS_SUBMITTED',
  Eligible = 'ELIGIBLE',
  Ineligible = 'INELIGIBLE',
  UnderProcurement = 'UNDER_PROCUREMENT',
  ClosedPurchasedFromVendor = 'CLOSED_PURCHASED_FROM_VENDOR',
  ClosedPurchasedFromAnotherVendor = 'CLOSED_PURCHASED_FROM_ANOTHER_VENDOR',
  ClosedOther = 'CLOSED_OTHER',
  // Events
  BuyerInitiatedInterest = 'BUYER_INITIATED_INTEREST',
  MatchInitiated = 'MATCH_INITIATED',
  MatchMeetingHeld = 'MATCH_MEETING_HELD',
  PurchaseDirectAwardWithNoi = 'PURCHASE_DIRECT_AWARD_WITH_NOI',
  PurchaseDirectAwardWithoutNoi = 'PURCHASE_DIRECT_AWARD_WITHOUT_NOI',
  PurchaseSolicitationBcBid = 'PURCHASE_SOLICITATION_BC_BID',
  PurchaseSolicitationSelectedVendors = 'PURCHASE_SOLICITATION_SELECTED_VENDORS',
  // Other
  GeneralNote = 'GENERAL_NOTE'
}

export function parseLogItemType(raw: string): LogItemType | null {
  switch (raw) {
    case 'APPLICATION_SUBMITTED':
      return LogItemType.ApplicationSubmitted;
    case 'UNDER_REVIEW':
      return LogItemType.UnderReview;
    case 'EDITS_REQUIRED':
      return LogItemType.EditsRequired;
    case 'EDITS_SUBMITTED':
      return LogItemType.EditsSubmitted;
    case 'ELIGIBLE':
      return LogItemType.Eligible;
    case 'INELIGIBLE':
      return LogItemType.Ineligible;
    case 'UNDER_PROCUREMENT':
      return LogItemType.UnderProcurement;
    case 'CLOSED_PURCHASED_FROM_VENDOR':
      return LogItemType.ClosedPurchasedFromVendor;
    case 'CLOSED_PURCHASED_FROM_ANOTHER_VENDOR':
      return LogItemType.ClosedPurchasedFromAnotherVendor;
    case 'CLOSED_OTHER':
      return LogItemType.ClosedOther;
    case 'BUYER_INITIATED_INTEREST':
      return LogItemType.BuyerInitiatedInterest;
    case 'MATCH_INITIATED':
      return LogItemType.MatchInitiated;
    case 'MATCH_MEETING_HELD':
      return LogItemType.MatchMeetingHeld;
    case 'PURCHASE_DIRECT_AWARD_WITH_NOI':
      return LogItemType.PurchaseDirectAwardWithNoi;
    case 'PURCHASE_DIRECT_AWARD_WITHOUT_NOI':
      return LogItemType.PurchaseDirectAwardWithoutNoi;
    case 'PURCHASE_SOLICITATION_BC_BID':
      return LogItemType.PurchaseSolicitationBcBid;
    case 'PURCHASE_SOLICITATION_SELECTED_VENDORS':
      return LogItemType.PurchaseSolicitationSelectedVendors;
    case 'GENERAL_NOTE':
      return LogItemType.GeneralNote;
    default:
      return null;
  }
}

export type LogItemTypeStatus
  = LogItemType.ApplicationSubmitted
  | LogItemType.UnderReview
  | LogItemType.EditsRequired
  | LogItemType.EditsSubmitted
  | LogItemType.Eligible
  | LogItemType.Ineligible
  | LogItemType.UnderProcurement
  | LogItemType.ClosedPurchasedFromVendor
  | LogItemType.ClosedPurchasedFromAnotherVendor
  | LogItemType.ClosedOther;

export type LogItemTypeEvent
  = LogItemType.BuyerInitiatedInterest
  | LogItemType.MatchInitiated
  | LogItemType.MatchMeetingHeld
  | LogItemType.PurchaseDirectAwardWithNoi
  | LogItemType.PurchaseDirectAwardWithoutNoi
  | LogItemType.PurchaseSolicitationBcBid
  | LogItemType.PurchaseSolicitationSelectedVendors;

export type LogItemTypeOther
  = LogItemType.GeneralNote;

export interface PublicLogItem {
  createdAt: Date;
  createdBy?: PublicUser;
  type: LogItemType;
  note?: string;
}

interface BasicLogItem<Type = LogItemType> {
  createdAt: Date;
  type: Type;
}

export function logItemTypeIsStatus(item: LogItemType): item is LogItemTypeStatus {
  return item === LogItemType.ApplicationSubmitted
      || item === LogItemType.UnderReview
      || item === LogItemType.EditsRequired
      || item === LogItemType.EditsSubmitted
      || item === LogItemType.Eligible
      || item === LogItemType.Ineligible
      || item === LogItemType.UnderProcurement
      || item === LogItemType.ClosedPurchasedFromVendor
      || item === LogItemType.ClosedPurchasedFromAnotherVendor
      || item === LogItemType.ClosedOther;
}

export function logItemTypeIsEvent(item: LogItemType): item is LogItemTypeEvent {
  return item === LogItemType.BuyerInitiatedInterest
      || item === LogItemType.MatchInitiated
      || item === LogItemType.MatchMeetingHeld
      || item === LogItemType.PurchaseDirectAwardWithNoi
      || item === LogItemType.PurchaseDirectAwardWithoutNoi
      || item === LogItemType.PurchaseSolicitationBcBid
      || item === LogItemType.PurchaseSolicitationSelectedVendors;
}

export function logItemTypeIsSystem(item: LogItemType): boolean {
  return item === LogItemType.ApplicationSubmitted
      || item === LogItemType.EditsSubmitted;
}

export function logItemTypeIsOther(item: LogItemType): item is LogItemTypeOther {
  return item === LogItemType.GeneralNote;
}

export function getLatestStatus(logItems: BasicLogItem[]): LogItemTypeStatus | null {
  let foundItem: BasicLogItem<LogItemTypeStatus> | null = null;
  for (const item of logItems) {
    const isStatus = logItemTypeIsStatus(item.type);
    let isMatch = !foundItem && isStatus;
    isMatch = isMatch || (!!foundItem && isStatus && item.createdAt.getTime() > foundItem.createdAt.getTime());
    if (isMatch) {
      foundItem = item as BasicLogItem<LogItemTypeStatus>;
    }
  }
  return foundItem && foundItem.type;
}

export interface CreateRequestBody {
  vendorIdeaId: string;
  type: string;
  note?: string;
}

export interface CreateValidationErrors {
  permissions?: string[];
  vendorIdeaId?: string[];
  type?: string[];
  note?: string[];
}
