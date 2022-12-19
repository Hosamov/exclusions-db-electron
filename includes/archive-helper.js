const moment = require('moment');

//* Archive Helper function
function archiveHelper(date1, date2) {
  const dateOne = new Date(moment(date1).format('YYYY-MM-DD'));
  const dateTwo = new Date(moment(date2).format('YYYY-MM-DD'));
  console.log(dateOne, dateTwo);
  // Take two date params to compare
  // Check first argument vs second
    // if first argument is greater than second, return false
    // else
    // return true

    //Note: May need to convert date somehow to make this work properly.
}

module.exports = archiveHelper;