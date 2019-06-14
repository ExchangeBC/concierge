import { Set } from 'immutable';
import rawData from './categories-raw.json';

const data: Set<string> = Set(rawData).sort((a, b) => a.localeCompare(b));
export default data;
