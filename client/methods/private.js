// third-party
const Bluebird   = require('bluebird');
const superagent = require('superagent');

/**
 * Decodes a token and verifies its validity.
 * 
 * @param  {String} authToken Private authentication token
 * @param  {String} token     Token to be decoded
 * @return {Bluebird -> tokenData}
 */
exports.decodeToken = function (authToken, token) {

  return new Bluebird((resolve, reject) => {

    superagent.post(this.serverURI + '/auth/token/decode')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        token: token,
      })
      .end((err, res) => {

        if (err) {
          if (res && res.body && res.body.error) {
            reject(res.body.error);
          } else {
            reject(err);
          }
        } else {
          resolve(res.body.data);
        }

      });
  });

};
