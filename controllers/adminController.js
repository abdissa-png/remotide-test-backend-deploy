const User = require("../models/userModel");
const TalentProfile = require("../models/talentProfileModel");
const CompanyProfile = require("../models/companyProfileModel");
const JobPosting = require("../models/jobModel");
const AppError = require("./../helpers/appError");
const { hashPassword } = require("../helpers/auth");
const catchAsync = require("./../helpers/catchAsync");
const nodemailer = require("nodemailer");

const getActiveUsers = catchAsync(async (req, res) => {
  const talents = await User.find({ isActive: true, role: "talent" });
  const companies = await User.find({ isActive: true, role: "company" });

  res.status(200).json({
    status: "success",
    message: "Users fetched successfully",
    data: {
      talents,
      companies,
    },
  });
});
const getInActiveUsers = catchAsync(async (req, res) => {
  const talents = await User.find({ isActive: false, role: "talent" });
  const companies = await User.find({ isActive: false, role: "company" });

  res.status(200).json({
    status: "success",
    message: "Users fetched successfully",
    data: {
      talents,
      companies,
    },
  });
});
const activateUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found.", 404);
  }
  if (user.isActive) {
    throw new AppError("User already active.", 400);
  }
  user.isActive = true;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Users successfully activated",
  });
});
const deactivateUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found.", 404);
  }
  console.log(!user.isActive);
  if (!user.isActive) {
    throw new AppError("User already deactivated.", 400);
  }
  user.isActive = false;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Users successfully deactivated",
  });
});
const getAllAdmins = catchAsync(async (req, res) => {
  const admins = await User.find({ role: "admin" });
  res.status(200).json({
    status: "success",
    message: "Admins fetched successfully",
    data: {
      admins,
    },
  });
});
const getAdmin = catchAsync(async (req, res) => {
  const id = req.params.id;
  const admin = await User.findOne({ _id: id, role: "admin" });
  if (!admin) {
    throw new AppError("Admin not found.", 404);
  }
  res.status(200).json({
    status: "success",
    message: "Admin fetched successfully",
    data: {
      admin,
    },
  });
});
const createAdmin = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await hashPassword(password);

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    throw new AppError("User with the given email already exists.", 400);
  }
  // Create a new admin user
  const newAdmin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
  });

  // Send an email with the password to the new admin
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "remotide.com",
    to: email, // Admin's email
    subject: "Your Admin Account Password",
    text: `Hello ${name},\n\nYour admin account has been created successfully.\n\nPassword: ${password}\n\nPlease keep this password secure.`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  // Respond with success message
  return res.status(201).json({
    status: "success",
    data: {
      admin: newAdmin,
    },
  });
});
const updateAdmin = catchAsync(async (req, res) => {
  var hashedPassword;
  const id = req.params.id;
  const { password } = req.body;
  if (password) {
    hashedPassword = await hashPassword(password);
  }
  const admin = await User.findOne({ _id: id, role: "admin" });
  if (!admin) {
    throw new AppError("Admin not found.", 404);
  }
  for (const key in req.body) {
    if (Object.hasOwnProperty.call(req.body, key)) {
      if (key == "password") {
        admin[key] = hashedPassword;
      } else {
        admin[key] = req.body[key];
      }
    }
  }
  await admin.save();
  return res.status(200).json({
    status: "success",
    data: {
      admin,
    },
  });
});
const deleteAdmin = catchAsync(async (req, res) => {
  const id = req.params.id;
  const admin = await User.findOneAndDelete({ _id: id, role: "admin" });
  if (!admin) {
    throw new AppError("Admin to be deleted not found!");
  }
  return res.status(200).json({
    status: "success",
    message: "Admin successfully deleted",
  });
});

