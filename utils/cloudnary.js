const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET,
  secure:true
})

//cloudinary upload image
const cloudinaryUploadImage = async(fileToUpload)=>{
  try{
    const data = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: 'auto',
    });
    return data;
  }catch(error){
    return error;
  }
}

//cloudinary remove image
const cloudinaryRemoveImage = async(publicId)=>{
  try{
    const result = await cloudinary.uploader.destroy(publicId)
    return result;
  }catch(error){
    return error;
  }
}

//cloudinary remove multiple image
const cloudinaryRemoveMultipleImage = async(publicIds)=>{
  try{
    const result = await cloudinary.v2.api.delete_resources(publicIds)
    return result;
  }catch(error){
    return error;
  }
}

module.exports ={
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
  cloudinaryRemoveMultipleImage
}