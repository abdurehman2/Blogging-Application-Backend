const express = require("express");
const User = require("../models/user");
const Blog = require("../models/blog");
const Notification = require("../models/notification");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const auth = require("../middleware/auth");
const config = process.env;
const router = express.Router();

// Create new User
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let role;
    if (!role == req.body) {
      role = "user";
    } else {
      role = "admin";
    }
    if (!email && !password && !username) {
      res.status(400).send("All input is required");
    }
    const oldUser = await User.findOne({ username });
    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }
    const user = await User.create({
      username: username,
      email: email,
      password: password,
      role,
    });

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    console.log(token);
    user.token = token;
    res.status(201).json({ user, token });
  } catch (err) {
    console.log(err);
  }
});

// Get a User
router.get("/users/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Update a User
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { username, email, password },
      { new: true }
    );
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Login
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
      if (user.status === "blocked") {
        return res.status(400).send("You've been blocked");
      }
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

// Follow a User
router.post("/follow/:userId", auth, async (req, res) => {
  const followerId = req.user.user_id; // Current user ID (follower)
  const bloggerId = req.params.userId; // ID of the blogger to be followed

  try {
    // Check if the blogger to be followed exists
    const blogger = await User.findById(bloggerId);
    if (!blogger) {
      return res.status(404).json({ message: "Blogger not found" });
    }

    // Check if the user is trying to follow themselves
    if (followerId.toString() === bloggerId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if the user is already following the blogger
    if (blogger.followers.includes(followerId)) {
      return res
        .status(400)
        .json({ message: "You are already following this blogger" });
    }

    // Update the blogger's followers list
    blogger.followers.push(followerId);
    await blogger.save();

    // Update the follower's following list
    const follower = await User.findById(followerId);
    follower.following.push(bloggerId);
    await follower.save();

    // Create a new follow notification
    const notification = new Notification({
      type: "follow",
      message: `${req.user.username} started following you.`,
    });

    // Save the notification and add its reference to the user's notifications array
    await notification.save();
    blogger.notifications.push(notification._id);
    await blogger.save();

    res.json({ message: "You are now following the blogger" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get User Feed
router.get("/feed", auth, async (req, res) => {
  const userId = req.user.user_id; // Current user ID

  try {
    // Find the current user to get the list of followed bloggers
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract blogger IDs from the following list
    const bloggerIds = currentUser.following;

    // Ensure bloggerIds is an array and not empty
    if (!Array.isArray(bloggerIds) || bloggerIds.length === 0) {
      return res
        .status(200)
        .json({ message: "User is not following any bloggers", feed: [] });
    }

    const feed = await Blog.find({ created_by: { $in: bloggerIds } })
      .sort({ created_at: -1 })
      .populate("created_by", "username");

    res.json(feed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Endpoint to retrieve notifications for the current user
router.get("/notifications", auth, async (req, res) => {
  const userId = req.user.user_id; // Current user ID

  try {
    // Find the current user to get their notifications
    const user = await User.findById(userId).populate("notifications");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
});

module.exports = router;
