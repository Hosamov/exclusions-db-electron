const moment = require('moment');

Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

//* Archive Helper function
function archiveHelper(date)  {
  const currentDate = new Date();
  const expDate = new Date(moment(date).format('YYYY-MM-DD'));
  const actualExpDate = expDate.addDays(1);
  return currentDate > actualExpDate;
}

module.exports = archiveHelper;