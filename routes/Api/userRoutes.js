const express = require("express");
const router = express.Router();
const { register, login, profile, updateProfile  } = require("../../controllers/Api/userController");

router.post("/register", register);
router.post("/login", login);
router.get("/profile/:id", profile);
router.post("/profile/update", updateProfile);

module.exports = router;
