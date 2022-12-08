const router = require("express").Router();
const Challenge = require("../models/Challenge");
const Progress = require("../models/Progress");
const Image = require("../models/Image");
const verifyjwt = require("../utils/middlewares/verifyjwt");
const { validateChallenge } = require("../utils/validation");

const checkUsersOnChallenge = async (username, name) => {
  const challenges = await Challenge.find({ name: name });
  let users = [];
  challenges.forEach((challenge) => {
    users.push(challenge.createdBy);
  });
  let filteredUsers = users.filter((user) => {
    return user !== username;
  });
  const numberOfUsers = filteredUsers.length;
  return numberOfUsers;
};

const checkProgressOnChallenge = async (challenge) => {
  let UserProgress = [];
  const progress = await Progress.find({ progressFor: challenge._id });
  for (let i = 0; i < progress.length; i++) {
    const { day, date, text, image, link } = progress[i];
    const ImageRef = await Image.findOne({ _id: image });
    const progressImage = ImageRef.image;

    const newProgressData = {
      day: day,
      date: date,
      text: text,
      image: progressImage,
      link: link,
    };

    UserProgress.push(newProgressData);
  }

  return UserProgress;
};

router.post("/new", verifyjwt, async (req, res) => {
  const username = req.user.username;
  const { name, duration, ends, description, tag, visibility } = req.body;
  const newChallenge = {
    name: name,
    createdBy: username,
    duration: duration,
    ends: ends,
    description: description,
    tag: tag,
    visibility: visibility,
  };
  const { error } = validateChallenge(newChallenge);
  if (error) return res.status(400).send(error.details[0].message);
  const challenge = new Challenge(newChallenge);
  try {
    await challenge.save();
    res.send("challenge created successfully");
  } catch (err) {
    res.send(err);
  }
});

router.get("/me", verifyjwt, async (req, res) => {
  const username = req.user.username;
  try {
    const myChallenges = await Challenge.find({ createdBy: username });
    const myChallengesToReturn = [];
    for (let i = 0; i < myChallenges.length; i++) {
      const progress = await checkProgressOnChallenge(myChallenges[i]);
      myChallengesToReturn.push({
        challenge: myChallenges[i],
        progress: progress,
      });
    }
    res.json(myChallengesToReturn);
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/public", verifyjwt, async (req, res) => {
  const challenges = await Challenge.find({ visibility: true });
  const mappedChallenges = challenges.map((challenge) => {
    const { name } = challenge;
    return name;
  });
  const uniqueChallenges = [...new Set(mappedChallenges)];
  let publicChallenges = [];
  const howUsersDescribe = async (name) => {
    const challenge = await Challenge.find({ name: name, visibility: true });
    let descriptions = [];
    challenge.forEach((userChallenge) => {
      descriptions.push(userChallenge.description);
    });
    return descriptions;
  };

  for (let i = 0; i < uniqueChallenges.length; i++) {
    let numberOfUsersOnChallenge = await checkUsersOnChallenge(
      req.user.username,
      uniqueChallenges[i]
    );
    let howUsersDescribeChallenge = await howUsersDescribe(uniqueChallenges[i]),
      challenge = {
        challenge: uniqueChallenges[i],
        howUsersDescribe: howUsersDescribeChallenge,
        usersOnChallenge: numberOfUsersOnChallenge,
      };
    publicChallenges.push(challenge);
  }
  res.json(publicChallenges);
});
router.get("/challenge/:challengeId", verifyjwt, async (req, res) => {
  const challengeId = req.params.challengeId;
  try {
    const challenge = await Challenge.findById(challengeId);
    const { _id, name, createdBy, visibility } = challenge;
    const numberOfUsers = await checkUsersOnChallenge(req.user.username, name);

    if (req.user.username !== createdBy && visibility == false) {
      res.send(
        `This challenge is private and can only be viewed by @${createdBy}`
      );
    } else if (visibility == true) {
      const UserProgress = await checkProgressOnChallenge(challenge);
      res.json({
        challengeData: challenge,
        progressData: UserProgress,
        numberOfUsers: numberOfUsers,
      });
    }
  } catch (error) {
    res.send(error);
  }
});

router.delete("/challenge/:challengeId", verifyjwt, async (req, res) => {
  const { challengeId } = req.params;
  const { username } = req.user;
  try {
    const challenge = await Challenge.findOne({ _id: challengeId });
    if (username !== challenge.createdBy) {
      await Challenge.findByIdAndDelete(challengeId);
      res.status(200).send("challenge deleted successfully");
    } else {
      res.status(400).send("Only the creator of this chalenge can delete it");
    }
  } catch (error) {
    res.send(error.message);
  }
});
router.post("/challenge/progress/:challengeId", verifyjwt, async (req, res) => {
  const { challengeId } = req.params;
  const { username } = req.user;

  const { day, date, text, selectedImage, link } = req.body;

  const challenge = await Challenge.findOne({ _id: challengeId });

  if (username !== req.user.username) return null;

  try {
    const image = new Image({ image: selectedImage });
    await image.save();

    const progressData = {
      day: day,
      date: date,
      text: text,
      image: image._id,
      link: link,
      progressFor: challenge._id,
    };
    const progress = new Progress(progressData);

    progress.save();
    res.send("Progress added succefully");
  } catch (error) {
    res.send(error);
  }
});
router.patch(
  "/challenge/progress/:challengeId",
  verifyjwt,
  async (req, res) => {
    const { challengeId } = req.params;

    const challenge = await Challenge.findOne({ _id: challengeId });

    try {
      if (challenge.createdBy !== req.user.username) return null;

      await Challenge.findByIdAndUpdate(challengeId, { completed: true });
      res.send("Challenge completed successfully, congreats to you");
    } catch (error) {
      res.send(error.message);
    }
  }
);
module.exports = router;
