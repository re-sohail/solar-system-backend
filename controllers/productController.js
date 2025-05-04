import Product from "../models/Product.js";

// Get all products
export const getProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, sort } = req.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Build sort object
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case "price_asc":
          sortOption = { price: 1 };
          break;
        case "price_desc":
          sortOption = { price: -1 };
          break;
        case "newest":
          sortOption = { createdAt: -1 };
          break;
        case "rating":
          sortOption = { "ratings.average": -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    } else {
      sortOption = { createdAt: -1 };
    }

    const products = await Product.find(filter).sort(sortOption);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Create a product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      subCategory,
      description,
      price,
      imageUrl,
      additionalImages,
      specifications,
      brand,
      stock,
      installationGuide,
    } = req.body;

    const product = new Product({
      name,
      category,
      subCategory,
      description,
      price,
      imageUrl,
      additionalImages: additionalImages || [],
      specifications: specifications || {},
      brand,
      stock,
      installationGuide,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Update a product
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      subCategory,
      description,
      price,
      imageUrl,
      additionalImages,
      specifications,
      brand,
      stock,
      installationGuide,
      isActive,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.category = category || product.category;
      product.subCategory = subCategory || product.subCategory;
      product.description = description || product.description;
      product.price = price || product.price;
      product.imageUrl = imageUrl || product.imageUrl;
      product.additionalImages = additionalImages || product.additionalImages;
      product.specifications = specifications || product.specifications;
      product.brand = brand || product.brand;
      product.stock = stock !== undefined ? stock : product.stock;
      product.installationGuide =
        installationGuide || product.installationGuide;
      product.isActive = isActive !== undefined ? isActive : product.isActive;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin: Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get product categories
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get product brands
export const getProductBrands = async (req, res) => {
  try {
    const brands = await Product.distinct("brand");
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update product stock
export const updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined) {
      return res.status(400).json({ message: "Stock value is required" });
    }

    const product = await Product.findById(req.params.id);

    if (product) {
      product.stock = stock;
      const updatedProduct = await product.save();

      res.json({ message: "Product stock updated", product: updatedProduct });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
