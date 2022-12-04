const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExclusionSchema = new Schema({
  name: String,
  dob: Date,
  other: String,
  description: String,
  date: Date,
  exp_date: Date,
  ex_length: Number,
  img: {
    data: Buffer,
    contentType: String,
  },
});

module.exports = mongoose.model('Exclusion', ExclusionSchema);
