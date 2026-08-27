const mongoose = require('mongoose');

const explanationSchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  definition: {
    type: String,
    required: true
  },
  whatItIndicates: {
    type: String,
    required: true
  },
  whyItMatters: {
    type: String,
    required: true
  },
  example: {
    type: String,
    required: true
  },
  caution: {
    type: String,
    required: true
  }
});

module.exports = mongoose.models.Explanation || mongoose.model('Explanation', explanationSchema);
