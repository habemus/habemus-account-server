// native dependencies
const assert = require('assert');

// third-party dependencies
const should = require('should');

// own dependencies
const HAuthError = require('../../../shared/errors');

describe('HAuthError', function () {

  it('should throw a TypeError if the ErrorCode is not defined', function () {
    assert.throws(function () {
      new HAuthError('UnknownErrorCode');
    }, TypeError);
  });

  it('should store a code property', function () {
    var err = new HAuthError('UsernameMissing');

    err.code.should.equal('UsernameMissing');
  });
});