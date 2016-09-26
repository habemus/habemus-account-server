

exports.decodeToken = function (authToken, token) {

  return new Bluebird((resolve, reject) => {

    superagent.post(this.serverURI + '/auth/token/decode')
      .send({
        token: token,
      })
      .set('Authorization', 'Bearer ' + authToken)
      .end((err, res) => {

        if (err) {
          if (res && res.body) {
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
