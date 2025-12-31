const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  username: String,
});

const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}).select("_id username");
    if (!users) {
      res.send("No user found");
    } else {
      res.json(users);
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/users", async (req, res) => {
  console.log(req.body);
  const userObj = new User({ username: req.body.username, _id: req.body._id });

  try {
    const user = await userObj.save();
    console.log(user);
    res.json(user);
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log("Could not find user");
    } else {
      const exerciseObj = new Exercise({
        userId,
        description,
        duration: parseInt(duration),
        date: date ? new Date(date) : new Date(),
      });

      const exercise = await exerciseObj.save();

      res.json({
        _id: userId,
        username: user.username,
        date: exercise.date.toDateString(),
        duration: exercise.duration,
        description: exercise.description,
      });
    }
  } catch (error) {
    console.log(error);
    res.send("There was an error saving the exercise");
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;
  const user = await User.findById(userId);
  if (!user) {
    res.send("User not found");
    return;
  }

  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to);
  }

  let filter = { userId };

  if (from || to) {
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500);

  res.json({
    _id: userId,
    username: user.username,
    count: exercises.length,
    log: exercises.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
