const filterEl = document.getElementById('filter');
const sortEl = document.getElementById('sort');

filterEl.addEventListener('change', (event) => {
  console.log(event.target.value);
  //TODO: Redirect to /home/:filter/:sort
})

sortEl.addEventListener('change', (event) => {
  console.log(event.target.value);
  //TODO: Redirect to /home/:filter/:sort
})
