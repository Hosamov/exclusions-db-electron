//** Validation for password:
//* Credit: https://www.javascripttutorial.net/javascript-dom/javascript-form-validation/

const email = document.querySelector('#email');
const password = document.querySelector('#password');
const confirmPassword = document.querySelector('#confirm_password');

const form = document.querySelector('#signup');

/* Util functions */
const isRequired = value => value === '' ? false : true; // true if input arg is empty
const isBetween = (length, min, max) => length < min || length > max ? false: true; // fals if legn arg not between min and max

const isEmailValid = (email) => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
}

const isPasswordSecure = (password) => {
  const regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})');
  return regex.test(password);
}

const showError = (input, message) => {
  const formElement = input.parentElement;
  formElement.classList.remove('success');
  formElement.classList.add('error');

  const error = formElement.querySelector('small');
  error.textContent = message;
}

const showSuccess= (input, message) => {
  const formElement = input.parentElement;
  formElement.classList.remove('error');
  formElement.classList.add('success');

  // Hide the error message:
  const error = formElement.querySelector('small');
  error.textContent = '';
}

const checkEmail = () => {
  let valid = false;
  const username = email.value.trim();
  if(!isRequired(email)) {
    showError(email, 'Email cannot be blank.');
  } else if (!isEmailValid(username)) {
    showError(email, 'Email is not valid.');
  } else {
    showSuccess(email);
    valid = true;
  }
  return valid;
}

const checkPassword = () => {
  let valid = false;
  const pwd = password.value.trim();
  if(!isRequired(password)) {
    showError(password, 'Password cannot be blank.');
  } else if(!isPasswordSecure(pwd)) {
    showError(password, 'Password must have at least 8 characters that include at least 1 uppercase characters, 1 number, and 1 special character (!@#$%^&*)'); 
  } else {
    showSuccess(password);
    valid = true;
  }
  return valid;
}

checkConfirmPassword = () => {
  let valid = false;
  // check confirm password
  const confirmPwd = confirmPassword.value.trim();
  const pwd = password.value.trim();

  if(!isRequired(confirmPassword)) {
    showError(confirmPassword, 'Please enter the password again');
  } else if (pwd !== confirmPwd) {
    showError(confirmPassword, 'Confirm password does not match');
  } else {
    showSuccess(confirmPassword);
    valid = true;
  }
  return valid;
}

// Form Event listener:
form.addEventListener('submit', (event) => {
  event.preventDefault(); // prevent form from submitting
  // validate forms:
  let isEmailValid = checkEmail(),
      isPasswordValid = checkPassword(),
      isConfirmPasswordValid = checkConfirmPassword();

  let isFormValid = isEmailValid && 
      isPasswordValid && 
      isConfirmPasswordValid;

  // submit to the server if the form is valid
  if (isFormValid) {
    document.getElementById('signup').submit();
  }
});

// Debounce function to boost User experience:
const debounce = (fn, delay = 500) => {
  let timeoutId;
  return(...args) => {
    // cancel prev timer
    if(timeoutId) clearTimeout(timeoutId);
     //setup a new timer
    timeoutId = setTimeout(() => {
      fn.apply(null, args)
    }, delay);
  }
}

// Input Event Listener:
form.addEventListener('input', debounce(function(event) {
  switch (event.target.id) {
    case 'email':
      checkEmail();
      break;
    case 'password':
      checkPassword();
      break;
    case 'confirm_password':
      checkConfirmPassword();
      break;
  }
}));
