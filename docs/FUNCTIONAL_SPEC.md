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
    + [Feature Definition Example 3](#feature-definition-example-3)
    + [Tips for Writing Feature Definitions](#tips-for-writing-feature-definitions)
- [Specifications](#specifications)
  * [User Management](#user-management)
    + [Program Staff](#program-staff)
    + [Buyers](#buyers)
    + [Vendors](#vendors)
    + [Anonymous Users](#anonymous-users)
  * [All Users](#all-users)
  * [Requests for Information](#requests-for-information)
    + [Program Staff](#program-staff-1)
    + [Buyers](#buyers-1)
    + [Vendors](#vendors-1)
    + [Anonymous Users](#anonymous-users-1)
  * [All Users](#all-users-1)
  * [Requests for Information Responses](#requests-for-information-responses)
    + [Program Staff](#program-staff-2)
    + [Buyers](#buyers-2)
    + [Vendors](#vendors-2)
    + [Anonymous Users](#anonymous-users-2)
  * [All Users](#all-users-2)
  * [Discovery Day Sessions](#discovery-day-sessions)
    + [Program Staff](#program-staff-3)
    + [Buyers](#buyers-3)
    + [Vendors](#vendors-3)
    + [Anonymous Users](#anonymous-users-3)
  * [All Users](#all-users-3)
  * [Discovery Day Sessions](#discovery-day-sessions-1)
    + [Program Staff](#program-staff-4)
    + [Buyers](#buyers-4)
    + [Vendors](#vendors-4)
    + [Anonymous Users](#anonymous-users-4)
  * [All Users](#all-users-4)
  * [Vendor-Initiated Ideas](#vendor-initiated-ideas)
    + [Program Staff](#program-staff-5)
    + [Buyers](#buyers-5)
    + [Vendors](#vendors-5)
    + [Anonymous Users](#anonymous-users-5)
  * [All Users](#all-users-5)
  * [Static Pages](#static-pages)
    + [Program Staff](#program-staff-6)
    + [Buyers](#buyers-6)
    + [Vendors](#vendors-6)
    + [Anonymous Users](#anonymous-users-6)
  * [All Users](#all-users-6)
  * [Feedback](#feedback)
    + [Program Staff](#program-staff-7)
    + [Buyers](#buyers-7)
    + [Vendors](#vendors-7)
    + [Anonymous Users](#anonymous-users-7)
  * [All Users](#all-users-7)

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

### All Users

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

#### Feature Definition Example 3

```markdown
Given the Program Staff has accepted the terms and conditions  
And the Program Staff is viewing a Buyer profile  
When the Program Staff changes the Buyer's verification status using a dropdown  
Then the Buyer's verification status is changed to the Program Staff's selection.
```

#### Tips for Writing Feature Definitions

- Always capitalise user personas, and refer to them explicitly. For example, "Given the **P**rogram **S**taff...". i.e. Never refer to users with pronouns (e.g. "they").
- Each clause in a feature definition should be separated by a new line (two blank spaces at the end of each line in Markdown).
- Multiple features should be separated by a paragraph (a full blank line between feature definitions in Markdown).
- Other than capitalisation, feature definitions (generally) do not require punctuation, except for a full stop at the end of the definition.

## Specifications

### User Management

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

### All Users

TODO

### Requests for Information

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

### All Users

TODO

### Requests for Information Responses

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

### All Users

TODO

### Discovery Day Sessions

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

### All Users

TODO

### Discovery Day Sessions

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

### All Users

TODO

### Vendor-Initiated Ideas

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

### All Users

TODO

### Static Pages

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

### All Users

TODO

### Feedback

#### Program Staff

TODO

#### Buyers

TODO

#### Vendors

TODO

#### Anonymous Users

TODO

### All Users

TODO
