# Habemus auth

# development
`gulp develop`

# reference: [parse.com errors](https://parse.com/docs/js/api/classes/Parse.Error.html)

[link](https://parse.com/docs/dotnet/api/html/T_Parse_ParseException_ErrorCode.htm)

  Member name Value Description
OtherCause  -1  Error code indicating that an unknown error or an error unrelated to Parse occurred.
InternalServerError 1 Error code indicating that something has gone wrong with the server. If you get this error code, it is Parse's fault. Please report the bug to https://parse.com/help.
ConnectionFailed  100 Error code indicating the connection to the Parse servers failed.
ObjectNotFound  101 Error code indicating the specified object doesn't exist.
InvalidQuery  102 Error code indicating you tried to query with a datatype that doesn't support it, like exact matching an array or object.
InvalidClassName  103 Error code indicating a missing or invalid classname. Classnames are case-sensitive. They must start with a letter, and a-zA-Z0-9_ are the only valid characters.
MissingObjectId 104 Error code indicating an unspecified object id.
InvalidKeyName  105 Error code indicating an invalid key name. Keys are case-sensitive. They must start with a letter, and a-zA-Z0-9_ are the only valid characters.
InvalidPointer  106 Error code indicating a malformed pointer. You should not see this unless you have been mucking about changing internal Parse code.
InvalidJSON 107 Error code indicating that badly formed JSON was received upstream. This either indicates you have done something unusual with modifying how things encode to JSON, or the network is failing badly.
CommandUnavailable  108 Error code indicating that the feature you tried to access is only available internally for testing purposes.
NotInitialized  109 You must call Parse.initialize before using the Parse library.
IncorrectType 111 Error code indicating that a field was set to an inconsistent type.
InvalidChannelName  112 Error code indicating an invalid channel name. A channel name is either an empty string (the broadcast channel) or contains only a-zA-Z0-9_ characters and starts with a letter.
PushMisconfigured 115 Error code indicating that push is misconfigured.
ObjectTooLarge  116 Error code indicating that the object is too large.
OperationForbidden  119 Error code indicating that the operation isn't allowed for clients.
CacheMiss 120 Error code indicating the result was not found in the cache.
InvalidNestedKey  121 Error code indicating that an invalid key was used in a nested JSONObject.
InvalidFileName 122 Error code indicating that an invalid filename was used for ParseFile. A valid file name contains only a-zA-Z0-9_. characters and is between 1 and 128 characters.
InvalidACL  123 Error code indicating an invalid ACL was provided.
Timeout 124 Error code indicating that the request timed out on the server. Typically this indicates that the request is too expensive to run.
InvalidEmailAddress 125 Error code indicating that the email address was invalid.
DuplicateValue  137 Error code indicating that a unique field was given a value that is already taken.
InvalidRoleName 139 Error code indicating that a role's name is invalid.
ExceededQuota 140 Error code indicating that an application quota was exceeded. Upgrade to resolve.
ScriptFailed  141 Error code indicating that a Cloud Code script failed.
ValidationFailed  142 Error code indicating that a Cloud Code validation failed.
FileDeleteFailed  153 Error code indicating that deleting a file failed.
RequestLimitExceeded  155 Error code indicating that the application has exceeded its request limit.
InvalidEventName  160 Error code indicating that the provided event name is invalid.
UsernameMissing 200 Error code indicating that the username is missing or empty.
PasswordMissing 201 Error code indicating that the password is missing or empty.
UsernameTaken 202 Error code indicating that the username has already been taken.
EmailTaken  203 Error code indicating that the email has already been taken.
EmailMissing  204 Error code indicating that the email is missing, but must be specified.
EmailNotFound 205 Error code indicating that a user with the specified email was not found.
SessionMissing  206 Error code indicating that a user object without a valid session could not be altered.
MustCreateUserThroughSignup 207 Error code indicating that a user can only be created through signup.
AccountAlreadyLinked  208 Error code indicating that an an account being linked is already linked to another user.
InvalidSessionToken 209 Error code indicating that the current session token is invalid.
LinkedIdMissing 250 Error code indicating that a user cannot be linked to an account because that account's id could not be found.
InvalidLinkedSession  251 Error code indicating that a user with a linked (e.g. Facebook) account has an invalid session.
UnsupportedService  252 Error code indicating that a service being linked (e.g. Facebook or Twitter) is unsupported.



# [Firebase error codes](https://www.firebase.com/docs/java-api/javadoc/com/firebase/client/FirebaseError.html)
Modifier and Type Field and Description
static int  AUTHENTICATION_PROVIDER_DISABLED
The requested authentication provider is disabled for this Firebase.
static int  DATA_STALE
Internal use
static int  DENIED_BY_USER
The user did not authorize the application.
static int  DISCONNECTED
The operation had to be aborted due to a network disconnect
static int  EMAIL_TAKEN
The new user account cannot be created because the specified email address is already in use.
static int  EXPIRED_TOKEN
The supplied auth token has expired
static int  INVALID_AUTH_ARGUMENTS
The specified credentials are malformed or incomplete.
static int  INVALID_CONFIGURATION
The requested authentication provider is misconfigured, and the request cannot complete.
static int  INVALID_CREDENTIALS
The specified authentication credentials are invalid.
static int  INVALID_EMAIL
The specified email is not a valid email.
static int  INVALID_PASSWORD
The specified user account password is incorrect.
static int  INVALID_PROVIDER
The requested authentication provider does not exist.
static int  INVALID_TOKEN
The specified authentication token is invalid.
static int  LIMITS_EXCEEDED
Limited exceeded.
static int  MAX_RETRIES
The transaction had too many retries
static int  NETWORK_ERROR
The operation could not be performed due to a network error.
static int  OPERATION_FAILED
The server indicated that this operation failed
static int  OVERRIDDEN_BY_SET
The transaction was overridden by a subsequent set
static int  PERMISSION_DENIED
This client does not have permission to perform this operation
static int  PREEMPTED
The active or pending auth credentials were superseded by another call to auth
static int  PROVIDER_ERROR
A third-party provider error occurred.
static int  UNAVAILABLE
The service is unavailable
static int  UNKNOWN_ERROR
An unknown error occurred.
static int  USER_CODE_EXCEPTION
An exception occurred in user code
static int  USER_DOES_NOT_EXIST
The specified user account does not exist.
static int  WRITE_CANCELED
The write was canceled locally