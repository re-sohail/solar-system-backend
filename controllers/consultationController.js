import Consultation from "../models/Consultation.js"

// Create a new consultation request
export const createConsultation = async (req, res) => {
  try {
    const { topic, description, preferredDate, alternateDate, consultationType } = req.body

    const consultation = new Consultation({
      user: req.user._id,
      topic,
      description,
      preferredDate,
      alternateDate,
      consultationType,
    })

    const createdConsultation = await consultation.save()
    res.status(201).json(createdConsultation)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get user's consultations
export const getMyConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ user: req.user._id }).sort({ createdAt: -1 })

    res.json(consultations)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get consultation by ID
export const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate("user", "name email")
      .populate("assignedExpert", "name")

    if (consultation) {
      // Check if the user is the owner or an admin
      if (consultation.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to view this consultation" })
      }

      res.json(consultation)
    } else {
      res.status(404).json({ message: "Consultation not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update consultation feedback
export const updateConsultationFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body

    const consultation = await Consultation.findById(req.params.id)

    if (consultation) {
      // Check if the user is the owner
      if (consultation.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this consultation" })
      }

      // Check if consultation is completed
      if (consultation.status !== "completed") {
        return res.status(400).json({ message: "Cannot provide feedback for incomplete consultation" })
      }

      consultation.feedback = {
        rating,
        comment,
        submittedAt: new Date(),
      }

      const updatedConsultation = await consultation.save()
      res.json(updatedConsultation)
    } else {
      res.status(404).json({ message: "Consultation not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Cancel consultation
export const cancelConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)

    if (consultation) {
      // Check if the user is the owner or an admin
      if (consultation.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to cancel this consultation" })
      }

      // Check if consultation can be cancelled
      if (consultation.status === "completed") {
        return res.status(400).json({ message: "Cannot cancel completed consultation" })
      }

      consultation.status = "cancelled"

      const updatedConsultation = await consultation.save()
      res.json(updatedConsultation)
    } else {
      res.status(404).json({ message: "Consultation not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Get all consultations
export const getConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({})
      .populate("user", "name email")
      .populate("assignedExpert", "name")
      .sort({ createdAt: -1 })

    res.json(consultations)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Update consultation status
export const updateConsultationStatus = async (req, res) => {
  try {
    const { status, assignedExpert, notes } = req.body

    const consultation = await Consultation.findById(req.params.id)

    if (consultation) {
      consultation.status = status || consultation.status

      if (assignedExpert) {
        consultation.assignedExpert = assignedExpert
      }

      if (notes) {
        consultation.notes = notes
      }

      const updatedConsultation = await consultation.save()
      res.json(updatedConsultation)
    } else {
      res.status(404).json({ message: "Consultation not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
