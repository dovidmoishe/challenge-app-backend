const mongoose = require("mongoose");

const Image = mongoose.Schema({
  image: String,
});

module.exports = mongoose.model("Image", Image);
