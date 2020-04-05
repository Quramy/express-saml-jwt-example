# Express SAML JWT example

## Setup

```
$ docker-compose up
```

### Get certificate file for SAML login

1. Go to http://localhost:8080/auth/admin/master/console/#/realms/testrealm/keys
  - Pass `admin` to username and `admin` to password to login Keycloak administration console
  - Click "Certificate" button and copy it
1. Create dir `certs` at the project root and create a new file `certs/certificate` and paste the copied value

### Create test user

1. Go to http://localhost:8080/auth/admin/master/console/#/realms/testrealm/users 
1. Click "Add user" button and create a user for test
  - Email field is required
1. Click "Credentials" tab and set password for the user

## Run

```
$ npm i
$ npm run dev
```
