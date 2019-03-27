export interface PublicDiscoveryDayResponse {
  createdAt: Date;
  // TODO pass some vendor profile information here when required.
  vendor: string;
}

export interface CreateValidationErrors {
  permissions?: string[];
  contentType?: string[];
  rfiId?: string[];
  acceptedTermsAt?: string[];
  vendor?: string[];
}
