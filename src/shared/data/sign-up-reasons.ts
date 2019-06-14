import { OrderedSet } from 'immutable';
import rawData from './sign-up-reasons-raw.json';

const data: OrderedSet<string> = OrderedSet(rawData);
export default data;
