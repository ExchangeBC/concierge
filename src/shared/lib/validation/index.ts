import { ADT } from '../types';

export type ValidOrInvalid<Valid, Invalid> = ADT<'valid', Valid> | ADT<'invalid', Invalid>;

export function valid<Valid>(value: Valid): ValidOrInvalid<Valid, any> {
  return {
    tag: 'valid',
    value
  };
}

export function invalid<Invalid>(value: Invalid): ValidOrInvalid<any, Invalid> {
  return {
    tag: 'invalid',
    value
  };
}

export function allValid(results: Array<ValidOrInvalid<any, any>>): boolean {
  for (const result of results) {
    switch (result.tag) {
      case 'valid':
        continue;
      case 'invalid':
        return false;
    }
  }
  return true;
}

export function allInvalid(results: Array<ValidOrInvalid<any, any>>): boolean {
  for (const result of results) {
    switch (result.tag) {
      case 'valid':
        return false;
      case 'invalid':
        continue;
    }
  }
  return true;
}

export function getValidValue<Valid, Fallback>(result: ValidOrInvalid<Valid, any>, fallback: Fallback): Valid | Fallback {
  switch (result.tag) {
    case 'valid':
      return result.value;
    case 'invalid':
      return fallback;
  }
}

export function getInvalidValue<Invalid, Fallback>(result: ValidOrInvalid<any, Invalid>, fallback: Fallback): Invalid | Fallback {
  switch (result.tag) {
    case 'valid':
      return fallback;
    case 'invalid':
      return result.value;
  }
}
