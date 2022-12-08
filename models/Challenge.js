const mongoose = require("mongoose");

const Challenge = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  started: {
    type: String,
    default: new Date().toDateString(),
  },
  ends: String,
  description: {
    type: String,
  },
  tag: [String, String],
  visibility: {
    type: Boolean,
    default: true,
  },
  completed: Boolean,
});

module.exports = mongoose.model("Challenge", Challenge);
