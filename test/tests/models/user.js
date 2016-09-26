// native dependencies
const assert = require('assert');

// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');

// auxiliary
const aux = require('../../auxiliary');

const hAccountApp = require('../../../');

const REQUIRED_OPTIONS = {
  apiVersion: '0.0.0',
  mongodbURI: 'mongodb://localhost:27017/h-auth-test-db',
  secret: 'fake-secret',

  nodemailerTransport: stubTransort(),
  fromEmail: 'from@dev.habem.us',

  host: 'http://localhost'
};

describe('User Model#setAccountActive', function () {

  it('should modify the user.status', function () {
    var app = hAccountApp(REQUIRED_OPTIONS);

    var User = app.models.User;

    var user = new User({});

    user.setAccountActive('SomeReason');

    var status = user.get('status');

    status.value.should.equal(app.constants.ACCOUNT_STATUSES.ACTIVE);
    status.reason.should.equal('SomeReason');
  });

  it('should require a reason', function () {
    var app = hAccountApp(REQUIRED_OPTIONS);

    var User = app.models.User;

    var user = new User({});

    assert.throws(function () {
      user.setAccountActive();
    });
  });

});