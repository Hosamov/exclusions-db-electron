const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const Exclusion = new Schema({
  name: String,
  dob: Date,
  other: String,
  description: String,
  date: Date,
  exp_date: Date,
  ex_length: Number,
  img: {
    data: Buffer,
    contentType: String
  }
});

Exclusion.plugin(passportLocalMongoose);

module.exports = mongoose.model('Exclusion', Exclusion);
