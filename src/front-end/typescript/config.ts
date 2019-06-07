export const NODE_ENV: 'development' | 'production'  = process.env.NODE_ENV === 'development' ? 'development' : 'production';

export const LIVE_SITE_DOMAIN = 'procurementconcierge.gov.bc.ca';

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'Procurement.Concierge@gov.bc.ca';

export const FALLBACK_USER_NAME = 'No Name Provided';
