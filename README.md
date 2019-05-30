# Procurement Concierge

The Procurement Concierge is a web application that enables Buyers to work with Program Staff to publish Requests for Information, and for Vendors to respond to them.
In addition, Vendors can use this tool to publish their own ideas, enabling Program Staff to facilitate connections between Buyers and Vendors.

This document describes the project's developer environment, technical architecture and deployment infrastructure.

## Table of Contents

<!-- toc -->

- [Project Organisation](#project-organisation)
  * [Front-End (`src/front-end`)](#front-end-srcfront-end)
  * [Back-End (`src/back-end`)](#back-end-srcback-end)
    + [CRUD Resources](#crud-resources)
  * [Shared (`src/shared`)](#shared-srcshared)
- [Contributing](#contributing)
- [Development Environment](#development-environment)
  * [Dependencies](#dependencies)
  * [Quick Start](#quick-start)
  * [NPM Scripts](#npm-scripts)
  * [Environment Variables](#environment-variables)
- [Deployment](#deployment)
  * [Environments](#environments)
  * [Deployment Process](#deployment-process)
- [Team](#team)

<!-- tocstop -->

## Project Organisation

The Concierge is a full-stack TypeScript web application that uses MongoDB for persistence.
It is written in a functional and declarative style with the goal of maximising compile-time guarantees through type-safety.

![Concierge Architecture](https://github.com/BCDevExchange/concierge/blob/develop/docs/Concierge%20Architecture.svg)

The source code is split into three parts:

### Front-End (`src/front-end`)

A TypeScript single-page application using React, Immutable.js, Bootstrap and SASS.
The front-end is build system is executed by Grunt.

The front-end's state management framework (`src/front-end/lib/framework.tsx`) provides type-safe state management, and is heavily influenced by the [Elm Architecture](https://guide.elm-lang.org/architecture/). If you've used Redux before, you will find this to be very similar since Redux is also based on the Elm Architecture. The main difference is that this project's framework derives greater inspiration from the Elm Architecture and it aims to be far more type-safe than Redux.

![Concierge Front-End Architecture](https://github.com/BCDevExchange/concierge/blob/develop/docs/Front-End%20Architecture.svg)

### Back-End (`src/back-end`)

A TypeScript server that vends the front-end's build assets (`src/back-end/lib/routers/front-end.ts`) as well as a JSON CRUD API (`src/back-end/lib/resources/**.ts`) that performs business logic and persists data to a MongoDB database.

The server framework (`src/back-end/lib/server/index.ts`) provides type-safe abstractions for API development, and is executed by Express (`src/back-end/lib/server/adapters.ts`).

![Concierge Back-End Architecture](https://github.com/BCDevExchange/concierge/blob/develop/docs/Back-End%20Architecture.svg)

#### CRUD Resources

CRUD resources are created in a standardised, type-safe way in this project. CRUD abstractions are located in `src/back-end/lib/crud.ts`, and it is recommended to review this module prior to extending the API.

### Shared (`src/shared`)

The `src/shared` folder contains modules that expose types and functions that are used across the entire stack: front-end and back-end.

### Database Migrations (`migrations`)

All database migration logic is stored in the `migrations` folder. Migrations are managed by the `migrate` NPM module, and use the native MongoDB driver to execute them. You can create a migration using the following command:

```bash
npm run migrations:create -- <MIGRATION_NAME>
```

This command creates a migration file from a template and stores it at `migrations/migrations/{TIMESTAMP}_{MIGRATION_NAME}.ts`.

**DO NOT delete or change committed migration files. Creating and executing migrations is a stateful process, and, unless you know what you are doing, running a database migration should be viewed as an irreversible process.**

## Contributing

Features should be implemented in feature branches. Create a pull request against the `develop` branch to have your work reviewed for subsequent deployment.

The `develop` branch contains all approved code.

The `master` branch contains work that has passed the Quality Assurance process and is ready to be deployed to production.

Hotfixes can be merged directly to `master` via a pull request, but should be merged back into the `develop` branch as well.

## Development Environment

### Dependencies

If you are using NixOS or the Nix package manager, running `nix-shell` will install all necessary dependencies,
and drop you in a shell with them accessible in your `$PATH`.

If you are not using Nix, please ensure the following packages have been installed:

- Node.js 10.x
- SASS
- MongoDB 3.4.x
- Docker
- Docker Compose 3.x

Once complete, `cd` into this repository's root directory and proceed to install NPM dependencies:

```bash
npm install
```

### Quick Start

Once you have installed all necessary dependencies, create a `.env` file and replace the placeholder values with your credentials. Refer to the "Environment Variables" section below for further information.

```bash
cp sample.env .env
# Open .env in your text editor.
```

Finally, open three terminals and run the following commands:

```bash
docker-compose up # Terminal 1, starts a local MongoDB server.
npm run back-end:watch # Terminal 2, starts the back-end server.
npm run front-end:watch # Terminal 3, builds the front-end source code.
```

Then, visit the URL logged to your terminal to view the now locally-running web application.

You can stop (and wipe) the local MongoDB server by running `docker-compose down`.

### NPM Scripts

It is recommended that developers use the following scripts defined in `package.json` to operate this web application:

```bash
# Usage
npm run <SCRIPT_NAME>
```

| Script Name | Description |
|---|---|
| `start` | Runs the back-end server. |
| `front-end:lint` | Lints the front-end source code using tslint. |
| `front-end:typecheck` | Typechecks the front-end source code using tsc. |
| `front-end:test` | Runs unit tests for the front-end source code. |
| `front-end:build` | Builds the front-end using grunt. |
| `front-end:watch` | Builds the front-end using grunt, and rebuilds it whenever a front-end or shared source file changes. |
| `front-end:typedoc` | Builds TypeDoc API documentation for the front-end source code. |
| `back-end:lint` | Lints the back-end source code using tslint. |
| `back-end:typecheck` | Typechecks the back-end source code using tsc. |
| `back-end:test` | Runs unit tests for the back-end source code. |
| `back-end:start` | Starts the back-end server. |
| `back-end:watch` | Starts the back-end server inside a nodemon process, and restarts it whenever a back-end or shared source file changes. |
| `back-end:typedoc` | Builds TypeDoc API documentation for the back-end source code. |
| `shared:typedoc` | Builds TypeDoc API documentation for the shared source code. |
| `migrations:create` | Creates a migration file from a template in `migrations/migrations`. |
| `migrations:up` | Runs migrations using their exported `up` functions. |
| `typedoc:build` | Builds all TypeDoc API documentation. |
| `typedoc:start` | Serves TypeDoc documentation on a local server. |
| `docs:readme-toc` | Generate and insert a table of contents for README.md. |
| `docs:licenses` | Generate the list of licenses from this project's NPM dependencies in OPEN_SOURCE_LICENSES.txt. |

### Environment Variables

Developers can configure the following environment variables to alter how the web application is built and/or run.
All environment variables affect the back-end server's functionality, and are sanitised in `src/back-end/config.ts`.
`NODE_ENV` is the only environment variable that affects how the front-end source code is built.

In development, developers can create a `.env` file in the repository's root directory to configure environment variables.
As a convenience, developers can refer to `sample.env` as a guide.

| Name | Description |
|---|---|
| `NODE_ENV` | The back-end run-time's environment, or the front-end's build target. Possible values include either "development" or "production". |
| `SERVER_HOST` | The IPv4 address for the back-end to bind to. |
| `SERVER_PORT` | The TCP port for the back-end to bind to. |
| `BASIC_AUTH_USERNAME` | An HTTP basic auth username to limit access to the web application. |
| `BASIC_AUTH_PASSWORD_HASH` | A password hash to authenticate HTTP basic auth passwords to limit access to the web application. |
| `MONGO_URL` | The MongoDB database to connect to. |
| `DATABASE_SERVICE_NAME` | Auto-generated by OpenShift. |
| `${DATABASE_SERVICE_NAME}_SERVICE_HOST` | The MongoDB host to connect to in OpenShift. |
| `${DATABASE_SERVICE_NAME}_SERVICE_PORT` | The MongoDB port to connect to in OpenShift. |
| `MONGODB_USER` | The MongoDB user to connect with in OpenShift. |
| `MONGODB_PASSWORD` | The MongoDB password to connect with in OpenShift. |
| `MONGODB_DATABASE_NAME` | The MongoDB database to connect to in OpenShift. |
| `TOKEN_SECRET` | The secret used to hash ForgotPasswordTokens. |
| `COOKIE_SECRET` | The secret used to hash cookies. |
| `FILE_STORAGE_DIR` | The location to store uploaded files. |
| `MAILER_GMAIL_USER` | A GMail SMTP username to test transactional emails in development. |
| `MAILER_GMAIL_PASS` | A GMail SMTP password to test transactional emails in development. |
| `MAILER_HOST` | SMTP server host for transactional emails in production. |
| `MAILER_PORT` | SMTP server port for transactional emails in production. |
| `MAILER_FROM` | The sender for transactional emails. |
| `MAILER_ROOT_URL` | The domain used for links in transactional email bodies. |

## Deployment

This project is deployed to the Government of British Columbia's own OpenShift infrastructure.

### Environments

We have four environments:

| OpenShift Project | Name | URL |
|---|---|---|
| akpalw-dev | Development | https://concierge-dev.pathfinder.gov.bc.ca |
| akpalw-test | Test | https://concierge-test.pathfinder.gov.bc.ca |
| akpalw-prod | Staging | https://concierge-staging.pathfinder.gov.bc.ca |
| akpalw-prod | Production | https://concierge.pathfinder.gov.bc.ca |

The Test and Staging environments share the same database instance, whereas the Development and Production environments have their own databases.

The Development, Test and Staging environments are secured behind HTTP Basic Auth. Please contact a team member to access these credentials.

### Deployment Process

The "akpalw-tools" OpenShift project is used to trigger the deployment process for all environments.

To deploy to the Development environment, start a build for "akpalw-dev", and OpenShift will build and deploy HEAD from the `develop` branch.

To deploy to the Production environment, merge the `develop` branch into the `master` branch. "akpalw-prod" has been configured to start the deployment process for production automatically when commits are made to the `master` branch. Note that the Production deployment process first deploys to the Staging environment, and requires approval before the deployment continues to the Production environment.

#### Running Database Migrations

Using an environment's deployment shell, run `npm run migrations:up` in the root of this repository's directory. It is recommended to run a migration prior to deploying code that depends on the changes effected by that migration.

## Team

The Procurement Concierge is currently operated by the BC Developers Exchange within the Government of British Columbia.

This project was originally built by the digital product development team at [Real Folk](https://www.realfolk.io).
