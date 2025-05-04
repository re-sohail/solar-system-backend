import express from "express"
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  getProductBrands,
  updateProductStock,
} from "../controllers/productController.js"
import { auth, adminAuth } from "../middleware/auth.js"

const router = express.Router()

// Public routes
router.get("/", getProducts)
router.get("/categories", getProductCategories)
router.get("/brands", getProductBrands)
router.get("/:id", getProductById)

// Admin routes
router.post("/", auth, adminAuth, createProduct)
router.put("/:id", auth, adminAuth, updateProduct)
router.delete("/:id", auth, adminAuth, deleteProduct)
router.put("/:id/stock", auth, adminAuth, updateProductStock)

export default router
