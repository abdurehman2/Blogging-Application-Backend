const mongoose = require("mongoose");
const commentSchema = require("./comments");
const ratingSchema = require("./ratings");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  comments: [commentSchema],
  ratings: [ratingSchema],
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
