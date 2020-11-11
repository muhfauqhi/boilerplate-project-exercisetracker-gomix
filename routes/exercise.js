const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");

const router = express.Router();
const User = mongoose.model("User");
const Exercise = mongoose.model("Exercise");

router.post("/new-user", (req, res) => {
  const { username } = req.body;
  User.findOne({ username })
    .then((user) => {
      if (user) throw new Error("Username already taken");
      return User.create({ username });
    })
    .then((user) => {
      res.status(200).send({
        username: user.username,
        _id: user._id,
      });
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
});

router.post("/add", (req, res) => {
  let { userId, description, duration, date } = req.body;
  User.findOne({ _id: userId })
    .then((user) => {
      if (!user) throw new Error("Unknown userId");
      date = date || Date.now();
      return Exercise.create({
        description,
        duration,
        date,
        userId,
      });
    })
    .then((result) => {
      res.status(200).send({
        username: user.username,
        description,
        duration,
        _id: user._id,
        date: moment(result.date).format("ddd MMMM DD YYYY"),
      });
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
});

router.get("/log", (req, res) => {
  let { userId, from, to, limit } = req.query;
  from = moment(from, "YYYY-MM-DD").isValid() ? moment(from, "YYYY-MM-DD") : 0;
  to = moment(to, "YYYY-MM-DD").isValid()
    ? moment(to, "YYYY-MM-DD")
    : moment().add(1000000000000);
  User.findById(userId)
    .then((user) => {
      if (!user) throw new Error("Unknown user with _id");
      Exercise.find({ userId })
        .where("date")
        .gte(from)
        .lte(to)
        .limit(+limit)
        .exec()
        .then((log) =>
          res.status(200).send({
            _id: userId,
            username: user.username,
            count: log.length,
            log: log.map((o) => ({
              description: o.description,
              duration: o.duration,
              date: moment(o).format("ddd MMMM DD YYYY"),
            })),
          })
        );
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
});

router.get("/users", (req, res) => {
  User.find({}).then((user) => {
    if (!user) throw new Error("User empty");
    return res.status(200).send(user);
  });
});

module.exports = router;
