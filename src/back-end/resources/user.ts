import * as crud from 'back-end/lib/crud';
import { parsePhoneType, parseUserType, PhoneType, UserType } from 'back-end/lib/schemas';
import * as BuyerProfileSchema from 'back-end/schemas/buyer-profile';
import * as ProgramStaffProfileSchema from 'back-end/schemas/program-staff-profile';
import * as UserSchema from 'back-end/schemas/user';
import * as VendorProfileSchema from 'back-end/schemas/vendor-profile';
import bcrypt from 'bcrypt';
import { Set } from 'immutable';
import { get, isArray, isEqual, isObject } from 'lodash';
// import * as mongoose from 'mongoose';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import AVAILABLE_MINISTRIES from 'shared/data/ministries';
import { allValid, getInvalidValue, getValidValue, invalid, valid, ValidOrInvalid } from 'shared/lib/validation';

export type Validation<Value> = ValidOrInvalid<Value, string[]>;

type Profile = BuyerProfileSchema.Data | ProgramStaffProfileSchema.Data | VendorProfileSchema.Data;

interface ValidCreateRequestBody {
  email: string;
  passwordHash: string;
  userType: UserType;
  profile: Profile;
}

interface BuyerProfileValidationErrors {
  firstName: string[];
  lastName: string[];
  positionTitle: string[];
  ministry: string[];
  branch: string[];
  contactAddress: string[];
  contactCity: string[];
  contactProvince: string[];
  contactPostalCode: string[];
  contactCountry: string[];
  contactPhoneNumber: string[];
  contactPhoneCountryCode: string[];
  contactPhoneType: string[];
  industrySectors: string[];
  areasOfInterest: string[];
}

interface VendorProfileValidationErrors {
  name: string[];
}

interface ProgramStaffProfileValidationErrors {
  firstName: string[];
  lastName: string[];
}

type ProfileValidationErrors = BuyerProfileValidationErrors | VendorProfileValidationErrors | ProgramStaffProfileValidationErrors;

type FullProfileValidationErrors = ProfileValidationErrors | string[];

interface CreateValidationErrors {
  email: string[];
  password: string[];
  userType: string[];
  profile: FullProfileValidationErrors;
}

export type CreateRequestBody = ValidOrInvalid<ValidCreateRequestBody, CreateValidationErrors>;

export interface UpdateRequestBody {
  email: string;
}

function getString(obj: any, keyPath: string | string[]): string {
  return String(get(obj, keyPath, ''));
}

function getStringArray(obj: any, keyPath: string | string[]): string[] {
  const value: any[] = get(obj, keyPath, []);
  if (!isArray(value)) { return []; }
  return value.map(v => String(v));
}

// Validate a field only if it is truthy.
function optional<Value, Valid, Invalid>(fn: (v: Value) => ValidOrInvalid<Valid, Invalid>, v: Value, undefinedValue: Value): ValidOrInvalid<Valid | undefined, Invalid> {
  return isEqual(v, undefinedValue) ? valid(undefined) : fn(v);
}

function validateGenericString(value: string, name: string, min = 1, max = 100): Validation<string> {
  if (value.length < min || value.length > max) {
    return invalid([`${name} must be between 1 and 100 characters long.`]);
  } else {
    return valid(value);
  }
}

function validateStringArray(values: string[], availableValues: Set<string>, name: string): Validation<string[]> {
  availableValues = availableValues.map(v => v.toUpperCase());
  values.map(v => v.toUpperCase());
  const errors: string[] = values.reduce((acc, v) => {
    if (!availableValues.includes(v)) {
      acc.push(`"${v}" is not a valid ${name}.`);
    }
    return acc;
  }, [] as string[]);
  if (errors.length) {
    return invalid(errors);
  } else {
    return valid(values);
  }
}

/*function validateObjectId(objectId: string, name: string): Validation<string> {
  if (mongoose.Types.ObjectId.isValid(objectId)) {
    return valid(objectId);
  } else {
    return invalid([ `${name} is an invalid ObjectId.` ]);
  }
}*/

// TODO Ensure a user with the same email does not already exist.
// Make async, use User Model.
function validateEmail(email: string): Validation<string> {
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i)) {
    return invalid([ 'Please enter a valid email.' ]);
  } else {
    return valid(email);
  }
}

