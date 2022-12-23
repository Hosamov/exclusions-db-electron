// Helper script for tracking textarea characters in new-exclusion.pug and
// edit-exclusion.pug

const description = document.querySelector('.description');
const number = document.querySelector('.number');

// Set initial value
number.innerHTML = `<em>(${540 - description.value.length})</em>`;

description.addEventListener('input', (event) => {
  number.innerHTML = `<em>(${540 - event.target.value.length})</em>`;
});
