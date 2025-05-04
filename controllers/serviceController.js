import Service from "../models/Service.js"

// Get all services
export const getServices = async (req, res) => {
  try {
    const { type, packageSize, location } = req.query

    // Build filter object
    const filter = { isActive: true }

    if (type) filter.type = type
    if (packageSize) filter.packageSize = packageSize
    if (location) filter.availableLocations = { $in: [location] }

    const services = await Service.find(filter)

    res.json(services)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get service by ID
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)

    if (service) {
      res.json(service)
    } else {
      res.status(404).json({ message: "Service not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Create a service
export const createService = async (req, res) => {
  try {
    const { name, type, description, price, imageUrl, duration, packageSize, availableLocations } = req.body

    const service = new Service({
      name,
      type,
      description,
      price,
      imageUrl,
      duration,
      packageSize,
      availableLocations: availableLocations || [],
    })

    const createdService = await service.save()
    res.status(201).json(createdService)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Update a service
export const updateService = async (req, res) => {
  try {
    const { name, type, description, price, imageUrl, duration, packageSize, availableLocations, isActive } = req.body

    const service = await Service.findById(req.params.id)

    if (service) {
      service.name = name || service.name
      service.type = type || service.type
      service.description = description || service.description
      service.price = price || service.price
      service.imageUrl = imageUrl || service.imageUrl
      service.duration = duration || service.duration
      service.packageSize = packageSize || service.packageSize
      service.availableLocations = availableLocations || service.availableLocations
      service.isActive = isActive !== undefined ? isActive : service.isActive

      const updatedService = await service.save()
      res.json(updatedService)
    } else {
      res.status(404).json({ message: "Service not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Admin: Delete a service
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)

    if (service) {
      await service.deleteOne()
      res.json({ message: "Service removed" })
    } else {
      res.status(404).json({ message: "Service not found" })
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get service types
export const getServiceTypes = async (req, res) => {
  try {
    const types = await Service.distinct("type")
    res.json(types)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get service package sizes
export const getServicePackageSizes = async (req, res) => {
  try {
    const packageSizes = await Service.distinct("packageSize")
    res.json(packageSizes)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get available locations
export const getAvailableLocations = async (req, res) => {
  try {
    const locations = await Service.aggregate([
      { $unwind: "$availableLocations" },
      { $group: { _id: "$availableLocations" } },
      { $project: { _id: 0, location: "$_id" } },
    ])

    res.json(locations.map((item) => item.location))
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
