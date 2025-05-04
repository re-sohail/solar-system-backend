import Review from "../models/Review.js"
import Product from "../models/Product.js"

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId, serviceId, orderId, rating, comment, images } = req.body

    // Check if either productId or serviceId is provided
    if (!productId && !serviceId) {
      return res.status(400).json({ message: "Product ID or Service ID is required" })
    }

    // Check if user has already reviewed this product/service
    const existingReview = await Review.findOne({
      user: req.user._id,
      ...(productId ? { productId } : { serviceId }),
    })

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this item" })
    }

    // Create review
    const review = new Review({
      user: req.user._id,
      productId,
      serviceId,
      orderId,
      rating,
      comment,
      images: images || [],
    })

    const createdReview = await review.save()

    // Update product or service rating
    if (productId) {
      await updateProductRating(productId)
    } else if (serviceId) {
      await updateServiceRating(serviceId)
    }

    res.status(201).json(createdReview)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.id, isApproved: true })
      .populate("user", "name")
      .sort({ createdAt: -1 })

    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get reviews for a service
export const getServiceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.id, isApproved: true })
      .populate("user", "name")
      .sort({ createdAt: -1 })

    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get user's reviews
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("productId", "name imageUrl")
      .populate("serviceId", "name type")
      .sort({ createdAt: -1 })

    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { rating, comment, images } = req.body

    const review = await Review.findById(req.params.id)

    if (review) {
      // Check if the user is the owner
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this review" })
      }

      review.rating = rating || review.rating
      review.comment = comment || review.comment

      if (images) {
        review.images = images
      }

      const updatedReview = await review.save()

      // Update product or service rating
      if (review.productId) {
        await updateProductRating(review.productId)
      } else if (review.serviceId) {
        await updateServiceRating(review.serviceId)
      }

      res.json(updatedReview)
    } else {
      res.status(404).json({ message: "Review not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)

    if (review) {
      // Check if the user is the owner or an admin
      if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to delete this review" })
      }

      const productId = review.productId
      const serviceId = review.serviceId

      await review.deleteOne()

      // Update product or service rating
      if (productId) {
        await updateProductRating(productId)
      } else if (serviceId) {
        await updateServiceRating(serviceId)
      }

      res.json({ message: "Review removed" })
    } else {
      res.status(404).json({ message: "Review not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Get all reviews
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("user", "name")
      .populate("productId", "name")
      .populate("serviceId", "name")
      .sort({ createdAt: -1 })

    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Update review approval status
export const updateReviewApproval = async (req, res) => {
  try {
    const { isApproved } = req.body

    const review = await Review.findById(req.params.id)

    if (review) {
      review.isApproved = isApproved

      const updatedReview = await review.save()

      // Update product or service rating if approval status changed
      if (review.productId) {
        await updateProductRating(review.productId)
      } else if (review.serviceId) {
        await updateServiceRating(review.serviceId)
      }

      res.json(updatedReview)
    } else {
      res.status(404).json({ message: "Review not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Helper function to update product rating
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ productId, isApproved: true })

  if (reviews.length === 0) {
    const product = await Product.findById(productId)
    if (product) {
      product.ratings = { average: 0, count: 0 }
      await product.save()
    }
    return
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = totalRating / reviews.length

  const product = await Product.findById(productId)
  if (product) {
    product.ratings = {
      average: averageRating,
      count: reviews.length,
    }
    await product.save()
  }
}

// Helper function to update service rating
const updateServiceRating = async (serviceId) => {
  // This would be implemented if the Service model had a ratings field
  // Similar to updateProductRating function
}
