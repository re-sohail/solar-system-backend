import express from "express"
import {
  createMaintenance,
  getMyMaintenance,
  getMaintenanceById,
  updateMaintenanceFeedback,
  cancelMaintenance,
  getMaintenance,
  updateMaintenanceStatus,
} from "../controllers/maintenanceController.js"
import { auth, adminAuth } from "../middleware/auth.js"

const router = express.Router()

// Protected routes
router.post("/", auth, createMaintenance)
router.get("/mymaintenance", auth, getMyMaintenance)
router.get("/:id", auth, getMaintenanceById)
router.put("/:id/feedback", auth, updateMaintenanceFeedback)
router.put("/:id/cancel", auth, cancelMaintenance)

// Admin routes
router.get("/", auth, adminAuth, getMaintenance)
router.put("/:id/status", auth, adminAuth, updateMaintenanceStatus)

export default router
