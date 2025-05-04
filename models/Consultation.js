import mongoose from "mongoose"

const consultationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    alternateDate: Date,
    status: {
      type: String,
      enum: ["pending", "scheduled", "completed", "cancelled"],
      default: "pending",
    },
    consultationType: {
      type: String,
      enum: ["phone", "video", "in_person"],
      default: "phone",
    },
    assignedExpert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
    feedback: {
      rating: Number,
      comment: String,
      submittedAt: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

const Consultation = mongoose.model("Consultation", consultationSchema)

export default Consultation
