module.exports = function (options, req) {

  return {
    statusCode: 401,
    body: {
      code: 'InvalidToken',
    }
  }

}