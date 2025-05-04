// config/stripe.js
import Stripe from "stripe";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY ||
  "sk_test_51RKvnw4CeWZCQIOVAgWw7Ryl2xj2PkAaE5b7uqQ02JLMosTgQsK74V97WhilLtcSS0ueu8OyfFLncamqnvZhKiIy00JQy26Dj2";
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2022-11-15",
});

