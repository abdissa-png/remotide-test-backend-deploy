const express = require("express");
const path = require("path")
const AppError = require('./helpers/appError');
const globalErrorHandler = require('./controllers/errorController');
const { swaggerUi, specs } = require('./swagger'); // Import Swagger setup
const userRouter = require('./routes/userRouter');
const jobRouter = require('./routes/jobRouter');
const adminRouter = require('./routes/adminRouter');
const aiRouter = require('./routes/aiRouters');
const contractRouter = require('./routes/contractRouter');
const InvoiceRouter = require('./routes/invoiceRouter');
const WithdrawalRouter = require('./routes/withdrawalRouter')
const TransactionRouter = require('./routes/transactionRouter')
const cron = require("node-cron");
const Invoice = require("./models/invoiceModel");
const sendReminderEmail = require("./cronJobs")


const app = express();



// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


// Middlewares
app.use(express.json());

// Routes
app.use('/api/users', userRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);
app.use('/api/contract', contractRouter);
app.use('/api/invoice', InvoiceRouter);
app.use('/api/withdrawal', WithdrawalRouter)
app.use('/api/transaction',TransactionRouter)
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/api/packages', packageRouter);
// app.use('/api/profile', profileRouter);
// app.use('api/guide', guideRouter);


// app.use('/', require('./routes/authRoute'));
// app.use('/', require('./routes/loginRoute'));
// app.use('/', require('./routes/skillRoutes'));
// app.use('/', require('./routes/jobPostings'));
// app.use('/', require('./routes/talentRoute'));
// app.use('/', require('./routes/companyRoute'));
// app.use('/', require('./routes/guideRoutes'));
// app.use('/', require('./routes/packageRoutes'));

// Schedule a task to run every day at 12:00 AM
cron.schedule(
  '0 0 * * *',
  async () => {
    try {
      // Find invoices that are not fully paid and their due date has passed
      const overdueInvoices = await Invoice.find({
        status: { $ne: "Fully Paid" },
        dueDate: { $lt: new Date() },
      });

      // Update status to "overdue" for invoices with passed due dates
      await Promise.all(
        overdueInvoices.map(async (invoice) => {
          invoice.status = "Overdue";
          await invoice.save();
        })
      );

      // Find invoices that are not fully paid and have a due date set for the current month
      const dueThisMonthInvoices = await Invoice.find({
        status: { $ne: "Fully Paid" },
        dueDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // First day of next month
        },
      });

      // Send reminders for invoices due this month
      await Promise.all(
        dueThisMonthInvoices.map(async (invoice) => {
          await sendReminderEmail(invoice);
        })
      );

      console.log("Invoice reminders sent successfully.");
    } catch (error) {
      console.error("Error sending invoice reminders:", error);
    }
  },
  {
    vscheduled: true,
    timezone: "America/New_York", // Specify your timezone here
  }
);


app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);


module.exports = app;
