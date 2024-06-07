// controllers/candidateController.js

const JobPosting = require("../models/jobModel");
const talent = require("../models/talentProfileModel");

// API endpoint to identify the best candidates for a particular job based on selected skills
const identifyBestCandidates = async (req, res) => {
  const { JobId } = req.params; // Assuming jobId is passed as a parameter in the URL

  try {
    // Retrieve the job details
    const job = await JobPosting.findById(JobId).populate("skills");

    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }
    console.log(job);
    // Retrieve candidates who possess the required skills for the job
    // and passed a valid Calendly link
    const candidates = await talent
      .find({
        skills: { $in: job.skills },

        bookableCalendarLink: { $regex: /^https:\/\/calendly.com/ },
      })
      .populate("skills");

    // Rank candidates based on their skills match with the job requirements (You can implement your ranking algorithm here)

    // For demonstration purposes, let's assume the candidates are ranked based on the number of matching skills
    candidates.sort((a, b) => {
      const matchingSkillsA = a.skills.filter((skill) =>
        job.skills.includes(skill._id)
      );
      const matchingSkillsB = b.skills.filter((skill) =>
        job.skills.includes(skill._id)
      );
      return matchingSkillsB.length - matchingSkillsA.length;
    });
    console.log("Candidates", candidates);
    // Return the ranked list of candidates
    res.status(200).json({ job, candidates });
  } catch (error) {
    console.error("Error identifying best candidates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  identifyBestCandidates,
};
