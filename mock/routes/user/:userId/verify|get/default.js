module.exports = function (options, req, res) {

  var msg = req.app.messageAPI.response.item({
    verified: true
  }, { verified: true })

  res.status(200).json(msg);
}