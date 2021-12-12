import { isProgramStaff } from 'back-end/lib/permissions';
import { makeResource } from 'back-end/lib/resources/request-for-information';

export const resource = makeResource('requestForInformationPreviews', (Models) => Models.RfiPreview, isProgramStaff);

export default resource;
