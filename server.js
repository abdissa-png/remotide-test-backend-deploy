const mongoose = require('mongoose');
const {MONGO_URL,PORT} = require("./config")

process.on('uncaughtException', err => {
    console.log("err: ", err)
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
    process.exit(1);
})

const app = require('./app');

// Database connection
mongoose.connect(MONGO_URL)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log("Database connection failed", err);
  });

  // const server = app.listen(PORT, () => {
  //   console.log(`App running on port ${PORT}...`);
  // });
  
  process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
