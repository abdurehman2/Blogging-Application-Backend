const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  value: Number,
  ratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = ratingSchema;
