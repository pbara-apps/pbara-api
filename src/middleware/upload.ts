import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed =
      file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (!allowed) {
      cb(new Error("Only image and video files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export default upload;
