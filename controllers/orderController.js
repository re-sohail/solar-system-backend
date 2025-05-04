import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { stripe } from "../config/stripe.js";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { products, services, shippingAddress, paymentMethod } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // 1) Calculate totalAmount
    let totalAmount = 0;
    const orderProducts = [];
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Not enough stock for ${product.name}` });
      }
      totalAmount += product.price * item.quantity;
      orderProducts.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
      });
      product.stock -= item.quantity;
      await product.save();
    }
    const orderServices = [];
    if (services && services.length > 0) {
      for (const service of services) {
        totalAmount += service.price;
        orderServices.push({
          service: service.service,
          price: service.price,
          scheduledDate: service.scheduledDate,
        });
      }
    }

    // Convert totalAmount to cents (Stripe expects the smallest currency unit)
    const amountInCents = Math.round(totalAmount * 100);

    // 2) Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd", // or your store currency
      metadata: { userId: req.user._id.toString() },
    });

    // 3) Create order in your DB (payment still pending)
    const order = new Order({
      user: req.user._id,
      products: orderProducts,
      services: orderServices,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentIntentId: paymentIntent.id,
      paymentStatus: "pending",
    });

    const createdOrder = await order.save();

    // 4) Return client_secret to client
    res.status(201).json({
      order: createdOrder,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("products.product", "name imageUrl")
      .populate("services.service", "name type");

    if (order) {
      // Check if the user is the owner or an admin
      if (
        order.user._id.toString() !== req.user._id.toString() &&
        !req.user.isAdmin
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this order" });
      }

      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get logged in user's orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("products.product", "name imageUrl")
      .populate("services.service", "name type");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update order to paid
export const updateOrderToPaid = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify payment with Stripe if paymentIntentId is provided
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: "Payment has not been completed yet",
          status: paymentIntent.status,
        });
      }

      // Make sure this payment belongs to this order
      if (order.paymentIntentId !== paymentIntentId) {
        return res
          .status(400)
          .json({ message: "Payment ID does not match this order" });
      }
    }

    order.paymentStatus = "completed";
    order.orderStatus = "processing";

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Get all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "id name")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (order) {
      order.orderStatus = orderStatus || order.orderStatus;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Update service status in order
export const updateServiceStatus = async (req, res) => {
  try {
    const { serviceId, status } = req.body;

    const order = await Order.findById(req.params.id);

    if (order) {
      const serviceIndex = order.services.findIndex(
        (s) => s._id.toString() === serviceId
      );

      if (serviceIndex === -1) {
        return res
          .status(404)
          .json({ message: "Service not found in this order" });
      }

      order.services[serviceIndex].status = status;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is authorized
    if (
      order.user.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this order" });
    }

    // Check if order can be cancelled
    if (["delivered", "installed", "completed"].includes(order.orderStatus)) {
      return res.status(400).json({ message: "Cannot cancel completed order" });
    }

    // Update order status
    order.orderStatus = "cancelled";

    // Restore product stock
    for (const item of order.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
