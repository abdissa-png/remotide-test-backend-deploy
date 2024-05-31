require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USERNAME = process.env.EMAIL_USERNAME;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE = process.env.PAYPAL_BASE;
const FLW_PUBLIC_KEY = process.env.FLW_PUBLIC_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_BASE = process.env.FLW_BASE;
const FRONTEND_URL = process.env.NODE_ENV=="development" ? process.env.FRONTEND_DEV: process.env.FRONTEND_PROD;
const BACKEND_URL = process.env.NODE_ENV=="development" ?  process.env.BACKEND_DEV : process.env.BACKEND_PROD;
const PORT = process.env.PORT || 3000;
module.exports = {
  MONGO_URL,
  JWT_SECRET,
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_BASE,
  FLW_PUBLIC_KEY,
  FLW_SECRET_KEY,
  FLW_BASE,
  FRONTEND_URL,
  BACKEND_URL,
  PORT
};
