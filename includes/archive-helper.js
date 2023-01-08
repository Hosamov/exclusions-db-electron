const { ISO_8601 } = require("moment"); // automatically format for ISO
const moment = require("moment");

// addDays method for adding days if necessary:
Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

//* Archive Helper function
// Compare current date to expiration date and return a boolean value
function archiveHelper(date) {
  const thisDate = new Date();
  const currentDate = moment(thisDate).format(); 
  const expDate = moment(date).format(); 
  console.log(expDate);
  return currentDate > expDate; 
}

module.exports = archiveHelper;
