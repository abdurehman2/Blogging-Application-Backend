const express = require("express");
const User = require("../models/user");
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

router.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
});

module.exports = router;
