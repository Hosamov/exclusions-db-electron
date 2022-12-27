//** Validation for password:

const password = document.getElementById('password');
const verifyPassword = document.getElementById('verify_password');
const checkmarkPass= document.querySelector('.fa-check-pass');
const exPass = document.querySelector('.fa-x-pass');
const checkmarkVerify = document.querySelector('.fa-check-verify');
const exVerify = document.querySelector('.fa-x-verify');

checkmarkPass.style.visibility = 'hidden';
exPass.style.visibility = 'hidden';
checkmarkVerify.style.visibility = 'hidden';
exVerify.style.visibility = 'hidden';

//* Check password integrity
password.addEventListener('keyup', (event) => {
  const passwordIsValid = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/i;
  if(event.target.value.match(passwordIsValid)) {
    checkmarkPass.style.visibility = 'visible';
    exPass.style.visibility = 'hidden';
  } else {
    checkmarkPass.style.visibility = 'hidden';
    exPass.style.visibility = 'visible';
  }
});

//* Check matching passwords
verifyPassword.addEventListener('keyup' || 'change', (event) => {
  if (password.value === event.target.value) {
    checkmarkVerify.style.visibility = 'visible';
    exVerify.style.visibility = 'hidden';
  } else {
    checkmarkVerify.style.visibility = 'hidden';
    exVerify.style.visibility = 'visible';
    console.log(password.value, event.target.value);
  }
});

if(verifyPassword.value !== password.value) exVerify.style.visibility = 'visible';
