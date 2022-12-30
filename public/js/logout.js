const logoutIcon = document.querySelector('#logout-icon');
const logoutForm = document.querySelector('#logout');

logoutIcon.addEventListener('click', (e) => {
  logoutForm.submit();
});