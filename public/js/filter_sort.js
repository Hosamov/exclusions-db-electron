const filterEl = document.getElementById('filter');
const sortEl = document.getElementById('srt');

// Initialize object for holding filter and sort
let filterSrt = {
  filter: '',
  srt: '',
};

/**
 * filterSort() function - returns object with two keys: Filter and Sort
 * params: none
 * returns: Object
 */
function filterSort() {
  // Event listener for filter element in user-home template
  filterEl.addEventListener('change', (event) => {
    filterSrt.filter = event.target.value;
  });

  // Event listener for srt (sort) element in user-home template
  sortEl.addEventListener('change', (event) => {
    filterSrt.srt = event.target.value;
  });

  // Handle unselected options:
  if (filterSrt.filter === '' || filterSrt.filter === null)
    filterSrt.filter = 'all';
  if (filterSrt.srt === '' || filterSrt.srt === null)
    filterSrt.srt = 'last_name';

  return filterSrt;
}

filterSort();
