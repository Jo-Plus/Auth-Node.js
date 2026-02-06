const multer = require("multer");
const path = require("node:path");

//photo storage
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../images"));
  },
  filename: (req, file, cb) => {
    if (file) {
      cb(
        null,
        Date.now() + "-" + Math.round(Math.random() * 1e9) + file.originalname,
      );
    } else {
      cb(null, false);
    }
  },
});

//photo upload middleware
const photoUpload = multer({
  storage: photoStorage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb({ message: "unsupported file format" }, false);
    }
  },
  limits: { fileSize: 1024 * 1024 * 5 },
});

module.exports = photoUpload;
