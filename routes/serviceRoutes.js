import express from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServiceTypes,
  getServicePackageSizes,
  getAvailableLocations,
} from "../controllers/serviceController.js";
import { auth, adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getServices);
router.get("/types", getServiceTypes);
router.get("/packages", getServicePackageSizes);
router.get("/locations", getAvailableLocations);
router.get("/:id", getServiceById);

// Admin routes
router.post("/", auth, adminAuth, createService);
router.put("/:id", auth, adminAuth, updateService);
router.delete("/:id", auth, adminAuth, deleteService);

export default router;
