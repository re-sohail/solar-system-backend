// config/stripe.js
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

// (No secrets should be hardcoded here.)

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2022-11-15",
});
