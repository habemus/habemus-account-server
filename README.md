# Habemus account API

The account API is responsible for managing data that concerns the USER.
All information related to the user MUST be stored in databases managed by
h-account api.

H-Account is responsible for managing authentication and authentication tokens
as well.

## Sign-up
- once a user creates an account, the account is marked as unverified
- an account's email MUST be unique
- an account's usernamer MUST be unique
- the uniqueness of both account email and account username is considered
  only among unique accounts
- username and e-mail MUST NOT be modifiable after the account has been created:
  the only way of using an account with a different email OR username is for the
  user to create another account.

## E-mail verification
  - once a new account is created, the verification email is sent to the account's email
  - the email MUST contain a URL which has the verification code as a query string parameter
  - once the user accesses the URL, the server MUST verify the verification code against
    the given account
  - in case the verification fails, the browser MUST be redirected to a page informing that
    the verification has failed
  - in case the verification succeeds, the browser MUST be redirected to a page informing
    that the verification has succeeded with the following characteristics:
    - The url displayed in the browser MUST NOT have the verification code
    - the webpage MUST have a link to the projects dashboard
  - the e-mail verification process MUST expire after 1 day, time period after which
    the unverified account MUST be deleted in case it has not been verified

## Log-in
- the login API call returns to the client a JWT token that contains the user's basic
  data: username, email and _id
- the token MUST be stored by the client and used in further API requests
  in the Authorization Bearer flow
- once the token expires, the user MUST re-authenticate itself to obtain
  a new token
- in case the user logs into the system using an unverified account
  all system resources MUST be blocked prior to the verification is successful
  - the user MUST be capable of requesting the e-mail verification e-mail to be sent again
  - the user MUST be capable of logging out
  - the user MUST be capable of logging out and creating another account

## Log-out
- the logout API call blacklists the given token for further usage
- the client MUST destroy the token from its local storage
- if any API calls further happen with the blacklisted token, it MUST be rejected

## Password reset ** Demands further study
- the password reset API call sends an email to the requested email with an URL that has
  a password-reset code.
- the password-reset code MUST be submited to the server along with the account's data
