import { getString } from 'shared/lib';
import { InnovationDefinition, VersionContact, VersionContactValidationErrors, VersionDescription, VersionDescriptionValidationErrors, VersionEligibility, VersionEligibilityValidationErrors } from 'shared/lib/resources/vendor-idea';
import { allValid, ArrayValidation, getInvalidValue, invalid, optional, valid, validateArray, validateCategories, validateEmail, validateGenericString, validateIndustrySectors, validatePhoneNumber, Validation, ValidOrInvalid } from 'shared/lib/validators';
import * as validators from 'shared/lib/validators';

export function validateDescriptionTitle(raw: string): Validation<string> {
  return validateGenericString(raw, 'Title', 1, 75);
}

export function validateDescriptionSummary(raw: string): Validation<string> {
  return validateGenericString(raw, 'Brief Description', 1, 2000);
}

export function validateDescriptionIndustrySectors(raw: string[]): ArrayValidation<string> {
  return validateIndustrySectors(raw);
}

export function validateDescriptionCategories(raw: string[]): ArrayValidation<string> {
  return validateCategories(raw, 'Area of Interest', 'an');
}

export function validateDescription(raw: VersionDescription): ValidOrInvalid<VersionDescription, VersionDescriptionValidationErrors> {
  const validatedTitle = validateDescriptionTitle(raw.title);
  const validatedSummary = validateDescriptionSummary(raw.summary);
  const validatedIndustrySectors = validateDescriptionIndustrySectors(raw.industrySectors);
  const validatedCategories = validateDescriptionCategories(raw.categories);
  const validatedNumIndustrySectors = !raw.industrySectors.length ? invalid(['Please select at least one Industry Sector.']) : valid(null);
  const validatedNumCategories = !raw.categories.length ? invalid(['Please select at least one Industry Sector.']) : valid(null);
  if (allValid([validatedTitle, validatedSummary, validatedIndustrySectors, validatedCategories, validatedNumIndustrySectors, validatedNumCategories])) {
    return valid({
      title: validatedTitle.value,
      summary: validatedSummary.value,
      industrySectors: validatedIndustrySectors.value,
      categories: validatedCategories.value
    } as VersionDescription);
  } else {
    return invalid({
      title: getInvalidValue(validatedTitle, undefined),
      summary: getInvalidValue(validatedSummary, undefined),
      industrySectors: getInvalidValue(validatedIndustrySectors, undefined),
      categories: getInvalidValue(validatedCategories, undefined),
      numIndustrySectors: getInvalidValue(validatedNumIndustrySectors, undefined),
      numCategories: getInvalidValue(validatedNumCategories, undefined)
    });
  }
}

export function validateEligibilityExistingPurchase(raw: string | undefined): Validation<string | undefined> {
  return optional(
    v => validateGenericString(v, 'Existing Purchase Explanation', 1, 5000),
    raw
  );
}

export function validateEligibilityProductOffering(raw: string): Validation<string> {
  return validateGenericString(raw, 'Product Offering Explanation', 1, 5000);
}

export function validateEligibilityInnovationDefinitionOtherText(raw: string): Validation<string> {
  return validateGenericString(raw, 'Other Description', 1, 500);
}

export function validateEligibilityInnovationDefinition(raw: any): Validation<InnovationDefinition> {
  const tag = getString(raw, 'tag');
  const value = getString(raw, 'value');
  switch (tag) {
    case 'newTechnology':
      return valid({ tag: 'newTechnology', value: undefined });
    case 'existingTechnologyNotPurchased':
      return valid({ tag: 'existingTechnologyNotPurchased', value: undefined });
    case 'newApplicationOfExistingTechnology':
      return valid({ tag: 'newApplicationOfExistingTechnology', value: undefined });
    case 'improvementToExistingTechnology':
      return valid({ tag: 'improvementToExistingTechnology', value: undefined });
    case 'newGovernmentNeeds':
      return valid({ tag: 'newGovernmentNeeds', value: undefined });
    case 'other':
      const validatedValue = validateEligibilityInnovationDefinitionOtherText(value);
      return validators.mapValid(validatedValue, v => ({ tag: 'other', value: v }));
  }
  return invalid([`${JSON.stringify(raw)} is not a valid Innovation Definition.`]);
}

export function validateEligibilityInnovationDefinitions(innovationDefinitions: any[]): ArrayValidation<InnovationDefinition> {
  return validateArray(innovationDefinitions, validateEligibilityInnovationDefinition);
}

export function validateEligibility(raw: VersionEligibility): ValidOrInvalid<VersionEligibility, VersionEligibilityValidationErrors> {
  const validatedExistingPurchase = validateEligibilityExistingPurchase(raw.existingPurchase);
  const validatedProductOffering = validateEligibilityProductOffering(raw.productOffering);
  const validatedInnovationDefinitions = validateEligibilityInnovationDefinitions(raw.innovationDefinitions);
  const enoughNumInnovationDefinitions = validatedInnovationDefinitions.tag === 'valid' && !!validatedInnovationDefinitions.value.length;
  if (enoughNumInnovationDefinitions && allValid([validatedExistingPurchase, validatedProductOffering, validatedInnovationDefinitions])) {
    return valid({
      existingPurchase: validatedExistingPurchase.value,
      productOffering: validatedProductOffering.value,
      innovationDefinitions: validatedInnovationDefinitions.value
    } as VersionEligibility);
  } else {
    return invalid({
      existingPurchase: getInvalidValue(validatedExistingPurchase, undefined),
      productOffering: getInvalidValue(validatedProductOffering, undefined),
      innovationDefinitions: getInvalidValue(validatedInnovationDefinitions, undefined),
      numInnovationDefinitions: enoughNumInnovationDefinitions ? undefined : ['Please select at least one innovation definition.']
    });
  }
}

export function validateContactName(raw: string): Validation<string> {
  return validators.validateContactName(raw);
}

export function validateContactEmail(raw: string): Validation<string> {
  return validateEmail(raw);
}

export function validateContactPhoneNumber(raw: string | undefined): Validation<string | undefined> {
  return optional(v => validatePhoneNumber(v), raw);
}

export function validateContact(raw: VersionContact): ValidOrInvalid<VersionContact, VersionContactValidationErrors> {
  const validatedName = validateContactName(raw.name);
  const validatedEmail = validateContactEmail(raw.email);
  const validatedPhoneNumber = validateContactPhoneNumber(raw.phoneNumber);
  if (allValid([validatedName, validatedEmail, validatedPhoneNumber])) {
    return valid({
      name: validatedName.value,
      email: validatedEmail.value,
      phoneNumber: validatedPhoneNumber.value
    } as VersionContact);
  } else {
    return invalid({
      name: getInvalidValue(validatedName, undefined),
      email: getInvalidValue(validatedEmail, undefined),
      phoneNumber: getInvalidValue(validatedPhoneNumber, undefined)
    });
  }
}
