import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
    file: Express.Multer.File,
    folder: string = 'shopee-clone'
): Promise<{ url: string; publicId: string }> => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder,
            resource_type: 'auto',
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
            ],
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error: any) {
        logger.error(`Cloudinary upload error: ${error.message}`);
        throw error;
    }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
        logger.error(`Cloudinary delete error: ${error.message}`);
        throw error;
    }
};

export default cloudinary;
