import User from "../models/User.js";
import jwt from "jsonwebtoken";
import OTPConfirm from "../models/OtpConfirm.js";
import nodeMailer from "nodemailer";

// Generate JWT token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Send OTP to email
const sendOTP = async (email, otp) => {
  // Send the OTP to the user
  const transporter = nodeMailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "OTP Verification",
    text: `Your OTP is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending OTP", error);
    } else {
      console.log("OTP sent successfully", info.response);
    }
  });
};

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, mobileNo, address } =
      req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      mobileNo,
      address,
    });

    const otp = Math.floor(1000 + Math.random() * 9000);

    await sendOTP(email, otp);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Confirm OTP
export const confirmOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTPConfirm.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Verify the user
    const user = await User.findOne({ email });
    if (user) {
      user.isVerified = true;
      await user.save();
      await OTPConfirm.deleteOne({ email }); // Remove OTP after successful verification
      res.json({ message: "OTP verified successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      const otp = Math.floor(1000 + Math.random() * 9000);
      await OTPConfirm.updateOne(
        { email },
        { email, otp, expiresAt: new Date(Date.now() + 2 * 60000) },
        { upsert: true }
      );
      await sendOTP(email, otp);
      return res.status(403).json({ message: "User not verified. OTP sent." });
    }

    if (await user.comparePassword(password)) {
      res.json({
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const id = req.user._id;
    const { firstName, lastName, mobileNo, address, profilePicture } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.mobileNo = mobileNo || user.mobileNo;
      user.profilePicture = profilePicture || user.profilePicture;
      user.address = {
        ...user.address,
        ...address,
      };

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Save preferred configuration
export const savePreferredConfiguration = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }

    const user = await User.findById(req.user._id);

    if (user) {
      user.preferredConfigurations.push({
        name,
        description,
        savedAt: new Date(),
      });

      await user.save();
      res.status(201).json({
        message: "Configuration saved successfully",
        configuration: user.preferredConfigurations,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Get all users
export const getUsers = async (req, res) => {
  try {
    // exclude users that have "isAdmin" true
    const users = await User.find({ isAdmin: false }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Update user
export const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { firstName, lastName, email, mobileNo, address, profilePicture } =
      req.body;

    const user = await User.findById(id);

    if (user) {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.mobileNo = mobileNo || user.mobileNo;
      user.profilePicture = profilePicture || user.profilePicture;
      user.address = {
        ...user.address,
        ...address,
      };

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
