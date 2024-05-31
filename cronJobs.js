const nodemailer = require("nodemailer");

// Function to send reminder email for an invoice
async function sendReminderEmail(invoice) {
    // Implement your email sending logic using nodemailer
    // Example:
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
      to: companyEmail,
      subject: "Reminder: Payment Due for Invoice",
      text: `Dear recipient,\n\nThis is a reminder that payment for the invoice '${invoice.invoiceName}' is due this month. Please make the payment as soon as possible.\n\nThank you.`,
    };
  
    await transporter.sendMail(mailOptions);
  }
  
module.exports = {
  sendReminderEmail,
}
  