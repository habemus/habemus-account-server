console.log(':)');
console.log(CLIENT);

var c = new CLIENT();

c.who(function (err, res) {
  console.log(err, res.body)
})