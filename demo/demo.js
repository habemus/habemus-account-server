// instantiate the service client
var auth = new HAuthClient({
  serverURI: 'http://localhost:4000/'
});

// auxiliary functions
function _validateEmail(email) {
  return email ? true : false;
}

function _validatePassword(password) {
  return password.length > 6;
}

function _validatePasswordConfirm(password, passwordConfirm) {
  return password === passwordConfirm;
}

// signup
var signup                = document.querySelector('#signup');
var signupEmail           = document.querySelector('#signup-email');
var signupPassword        = document.querySelector('#signup-password');
var signupPasswordConfirm = document.querySelector('#signup-password-confirm');

function clearSignup() {
  signupEmail.value = '';
  signupPassword.value = '';
  signupPasswordConfirm.value = '';
}

signup.addEventListener('submit', function (e) {
  e.preventDefault();
  e.stopPropagation();

  var emailValid        = _validateEmail(signupEmail.value);
  var passowrdValid     = _validatePassword(signupPassword.value);
  var passowrdConfirmed = _validatePasswordConfirm(signupPassword.value, signupPasswordConfirm.value);

  // if (!emailValid) {
  //   alert('email invalid');

  //   return;
  // }

  // if (!passowrdValid) {
  //   alert('password invalid');

  //   return;
  // }

  if (!passowrdConfirmed) {
    alert('password not confirmed');

    return;
  }

  auth.signUp(signupEmail.value, signupPassword.value, {
    email: signupEmail.value
  })
  .then(function (res) {
    alert('signup success');

    clearSignup();
    console.log('signup successful', res);
  }, function (err) {
    console.log('signup error', err);
  });

});

// login
var login = document.querySelector('#login');
var loginEmail = document.querySelector('#login-email');
var loginPassword = document.querySelector('#login-password');

function clearLogin() {
  loginEmail.value = '';
  loginPassword.value = '';
}

login.addEventListener('submit', function (e) {
  e.preventDefault();
  e.stopPropagation();

  var emailValid = _validateEmail(loginEmail.value);

  auth.logIn(loginEmail.value, loginPassword.value)
    .then(function (res) {
      alert('login success')
 

      clearLogin();
      console.log(res);
    }, function (err) {
      alert('login error');
      console.log(err);
    });
});

// logout
var logout = document.querySelector('#logout');

logout.addEventListener('click', function (e) {
  auth.logOut()
    .then(function (res) {
 
    }, function (err) {

    });
});

// handle login status changes
var userArea    = document.querySelector('#user-area');
var loginStatus = document.querySelector('#login-status');
var showUsername  = document.querySelector('#show-username');
var showCreatedAt = document.querySelector('#show-created-at');
var showVerifiedAt = document.querySelector('#show-verified-at');

auth.on('auth-status-change', _handleAuthStatusChange)
function _handleAuthStatusChange () {

  console.log('handle auth-status-change');


  auth.getCurrentUser()
    .then(function (user) {

      showUsername.innerHTML  = user.username;
      showCreatedAt.innerHTML = user.createdAt;
      showVerifiedAt.innerHTML = user.verifiedAt;

      signup.hidden = true;
      login.hidden = true;
      userArea.hidden = false;
      loginStatus.innerHTML = 'logged in';
    }, function (err) {

      showUsername.innerHTML  = '';
      showCreatedAt.innerHTML = '';

      signup.hidden = false;
      login.hidden = false;
      userArea.hidden = true;
      loginStatus.innerHTML = 'not logged in';
    });

  // if (auth.isAuthenticated()) {

  // } else {
  // }
}


// // initialization
// function _init() {
//   _handleAuthStatusChange();
// }

// _init();
