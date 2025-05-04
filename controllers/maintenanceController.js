import Maintenance from "../models/Maintenance.js"

// Create a new maintenance request
export const createMaintenance = async (req, res) => {
  try {
    const { serviceType, description, scheduledDate, address } = req.body

    const maintenance = new Maintenance({
      user: req.user._id,
      serviceType,
      description,
      scheduledDate,
      address,
    })

    const createdMaintenance = await maintenance.save()
    res.status(201).json(createdMaintenance)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get user's maintenance requests
export const getMyMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.find({ user: req.user._id }).sort({ createdAt: -1 })

    res.json(maintenance)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get maintenance by ID
export const getMaintenanceById = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate("user", "name email")
      .populate("assignedTechnician", "name")

    if (maintenance) {
      // Check if the user is the owner or an admin
      if (maintenance.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to view this maintenance request" })
      }

      res.json(maintenance)
    } else {
      res.status(404).json({ message: "Maintenance request not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update maintenance feedback
export const updateMaintenanceFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body

    const maintenance = await Maintenance.findById(req.params.id)

    if (maintenance) {
      // Check if the user is the owner
      if (maintenance.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this maintenance request" })
      }

      // Check if maintenance is completed
      if (maintenance.status !== "completed") {
        return res.status(400).json({ message: "Cannot provide feedback for incomplete maintenance" })
      }

      maintenance.feedback = {
        rating,
        comment,
        submittedAt: new Date(),
      }

      const updatedMaintenance = await maintenance.save()
      res.json(updatedMaintenance)
    } else {
      res.status(404).json({ message: "Maintenance request not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Cancel maintenance
export const cancelMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)

    if (maintenance) {
      // Check if the user is the owner or an admin
      if (maintenance.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to cancel this maintenance request" })
      }

      // Check if maintenance can be cancelled
      if (maintenance.status === "completed" || maintenance.status === "in_progress") {
        return res.status(400).json({ message: "Cannot cancel in-progress or completed maintenance" })
      }

      maintenance.status = "cancelled"

      const updatedMaintenance = await maintenance.save()
      res.json(updatedMaintenance)
    } else {
      res.status(404).json({ message: "Maintenance request not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Get all maintenance requests
export const getMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.find({})
      .populate("user", "name email")
      .populate("assignedTechnician", "name")
      .sort({ createdAt: -1 })

    res.json(maintenance)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Update maintenance status
export const updateMaintenanceStatus = async (req, res) => {
  try {
    const { status, assignedTechnician, notes } = req.body

    const maintenance = await Maintenance.findById(req.params.id)

    if (maintenance) {
      maintenance.status = status || maintenance.status

      if (assignedTechnician) {
        maintenance.assignedTechnician = assignedTechnician
      }

      if (notes) {
        maintenance.notes = notes
      }

      const updatedMaintenance = await maintenance.save()
      res.json(updatedMaintenance)
    } else {
      res.status(404).json({ message: "Maintenance request not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
