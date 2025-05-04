import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
      enum: [
        "panel_cleaning",
        "battery_check",
        "inverter_maintenance",
        "system_inspection",
        "repair",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "scheduled", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    assignedTechnician: {
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
  }
);

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

export default Maintenance;
