import { AxiosResponse, default as axios } from 'axios';
import { HttpMethod } from 'shared/lib/types';

export type RequestFunction = (method: HttpMethod, path: string, data?: object) => Promise<AxiosResponse<any>>;

export const request: RequestFunction = async (method, url, data) => {
  if (method === HttpMethod.Any) {
    throw new Error('HttpMethod.Any is an invalid HTTP request method.');
  }
  return await axios({
    method,
    url,
    data,
    validateStatus() {
      return true;
    }
  });
}

export function prefixRequest(prefix: string): RequestFunction {
  const cleanSlashes = (v: string): string => v.replace(/^\/*/, '/').replace(/\/*$/, '');
  return (method, path, data) => {
    return request(method, `${cleanSlashes(prefix)}${cleanSlashes(path)}`, data);
  };
}
