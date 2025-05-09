// config/stripe.js
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing Stripe Key in environment");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2022-11-15",
});