async function validatePassword(password: string, hashPassword = true): Promise<Validation<string>> {
  const hasNumber = !!password.match(/[0-9]/);
  const hasLowercaseLetter = !!password.match(/[a-z]/);
  const hasUppercaseLetter = !!password.match(/[A-Z]/);
  const errors: string[] = [];
  if (password.length < 8) { errors.push('Passwords must be at least 8 characters long.'); }
  if (!hasNumber || !hasLowercaseLetter || !hasUppercaseLetter) { errors.push('Passwords must contain at least one number, lowercase letter and uppercase letter.'); }
  if (errors.length) {
    return invalid(errors);
  } else {
    return valid(hashPassword ? await bcrypt.hash(password, 10) : password);
  }
}

function validateUserType(userType: string): Validation<UserType> {
  const parsedUserType = parseUserType(userType);
  if (!parsedUserType) {
    return invalid([ 'Please select a valid User Type; either "buyer", "vendor" or "program_staff".' ]);
  } else {
    return valid(parsedUserType);
  }
}

function validateFirstName(firstName: string): Validation<string> {
  return validateGenericString(firstName, 'First Name');
}

function validateLastName(lastName: string): Validation<string> {
  return validateGenericString(lastName, 'Last Name');
}

function validatePositionTitle(positionTitle: string): Validation<string> {
  return validateGenericString(positionTitle, 'Position Title');
}

function validateMinistry(ministry: string): Validation<string> {
  const result = validateStringArray([ministry], AVAILABLE_MINISTRIES, 'Ministry');
  switch (result.tag) {
    case 'valid':
      return valid(ministry);
    case 'invalid':
      return result;
  }
}

function validateBranch(branch: string): Validation<string> {
  return validateGenericString(branch, 'Branch');
}

function validateAddress(address: string): Validation<string> {
  return validateGenericString(address, 'Street Address');
}

function validateCity(city: string): Validation<string> {
  return validateGenericString(city, 'City');
}

function validateProvince(province: string): Validation<string> {
  return validateGenericString(province, 'Province');
}

function validatePostalCode(postalCode: string): Validation<string> {
  return validateGenericString(postalCode, 'Postal Code');
}

function validateCountry(country: string): Validation<string> {
  return validateGenericString(country, 'Country');
}

function validatePhoneNumber(phoneNumber: string): Validation<string> {
  return validateGenericString(phoneNumber, 'Phone Number');
}

function validatePhoneCountryCode(phoneCountryCode: string): Validation<string> {
  return validateGenericString(phoneCountryCode, 'Phone Country Code');
}

function validatePhoneType(phoneType: string): Validation<PhoneType> {
  const parsedPhoneType = parsePhoneType(phoneType);
  if (!parsedPhoneType) {
    return invalid([ 'Please select a valid Phone Type; either "office" or "cell_phone".' ]);
  } else {
    return valid(parsedPhoneType);
  }
}

function validateIndustrySectors(industrySectors: string[]): Validation<string[]> {
  return validateStringArray(industrySectors, AVAILABLE_INDUSTRY_SECTORS, 'Industry Sector');
}

function validateCategories(categories: string[], name = 'Category'): Validation<string[]> {
  return validateStringArray(categories, AVAILABLE_CATEGORIES, name);
}

