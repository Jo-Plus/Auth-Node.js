const mongoose = require('mongoose');

module.exports = async ()=>{
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("connected To DB ^_^");
  }catch (err){
    console.log("connection Failed To DB !" , err);
  }
}