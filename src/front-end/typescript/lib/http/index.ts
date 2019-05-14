import { AxiosResponse, default as axios } from 'axios';
import { HttpMethod } from 'shared/lib/types';

export type RequestFunction = (method: HttpMethod, path: string, data?: object) => Promise<AxiosResponse<any>>;

export const request: RequestFunction = (method, url, data) => {
  return axios({
    method,
    url,
    data,
    validateStatus(code) {
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
