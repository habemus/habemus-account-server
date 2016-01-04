// maybe not the best reference (it is for dotnet), but 
// that's all that I (Simon) could find online.
// http://parse.com/docs/dotnet/api/html/T_Parse_ParseException_ErrorCode.htm

'use strict';

var PARSE_COM_ERROR_CODES = {
  '202': 'USERNAME_TAKEN',
  '203': 'EMAIL_TAKEN',
};

module.exports = function retrieveErrorName(code) {
  return PARSE_COM_ERROR_CODES[code];
};