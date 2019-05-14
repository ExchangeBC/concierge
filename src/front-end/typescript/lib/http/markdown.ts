import { prefixRequest } from 'front-end/lib/http';
import { HttpMethod } from 'shared/lib/types';

const request = prefixRequest('/');

export async function getDocument(name: string): Promise<string> {
  try {
    name = name.replace(/(\.md)?$/, '.md');
    const response = await request(HttpMethod.Get, `/markdown/${name}`);
    switch (response.status) {
      case 200:
        return response.data;
      default:
        return '';
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return '';
  }
}
