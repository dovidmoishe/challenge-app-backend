const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validateSignUp, validateLogin } = require("../utils/validation");
const Challenge = require("../models/Challenge");
const verifyjwt = require("../utils/middlewares/verifyjwt");

router.post("/signup", async (req, res) => {
  const { name, username, email, bio, password } = req.body;

  const { error } = validateSignUp(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const emailExists = await User.findOne({ email: email });
  const usernameExists = await User.findOne({ username: username });
  if (emailExists)
    return res.status(400).send("Email is already being used by another user");
  if (usernameExists)
    return res
      .status(400)
      .send("Username is already being used bu another user, pick another one");

  const salt = await bcrypt.genSalt(10);
  const HashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    name: name,
    username: username,
    email: email,
    bio: bio,
    password: HashedPassword,
  });

  try {
    const newUser = await user.save();
    console.log(newUser);
  } catch (err) {
    console.log({ message: err.message });
  }
  const token = jwt.sign(
    { _id: user._id, username: user.username },
    process.env.TOKEN_SECRET
  );
  res.json({ token: token });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { error } = validateLogin(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: email });
  if (!user) return res.status(400).send("Email is not found");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).send("Invalid Password");

  const token = jwt.sign(
    { _id: user._id, username: user.username },
    process.env.TOKEN_SECRET
  );
  res.json({ token: token });
});

router.get("/:username", async (req, res) => {
  const usernameParam = req.params.username;

  try {
    const user = await User.findOne({ username: usernameParam });

    const { name, username, bio } = user;

    const UserChallenges = await Challenge.find({
      createdBy: usernameParam,
      visibility: true,
    });

    res.json({
      userData: {
        name: name,
        username: username,
        bio: bio,
      },
      UserChallenges: UserChallenges,
    });
  } catch (error) {
    res.send(error.message);
  }
});

router.patch("/updateProfile", verifyjwt, async (req, res) => {
  const myProfile = await User.findOne({ username: req.user.username });

  try {
    const updatedInfo = req.body;
    await User.findByIdAndUpdate(myProfile._id, updatedInfo);
    res.send("Profile updated successfully");
  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;
