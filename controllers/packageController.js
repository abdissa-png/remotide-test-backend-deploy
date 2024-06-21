const Package = require("../models/packageModel");
const Discount = require("../models/discountModel");
const AppError = require("../helpers/appError");
const catchAsync = require("../helpers/catchAsync");
const mongoose = require("mongoose");

// Controller method to get all packages
const getPackages = catchAsync(async (req, res) => {
  const packages = await Package.find({ isActive: true }).populate("discount");
  // Add the fetched discounts to the corresponding packages
  const packagesWithDiscounts = packages.map((package) => {
    const { discountPercentage, originalPrice } = package.discount;
    return {
      ...package.toJSON(),
      discount: {
        ...package.discount.toJSON(),
        discountedPrice: originalPrice * ((100 - discountPercentage) / 100),
      },
    };
  });
  res.status(200).json({
    status: "success",
    data: {
      packages: packagesWithDiscounts,
    },
  });
});

// Controller method to create a new package
const createPackage = catchAsync(async (req, res) => {
  const { packageDetails, discountDetails } = req.body;
  var newPackage = await Package.create(packageDetails);
  const newDiscount = await Discount.create({
    ...discountDetails,
    packageId: newPackage._id,
  });
  const { discountPercentage, originalPrice } = newDiscount;
  newPackage.discount = newDiscount._id;
  await newPackage.save();
  const packageWithDiscountDetails = {
    ...newPackage.toJSON(),
    discount: {
      ...newDiscount.toJSON(),
      discountedPrice: originalPrice * ((100 - discountPercentage) / 100),
    },
  };

  res.status(201).json({
    status: "success",
    message: "package created successfully",
    data: {
      package: packageWithDiscountDetails,
    },
  });
});

// Controller method to get a package by ID
const getPackageById = catchAsync(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError("Invalid ID provided", 400);
  }

  const package = await Package.findOne({
    _id: req.params.id,
    isActive: true,
  }).populate("discount");

  if (!package) {
    throw new AppError("Package not found", 404);
  }
  const { discountPercentage, originalPrice } = package?.discount;

  res.status(200).json({
    status: "success",
    data: {
      package: {
        ...package.toJSON(),
        discount: {
          ...package.discount.toJSON(),
          discountedPrice: originalPrice * ((100 - discountPercentage) / 100),
        },
      },
    },
  });
});

// Controller method to update a package by ID
const updatePackageById = catchAsync(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError("Invalid ID provided", 400);
  }
  const { packageDetails, discountDetails } = req.body;
  var package = await Package.findOne({ _id: req.params.id, isActive: true });
  var discount;
  if (discountDetails) {
    discount = await Discount.create({
      ...discountDetails,
      packageId: package._id,
    });
    package.discount = discount._id;
  } else {
    discount = await Discount.findById(package.discount);
  }
  const { discountPercentage, originalPrice } = discount;
  for (const key in packageDetails) {
    if (Object.hasOwnProperty.call(packageDetails, key)) {
      package[key] = packageDetails[key];
    }
  }
  await package.save();

  if (!package) {
    throw new AppError("Package not found", 404);
  }
  res.status(200).json({
    status: "success",
    message: "updated successfully",
    updatedPackage: {
      ...package.toJSON(),
      discount: {
        ...discount.toJSON(),
        discountedPrice: originalPrice * ((100 - discountPercentage) / 100),
      },
    },
  });
});

// Controller method to delete a package by ID
const deletePackageById = catchAsync(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError("Invalid ID provided", 400);
  }

  const package = await Package.findOne({ _id: req.params.id, isActive: true });
  if (!package) {
    throw new AppError("Package not found", 404);
  }
  package.isActive = false;
  await package.save();
  res.status(200).json({ status: "success", message: "Package deleted" });
});

module.exports = {
  getPackages,
  getPackageById,
  createPackage,
  updatePackageById,
  deletePackageById,
};
