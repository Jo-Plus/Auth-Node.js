const nodemailer = require("nodemailer");

module.exports = async(userEmail , subject , htmlTemplate)=>{
  try{
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth:{
        user:process.env.EMAIL,
        pass:process.env.EMAIL_PASSWORD
      }
    })
    const mailOptions={
        from: '"Taskify App" <' + process.env.EMAIL + '>',
        to: userEmail,
        subject: subject,
        html: htmlTemplate,
    }
      const info = await transporter.sendMail(mailOptions);
  }catch(error){
    throw new Error("Internal Server Error (nodemailer)")
  }
}