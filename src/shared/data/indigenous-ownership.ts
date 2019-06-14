import { OrderedSet } from 'immutable';
import rawData from './indigenous-ownership-raw.json';

const data: OrderedSet<string> = OrderedSet(rawData);
export default data;