const getAdminStats = catchAsync(async (req, res) => {
  // Calculate the date one month ago from the requesting date
  const twoYearAgo = new Date();
  twoYearAgo.setFullYear(twoYearAgo.getFullYear() - 2);

  // Aggregate users registered and jobs created by date
  const userStats = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: twoYearAgo }, // Fetch users registered within the last month
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const jobStats = await JobPosting.aggregate([
    {
      $match: {
        createdAt: { $gte: twoYearAgo }, // Fetch jobs created within the last month
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const talentstatus = await TalentProfile.aggregate([
    {
      $match: {
        createdAt: { $gte: twoYearAgo }, // Fetch jobs created within the last month
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const companystatus = await CompanyProfile.aggregate([
    {
      $match: {
        createdAt: { $gte: twoYearAgo }, // Fetch jobs created within the last month
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  // Merge userStats and jobStats into a single array
  const statsData = mergeStats(
    userStats,
    jobStats,
    companystatus,
    talentstatus
  );

  return res.status(200).json({ status: "success", data: statsData });
});

function mergeStats(userStats, jobStats, companystatus, talentstatus) {
  const mergedStats = {};

  // Combine userStats and jobStats into a single object
  userStats.forEach((stat) => {
    mergedStats[stat._id] = { usersRegistered: stat.count };
  });

  jobStats.forEach((stat) => {
    if (mergedStats[stat._id]) {
      mergedStats[stat._id].jobsCreated = stat.count;
    } else {
      mergedStats[stat._id] = { jobsCreated: stat.count };
    }
  });

  companystatus.forEach((stat) => {
    if (mergedStats[stat._id]) {
      mergedStats[stat._id].companyCreated = stat.count;
    } else {
      mergedStats[stat._id] = { companyCreated: stat.count };
    }
  });

  talentstatus.forEach((stat) => {
    if (mergedStats[stat._id]) {
      mergedStats[stat._id].talentCreated = stat.count;
    } else {
      mergedStats[stat._id] = { talentCreated: stat.count };
    }
  });

  // Convert mergedStats object into an array of objects
  const statsArray = Object.keys(mergedStats).map((date) => ({
    date,
    usersRegistered: mergedStats[date].usersRegistered || 0,
    jobsCreated: mergedStats[date].jobsCreated || 0,
    talentstatus: mergedStats[date].talentCreated || 0,
    companystatus: mergedStats[date].companyCreated || 0,
  }));

  return statsArray;
}
const getUserStatsByDate = async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    // Check if startDate and endDate are provided
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }

    // Parse start and end dates as Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Check if startDateObj and endDateObj are valid dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid startDate or endDate" });
    }

    // Adjust endDate to include the entire day
    endDateObj.setHours(23, 59, 59, 999);

    const userStats = await getUserStats(startDateObj, endDateObj);
    res.status(200).json(userStats);
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
async function getUserStats(startDate, endDate) {
  try {
    // Aggregation pipeline to get daily counts
    const dailyStatsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ];

    // Aggregation pipeline to get total count
    const totalCountPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
        },
      },
    ];

    // Execute both pipelines in parallel
    const [dailyStats, totalCount] = await Promise.all([
      User.aggregate(dailyStatsPipeline),
      User.aggregate(totalCountPipeline),
    ]);

    // Combine daily stats and total count into a single object
    const stats = {
      dailyStats,
      total: totalCount.length > 0 ? totalCount[0].totalCount : 0,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    throw error;
  }
}

// talent satatus based on date  interval
const getTalentStatsByDate = async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    // Check if startDate and endDate are provided
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }

    // Parse start and end dates as Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Check if startDateObj and endDateObj are valid dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid startDate or endDate" });
    }

    // Adjust endDate to include the entire day
    endDateObj.setHours(23, 59, 59, 999);

    const talentStats = await getTalentStats(startDateObj, endDateObj);
    res.status(200).json(talentStats);
  } catch (error) {
    console.error("Error fetching talent statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

async function getTalentStats(startDate, endDate) {
  try {
    // Aggregation pipeline to get daily counts for talents
    const dailyStatsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ];

    // Aggregation pipeline to get total count for talents
    const totalCountPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
        },
      },
    ];

    // Execute both pipelines in parallel
    const [dailyStats, totalCount] = await Promise.all([
      TalentProfile.aggregate(dailyStatsPipeline),
      TalentProfile.aggregate(totalCountPipeline),
    ]);

    // Combine daily stats and total count into a single object
    const stats = {
      dailyStats,
      total: totalCount.length > 0 ? totalCount[0].totalCount : 0,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching talent statistics:", error);
    throw error;
  }
}

// company satatus based on date  interval
const getCompanyStatsByDate = async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    // Check if startDate and endDate are provided
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }

    // Parse start and end dates as Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Check if startDateObj and endDateObj are valid dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid startDate or endDate" });
    }

    // Adjust endDate to include the entire day
    endDateObj.setHours(23, 59, 59, 999);

    const CompanyStats = await getCompanyStats(startDateObj, endDateObj);
    res.status(200).json(CompanyStats);
  } catch (error) {
    console.error("Error fetching talent statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

async function getCompanyStats(startDate, endDate) {
  try {
    // Aggregation pipeline to get daily counts for talents
    const dailyStatsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ];

    // Aggregation pipeline to get total count for talents
    const totalCountPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
        },
      },
    ];

    // Execute both pipelines in parallel
    const [dailyStats, totalCount] = await Promise.all([
      CompanyProfile.aggregate(dailyStatsPipeline),
      CompanyProfile.aggregate(totalCountPipeline),
    ]);

    // Combine daily stats and total count into a single object
    const stats = {
      dailyStats,
      total: totalCount.length > 0 ? totalCount[0].totalCount : 0,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching talent statistics:", error);
    throw error;
  }
}

// company satatus based on date  interval
const getJobStatsByDate = async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    // Check if startDate and endDate are provided
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }

    // Parse start and end dates as Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Check if startDateObj and endDateObj are valid dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid startDate or endDate" });
    }

    // Adjust endDate to include the entire day
    endDateObj.setHours(23, 59, 59, 999);

    const jobStats = await getJobStats(startDateObj, endDateObj);
    res.status(200).json(jobStats);
  } catch (error) {
    console.error("Error fetching talent statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

async function getJobStats(startDate, endDate) {
  try {
    // Aggregation pipeline to get daily counts for talents
    const dailyStatsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ];

    // Aggregation pipeline to get total count for talents
    const totalCountPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
        },
      },
    ];

    // Execute both pipelines in parallel
    const [dailyStats, totalCount] = await Promise.all([
      JobPosting.aggregate(dailyStatsPipeline),
      JobPosting.aggregate(totalCountPipeline),
    ]);

    // Combine daily stats and total count into a single object
    const stats = {
      dailyStats,
      total: totalCount.length > 0 ? totalCount[0].totalCount : 0,
    };
    console.log(stats);
    return stats;
  } catch (error) {
    console.error("Error fetching talent statistics:", error);
    throw error;
  }
}

module.exports = {
  getActiveUsers,
  getInActiveUsers,
  activateUser,
  deactivateUser,
  getAllAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminStats,
  getUserStatsByDate,
  getTalentStatsByDate,
  getCompanyStatsByDate,
  getJobStatsByDate,
};
