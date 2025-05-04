import express from "express"
import {
  createConsultation,
  getMyConsultations,
  getConsultationById,
  updateConsultationFeedback,
  cancelConsultation,
  getConsultations,
  updateConsultationStatus,
} from "../controllers/consultationController.js"
import { auth, adminAuth } from "../middleware/auth.js"

const router = express.Router()

// Protected routes
router.post("/", auth, createConsultation)
router.get("/myconsultations", auth, getMyConsultations)
router.get("/:id", auth, getConsultationById)
router.put("/:id/feedback", auth, updateConsultationFeedback)
router.put("/:id/cancel", auth, cancelConsultation)

// Admin routes
router.get("/", auth, adminAuth, getConsultations)
router.put("/:id/status", auth, adminAuth, updateConsultationStatus)

export default router
