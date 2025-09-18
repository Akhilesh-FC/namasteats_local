const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../../config/db"); // mysql connection
const fs = require("fs");
const path = require("path");

// ✅ Register without u_id
const register = async (req, res) => {
  try {
    const { name, email, mobile_no } = req.body;

    // ✅ Name required
    if (!name) {
      return res.status(200).json({ status: false, message: "name is required" });
    }

    // ✅ Check unique constraints
    if (mobile_no) {
      const existingMobile = await User.findOne({ where: { mobile_no } });
      if (existingMobile) {
        return res.status(200).json({ status: false, message: "mobile_no already exists" });
      }
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(200).json({ status: false, message: "email already exists" });
      }
    }

    // ✅ Create user (email & mobile optional)
    const user = await User.create({
      name,
      email: email || null,
      mobile_no: mobile_no || null,
    });

    // ✅ Response same as Laravel
    return res.status(200).json({
      status: true,
      message: "Registration successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile_no: user.mobile_no,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};


// Login
const login = async (req, res) => {
	console.log("req.params", req.params);
  try {
    const { mobile_no, email } = req.body;
	  console.log("req.body", req.body)

    // Step 1: Validation (either mobile_no or email required)
    if (!mobile_no && !email) {
      return res.status(200).json({
        status: false,
        field: "mobile_no / email",
        message: "Either mobile_no or email is required",
        login_status: 0,
        user_id: null
      });
    }
console.log("yaha tk pahuh gye h ")
    // Step 2: FCM token from headers
	  const fcmToken =
  req.headers["fcm_token"] || req.headers["fcm-token"];

	  console.log("fcmTokenfcmToken",fcmToken)
    if (!fcmToken) {
      return res.status(200).json({
        status: false,
        field: "fcm_token",
        message: "FCM token is required in h",
        login_status: 0,
        user_id: null
      });
    }

    let user;
    if (mobile_no) {
      user = await User.findOne({ where: { mobile_no } });
    }
    if (!user && email) {
      user = await User.findOne({ where: { email } });
    }

   
    if (user) {
      await user.update({ fcm_token: fcmToken });

      return res.status(200).json({
        status: true,
        message: "Login successful",
        fcm_token: user.fcm_token,
        login_status: 1,
        user_id: user.id
      });
    } else {
      
      return res.status(200).json({
        status: false,
        message: "User not registered",
        login_status: 0,
        user_id: null
      });
    }

  } catch (error) {
	  console.log("error",error)
    return res.status(500).json({
      status: false,
      message: error.message,
      login_status: 0,
      user_id: null
    });
  }
};


const profile = async (req, res) => {
	//conosle.log()
  try {
    const { id: userId } = req.params;
	  

    if (!userId) {
      return res.json({ status: false, message: "User ID is required" });
    }

    const users = await db.query(
      "SELECT * FROM users WHERE id = ?",
      { replacements: [userId], type: db.QueryTypes.SELECT }
    );

    if (!users.length) {
      return res.json({ status: false, message: "User not found" });
    }

    let user = users[0];

    const sliders = await db.query(
      "SELECT image FROM sliders WHERE status = 'active' LIMIT 1",
      { type: db.QueryTypes.SELECT }
    );

    user.slider_image = sliders.length > 0 ? sliders[0].image : null;

    return res.json({
      status: true,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (err) {
    console.error("Profile API Error:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};


const profile_oldddd = async (req, res) => {
  //console.log("req.params", req.params);
  try {
    const { id: userId } = req.params;

    if (!userId) {
      return res.json({ status: false, message: "User ID is required" });
    }

   

    // ✅ User find
    const users = await db.query(
      "SELECT * FROM users WHERE id = ?",
      {
        replacements: [userId],
        type: db.QueryTypes.SELECT
      }
    );

    if (!users || users.length === 0) {
      return res.json({ status: false, message: "User not found" });
    }

  

    // ✅ Refetch updated user
    const updatedUser = await db.query(
      "SELECT * FROM users WHERE id = ?",
      {
        replacements: [userId],
        type: db.QueryTypes.SELECT
      }
    );

    let user = updatedUser[0];

    // ✅ Slider image fetch
    const sliders = await db.query(
      "SELECT image FROM sliders WHERE status = 'active' LIMIT 1",
      { type: db.QueryTypes.SELECT }
    );

    user.slider_image = sliders.length > 0 ? sliders[0].image : null;

    return res.json({
      status: true,
      message: "User profile updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("Profile API Error:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};



const updateProfile = async (req, res) => {
  try {
    console.log("📥 Incoming Body:", req.body);

    const {
      user_id,
      name,
      email,
		mobile,
      dob,
      anniversary,
      gender,
      profile_image,
    } = req.body;

    if (!user_id) {
      return res.json({ status: false, message: "User ID is required" });
    }

    // ✅ User check
    const rows = await db.query("SELECT * FROM users WHERE id = ?", {
      replacements: [user_id],
      type: db.QueryTypes.SELECT,
    });

    if (!rows || rows.length === 0) {
      return res.json({ status: false, message: "User not found" });
    }
    let user = rows[0];

    let profileImageUrl = user.profile_image;

    // ✅ Handle base64 profile image
    if (profile_image && profile_image.startsWith("data:image")) {
      const uploadDir = path.join(__dirname, "../../public/uploads/profile");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // delete old image if exist
      if (user.profile_image) {
        const oldPath = path.join(
          __dirname,
          "../../public",
          user.profile_image.replace(`${process.env.APP_URL}/`, "")
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // clean base64 prefix
      const base64Data = profile_image.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      const fileName = `profile_${Date.now()}_${Math.floor(
        Math.random() * 10000
      )}.png`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, imageBuffer);

      profileImageUrl = `${process.env.APP_URL}/uploads/profile/${fileName}`;
    }

    // ✅ Build dynamic update query
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name=?");
      values.push(name);
    }
    if (email !== undefined) {
      fields.push("email=?");
      values.push(email);
    }
	  if (mobile !== undefined) {
      fields.push("mobile=?");
      values.push(mobile);
    }
    if (dob !== undefined) {
      fields.push("dob=?");
      values.push(dob);
    }
    if (anniversary !== undefined) {
      fields.push("anniversary=?");
      values.push(anniversary);
    }
    if (gender !== undefined) {
      fields.push("gender=?");
      values.push(gender);
    }
    if (profileImageUrl !== undefined) {
      fields.push("profile_image=?");
      values.push(profileImageUrl);
    }

    if (fields.length === 0) {
      return res.json({ status: false, message: "No fields to update" });
    }

    values.push(user_id); // last me id

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id=?`;

    await db.query(query, {
      replacements: values,
      type: db.QueryTypes.UPDATE,
    });

    const updatedUserRows = await db.query(
      "SELECT * FROM users WHERE id = ?",
      {
        replacements: [user_id],
        type: db.QueryTypes.SELECT,
      }
    );

    return res.json({
      status: true,
      message: "Profile updated successfully",
      data: updatedUserRows[0],
    });
  } catch (err) {
    console.error("❌ Update Profile Error:", err);
    return res
      .status(500)
      .json({ status: false, message: "Server error", error: err.message });
  }
};


// ✅ Update user profile
const updateProfile_old = async (req, res) => {
  try {
    console.log("📥 Incoming Body:", req.body);

    const {
      user_id,
      name,
      email,
      dob,
      anniversary,
      gender,
      profile_image,
    } = req.body;

    if (!user_id) {
      return res.json({ status: false, message: "User ID is required" });
    }

    // ✅ User find
    const rows = await db.query("SELECT * FROM users WHERE id = ?", {
      replacements: [user_id],
      type: db.QueryTypes.SELECT,
    });

    console.log("🔍 User Lookup Result:", rows);

    if (!rows || rows.length === 0) {
      return res.json({ status: false, message: "User not found" });
    }
    let user = rows[0];

    let profileImageUrl = user.profile_image;

    // ✅ Handle base64 profile image
    if (profile_image && profile_image.startsWith("data:image")) {
      console.log("🖼️ Processing new profile image...");

      const uploadDir = path.join(__dirname, "../../public/uploads/profile");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // delete old image if exist
      if (user.profile_image) {
        const oldPath = path.join(
          __dirname,
          "../../public",
          user.profile_image.replace(`${process.env.APP_URL}/`, "")
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log("🗑️ Old image deleted:", oldPath);
        }
      }

      // clean base64 prefix
      const base64Data = profile_image.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      const fileName = `profile_${Date.now()}_${Math.floor(
        Math.random() * 10000
      )}.png`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, imageBuffer);

      profileImageUrl = `${process.env.APP_URL}/uploads/profile/${fileName}`;
      console.log("✅ New profile image saved:", profileImageUrl);
    }

    // ✅ Update DB
    await db.query(
      `UPDATE users 
       SET name=?, email=?,  dob=?, anniversary=?, gender=?, profile_image=? 
       WHERE id=?`,
      {
        replacements: [
          name,
          email,
          dob,
          anniversary,
          gender,
          profileImageUrl,
          user_id,
        ],
        type: db.QueryTypes.UPDATE,
      }
    );

    console.log("✅ User profile updated in DB");

    const updatedUserRows = await db.query(
      "SELECT * FROM users WHERE id = ?",
      {
        replacements: [user_id],
        type: db.QueryTypes.SELECT,
      }
    );

    return res.json({
      status: true,
      message: "Profile updated successfully",
      data: updatedUserRows[0],
    });
  } catch (err) {
    console.error("❌ Update Profile Error:", err);
    return res
      .status(500)
      .json({ status: false, message: "Server error", error: err.message });
  }
};

module.exports = {  login, register, profile, updateProfile };

