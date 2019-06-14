import { OrderedSet } from 'immutable';
import rawData from './head-office-locations-raw.json';

const data: OrderedSet<string> = OrderedSet(rawData);
export default data;
