import { getCloudinary, getUploadFolder } from "@/config/cloudinary";
import { Readable } from "node:stream";

type UploadResult = {
  url: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes?: number;
};

const UploadService = {
  async uploadFile(
    file: Express.Multer.File,
    subfolder?: string,
  ): Promise<UploadResult> {
    const cloudinary = getCloudinary();
    const baseFolder = getUploadFolder();
    const folder = subfolder ? `${baseFolder}/${subfolder}` : baseFolder;
    const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
      format?: string;
      bytes?: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Upload failed"));
            return;
          }
          resolve(uploadResult);
        },
      );

      Readable.from(file.buffer).pipe(stream);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
    };
  },
};

export default UploadService;
