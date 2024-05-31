const path = require('path');
const fs = require('fs');
const multer=require("multer");
const {BACKEND_URL} = require("./../config")
const staticFilePath=`${BACKEND_URL}/uploads`

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
       const dir = path.resolve('uploads');
       if (!fs.existsSync(dir)){
         fs.mkdirSync(dir);
       };
       cb(null,dir)
    },
    filename: function(req, file, cb) {
       // Parse the file path to get the file name without the extension
    const parsedPath = path.parse(file.originalname);
    const fileNameWithoutExtension = parsedPath.name;

    // Construct the new file name with a timestamp and the original extension
    const newFileName = `${fileNameWithoutExtension.replace(/ /g, '')}-${Date.now()}${parsedPath.ext}`;

    cb(null, newFileName);
    }
   });
   
const upload = multer({ storage: storage });

module.exports= {
    staticFilePath,
    storage,
    upload
}