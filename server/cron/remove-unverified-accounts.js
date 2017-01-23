/**
 * This job removes all unverified accounts that have been created at least 24h ago.
 */

// third-party
const Bluebird = require('bluebird');
const CronJob = require('cron').CronJob;
const moment  = require('moment');
const ms      = require('ms');

module.exports = function (app, options) {

  const Account = app.services.mongoose.models.Account;

  var ACCOUNT_VERIFICATION_DURATION = options.accountVerificationDuration || '1 day';
  ACCOUNT_VERIFICATION_DURATION = typeof ACCOUNT_VERIFICATION_DURATION === 'string' ?
    ms(ACCOUNT_VERIFICATION_DURATION) : ACCOUNT_VERIFICATION_DURATION;

  // by default run every 30 minutes
  var CRON_REMOVE_UNVERIFIED_ACCOUNTS = options.cronRemoveUnverifiedAccounts || '00 30 * * * *';

  /**
   * Auxiliary function that fetches all unverified accounts to be removed.
   * @return {Bluebird -> Array}
   */
  function getUnverifiedAccounts() {

    var query = {
      createdAt: {
        $lte: moment().subtract(ACCOUNT_VERIFICATION_DURATION, 'ms').toDate(),
      }
    };

    Account.scopeQueryByStatuses(query, [
      app.constants.ACCOUNT_STATUSES.NEW,
      app.constants.ACCOUNT_STATUSES.VERIFYING,
    ]);

    return Account.find(query);
  }

  var job = new CronJob({
    cronTime: CRON_REMOVE_UNVERIFIED_ACCOUNTS,
    onTick: function() {
      return getUnverifiedAccounts().then((unverifiedAccounts) => {

        // remove at most 10 accounts at a time
        unverifiedAccounts = unverifiedAccounts.slice(0, 50);

        if (unverifiedAccounts.length > 0) {
          console.log('remove-unverified-accounts: remove accounts unverified for over the allowed time period ', unverifiedAccounts.map((account) => {
            return account.username;
          }));
          
          return Bluebird.all(unverifiedAccounts.map((account) => {
            return app.controllers.account.delete(account);
          }));
        }
      });
    },
    start: false,
  });
  job.start();

  return job;
};
