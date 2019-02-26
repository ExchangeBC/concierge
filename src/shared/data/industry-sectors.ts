import { Set } from 'immutable';
import industrySectors from './industry-sectors-raw.json';

const data: Set<string> = Set(industrySectors);
export default data;
