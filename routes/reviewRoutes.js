import express from "express"
import {
  createReview,
  getProductReviews,
  getServiceReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  getReviews,
  updateReviewApproval,
} from "../controllers/reviewController.js"
import { auth, adminAuth } from "../middleware/auth.js"

const router = express.Router()

// Public routes
router.get("/product/:id", getProductReviews)
router.get("/service/:id", getServiceReviews)

// Protected routes
router.post("/", auth, createReview)
router.get("/myreviews", auth, getMyReviews)
router.put("/:id", auth, updateReview)
router.delete("/:id", auth, deleteReview)

// Admin routes
router.get("/", auth, adminAuth, getReviews)
router.put("/:id/approve", auth, adminAuth, updateReviewApproval)

export default router
