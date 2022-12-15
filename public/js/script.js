const copyright = document.querySelector('.copyright');

// Date code:
const date = new Date();
const thisYear = date.getFullYear();

copyright.innerHTML = `© Copyright ${thisYear}, <a href="https://www.backyarddev.io/" target="_blank"> BackyardDev`;