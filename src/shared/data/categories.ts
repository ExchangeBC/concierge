import { Set } from 'immutable';
import categories from './categories-raw.json';

const data: Set<string> = Set(categories).sort((a, b) => a.localeCompare(b));
export default data;
