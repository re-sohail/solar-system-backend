import express from "express";
import {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  getOrders,
  updateOrderStatus,
  updateServiceStatus,
  cancelOrder,
} from "../controllers/orderController.js";
import { auth, adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Protected routes
router.post("/", auth, createOrder);
router.get("/myorders", auth, getMyOrders);
router.get("/:id", auth, getOrderById);
router.put("/:id/pay", auth, updateOrderToPaid);
router.put("/:id/cancel", auth, cancelOrder);

// Admin routes
router.get("/", auth, adminAuth, getOrders);
router.put("/:id/status", auth, adminAuth, updateOrderStatus);
router.put("/:id/service", auth, adminAuth, updateServiceStatus);

export default router;
