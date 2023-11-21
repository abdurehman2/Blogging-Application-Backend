const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Blog = require("../models/blog");
const router = express.Router();

// Create a new Blog Post
router.post("/posts", auth, async (req, res) => {
  const { title, description } = req.body;
  const newBlog = new Blog({
    title,
    description,
    created_by: new mongoose.Types.ObjectId(req.user.user_id),
  });
  try {
    await newBlog.save();
    res.json({ message: "Post created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Retrieve all blogs
router.get("/posts", async (req, res) => {
  try {
    let query = {};

    // Filtering by user
    if (req.query.user) {
      // Convert the user ID to a Mongoose ObjectId
      const userId = new mongoose.Types.ObjectId(req.query.user);
      query.created_by = userId;
    }

    // Sorting by date
    let sortOption = { created_at: -1 }; // Default sorting: latest first
    if (req.query.sort === "oldest") {
      sortOption = { created_at: 1 }; // Sorting: oldest first
    }

    const posts = await Blog.find(query).sort(sortOption);

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Retrieve a specific blog
router.get("/posts/:postId", async (req, res) => {
  const postID = req.params.postId;
  try {
    const post = await Blog.findById(postID);
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Pagination;
router.get("/posts", async (req, res) => {
  try {
    let { page, size, title } = req.query;
    page = parseInt(page, 10) || 1;
    size = parseInt(size, 10) || 10;
    const skip = (page - 1) * size;

    const filter = title ? { title: { $regex: title, $options: "i" } } : {};

    const blogPosts = await Blog.find(filter).skip(skip).limit(size);
    const total = await Blog.countDocuments(filter);

    res.json({
      totalPages: Math.ceil(total / size),
      currentPage: page,
      blogPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update Blog Post
router.put("/posts/:postId", auth, async (req, res) => {
  const postId = req.params.postId;
  const { title, description } = req.body;

  try {
    const blogPost = await Blog.findById(postId);
    console.log("Blog post created by:", blogPost.created_by.toString());
    console.log("User ID from token:", req.user.user_id);
    if (!blogPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has permission to update the post
    if (blogPost.created_by.toString() !== req.user.user_id) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to update this post",
      });
    }

    // Update the blog post
    blogPost.title = title;
    blogPost.description = description;

    await blogPost.save();

    res.json({ message: "Post updated successfully", updatedPost: blogPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Delete a Blog Post
router.delete("/posts/:postId", auth, async (req, res) => {
  const postId = req.params.postId;

  try {
    const blogPost = await Blog.findById(postId);

    if (!blogPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has permission to delete the post
    if (blogPost.created_by.toString() !== req.user.user_id) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to delete this post",
      });
    }

    // Delete the blog post
    await Blog.deleteOne({ _id: postId });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Post a Comment
router.post("/posts/:postId/comments", auth, async (req, res) => {
  const { text } = req.body;
  const comment = { text, postedBy: req.user.user_id };

  try {
    const blogPost = await Blog.findById(req.params.postId);
    blogPost.comments.push(comment);
    await blogPost.save();
    console.log(comment);
    res.json({ message: "Comment added successfully", comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Post a rating
router.post("/posts/:postId/ratings", auth, async (req, res) => {
  const { value } = req.body;
  const rating = { value, ratedBy: req.user.user_id };

  try {
    const blogPost = await Blog.findById(req.params.postId);
    blogPost.ratings.push(rating);
    await blogPost.save();

    res.json({ message: "Rating added successfully", rating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
