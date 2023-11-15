const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: String,
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = commentSchema;
