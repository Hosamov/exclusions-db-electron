const filterEl = document.getElementById('filter');
const sortEl = document.getElementById('srt');

//FIXME: Save these somehow, each change:
let filterSrt = {
  filter: '',
  srt: '',
};

function filterSort() {
  filterEl.addEventListener('change', (event) => {
    filterSrt.filter = event.target.value;
  })
  
  sortEl.addEventListener('change', (event) => {
    filterSrt.srt = event.target.value;
  })

  if(filterSrt.filter === '' || filterSrt.filter === null) filterSrt.filter = 'all';
  if(filterSrt.srt === '' || filterSrt.srt === null) filterSrt.srt = 'last_name';

  console.log(filterSrt);
  return filterSrt;
}
filterSort();


// location.href = `/home/exclusions/${filterSort()[0]}/${filterSort()[1]}`;

