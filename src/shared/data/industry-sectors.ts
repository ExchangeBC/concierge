import { Set } from 'immutable';
import industrySectors from './industry-sectors.json';

const data: Set<string> = Set(industrySectors);
export default data;
