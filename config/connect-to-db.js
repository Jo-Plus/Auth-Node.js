const mongoose = require("mongoose");

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected To DB ^_^");
  } catch (err) {
    console.log("Connection Failed To DB!", err.message);
  }
};
