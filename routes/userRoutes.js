import express from "express";
import {
  registerUser,
  confirmOTP,
  loginUser,
  getUserProfile,
  updateUserProfile,
  savePreferredConfiguration,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

import { auth, adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/confirm-otp", confirmOTP);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", auth, getUserProfile);
router.put("/profile", auth, updateUserProfile);
router.post("/configurations", auth, savePreferredConfiguration);

// Admin routes
router.get("/all-user", auth, adminAuth, getUsers);
router.get("/:id", auth, adminAuth, getUserById);
router.put("/:id", auth, adminAuth, updateUser);
router.delete("/:id", auth, adminAuth, deleteUser);

export default router;
