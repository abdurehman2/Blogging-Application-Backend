const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const blogRoutes = require("./routes/blogRoutes");
const adminRoutes = require("./routes/adminRoutes");
const mongoose = require("mongoose");
const app = express();

mongoose
  .connect("mongodb://127.0.0.1:27017/BlogApp", { useNewUrlParser: true })
  .then(() => console.log("Success"))
  .catch(() => console.log("Error"));

app.use(express.json());
app.use(bodyParser.json());
app.use("/", userRoutes);
app.use("/blogs", blogRoutes);
app.use("/admin", adminRoutes);

app.listen(3000, () => {
  console.log("Port running on 3000");
});
