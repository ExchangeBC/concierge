import { OrderedSet } from 'immutable';
import rawData from './number-of-employees-raw.json';

const data: OrderedSet<string> = OrderedSet(rawData);
export default data;
