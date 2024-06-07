const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const ResumeData = require('../models/resumeDataModel');

const gResumesId = async (req, res) => {
    const resumeId = req.params.resumeId; // Assuming the resume ID is passed as a parameter
    try {
        // Find the ResumeData document by its ID
        const resumeData = await ResumeData.findById({userId:resumeId});
        
        if (!resumeData) {
            return res.status(404).json({ message: 'Resume data not found' });
        }

        // Read the resume file using fs module
        const resumeBuffer = fs.readFileSync(resumeData.filePath); // Assuming filePath is a field in ResumeData model
        
        // Convert PDF resume to JSON
        const pdfData = await pdf(resumeBuffer);
        const resumeJson = { 
            text: pdfData.text, // JSON object containing extracted text from resume
            userId: resumeData.userId // Add the user ID associated with the resume
        };

        // Update the existing ResumeData document with the extracted text (optional)
        resumeData.text = resumeJson.text;
        await resumeData.save();

        // Respond with the extracted text
        res.status(200).json({ resumeJson });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getResumesId= async (req, res) => {
    const resumeId = req.params.resumeId;
    try {
        // Fetch all ResumeData documents from the database
        const resumes = await ResumeData.find({userId:resumeId});
         
        if (!resumes) {
            return res.status(404).json({ message: 'Resume data not found' });
        }
        // If no resumes found, respond with 404 status
        if (!resumes || resumes.length === 0) {
            return res.status(404).json({ message: 'No resumes found' });
        }

        // Prepare response with resume data
        const resumesData = resumes.map(resume => ({
            text: resume.text, // Assuming `text` is the field containing JSON data
            userId: resume.userId // Add the user ID associated with the resume
        }));

        // Respond with the list of resumes
        res.status(200).json({ resumes: resumesData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getAllResumes = async (req, res) => {
    try {
        // Fetch all ResumeData documents from the database
        const resumes = await ResumeData.find();
        
        // If no resumes found, respond with 404 status
        if (!resumes || resumes.length === 0) {
            return res.status(404).json({ message: 'No resumes found' });
        }

        // Prepare response with resume data
        const resumesData = resumes.map(resume => ({
            text: resume.text, // Assuming `text` is the field containing JSON data
            userId: resume.userId // Add the user ID associated with the resume
        }));

        // Respond with the list of resumes
        res.status(200).json({ resumes: resumesData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



module.exports = {
     getResumesId,
     getAllResumes


};
