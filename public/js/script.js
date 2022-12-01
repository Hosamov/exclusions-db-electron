const copyright = document.querySelector('.copyright');

// Date code:
const date = new Date();
const thisYear = date.getFullYear();

copyright.innerHTML = `© Copyright ${thisYear}, Matt Coale`;