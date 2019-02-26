import { Set } from 'immutable';
import ministries from './ministries-raw.json';

const data: Set<string> = Set(ministries);
export default data;
