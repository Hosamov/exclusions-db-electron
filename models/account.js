const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const Account = new Schema({
  username: String,
  password: String,
  role: String, //null, user, supervisor, admin
  active: Boolean,
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
