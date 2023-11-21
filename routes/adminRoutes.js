const express = require("express");
const User = require("../models/user");
const Blog = require("../models/blog");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const auth = require("../middleware/auth");
const config = process.env;
const router = express.Router();

// Admin Login
router.post("/login", async (req, res) => {
  // Our login logic starts here
  try {
    // Get user input
    const { email, password } = req.body;
    // Validate user input
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });
    if (user) {
      const token = jwt.sign({ user_id: user._id, email }, config.TOKEN_KEY, {
        expiresIn: "2h",
      });
      user.token = token;
      return res.status(200).json({ user, token });
    }
    return res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
});

// View all users
router.get("/users", auth, async (req, res) => {
  const admin = await User.findById(req.user.user_id);
  try {
    if (admin) {
      const users = await User.find();
      res.json(users);
    } else {
      res.status(403).json({ message: "Only admin can access this route" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Block a user
router.put("/users/:userId/block", auth, async (req, res) => {
  const admin = await User.findById(req.user.user_id);
  try {
    // Check if the logged-in user is an admin
    if (!admin) {
      return res
        .status(403)
        .json({ message: "Only admin can access this route" });
    }

    const userId = req.params.userId;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role == "admin") {
      return res.status(404).json({ message: "Cannot block other admin" });
    }

    // Update the user's status to 'blocked'
    user.status = "blocked";
    await user.save();

    res.json({ message: "User blocked successfully", blockedUser: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all blog posts
router.get("/blog-posts", auth, async (req, res) => {
  const admin = await User.findById(req.user.user_id);
  try {
    if (admin) {
      const blogPosts = await Blog.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "created_by",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $addFields: {
            averageRating: {
              $avg: "$ratings.value",
            },
          },
        },
        {
          $project: {
            title: 1,
            author: "$author.username",
            created_at: 1,
            averageRating: 1,
          },
        },
      ]);

      console.log("blogPosts:", blogPosts); // Log the fetched blog posts

      res.json(blogPosts);
    } else {
      return res
        .status(403)
        .json({ message: "Only admin can access this route" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// View a particular blog post
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

// Disable a blog post
router.put("/blogs/:blogId/disable", auth, async (req, res) => {
  const admin = await User.findById(req.user.user_id);
  try {
    if (admin) {
      const blogId = req.params.blogId;

      // Check if the blog exists
      const blog = await Blog.findById(blogId);
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      // Update the blog's "disabled" status to true
      blog.disabled = true;
      await blog.save();

      res.json({ message: "Blog disabled successfully", disabledBlog: blog });
    } else {
      return res
        .status(403)
        .json({ message: "Only admin can access this route" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
