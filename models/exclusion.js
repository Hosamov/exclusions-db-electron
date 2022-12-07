const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExclusionSchema = new Schema({
  name: String,
  dob: String,
  other_info: String,
  ordinance: String,
  description: String,
  date_served: { type: Date, default: Date.now() },
  exp_date: { type: Date, default: Date.now() },
  length: String,
  other_length: Number,
  img_url: String,
});

module.exports = mongoose.model('Exclusion', ExclusionSchema, 'exclusions');
