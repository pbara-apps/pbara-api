import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

/** Image-only upload (e.g. public registration proof of payment). */
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export default upload;
