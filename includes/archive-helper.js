const moment = require('moment');

//* Archive Helper function
function archiveHelper(date)  {
  const currentDate = new Date();
  const expDate = new Date(moment(date).format('YYYY-MM-DD'));
  return currentDate > expDate;
}

module.exports = archiveHelper;