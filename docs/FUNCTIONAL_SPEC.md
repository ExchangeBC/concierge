# Functional Test Specification

This document details the expected functionality of the Procurement Concierge Program's web application. It should be updated regularly to reflect new features and changes to existing features. This document can also serve as a Quality Assurance testing plan.

## Table of Contents

<!-- toc -->

- [Contribution Guidelines](#contribution-guidelines)
  * [Specification Definitions](#specification-definitions)
    + [Specification Structure](#specification-structure)
  * [Feature Definitions](#feature-definitions)
    + [Feature Definition Structure](#feature-definition-structure)
    + [Feature Definition Example 1](#feature-definition-example-1)
    + [Feature Definition Example 2](#feature-definition-example-2)
    + [Tips for Writing Feature Definitions](#tips-for-writing-feature-definitions)
- [Specifications](#specifications)
  * [User Management](#user-management)
    + [Program Staff](#program-staff)
    + [Buyers](#buyers)
    + [Vendors](#vendors)
    + [Anonymous Users](#anonymous-users)
      - [Sign In](#sign-in)
      - [Sign Up](#sign-up)
      - [Forgot/Reset Password](#forgotreset-password)
      - [Change Password](#change-password)
    + [All Users](#all-users)
      - [Terms & Conditions](#terms--conditions)
  * [Requests for Information](#requests-for-information)
    + [Program Staff](#program-staff-1)
    + [Buyers](#buyers-1)
    + [Vendors](#vendors-1)
    + [Anonymous Users](#anonymous-users-1)
    + [All Users](#all-users-1)
  * [Requests for Information Responses](#requests-for-information-responses)
    + [Program Staff](#program-staff-2)
    + [Buyers](#buyers-2)
    + [Vendors](#vendors-2)
    + [Anonymous Users](#anonymous-users-2)
    + [All Users](#all-users-2)
  * [Discovery Day Sessions](#discovery-day-sessions)
    + [Program Staff](#program-staff-3)
    + [Buyers](#buyers-3)
    + [Vendors](#vendors-3)
    + [Anonymous Users](#anonymous-users-3)
    + [All Users](#all-users-3)
  * [Vendor-Initiated Ideas](#vendor-initiated-ideas)
    + [Program Staff](#program-staff-4)
    + [Buyers](#buyers-4)
    + [Vendors](#vendors-4)
    + [Anonymous Users](#anonymous-users-4)
    + [All Users](#all-users-4)
  * [Static Pages](#static-pages)
    + [Program Staff](#program-staff-5)
    + [Buyers](#buyers-5)
    + [Vendors](#vendors-5)
    + [Anonymous Users](#anonymous-users-5)
    + [All Users](#all-users-5)
  * [Feedback](#feedback)
    + [Program Staff](#program-staff-6)
    + [Buyers](#buyers-6)
    + [Vendors](#vendors-6)
    + [Anonymous Users](#anonymous-users-6)
    + [All Users](#all-users-6)

<!-- tocstop -->

## Contribution Guidelines

This section describes the structure of this document, and how to add to, or modify, it.
This document is written in Markdown, and is stored in the web app's GitHub repository to ensure
its version history is tracked with Git.

### Specification Definitions

All functional specifications are listed under the [Specifications](#specifications) heading.
Each specification describes a subset of the web app's features, typically limited to a specific domain.
For example, a specification may describe all features related to "Requests for Information".

Each specification also lists features grouped by each of the web app's user personas.
The user persona groupings are:

- Program Staff
- Public Sector Buyers
- Vendors
- Anonymous Users (users that have not signed in)
- All Users

The following snippet describes the structure of a specification, and can be used as a template when
adding new specifications to this document.

#### Specification Structure

```markdown
### [Specification Name, e.g. "Requests for Information"]

#### Program Staff

[List of Features]

#### Buyers

[List of Features]

#### Vendors

[List of Features]

#### Anonymous Users

[List of Features]

#### All Users

[List of Features]
```

### Feature Definitions

Each feature defined under each user persona should be structured using the following syntax (similar to Cucumber's BDD language, [Gherkin](https://cucumber.io/docs/gherkin/reference/)):

#### Feature Definition Structure

```markdown
Given [PREMISE]  
[And [ADDITIONAL_PREMISE]]  
When [ACTION]  
[And [ADDITIONAL_ACTION]]  
Then [OUTCOME]  
[And [ADDITIONAL_OUTCOME]].
```

Note that the "And" clauses are optional, and each line in a feature definition ends with two blank spaces, which is how new lines are authored in Markdown.

The following snippets provide examples of how actual feature definitions should be authored.

#### Feature Definition Example 1

```markdown
Given the Program Staff has accepted the terms and conditions  
When the Program Staff clicks a link to a User's profile  
Then the Program Staff is shown the User's profile.
```

#### Feature Definition Example 2

```markdown
Given the Program Staff has accepted the terms and conditions  
And the Program Staff is viewing a Buyer profile  
When the Program Staff changes the Buyer's verification status using a dropdown  
Then the Buyer's verification status is changed to the Program Staff's selection.
```

#### Tips for Writing Feature Definitions

- Each feature definition should explicitly define its premises. For example, note how "Feature Definition Example 2" above does not implicitly rely on the premise that a Program Staff has accepted the terms and conditions from "Feature Definition Example 1" to view a Buyer's profile. In other words, a feature definition should not rely on premises from other definitions — they should be as comprehensive as possible.
- Always capitalise user personas, and refer to them explicitly. For example, "Given the **P**rogram **S**taff...". i.e. Never refer to users with pronouns (e.g. "they"). If you need to refer to a generic user, simply refer to them as "User."
- Each clause in a feature definition should be separated by a new line (two blank spaces at the end of each line in Markdown).
- Multiple features should be separated by a paragraph (a full blank line between feature definitions in Markdown).
- Other than capitalisation, feature definitions (generally) do not require punctuation, except for a full stop at the end of the definition.

## Specifications

### User Management

#### Program Staff

##### Sign Up

###### Scenario: Program Staff wants to create a Program Staff account  
Given the Program Staff is viewing the users listing page  
When the Program Staff clicks "Create a Program Staff Account"  
Then the Program Staff is directed to the sign up: step 1 page for Program Staff.

###### Scenario: Program Staff supplies valid email address and password (and password confirmation) when creating a Program Staff account  
Given the Program Staff is viewing the sign up: step 1 page for Program Staff  
When the Program Staff enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the Program Staff is directed to the sign up: step 2 page for Program Staff.

###### Scenario: Program Staff supplies email address already associated with an account when creating a Program Staff account
Given the Program Staff is viewing the sign up: step 1 page for Program Staff  
And the new Program Staff has an active account  
When the Program Staff enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the Program Staff is directed to the sign up: step 2 page for Program Staff.

###### Scenario: Program Staff supplies email address already associated with an account and has completed the registration process for a Program Staff account
Given the Program Staff is viewing the sign up: step 2 page for Program Staff  
And the new Program Staff has an active account  
When the Program Staff clicks "Create Account"  
Then the Program Staff is redirected to the sign up: step 1 page for Program Staff  
And the Program Staff is presented with an error message.

###### Scenario: Program Staff supplies an invalid email address when creating a Program Staff account  
Given the Program Staff is viewing the sign up: step 1 page for Program Staff  
When the Program Staff enters an invalid email address and password (and password confirmation) correctly  
Then the Program Staff is presented with an error message, "Please enter a valid email."  

###### Scenario: Program Staff supplies password confirmation incorrectly when creating a Program Staff account  
Given the Program Staff is viewing the sign up: step 1 page for Program Staff  
When the Program Staff enters a valid email address and password but re-enter the password confirmation incorrectly  
Then the Program Staff is presented with the error message, "Password confirmation doesn’t match original password."  

###### Scenario: Program Staff completes registration process for creating a Program Staff account  
Given the Program Staff is viewing the sign up: step 2 page for Program Staff  
And the new Program Staff does not already have an account associated with the email address   
When the Program Staff supplies all required information  
And clicks "Create Account"  
Then the Program Staff is directed to the user listing page  
And the new Program Staff will receive  
And the new Program Staff is sent an email to confirm that the Program Staff’s account has been created.  

##### Managing User Profiles

###### Scenario: Program Staff wants to view a list of all system users  
Given the Program Staff is signed in    
When the Program Staff clicks "Users" in the main navigation bar  
Then the Program Staff is directed to the user listing page.

###### Scenario: Program Staff wants to filter the list of all system users  
Given the Program Staff is signed in  
And is viewing the user listing page  
When the Program Staff selects a filter using an available dropdown  
Then the user listing table data is filtered accordingly.

###### Scenario: Program Staff wants to search the list of all system users  
Given the Program Staff is signed in  
And is viewing the user listing page  
When the Program Staff enters at least two characters into the available search bar  
Then the user listing table data is filtered accordingly.
 
###### Scenario: Program Staff wants to view another user's profile and has accepted the terms and conditions  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the user listing page  
When the Program Staff clicks the user's name to view the user's profile  
Then the Program Staff is directed to the appropriate user's profile page.

###### Scenario: Program Staff wants to view another user's profile and has not accepted the terms and conditions  

Given the Program Staff is signed in  
And has not accepted the terms and conditions
And is viewing the user listing page  
When the Program Staff clicks the user's name to view the user's profile  
Then the Program Staff is presented with an alert to review the terms and conditions.

###### Scenario: Program Staff wants to update a Public Sector Buyer's account status  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing a Buyer's user profile  
When the Program Staff changes the Buyer's account status using the available dropdown  
Then the Buyer's account status is changed to the Program Staff's selection  
And the Buyer is sent an email to notify of the account status change.

###### Scenario: Program Staff wants to initiate the deactivation of another Program Staff's account  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing a Program Staff's user profile  
When the Program Staff clicks "Deactivate Account"  
Then the Program Staff is presented with an alert to confirm the deactivation of a Program Staff's account.

###### Scenario: Program Staff wants to confirm the deactivation of another Program Staff's account  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm the deactivation of a Program Staff's account  
When the Program Staff clicks "Yes, deactivate this account"  
Then the other Program Staff's account is deactivated  
And the other Program Staff is sent an email notification  
And the Program Staff is directed to the user listing page.

###### Scenario: Program Staff wants to cancel the deactivation of another Program Staff's account  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm the deactivation of a Program Staff's account  
When the Program Staff clicks "Cancel"  
Then the alert closes  
And the Program Staff is directed back to the other Program Staff's user profile.

#### Buyers

##### User Profile

###### Scenario: Buyer wants to add an Industry Sector when editing the Buyer’s user profile  
Given the Buyer is signed in  
And the Buyer is viewing the Buyer’s user profile  
And the Buyer’s user profile is open for editing by the Buyer  
When the Buyer clicks “Add” to add an Industry Sector  
Then an additional Industry Sector dropdown field will appear.

###### Scenario: Buyer wants to add an Area of Interest when editing the Buyer’s user profile  
Given the Buyer is signed in  
And the Buyer is viewing the Buyer’s user profile  
And the Buyer’s user profile is open for editing by the Buyer  
When the Buyer clicks “Add” to add an Area of Interest    
Then an additional Area of Interest dropdown field will appear.

###### Scenario: Buyer wants to remove an Industry Sector when editing the Buyer’s user profile  
Given the Buyer is signed in  
And the Buyer is viewing the Buyer’s user profile  
And the Buyer’s user profile is open for editing by the Buyer  
And at least two Industry Sector dropdown fields are present  
When the Buyer clicks the trash can icon next to an Industry Sector dropdown field  
Then the Industry Sector dropdown field is removed.

###### Scenario: Buyer wants to remove an Area of Interest when editing the Buyer’s user profile  
Given the Buyer is signed in  
And the Buyer is viewing the Buyer’s user profile  
And the Buyer’s user profile is open for editing by the Buyer  
And at least two Area of Interest dropdown fields are present  
When the Buyer clicks the trash can icon next to an Area of Interest dropdown field  
Then the Area of Interest dropdown field is removed.

##### Account Deactivation

###### Scenario: Buyer wants to initiate the deactivation of the Buyer's account  
Given the Buyer is signed in   
And the Buyer is viewing the Buyer's user profile  
When the Buyer clicks "Deactivate Account"  
Then the Buyer is presented with an alert to confirm the deactivation of the Buyer's account.

###### Scenario: Buyer wants to confirm the deactivation of the Buyer's account  
Given the Buyer is signed in  
And is viewing the alert to confirm the deactivation of the Buyer's account  
When the Buyer clicks "Yes, deactivate my account"  
Then the Buyer's account is deactivated  
And the Buyer is sent an email notification  
And the Buyer is directed to the landing page.

###### Scenario: Buyer wants to cancel the deactivation of the Buyer's account  
Given the Buyer is signed in  
And is viewing the alert to confirm the deactivation of the Buyer's account  
When the Buyer clicks "Cancel"  
Then the alert closes  
And the Buyer is directed back to the Buyer's user profile.

#### Vendors

##### User Profile

###### Scenario: Vendor wants to add an Industry Sector when editing the Vendor’s user profile  
Given the Vendor is signed in  
And the Vendor is viewing the Vendor’s user profile  
And the Vendor’s user profile is open for editing by the Vendor  
When the Vendor clicks “Add” to add an Industry Sector  
Then an additional Industry Sector dropdown field will appear.

###### Scenario: Vendor wants to add an Area of Interest when editing the Vendor’s user profile  
Given the Vendor is signed in  
And the Vendor is viewing the Vendor’s user profile  
And the Vendor’s user profile is open for editing by the Vendor  
When the Vendor clicks “Add” to add an Area of Interest    
Then an additional Area of Interest dropdown field will appear.

###### Scenario: Vendor wants to remove an Industry Sector when editing the Vendor’s user profile  
Given the Vendor is signed in  
And the Vendor is viewing the Vendor’s user profile  
And the Vendor’s user profile is open for editing by the Vendor  
And at least two Industry Sector dropdown fields are present  
When the Vendor clicks the trash can icon next to an Industry Sector dropdown field  
Then the Industry Sector dropdown field is removed.

###### Scenario: Vendor wants to remove an Area of Interest when editing the Vendor’s user profile  
Given the Vendor is signed in  
And the Vendor is viewing the Vendor’s user profile  
And the Vendor’s user profile is open for editing by the Vendor  
And at least two Area of Interest dropdown fields are present  
When the Vendor clicks the trash can icon next to an Area of Interest dropdown field  
Then the Area of Interest dropdown field is removed.

##### Account Deactivation

###### Scenario: Vendor wants to initiate the deactivation of the Vendor's account  
Given the Vendor is signed in   
And the Vendor is viewing the Vendor's user profile  
When the Vendor clicks "Deactivate Account"  
Then the Vendor is presented with an alert to confirm the deactivation of the Vendor's account.

###### Scenario: Vendor wants to confirm the deactivation of the Vendor's account  
Given the Vendor is signed in  
And is viewing the alert to confirm the deactivation of the Vendor's account  
When the Vendor clicks "Yes, deactivate my account"  
Then the Vendor's account is deactivated  
And the Vendor is sent an email notification  
And the Vendor is directed to the landing page.

###### Scenario: Vendor wants to cancel the deactivation of the Vendor's account  
Given the Vendor is signed in  
And is viewing the alert to confirm the deactivation of the Vendor's account  
When the Vendor clicks "Cancel"  
Then the alert closes  
And the Vendor is directed back to the Vendor's user profile.

#### Anonymous Users

##### Sign In

###### Scenario: User supplies correct email address and password when attempting to sign in  
Given the User is viewing the sign in page  
And the User has an account  
When the User enters a valid email address and password correctly  
And clicks "Sign In"  
Then the User is directed to the RFIs page.

###### Scenario: User does not supply correct email address and/or password when attempting to sign in  
Given the User is viewing the sign in page  
When the User enters a valid email address and/or password incorrectly  
And clicks "Sign In"  
Then the User is presented with an error message.

###### Scenario: User attempts to sign in, but does not have an account
Given the User is viewing the sign in page  
And the User does not have an account  
When the User clicks "sign up here"  
Then the User is directed to the sign up: step 1 page.

##### Sign Up

###### Scenario: User wants to sign up for an account using the "Sign Up" button in the main header
Given the User is not signed in    
When the User clicks "Sign Up" in the main header  
Then the User is directed to the sign up: step 1 page.

###### Scenario: User wants to sign up for an account using the "Get Started" button
Given the User is not signed in  
And is viewing the landing page  
When the User clicks "Get Started"  
Then the User is directed to the sign up: step 1 page.

###### Scenario: User wants to sign up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 1 page  
When the User clicks "Select" in the Public Sector Buyer card  
Then the User is directed to the sign up: step 2 page for Public Sector Buyers.

###### Scenario: User wants to sign up for a Vendor account  
Given the User is viewing the sign up: step 1 page  
When the User clicks "Select" in the Vendor card  
Then the User is directed to the sign up: step 2 page for Vendors.

###### Scenario: User supplies valid email address and password (and password confirmation) when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 2 page for Public Sector Buyers  
When the User enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the User is directed to the sign up: step 3 page for Public Sector Buyers.

###### Scenario: User supplies email address already associated with an account when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 2 page for Public Sector Buyers  
And the User has an active account  
When the User enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the User is directed to the sign up: step 3 page for Public Sector Buyers.

###### Scenario: User supplies email address already associated with an account and has completed the registration process for a Public Sector Buyer account 
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
And the User has an active account  
When the User clicks "Create Account"  
Then the User is redirected to the sign up: step 2 page for Public Sector Buyers  
And the User is presented with an error message.

###### Scenario: User supplies an invalid email address when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 2 page for Public Sector Buyers  
When the User enters an invalid email address and password (and password confirmation) correctly  
Then the User is presented with an error message, "Please enter a valid email."

###### Scenario: User supplies password confirmation incorrectly when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 2 page for Public Sector Buyers  
When the User enters a valid email address and password but re-enter the password confirmation incorrectly  
Then the User is presented with the error message, "Password confirmation doesn’t match original password."

###### Scenario: User completes step 3 of 4 when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 3 page for Public Sector Buyers  
When the User provides all required information  
And clicks "Next"  
Then the User is directed to the sign up: step 4 page for Public Sector Buyers.

###### Scenario: User completes step 4 of 4 when signing up for a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
And the User does not already have an account associated with the email address the User has supplied  
When the User provides at least one Industry Sector   
And the User provides at least one Area of Interest  
And clicks "Create Account"  
Then the User is directed to the terms and conditions page  
And the User is sent an email to confirm that the User’s account has been created.

###### Scenario: User wants to add an Industry Sector when creating a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
When the User clicks "Add" to add an Industry Sector  
Then an additional Industry Sector dropdown field will appear.

###### Scenario: User wants to add an Area of Interest when creating a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
When the User clicks "Add" to add an Area of Interest  
Then an additional Area of Interest dropdown field will appear.

###### Scenario: User wants to remove an Industry Sector when creating a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
And at least two Industry Sector dropdown fields are present  
When the User clicks the trash can icon next to an Industry Sector dropdown field  
Then the Industry Sector dropdown field is removed.

###### Scenario: User wants to remove an Area of Interest when creating a Public Sector Buyer account  
Given the User is viewing the sign up: step 4 page for Public Sector Buyers  
And at least two Area of Interest dropdown fields are present  
When the User clicks the trash can icon next to an Area of Interest dropdown field  
Then the Area of Interest dropdown field is removed.

###### Scenario: User supplies valid email address and password (and password confirmation) when signing up for a Vendor account  
Given the User is viewing the sign up: step 2 page for Vendors  
When the User enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the User is directed to the sign up: step 3 page for Vendors.  

###### Scenario: User supplies email address already associated with an account when signing up for a Vendor account  
Given the User is viewing the sign up: step 2 page for Vendors  
And the User has an active account  
When the User enters a valid email address and password (and password confirmation) correctly  
And clicks "Next"  
Then the User is directed to the sign up: step 3 page for Vendors.  

###### Scenario: User supplies email address already associated with an account and has completed the registration process for a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
And the User has an active account  
When the User clicks "Create Account"  
Then the User is redirected to the sign up: step 2 page for Vendors  
And the User is presented with an error message.  

###### Scenario: User supplies an invalid email address when signing up for a Vendor account  
Given the User is viewing the sign up: step 2 page for Vendors  
When the User enters an invalid email address and password (and password confirmation) correctly  
Then the User is presented with an error message, "Please enter a valid email."  

###### Scenario: User supplies password confirmation incorrectly when signing up for a Vendor account  
Given the User is viewing the sign up: step 2 page for Vendors  
When the User enters a valid email address and password but re-enter the password confirmation incorrectly  
Then the User is presented with the error message, "Password confirmation doesn’t match original password."  

###### Scenario: User completes step 3 of 4 when signing up for a Vendor account  
Given the User is viewing the sign up: step 3 page for Vendors  
When the User provides all required information  
And clicks "Next"  
Then the User is directed to the sign up: step 4 page for Vendors.  

###### Scenario: User’s Head Office Location is located within British Columbia  
Given the User is viewing the sign up: step 3 page for Vendors  
When the User selects “British Columbia” from the “Head Office Location” dropdown list  
Then the “City” field is presented as a required field  

###### Scenario: User’s Head Office Location is located anywhere other than British Columbia  
Given the User is viewing the sign up: step 3 page for Vendors  
When the User selects any option other than “British Columbia” from the “Head Office Location” dropdown list  
Then the “City” field remains an optional field  

###### Scenario: User completes step 4 of 4 when signing up for a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
And the User does not already have an account associated with the email address the User has supplied  
When the User provides at least one Industry Sector  
And the User provides at least one Area of Interest  
And clicks "Create Account"  
Then the User is directed to the terms and conditions page  
And the User is sent an email to confirm that the User’s account has been created.  

###### Scenario: User wants to add an Industry Sector when creating a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
When the User clicks "Add" to add an Industry Sector  
Then an additional Industry Sector dropdown field will appear.  

###### Scenario: User wants to add an Area of Interest when creating a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
When the User clicks "Add" to add an Area of Interest  
Then an additional Area of Interest dropdown field will appear.  

###### Scenario: User wants to remove an Industry Sector when creating a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
And at least two Industry Sector dropdown fields are present  
When the User clicks the trash can icon next to an Industry Sector dropdown field  
Then the Industry Sector dropdown field is removed.  

###### Scenario: User wants to remove an Area of Interest when creating a Vendor account  
Given the User is viewing the sign up: step 4 page for Vendors  
And at least two Area of Interest dropdown fields are present  
When the User clicks the trash can icon next to an Area of Interest dropdown field  
Then the Area of Interest dropdown field is removed.  

##### Forgot/Reset Password

###### Scenario: User has forgotten the password associated with the User’s account when attempting to sign in  
Given the User is viewing the sign in page  
And the User has forgotten the password associated with the User’s account  
When the User clicks "Forgotten Your Password?"  
Then the User is directed to the forgot password page.

###### Scenario: User supplies a valid email address when requesting to reset the User’s password  
Given the User is viewing the forgot password page  
And the User has an account  
When the User enters a valid email address  
And clicks "Reset Password"  
Then the User is directed to a confirmation page  
And the User is sent an email with a link to reset the password associated with the User’s account.

###### Scenario: User supplies an invalid email address when requesting to reset the User’s password  
Given the User is viewing the forgot password page  
When the User enters an invalid email address  
Then the User is presented with an error message, "Please enter a valid email."

###### Scenario: User has submitted a request to reset the password associated with the User’s account  
Given the User has requested the password associated with the User’s account to be reset  
And the User has received the reset password email  
When the User clicks "Reset Your Password" in the reset password email  
Then the User is directed to the reset password page.

###### Scenario: User supplies new password and correctly re-enters the new password when attempting to reset the User’s password  
Given the User is viewing the reset password page  
When the User enters a new password and re-enters the new password correctly  
And clicks "Reset Password"  
Then the User is directed to a confirmation page.

###### Scenario: User supplies new password and incorrectly re-enters the new password when attempting to reset the User’s password  
Given the User is viewing the reset password page  
When the User enters a new password and re-enters the new password incorrectly  
Then the User is presented with an error message.

##### Change Password

###### Scenario: User wants to change the password associated with the User’s account
Given the User is signed in  
And the User is viewing the User’s profile  
When the User clicks "Change Password"  
Then the User is directed to the change password page.

###### Scenario: User supplies current password and new password correctly when attempting to change the User’s password  
Given the User is viewing the change password page  
When the User enters the User’s current password and new password correctly  
And clicks "Update Password"  
Then the User is directed to a confirmation page.

###### Scenario: User supplies current password incorrectly and new password correctly when attempting to change the User’s password  
Given the User is viewing the change password page  
When the User enters the User’s current password incorrectly and new password correctly  
And clicks "Update Password"  
Then the User is presented with the error message, "Please enter your correct password."

###### Scenario: User supplies current password and new password correctly and new password confirmation incorrectly when attempting to change the User’s password  
Given the User is viewing the change password page  
When the User enters the User’s current password and new password correctly but re-enters the new password confirmation incorrectly  
Then the User is presented with the error message, "Password confirmation doesn’t match original password."  

#### All Users

##### Terms & Conditions

###### Scenario: User skips terms and conditions during initial registration  
Given the User is viewing the terms and conditions page  
And the User has been directed to the terms and conditions after completing the registration process  
When the User clicks "Skip"  
Then the User is directed to the RFIs page  
And the User’s profile will state, "You have not agreed to the Terms & Conditions."

###### Scenario: User skips terms and conditions when reviewing on User profile  
Given the User is viewing the terms and conditions page  
And the User has not accepted the terms and conditions  
When the User clicks "Skip"  
Then the User is directed to the User’s profile page  
And the User’s profile will state, "You have not agreed to the Terms & Conditions."

###### Scenario: User accepts the terms and conditions during initial registration  
Given the User is viewing the terms and conditions page  
And the User has not accepted the terms and conditions  
When the User clicks "I Accept"  
Then the User is directed to the RFIs page  
And the User’s profile will state, "You agreed to the Terms and Conditions on [date] at [time]."

###### Scenario: User accepts the terms and conditions from the User’s profile  
Given the User is viewing the terms and conditions page  
And the User has not accepted the terms and conditions  
And the User is signed in  
When the User clicks "I Accept"  
Then the User is directed to the User’s profile page  
And the User’s profile will state, "You agreed to the Terms and Conditions on [date] and [time]."

###### Scenario: User has not accepted the terms and conditions  
Given the User has not accepted the terms and conditions  
And the User is signed in  
When the User views the User’s profile  
Then the User’s profile will state, "You have not agreed to the Terms & Conditions."

###### Scenario: User has accepted the terms and conditions  
Given the User has accepted the terms and conditions  
And the User is signed in  
When the User views the User’s profile  
Then the User’s profile will state, "You agreed to the Terms and Conditions on [date] and [time]."

###### Scenario: User is presented with an alert to review the terms and conditions and wants to do so  
Given the User has not accepted the terms and conditions  
And has been presented with an alert to review the terms and conditions when attempting to complete an action  
When the User clicks "Review Terms & Conditions"  
Then the User is directed to the terms and conditions page.  

###### Scenario: User is presented with an alert to review the terms and conditions and does not want to do so
Given the User has not accepted the terms and conditions  
And has been presented with an alert to review the terms and conditions when attempting to complete an action  
When the User clicks "Go Back"  
Then the User is directed back to the page the User was previously on.

##### User Profile

###### Scenario: User wants to view the User's user profile  
Given the User is signed in  
When the User clicks “My Profile” in the main navigation bar  
Then the User is directed the User’s user profile.

###### Scenario: User wants to edit the User's user profile  
Given the User is signed in  
And the User is viewing the User’s user profile  
When the User clicks “Edit Profile”  
Then the User’s user profile becomes open for editing by the User.

###### Scenario: User changes the User’s user profile information and wants to cancel the changes made  
Given the User is signed in  
And the User is viewing the User’s user profile  
And the User’s user profile is open for editing by the User  
When the User clicks “Cancel”  
Then the User’s changes made to the User’s user profile (if any) are cancelled  
And the User’s user profile is closed for editing.

###### Scenario: User changes the User’s user profile information and wants to save the changes made  
Given the User is signed in  
And the User is viewing the User’s user profile  
And the User’s user profile is open for editing by the User  
When the User changes their user profile information  
And clicks “Save Changes”  
And the User has supplied all required information  
Then the User’s user profile information is updated with the new information supplied by the User  
And the User’s user profile is closed for editing.

###### Scenario: User attempts to save changes made to User’s user profile and has not provided all required information  
Given the User is signed in  
And the User is viewing the User’s user profile  
And the User’s user profile is open for editing by the User  
When the User changes their user profile information  
And the User has not supplied all required information  
Then the User must supply the required information to activate the “Save Changes” button.

##### Sign Out

###### Scenario: User wants to sign out  
Given the User is signed in  
When the User clicks "Sign Out" in the main navigation bar  
Then the User is signed out  
And is directed to a confirmation page.

##### Account Reactivation 

###### Scenario: User wants to reactivate the User's deactivated account  
Given the User is viewing the sign in page  
And the User has an account that has been deactivated  
When the User enters the email address and password associated with the User's deactivated account correctly  
And clicks "Sign In"  
Then the User's account is reactivated  
And the User is directed to the RFIs page.

### Requests for Information

#### Program Staff

##### Viewing RFIs

###### Scenario: Program Staff wants to view a list of all RFIs using the "View RFIs" button on the landing page
Given the Program Staff is signed in  
And the Program Staff is viewing the landing page  
When the Program Staff clicks "View RFIs"  
Then the Program Staff is directed to the RFI listing page.

###### Scenario: Program Staff wants to view the RFI management page and has accepted the terms and conditions  
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the RFI listing page  
When the Program Staff clicks the RFI’s title  
Then the Program Staff is directed to the RFI’s management page.

###### Scenario: Program Staff wants to view the RFI management page and has not accepted the terms and conditions  
Given the Program Staff is signed in  
And has not accepted the terms and conditions  
And is viewing the RFI listing page  
When the Program Staff clicks the RFI’s title  
Then the Program Staff is presented with an alert to review the terms and conditions.

###### Scenario: Program Staff wants to view the public-facing version of a published RFI (i.e. the RFI description page)
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab of the RFI management page  
When the Program Staff clicks "View RFI"  
Then the Program Staff is directed to the RFI's description page.

###### Scenario: Program Staff wants to view an attachment from the public-facing version of a published RFI (i.e. the RFI description page)
Given the Program Staff is viewing the RFI description page  
And there is at least one attachment associated with the RFI  
When the Program Staff clicks the attachment link  
Then the attachment is downloaded by the Program Staff’s browser.

##### Creating RFIs

###### Scenario: Program Staff wants to create an RFI and has accepted the terms and conditions
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the RFI listing page  
When the Program Staff clicks “Create an RFI”  
Then the Program Staff is directed to the "Details" tab on the “Create a Request for Information (RFI)” page.

###### Scenario: Program Staff wants to create an RFI and has not accepted the terms and conditions
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the RFI listing page  
When the Program Staff clicks “Create an RFI”  
Then the Program Staff is presented with an alert to review the terms and conditions.

###### Scenario: Program Staff has begun creating an RFI and wants to cancel
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
When the Program Staff clicks “Cancel”  
Then the Program Staff is presented with an alert to confirm that the Program Staff wants to cancel the creation of an RFI.

###### Scenario: Program Staff wants to confirm the Program Staff's request to cancel the creation of an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the creation of an RFI  
When the Program Staff clicks “Yes, I want to cancel”  
Then the alert closes  
And the information entered by the Program Staff is not saved  
And the Program Staff is directed to the RFI listing page.

###### Scenario: Program Staff wants to cancel the Program Staff's request to cancel the creation of an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the creation of an RFI  
When the Program Staff clicks “Go Back”  
Then the alert closes  
And the Program Staff is directed back to the "Details" tab on the “Create a Request for Information (RFI)” page.

###### Scenario: Program Staff has not supplied all information required to create an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
When the Program Staff has not supplied all information required to create an RFI  
Then the “Publish RFI” button remains inactive  
And the “Preview RFI” button remains inactive.

###### Scenario: Program Staff wants to add commodity code when creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
When the Program Staff clicks “Add” to add a Commodity Code  
Then an additional Commodity Code dropdown field will appear.

###### Scenario: Program Staff wants to remove a commodity code when creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
When the Program Staff clicks the trash can icon next to a Commodity Code dropdown field  
Then the Commodity Code dropdown field is removed.

###### Scenario: Program Staff wants to add an attachment when creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
When the Program Staff clicks “Add Attachment”  
Then the Program Staff is presented with a window to select the file to be attached to the RFI.

###### Scenario: Program Staff wants to edit an attachment’s title when creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
And has added at least one attachment  
When the Program Staff clicks the input field for the attachment’s file name  
Then the Program Staff may enter a new title for the attachment.

###### Scenario: Program Staff wants to remove an attachment when creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
And has added at least one attachment  
When the Program Staff clicks the trash can icon next to the input field for the attachment’s title  
Then the attachment is removed.

###### Scenario: Program Staff wants to add an addendum when creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
When the Program Staff clicks “Add Addendum”  
Then an “Addendum” textarea box will appear at the top of the “Addenda” section.

###### Scenario: Program Staff wants to edit an addendum when creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
And has added at least one addendum  
When the Program Staff clicks the “Addendum” textarea box  
Then the Program Staff may enter new text or replace existing text within the “Addendum” textarea box.

###### Scenario: Program Staff wants to remove addendum when creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
And has added at least one addendum  
When the Program Staff clicks the trash can icon next to the “Addendum” textarea box  
Then the addendum is removed.

###### Scenario: Program Staff has supplied all information required to create an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
When the Program Staff has supplied all information required to create an RFI  
Then the “Publish RFI” button becomes active  
And the “Preview RFI” button becomes active.

###### Scenario: Program Staff wants to see a preview of the RFI before it is published
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
And has supplied all information required to create an RFI  
When the Program Staff clicks “Preview RFI”  
Then the Program Staff is directed to the RFI description page.

##### Editing RFIs

###### Scenario: Program Staff wants to edit a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the “Details” tab of the RFI management page  
When the Program Staff clicks “Edit Details”  
Then the RFI becomes open for editing by the Program Staff.

###### Scenario: Program Staff has begun editing an RFI and wants to cancel
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff   
When the Program Staff clicks “Cancel”  
Then the Program Staff is presented with an alert to confirm that the Program Staff wants to cancel the changes made to the RFI.

###### Scenario: Program Staff wants to confirm the Program Staff's request to cancel changes made to an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the changes made to the RFI  
When the Program Staff clicks, “Yes, I want to cancel”  
Then the alert closes  
And the changes made by the Program Staff are not saved  
And the Program Staff is directed back to the "Details" tab on the RFI management page.

###### Scenario: Program Staff wants to cancel the cancellation of editing an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the changes made to the RFI  
When the Program Staff clicks “Go Back”  
Then the alert closes  
And the Program Staff is directed back to the "Details" tab on the RFI management page.

###### Scenario: Program Staff has not supplied all information required to publish changes to a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff   
When the Program Staff has not supplied all information required to publish changes to a published RFI  
Then the “Publish Changes” button becomes inactive  
And the “Preview Changes” button becomes inactive.

###### Scenario: Program Staff wants to add commodity code when editing a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff   
When the Program Staff clicks “Add” to add a Commodity Code  
Then an additional Commodity Code dropdown field will appear.

###### Scenario: Program Staff wants to remove a commodity code when editing a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff  
When the Program Staff clicks the trash can icon next to a Commodity Code dropdown field  
Then the Commodity Code dropdown field is removed.

###### Scenario: Program Staff wants to add an attachment when editing a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff   
When the Program Staff clicks “Add Attachment”  
Then the Program Staff is presented with a window to select the file to be attached to the RFI.

###### Scenario: Program Staff wants to edit an attachment’s title that was attached when editing a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff   
And has added at least one attachment while editing the published RFI  
When the Program Staff clicks the input field for the attachment’s file name  
Then the Program Staff may enter a new title for the attachment.

###### Scenario: Program Staff wants to edit an attachment’s title that was attached during the creation of the published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff   
And at least one attachment was attached when the RFI was created  
When the Program Staff clicks the input field for the attachment’s file name  
Then the Program Staff is not able to enter a new title for the attachment.

###### Scenario: Program Staff wants to remove an attachment when editing a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff  
And at least one attachment has been added to the RFI  
When the Program Staff clicks the trash can icon next to the input field for the attachment’s title   
Then the attachment is removed.

###### Scenario: Program Staff wants to add an addendum when editing an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff  
When the Program Staff clicks “Add Addendum”  
Then an “Addendum” textarea box will appear at the top of the “Addenda” section.

###### Scenario: Program Staff wants to edit an addendum when editing an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff  
And at least one addendum has been added to the RFI  
When the Program Staff clicks the “Addendum” textarea box  
Then the Program Staff may enter new text or replace existing text within the “Addendum” textarea box.

###### Scenario: Program Staff wants to remove addendum when editing an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff  
And at least one addendum has been added to the RFI  
When the Program Staff clicks the trash can icon next to the “Addendum” textarea box  
Then the addendum is removed.


###### Scenario: Program Staff has supplied all information required to publish changes to a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff  
When the Program Staff has supplied all information required to publish changes to the published RFI  
Then the “Publish Changes” button remains active  
And the “Preview Changes” button remains active.

###### Scenario: Program Staff wants to see a preview of the RFI before the Program Staff’s changes are published
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff  
And has supplied all information required to publish changes to the published RFI  
When the Program Staff clicks “Preview Changes”  
Then the Program Staff is directed to the RFI description page.










##### Publishing RFIs

###### Scenario: Program Staff has supplied all required information and attempts to publish an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the “Create a Request for Information (RFI)” page  
And has supplied all information required to create an RFI  
When the Program Staff clicks “Publish RFI”  
Then the Program Staff is presented with an alert to confirm that the Program Staff wants to publish the RFI.

###### Scenario: Program Staff wants to confirm the Program Staff's request to publish an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to publish the RFI  
When the Program Staff clicks, “Yes, publish RFI”  
Then the alert closes  
And the RFI is published to the RFI listing page  
And the Program Staff is directed to RFI management page.

###### Scenario: Program Staff wants to cancel the Program Staff's request to publish an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to publish the RFI  
When the Program Staff clicks “Cancel”  
Then the alert closes  
And the Program Staff is directed back to the "Details" tab on the “Create a Request for Information (RFI)” page.

###### Scenario: Program Staff has supplied all required information and attempts to publish changes to a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Details" tab on the RFI management page  
And the RFI is open for editing by the Program Staff  
When the Program Staff clicks “Publish Changes”  
Then the Program Staff is presented with an alert to confirm that the Program Staff wants to publish changes to the RFI.

###### Scenario: Program Staff wants to confirm the Program Staff's request to publish changes to a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to publish changes to the RFI  
When the Program Staff clicks “Yes, publish changes”  
Then the alert closes  
And the RFI is updated with the changes made by the Program Staff  
And the Program Staff is directed back to the "Details" tab on the RFI management page.

###### Scenario: Program Staff wants to cancel the Program Staff's request to publish changes to a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to publish changes to the RFI  
When the Program Staff clicks “Cancel”  
Then the alert closes  
And the Program Staff is directed back to the "Details" tab on the RFI management page.

#### Buyers

##### Viewing RFIs

###### Scenario: Buyer wants to view a list of all RFIs using the "View RFIs" button on the landing page
Given the Buyer is signed in  
And the Buyer is viewing the landing page  
When the Buyer clicks "View RFIs"  
Then the Buyer is directed to the RFI listing page.

###### Scenario: Buyer wants to view the details of an RFI  
Given the Buyer is viewing the RFI listing page  
When the Buyer clicks the RFI’s title  
Then the Buyer is directed to the RFI description page.

###### Scenario: Buyer wants to view an attachment associated with an RFI  
Given the Buyer is viewing the RFI description page  
And there is at least one attachment associated with the RFI  
When the Buyer clicks the attachment link  
Then the attachment is downloaded by the Buyer’s browser.

###### Scenario: Buyer wants to email the contact associated with an RFI  
Given the Buyer is viewing the RFI description page  
When the Buyer clicks the RFI contact’s email link  
Then the Buyer’s email client is opened  
And an email draft is created and addressed to the RFI contact’s email address.

#### Vendors

##### Viewing RFIs

###### Scenario: Vendor wants to view a list of all RFIs using the "View RFIs" button on the landing page
Given the Vendor is signed in  
And the Vendor is viewing the landing page  
When the Vendor clicks "View RFIs"  
Then the Vendor is directed to the RFI listing page.

###### Scenario: Vendor wants to view the details of an RFI  
Given the Vendor is viewing the RFI listing page  
When the Vendor clicks the RFI’s title  
Then the Vendor is directed to the RFI description page.

###### Scenario: Vendor wants to view an attachment associated with an RFI  
Given the Vendor is viewing the RFI description page  
And there is at least one attachment associated with the RFI  
When the Vendor clicks the attachment link  
Then the attachment is downloaded by the Vendor’s browser.

###### Scenario: Vendor wants to email the contact associated with an RFI  
Given the Vendor is viewing the RFI description page  
When the Vendor clicks the RFI contact’s email link  
Then the Vendor’s email client is opened  
And an email draft is created and addressed to the RFI contact’s email address.

#### Anonymous Users

##### Viewing RFIs

###### Scenario: User wants to view the details of an RFI  
Given the User is viewing the RFI listing page  
When the User clicks the RFI’s title  
Then the User is directed to the RFI description page.

###### Scenario: User wants to view an attachment associated with an RFI  
Given the User is viewing the RFI description page  
And there is at least one attachment associated with the RFI  
When the User clicks the attachment link  
Then the attachment is downloaded by the User’s browser.

###### Scenario: User wants to email the contact associated with an RFI  
Given the User is viewing the RFI description page  
When the User clicks the RFI contact’s email link  
Then the User’s email client is opened  
And an email draft is created and addressed to the RFI contact’s email address.

#### All Users

##### Viewing RFIs

###### Scenario: User wants to view a list of all RFIs  
Given the User is viewing the landing page (or any other page within the web app)  
When the User clicks “RFIs”  
Then the User is directed to the RFI listing page.

###### Scenario: User wants to filter the list of RFIs  
Given the User is viewing the RFI listing page  
When the User selects a filter using an available dropdown  
Then the RFI listing table data is filtered accordingly.

###### Scenario: User wants to search the list of RFIs  
Given the User is viewing the RFI listing page  
When the User enters at least two characters into the available search bar  
Then the RFI listing table data is filtered accordingly.

### Requests for Information Responses

#### Program Staff

###### Scenario: Program Staff wants to view the responses received for an RFI
Given the Program Staff is signed in  
And has agreed to the terms and conditions  
And is viewing the RFI management page  
When the Program Staff selects the “Responses” tab  
Then the Program Staff is presented with information regarding the responses submitted by Vendors to the RFI.

###### Scenario: Program Staff wants to view the profile of the Vendor that submitted a response to the RFI
Given the Program Staff is signed in  
And has agreed to the terms and conditions  
And is viewing the “Responses” tab of the RFI management page  
When the Program Staff clicks the Vendor Name’s link  
Then a new tab is opened by the Program Staff’s browser  
And the Program Staff is directed to the Vendor’s profile.

###### Scenario: Program Staff wants to email the Vendor that submitted a response to the RFI
Given the Program Staff is signed in  
And has agreed to the terms and conditions  
And is viewing the “Responses” tab of the RFI management page  
When the Program Staff clicks the Vendor’s email address link  
Then the Program Staff’s email client is opened  
And an email draft is created and addressed to the Vendor’s email address.

###### Scenario: Program Staff wants to download an attachment submitted by a Vendor in response to the RFI
Given the Program Staff is signed in  
And has agreed to the terms and conditions  
And is viewing the “Responses” tab of the RFI management page  
When the Program Staff clicks the attachment link  
Then the attachment is downloaded by the Program Staff’s browser.

#### Buyers

#### Vendors

###### Scenario: Vendor is viewing an active (i.e. "Open") RFI that is accepting responses
Given the Vendor is signed in  
And is viewing the RFI description page  
When the RFI's status is "Open"  
Then the "Respond to RFI" button is displayed.

###### Scenario: Vendor is viewing an inactive (i.e. "Closed") RFI that is accepting responses
Given the Vendor is signed in  
And is viewing the RFI description page  
When the RFI's status is "Closed"  
And the viewing date is within the "Late Response Grace Period"  
Then the "Respond to RFI" button is displayed  
And a global alert is presented that states, "This RFI is still accepting responses up to [late response grace period] calendar days after the closing date and time."    

###### Scenario: Vendor is viewing an inactive (i.e. "Closed") RFI that is not accepting responses
Given the Vendor is signed in  
And is viewing the RFI description page  
When the RFI's status is "Closed"  
And the viewing date is past the "Late Response Grace Period"  
Then the "Respond to RFI" button is not displayed  
And a global alert is presented that states, "This RFI is no longer accepting responses."

###### Scenario: Vendor wants to respond to an RFI and has agreed to the terms and conditions
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the RFI description page 
And the RFI is accepting responses  
When the Vendor clicks “Respond to RFI”   
Then the Vendor is directed to the RFI response page. 

###### Scenario: Vendor wants to respond to an RFI and has not agreed to the terms and conditions
Given the Vendor is signed in  
And has not agreed to the terms and conditions  
And is viewing the RFI description page  
And the RFI is accepting responses  
When the Vendor clicks “Respond to RFI”  
Then the Vendor is presented with an alert to review the terms and conditions.

###### Scenario: Vendor wants to navigate to the RFI description from the RFI response page
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the RFI response page  
When the Vendor clicks the RFI description link  
Then the Vendor is directed to the RFI description page.

###### Scenario: Vendor wants to add an attachment to the Vendor’s response to the RFI
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the RFI response page  
When the Vendor clicks “Add Attachment”  
Then the Vendor is presented with a window to select the file to be attached to the RFI response.

###### Scenario: Vendor wants to edit an attachment’s title for the Vendor’s response to the RFI
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the RFI response page  
And has added at least one attachment  
When the Vendor clicks the input field for the attachment’s filename  
Then the Vendor may enter a new title for the attachment.

###### Scenario: Vendor wants to remove an attachment from the Vendor’s response to the RFI
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the RFI response page  
And has added at least one attachment  
When the Vendor clicks the trash can icon next to the input field for the attachment’s title  
Then the attachment is removed.

###### Scenario: Vendor wants to cancel the Vendor’s response to the RFI
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the RFI response page  
When the Vendor clicks “Cancel”  
Then the Vendor is directed back to the RFI description page.

###### Scenario: Vendor has added at least one attachment to the Vendor’s response to the RFI
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the RFI response page  
When the Vendor adds at least one attachment  
Then the “Submit Response” button becomes active.

###### Scenario: Vendor wants to submit the Vendor’s response to the RFI
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the RFI response page  
And has added at least one attachment  
When the Vendor clicks “Submit Response”  
Then the Vendor is presented with an alert to confirm that the Vendor wants to submit the Vendor’s response to the RFI.

###### Scenario: Vendor wants to confirm the Vendor’s request to submit the Vendor’s response to the RFI
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the alert to confirm that the Vendor wants to submit the Vendor’s response to the RFI  
When the Vendor clicks “Submit Response”  
Then the alert closes  
And the Vendor is directed to a confirmation page  
And the Vendor is sent an email to confirm that the Vendor’s response to the RFI has been received.

###### Scenario: Vendor wants to cancel the Vendor’s request to submit the Vendor’s response to the RFI
Given the Vendor is signed in  
And has agreed to the terms and conditions  
And is viewing the alert to confirm that the Vendor wants to submit the Vendor’s response to the RFI  
When the Vendor clicks “Cancel”  
Then the alert closes  
And the Vendor is directed back to the RFI response page.

#### Anonymous Users

###### Scenario: User is viewing an active (i.e. "Open") RFI that is accepting responses
Given the User is viewing the RFI description page  
And is not signed in  
When the RFI's status is "Open"  
Then the "Respond to RFI" button is displayed.

###### Scenario: User is viewing an inactive (i.e. "Closed") RFI that is accepting responses
Given the User is viewing the RFI description page  
And is not signed in  
When the RFI's status is "Closed"  
And the viewing date is within the "Late Response Grace Period"  
Then the "Respond to RFI" button is displayed  
And a global alert is presented that states, "This RFI is still accepting responses up to [late response grace period] calendar days after the closing date and time."    

###### Scenario: User is viewing an inactive (i.e. "Closed") RFI that is not accepting responses
Given the User is viewing the RFI description page  
And is not signed in  
When the RFI's status is "Closed"  
And the viewing date is past the "Late Response Grace Period"  
Then the "Respond to RFI" button is not displayed  
And a global alert is presented that states, "This RFI is no longer accepting responses."  

###### Scenario: User wants to respond to an RFI that the User is viewing
Given the User is viewing the RFI description page  
And is not signed in  
And the RFI is accepting responses  
When the User clicks “Respond to RFI”  
Then the User is directed to the sign in page.

#### All Users

### Discovery Day Sessions

#### Program Staff

##### Viewing Discovery Day Sessions

###### Scenario: Program Staff wants to view if an RFI has an associated Discovery Day session
Given the Program Staff is signed in  
And is viewing the RFI listing page  
When an RFI has an associated Discovery Day session  
Then a checkmark is displayed in the "Discovery Day Available" column. 

##### Discovery Day Session Management

###### Scenario: Program Staff wants to view the Discovery Day tab while creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Create a Request for Information (RFI)" page  
When the Program Staff clicks the "Discovery Day" tab  
Then the Discovery Day Session tab content is displayed.

###### Scenario: Program Staff wants to view the Discovery Day tab for a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the RFI management page  
When the Program Staff clicks the "Discovery Day" tab  
Then the Discovery Day Session tab content is displayed.

###### Scenario: Program Staff wants to associate a Discovery Day Session while creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the "Create a Request for Information (RFI)" page  
When the Program Staff selects the available checkbox  
Then the Discovery Day Session form is displayed.

###### Scenario: Program Staff no longer wants to associate a Discovery Day Session while creating an RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the "Create a Request for Information (RFI)" page  
And has selected the available checkbox  
When the Program Staff deselects the checkbox  
Then the Discovery Day Session form is no longer displayed.

###### Scenario: Program Staff wants to associate a Discovery Day Session with a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
When the Program Staff selects the available checkbox  
Then the Discovery Day Session form is displayed.

###### Scenario: Program Staff no longer wants to associate a Discovery Day Session with a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
And has selected the available checkbox  
When the Program Staff deselects the checkbox  
Then the Discovery Day Session form is no longer displayed.

###### Scenario: Program Staff has supplied all required information for associating a Discovery Day Session with a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
And has selected the available checkbox  
When the Program Staff has supplied all required information for the Discovery Day Session  
Then the "Publish Discovery Day Session" button becomes active.

###### Scenario: Program Staff has not supplied all required information for associating a Discovery Day Session with a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
And has selected the available checkbox  
When the Program Staff has not supplied all required information for the Discovery Day Session  
Then the "Publish Discovery Day Session" button remains inactive.

###### Scenario: Program Staff wants to see a preview of the Discovery Day Session section of the RFI before it is published
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
And has supplied all required information for the Discovery Day Session  
When the Program Staff clicks "Preview RFI"  
Then the Program Staff is directed to the RFI description page.

###### Scenario: Program Staff attempts to publish a Discovery Day Session to a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
And has supplied all required information for the Discovery Day Session  
When the Program Staff clicks "Publish Discovery Day Session"  
Then the Program Staff is presented with an alert to confirm that the Program Staff wants to publish the Discovery Day Session to the RFI description page.

###### Scenario: Program Staff wants to confirm the publishing of a Discovery Day Session to a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to publish the Discovery Day Session to the published RFI  
When the Program Staff clicks "Yes, publish Discovery Day Session"  
Then the alert closes  
And the RFI is updated with the Discovery Day Session information  
And the Program Staff is directed back to the "Details" tab on the RFI management page.

###### Scenario: Program Staff wants to cancel the publishing of a Discovery Day Session to a published RFI
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to publish the Discovery Day Session to the published RFI  
When the Program Staff clicks "Cancel"  
Then the alert closes  
And the Program Staff is directed back to the "Discovery Day" tab on the RFI management page.

###### Scenario: Program Staff has begun creating a Discovery Day Session on a published RFI and wants to cancel
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
And has supplied all required information for the Discovery Day Session  
When the Program Staff clicks "Cancel"  
Then the Program Staff is presented with an alert to confirm that the Program Staff wants to cancel the creation of the Discovery Day Session.

###### Scenario: Program Staff wants to confirm the cancellation of creating a Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the creation of the Discovery Day Session  
When the Program Staff clicks "Yes, I want to cancel"  
Then the alert closes  
And the information that the Program Staff entered in the "Details" tab on the RFI management page is not saved  
And the Program Staff is directed back to the "Discovery Day" tab on the RFI management page.

###### Scenario: Program Staff wants to cancel the cancellation of creating a Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the creation of the Discovery Day Session  
When the Program Staff clicks "Go Back"  
Then the alert closes  
And the Program Staff is directed back to the "Discovery Day" tab on the RFI management page.

###### Scenario: Program Staff wants to edit a published Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
When the Program Staff clicks "Edit Discovery Day Session"  
Then the Discovery Day Session becomes open for editing by the Program Staff.

###### Scenario: Program Staff attempts to publish changes to a published Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
And the Discovery Day Session is open for editing by the Program Staff  
When the Program Staff clicks "Publish Changes"  
Then the Program Staff is presented with an alert to confirm that the Program Staff wants to publish changes to the Discovery Day Session.

###### Scenario: Program Staff wants to confirm publishing changes to a published Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to publish changes to the Discovery Day Session  
When the Program Staff clicks "Yes, publish changes"  
Then the alert closes  
And the RFI is updated with the Discovery Day Session information  
And the Program Staff is directed back to the "Discovery Day" tab on the RFI management page.

###### Scenario: Program Staff wants to cancel publishing changes to a published Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to publish changes to the Discovery Day Session  
When the Program Staff clicks "Cancel"  
Then the alert closes    
And the Program Staff is directed back to the "Discovery Day" tab on the RFI management page.

###### Scenario: Program Staff wants to cancel changes made to published Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
And the Discovery Day Session is open for editing by the Program Staff  
When the Program Staff clicks "Cancel"  
The the Program Staff is presented with an alert to confirm that the Program Staff wants to cancel the editing of the Discovery Day Session.

###### Scenario: Program Staff wants to confirm the cancellation of changes made to Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the editing of the Discovery Day Session  
When the Program Staff clicks "Yes, I want to cancel"  
Then the alert closes  
And the Program Staff's changes to the Discovery Day Session are not saved  
And the Program Staff is directed back to the "Discovery Day" tab on the RFI management page.

###### Scenario: Program Staff wants to cancel the cancellation of changes made to Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the editing of the Discovery Day Session  
When the Program Staff clicks "Go Back"  
Then the alert closes  
And the Program Staff is directed back to the "Discovery Day" tab on the RFI management page.

###### Scenario: Program Staff wants to see a preview of the Discovery Day Session before the Program Staff's changes are published
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
And the Discovery Day Session is open for editing by the Program Staff  
When the Program Staff clicks "Preview Changes"  
Then the Program Staff is directed to the RFI description page.

###### Scenario: Program Staff wants to cancel a published Discovery Day Session that has registered attendees
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
When the Program Staff clicks "Cancel Discovery Day Session"  
Then the Program Staff is presented with an alert to confirm that the Program Staff wants to cancel the Discovery Day Session.

###### Scenario: Program Staff wants to confirm the cancellation of a published Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the Discovery Day Session  
When the Program Staff clicks "Yes, I want to cancel"  
Then the alert closes  
And the Discovery Day Session information is removed from the associated RFI  
And the Program Staff is directed back to the "Discovery Day" tab on the RFI management page.

###### Scenario: Program Staff wants to cancel the Program Staff's request to cancel the published Discovery Day Session
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Program Staff wants to cancel the Discovery Day Session  
When the Program Staff clicks "Go Back"  
Then the alert closes  
And the Program Staff is directed back to the "Discovery Day" tab on the RFI management page.

###### Scenario: Program Staff wants to view the RFI associated with a published Discovery Day Session from the "Discovery Day" tab
Given the Program Staff is signed in  
And has accepted the terms and conditions  
And is viewing the "Discovery Day" tab on the RFI management page  
When the Program Staff clicks "View RFI"  
Then the Program Staff is directed to the RFI description page.

#### Buyers

##### Viewing Discovery Day Sessions

###### Scenario: Buyer wants to view if an RFI has an associated Discovery Day session
Given the Buyer is signed in  
And is viewing the RFI listing page  
When an RFI has an associated Discovery Day session  
Then a checkmark is displayed in the "Discovery Day Available" column. 

#### Vendors

##### Viewing Discovery Day Sessions

###### Scenario: Vendor wants to view if an RFI has an associated Discovery Day session
Given the Vendor is signed in  
And is viewing the RFI listing page  
When an RFI has an associated Discovery Day session  
Then a checkmark is displayed in the "Discovery Day Available" column. 

###### Scenario: Vendor is viewing an active (i.e. "Open") RFI with an associated Discovery Day Session
Given the Vendor is signed in  
And has accepted the terms and conditions  
And there is a Discovery Day Session associated with the RFI  
And the RFI's status is "Open"  
When the Vendor is viewing the RFI description page  
Then the "Attend Discovery Day Session" is not displayed.

###### Scenario: Viewing is viewing an inactive (i.e. "Closed") RFI with an associated Discovery Day Session
Given the Vendor is signed in  
And has accepted the terms and conditions  
And there is a Discovery Day Session associated with the RFI  
And the RFI's status is "Closed"  
When the Vendor is viewing the RFI description page  
Then the "Attend Discovery Day Session" button is not displayed.

##### Discovery Day Session Registration

###### Scenario: Vendor wants to attend a Discovery Day Session for an RFI and has not accepted terms and conditions
Given the Vendor is signed in  
And has not accepted the terms and conditions  
And is viewing the RFI description page  
When the Vendor clicks “Attend Discovery Day Session”  
Then the Vendor is presented with an alert to review the terms and conditions.

###### Scenario: Vendor wants to attend a Discovery Day Session for an RFI and has accepted terms and conditions
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the RFI description page  
When the Vendor clicks “Attend Discovery Day Session"  
Then the Vendor is directed to the Discovery Day Session registration page.

###### Scenario: Vendor has not supplied all information required to submit the Vendor’s Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
When the Vendor has not supplied all required information for at least one attendee  
Then the “Submit Registration” button becomes inactive.

###### Scenario: Vendor has supplied all information required to submit the Vendor’s Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
When the Vendor has supplied all required information for all attendees  
Then the “Submit Registration” button becomes active.

###### Scenario: Vendor has supplied all required information and attempts to submit initial Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
And has added at least one attendee  
When the Vendor clicks “Submit Registration”  
Then the Vendor is presented with an alert to confirm that the Vendor wants to submit the Vendor’s Discovery Day Session registration.

###### Scenario: Vendor wants to confirm the submission of the Vendor’s Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Vendor wants to submit the Vendor’s Discovery Day Session registration  
When the Vendor clicks “Submit Registration”  
Then the alert closes  
And the Vendor and any additional attendees are sent an email confirmation  
And the Vendor is directed to a confirmation page.

###### Scenario: Vendor wants to cancel the submission of the Vendor’s Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Vendor wants to submit the Vendor’s Discovery Day Session registration  
When the Vendor clicks “Go Back”  
Then the alert closes  
And the Vendor is directed back to the Discovery Day Session registration page.

###### Scenario: Vendor has begun registering for a Discovery Day Session and wants to cancel
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
When the Vendor clicks “Cancel”  
Then the Vendor is presented with an alert to confirm that the Vendor wants to cancel the Vendor’s Discovery Day Session registration.

###### Scenario: Vendor wants to confirm the cancellation of the Vendor’s initial Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Vendor wants to cancel the Vendor’s Discovery Day Session registration  
When the Vendor clicks “Yes, I want to cancel”  
Then the alert closes  
And the information that the Vendor entered on the Discovery Day Session registration page (if any) is not saved  
And the Vendor is directed to the RFI description page.

###### Scenario: Vendor wants to cancel the cancellation of the Vendor’s initial Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm that the Vendor wants to cancel the Vendor’s Discovery Day Session registration  
When the Vendor clicks “Go Back”  
Then the alert closes  
And the Vendor is directed back to the Discovery Day Session registration page.

###### Scenario: Vendor wants to view the Vendor’s submitted Discovery Day Session registration from the RFI description page
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the RFI description page  
And has submitted a Discovery Day Session registration  
When the Vendor clicks “View Discovery Day Session Registration”  
Then the Vendor is directed to the Discovery Day Session registration page  
And the Vendor’s registration information is displayed.

###### Scenario: Vendor wants to view the Vendor’s submitted Discovery Day Session registration using the confirmation email link
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration confirmation email  
When the Vendor clicks “View Registration”  
Then the Vendor is directed to the Discovery Day Session registration page  
And the Vendor’s registration information is displayed.

###### Scenario: Vendor wants to view the Vendor’s submitted Discovery Day Session registration using the confirmation page link
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration confirmation page  
When the Vendor clicks the link provided to view the Vendor’s Discovery Day Session registration  
Then the Vendor is directed to the Discovery Day Session registration page  
And the Vendor’s registration information is displayed.

###### Scenario: Vendor wants to edit the Vendor’s Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
And has registered to attend the Discovery Day Session  
When the Vendor clicks “Edit Registration”  
Then the Vendor’s Discovery Day Session registration is open for editing by the Vendor.

###### Scenario: Vendor wants to submit changes made to the Vendor's submitted Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions    
And has registered to attend the Discovery Day Session  
And is viewing the Discovery Day Session registration page  
And the Vendor's Discovery Day Session registration is open for editing by the Vendor  
When the Vendor edits the Vendor's registration  
And clicks "Submit Changes"  
Then the Vendor is presented with an alert to confirm the changes made to the Vendor's Discovery Day Session registration.

###### Scenario: Vendor wants to confirm the submission of changes made to the Vendor's submitted Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And has registered to attend the Discovery Day Session  
And is viewing the alert to confirm the changes made to the Vendor's Discovery Day Session registration  
When the Vendor clicks “Submit Changes”  
Then the alert closes  
And the Vendor's Discovery Day Session registration information is updated  
And the Discovery Day Session registration page is closed for editing by the Vendor  
And the Vendor is directed back to the Vendor's Discovery Day Session registration page.

###### Scenario: Vendor wants to cancel the submission of changes made to the Vendor's submitted Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions    
And has registered to attend the Discovery Day Session  
And is viewing the alert to confirm the changes made to the Vendor's Discovery Day Session registration  
When the Vendor clicks “Go Back”  
Then the alert closes  
And the Vendor's Discovery Day Session registration information is updated  
And the Vendor is directed back to the Vendor's Discovery Day Session registration page.

###### Scenario: Vendor has the Vendor's Discovery Day Session registration open for editing and wants to cancel the Vendor's changes
Given the Vendor is signed in  
And has accepted the terms and conditions  
And has registered to attend the Discovery Day Session  
And is viewing the Discovery Day Session registration page  
And the Vendor's Discovery Day Session registration is open for editing by the Vendor  
When the Vendor clicks "Cancel"  
Then the Vendor is presented with an alert to confirm that the Vendor wants to cancel the changes made to the Vendor's Discovery Day Session registration.

###### Scenario: Vendor wants to confirm that the Vendor wants to cancel changes made to the Vendor's Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And has registered to attend the Discovery Day Session  
And is viewing the alert to confirm that the Vendor wants to cancel the changes made to the Vendor's Discovery Day Session registration  
When the Vendor clicks "Yes, I want to cancel"  
Then the alert closes  
And the Vendor's changes made to the Vendor's Discovery Day Session registration are not saved  
And the Vendor's Discovery Day Session registration is closed for editing by the Vendor  
And the Vendor is directed back to the Vendor's Discovery Day Session registration page.

###### Scenario: Vendor wants to cancel the Vendor's request to cancel the changes made to the Vendor's Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And has registered to attend the Discovery Day Session  
And is viewing the alert to confirm that the Vendor wants to cancel the changes made to the Vendor's Discovery Day Session registration  
When the Vendor clicks "Go Back"  
Then the alert closes  
And the Vendor is directed back to the Discovery Day Session registration page.

###### Scenario: Vendor wants to cancel the Vendor’s Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
When the Vendor clicks “Cancel Registration”  
Then the Vendor is presented with an alert to confirm that the Vendor wants to cancel the Vendor’s Discovery Day Session registration.

###### Scenario: Vendor wants to confirm the cancellation of the Vendor’s submitted Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm the cancellation of the Vendor’s submitted Discovery Day Session registration  
When the Vendor clicks “Yes, cancel registration”  
Then the alert closes  
And the Vendor and all attendees are sent an email confirmation  
And the Vendor is directed back to the Discovery Day Session registration page.

###### Scenario: Vendor wants to cancel the cancellation of the Vendor’s submitted Discovery Day Session registration
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the alert to confirm the cancellation of the Vendor’s submitted Discovery Day Session registration  
When the Vendor clicks “Go Back”  
Then the alert closes  
And the Vendor is directed back to the Discovery Day Session registration page.

###### Scenario: Vendor wants to add an attendee for a Discovery Day Session
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
When the Vendor clicks “Add Attendee”  
Then an additional row for attendee registration information will appear.

###### Scenario: Vendor wants to edit an attendee’s form of attendance from in-person to remote
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
And has added at least one attendee  
When the Vendor selects “Attending Remotely”  
Then the radio button is shown as selected under the “Attending Remotely” table column.

###### Scenario: Vendor wants to edit an attendee’s form of attendance from remote to in-person more than 24 hours prior to the Discovery Day Session’s start time
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
And has added at least one attendee  
And the Discovery Day Session start time is greater than 24 hours than [time]  
When the Vendor selects “Attending In-Person”  
Then the radio button is shown as selected under the “Attending In-Person” table column.

###### Scenario: Vendor wants to edit an attendee’s form of attendance from remote to in-person less than 24 hours prior to the Discovery Day Session’s start time
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
And has added at least one attendee  
And the Discovery Day Session start time is less than 24 hours than [time]  
When the Vendor selects “Attending In-Person”  
Then the radio button is shown as selected under the “Attending In-Person” table column  
And an error message is displayed.

###### Scenario: Vendor wants to remove an attendee for a Discovery Day Session
Given the Vendor is signed in  
And has accepted the terms and conditions  
And is viewing the Discovery Day Session registration page  
And has added at least two attendees  
When the Vendor clicks the trash can icon at the end of the attendee registration information row  
Then the attendee is removed.

##### Email Notifications

###### Scenario: Vendor's main contact is the only attendee

###### Scenario: Vendor's main contact is attending in addition to other attendees

###### Scenario: Vendor's main contact is not attending, but other attendees are

#### Anonymous Users

##### Viewing Discovery Day Session Information

###### Scenario: User wants to view if an RFI has an associated Discovery Day session
Given the User is viewing the RFI listing page  
When an RFI has an associated Discovery Day session  
Then a checkmark is displayed in the "Discovery Day Available" column. 

#### All Users

##### Viewing Discovery Day Session Information

###### Scenario: User wants to view the details of a Discovery Day Session associated with an RFI
Given the User is signed in  
And has accepted the terms and conditions  
And is viewing the RFI description page  
And there is a Discovery Day Session associated with the RFI  
When the User clicks “View Discovery Day Information”  
Then the User is navigated to the Discovery Day Session section on the RFI description page.

### Static Pages

#### All Users

###### Scenario: User wants to view the landing page  
Given the User is viewing any page within the web app  
When the User clicks the “Home” link on the main navigation bar  
Then the User is directed to the landing page.

###### Scenario: User wants to view the "About" page
Given the User is viewing any page within the web app  
When the User clicks the "About" link on the footer  
Then the User is directed to the "About" page.

###### Scenario: User wants to view the "Disclaimer" page
Given the User is viewing any page within the web app  
When the User clicks the "Disclaimer" link on the footer  
Then the User is directed to the "Disclaimer" page.

###### Scenario: User wants to view the "Privacy" page
Given the User is viewing any page within the web app  
When the User clicks the "Privacy" link on the footer  
Then the User is directed to the "Privacy" page.

###### Scenario: User wants to view the "Accessibility" page
Given the User is viewing any page within the web app  
When the User clicks the "Accessibility" link on the footer  
Then the User is directed to the "Accessibility" page.

###### Scenario: User wants to view the "Copyright" page
Given the User is viewing any page within the web app  
When the User clicks the "Copyright" link on the footer  
Then the User is directed to the "Copyright" page.

### Feedback

#### All Users

###### Scenario: User wants to provide feedback
Given the User is viewing any page within the web app  
When the User clicks "Send Feedback" on the footer  
Then the User is directed to the feedback page.

###### Scenario: User no longer wants to provide feedback
Given the User is viewing the feedback page   
When the User clicks "Cancel"  
Then the User is directed to the landing page.

###### Scenario: User has supplied all required information
Given the User is viewing the feedback page  
When the User supplies all required information  
Then the "Send Feedback" button becomes active.

###### Scenario: User has not supplied all required information
Given the User is viewing the feedback page  
When the User has not supplied all required information  
Then the "Send Feedback" button remains inactive.

###### Scenario: User wants to send feedback
Given the User is viewing the feedback page  
And has supplied all required information  
When the User clicks "Send Feedback"  
Then the User is directed to a confirmation page  
And the feedback is sent to the administrative email address.
