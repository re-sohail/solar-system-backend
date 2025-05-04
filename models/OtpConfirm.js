import mongoose from "mongoose";

const otpConfirmSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
      minLength: [4, "OTP must be at least 4 characters"],
      maxLength: [6, "OTP must be at most 6 characters"],
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60000), // 2 minutes
      index: { expires: "2m" }, // TTL index for automatic deletion
    },
  },
  { timestamps: true }
);

const OTPConfirm = mongoose.model("OTPConfirm", otpConfirmSchema);
export default OTPConfirm;