async function validateBuyerProfile(profile: object): Promise<ValidOrInvalid<BuyerProfileSchema.Data, BuyerProfileValidationErrors>> {
  const validatedFirstName = optional(validateFirstName, getString(profile, 'firstName'), '');
  const validatedLastName = optional(validateLastName, getString(profile, 'lastName'), '');
  const validatedPositionTitle = optional(validatePositionTitle, getString(profile, 'positionTitle'), '');
  const validatedMinistry = optional(validateMinistry, getString(profile, 'ministry'), '');
  const validatedBranch = optional(validateBranch, getString(profile, 'branch'), '');
  const validatedContactAddress = optional(validateAddress, getString(profile, 'contactAddress'), '');
  const validatedContactCity = optional(validateCity, getString(profile, 'contactCity'), '');
  const validatedContactProvince = optional(validateProvince, getString(profile, 'contactProvince'), '');
  const validatedContactPostalCode = optional(validatePostalCode, getString(profile, 'contactPostalCode'), '');
  const validatedContactCountry = optional(validateCountry, getString(profile, 'country'), '');
  const validatedContactPhoneNumber = optional(validatePhoneNumber, getString(profile, 'contactPhoneNumber'), '');
  const validatedContactPhoneCountryCode = optional(validatePhoneCountryCode, getString(profile, 'contactPhoneCountryCode'), '');
  const validatedContactPhoneType = optional(validatePhoneType, getString(profile, 'contactPhoneType'), '');
  const validatedIndustrySectors = optional(validateIndustrySectors, getStringArray(profile, 'industrySectors'), []);
  const validatedAreasOfInterest = optional(v => validateCategories(v, 'Areas of Interest'), getStringArray(profile, 'areasOfInterest'), []);
  if (allValid([validatedFirstName, validatedLastName, validatedPositionTitle, validatedMinistry, validatedBranch, validatedContactAddress, validatedContactCity, validatedContactProvince, validatedContactPostalCode, validatedContactCountry, validatedContactPhoneNumber, validatedContactPhoneCountryCode, validatedContactPhoneType, validatedIndustrySectors, validatedAreasOfInterest])) {
    return valid({
      firstName: getValidValue(validatedFirstName, undefined),
      lastName: getValidValue(validatedLastName, undefined),
      positionTitle: getValidValue(validatedPositionTitle, undefined),
      ministry: getValidValue(validatedMinistry, undefined),
      branch: getValidValue(validatedBranch, undefined),
      contactAddress: getValidValue(validatedContactAddress, undefined),
      contactCity: getValidValue(validatedContactCity, undefined),
      contactProvince: getValidValue(validatedContactProvince, undefined),
      contactPostalCode: getValidValue(validatedContactPostalCode, undefined),
      contactCountry: getValidValue(validatedContactCountry, undefined),
      contactPhoneNumber: getValidValue(validatedContactPhoneNumber, undefined),
      contactPhoneCountryCode: getValidValue(validatedContactPhoneCountryCode, undefined),
      contactPhoneType: getValidValue(validatedContactPhoneType, undefined),
      industrySectors: getValidValue(validatedIndustrySectors, undefined),
      areasOfInterest: getValidValue(validatedAreasOfInterest, undefined),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } else {
    return invalid({
      firstName: getInvalidValue(validatedFirstName, [] as string[]),
      lastName: getInvalidValue(validatedLastName, [] as string[]),
      positionTitle: getInvalidValue(validatedPositionTitle, [] as string[]),
      ministry: getInvalidValue(validatedMinistry, [] as string[]),
      branch: getInvalidValue(validatedBranch, [] as string[]),
      contactAddress: getInvalidValue(validatedContactAddress, [] as string[]),
      contactCity: getInvalidValue(validatedContactCity, [] as string[]),
      contactProvince: getInvalidValue(validatedContactProvince, [] as string[]),
      contactPostalCode: getInvalidValue(validatedContactPostalCode, [] as string[]),
      contactCountry: getInvalidValue(validatedContactCountry, [] as string[]),
      contactPhoneNumber: getInvalidValue(validatedContactPhoneNumber, [] as string[]),
      contactPhoneCountryCode: getInvalidValue(validatedContactPhoneCountryCode, [] as string[]),
      contactPhoneType: getInvalidValue(validatedContactPhoneType, [] as string[]),
      industrySectors: getInvalidValue(validatedIndustrySectors, [] as string[]),
      areasOfInterest: getInvalidValue(validatedAreasOfInterest, [] as string[])
    });
  }
}

function validateVendorProfile(profile: object): ValidOrInvalid<VendorProfileSchema.Data, VendorProfileValidationErrors> {
  return invalid({
    name: []
  });
}

function validateProgramStaffProfile(profile: object): ValidOrInvalid<ProgramStaffProfileSchema.Data, ProgramStaffProfileValidationErrors> {
  if (true) {
    return invalid({
      firstName: [],
      lastName: []
    });
  } else {
    return valid({
      firstName: 'foo',
      lastName: 'bar'
    });
  }
}

async function validateProfile(profile: object, validatedUserType: Validation<UserType>): Promise<ValidOrInvalid<Profile, FullProfileValidationErrors>> {
  if (validatedUserType.tag === 'invalid') {
    return invalid(['Cannot validate a user profile without a valid user type.']);
  }
  let validatedProfile: ValidOrInvalid<Profile, ProfileValidationErrors> | undefined;
  switch (validatedUserType.value) {
    case UserType.Buyer:
      validatedProfile = await validateBuyerProfile(profile);
      break;
    case UserType.Vendor:
      validatedProfile = validateVendorProfile(profile);
      break;
    case UserType.ProgramStaff:
      validatedProfile = validateProgramStaffProfile(profile);
      break;
  }
  if (!validatedProfile) {
    return invalid(['Unable to validate profile']);
  }
  switch (validatedProfile.tag) {
    case 'invalid':
      return invalid(validatedProfile.value);
    case 'valid':
      return valid(validatedProfile.value);
  }
}

async function validateCreateRequestBody(email: string, password: string, userType: string, profile: object): Promise<CreateRequestBody> {
  const validatedEmail = validateEmail(email);
  const validatedPassword = await validatePassword(password);
  const validatedUserType = validateUserType(userType);
  const validatedProfile = await validateProfile(profile, validatedUserType);
  if (validatedEmail.tag === 'valid' && validatedPassword.tag === 'valid' && validatedUserType.tag === 'valid' && validatedProfile.tag === 'valid') {
    return valid({
      email: validatedEmail.value,
      passwordHash: validatedPassword.value,
      userType: validatedUserType.value,
      profile: validatedProfile.value
    });
  } else {
    return invalid({
      email: validatedEmail.tag === 'invalid' ? validatedEmail.value : [],
      password: validatedPassword.tag === 'invalid' ? validatedPassword.value : [],
      userType: validatedUserType.tag === 'invalid' ? validatedUserType.value : [],
      profile: validatedProfile.tag === 'invalid' ? validatedProfile.value : []
    }) as CreateRequestBody;
  }
}

export type Resource = crud.Resource<UserSchema.Document, CreateRequestBody, UpdateRequestBody, CreateValidationErrors, null, null, null, null>;

const resource: Resource = {

  routeNamespace: 'users',
  model: UserSchema.NAME,
  extraModels: Set([
    BuyerProfileSchema.NAME,
    VendorProfileSchema.NAME,
    ProgramStaffProfileSchema.NAME
  ]),

  create: {

    async transformRequestBody(body, logger) {
      const email = body.email ? String(body.email) : '';
      const password = body.password ? String(body.password) : '';
      const userType = body.userType ? String(body.userType) : '';
      const profile = isObject(body.profile) ? body.profile : {};
      logger.debug('create user', { email, password, userType, profile });
      return await validateCreateRequestBody(email, password, userType, profile);
    },

    run(Model, ExtraModels) {
      return async request => {
        switch (request.body.tag) {
          case 'invalid':
            return {
              code: 400,
              headers: {},
              body: request.body.value
            };
          case 'valid':
            const body = request.body.value;
            request.logger.debug('body', body);
            // Create the profile.
            let ProfileModel;
            switch (body.userType) {
              case UserType.Buyer:
                ProfileModel = ExtraModels.get(BuyerProfileSchema.NAME);
                break;
              case UserType.Vendor:
                ProfileModel = ExtraModels.get(VendorProfileSchema.NAME);
                break;
              case UserType.ProgramStaff:
                ProfileModel = ExtraModels.get(ProgramStaffProfileSchema.NAME);
                break;
            }
            if (!ProfileModel) {
              throw new Error('Unable to create user profile, undefined profile Model');
            }
            const profile = new ProfileModel(body.profile);
            await profile.save();
            // Create the user.
            const now = Date.now();
            const user = new Model({
              email: body.email,
              passwordHash: body.passwordHash,
              userType: body.userType,
              profile: profile._id,
              createdAt: now,
              updatedAt: now
            });
            await user.save();
            // Respond with success.
            return {
              code: 201,
              headers: {},
              body: user
            };
        }
      };
    }

  }

};

export default resource;
