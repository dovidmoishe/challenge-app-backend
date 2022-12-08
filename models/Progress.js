const mongoose = require("mongoose");

const Progress = mongoose.Schema({
  day: Number,
  date: String,
  text: String,
  image: String,
  link: String,
  progressFor: String,
});

module.exports = mongoose.model("progress", Progress);
