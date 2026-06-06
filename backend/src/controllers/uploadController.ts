import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../middleware/upload';

const uploadImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ success: false, message: 'No images uploaded', error: 'Bad Request' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const uploadPromises = files.map((file) => uploadToCloudinary(file, 'mufar-commerce/uploads'));
    const results = await Promise.all(uploadPromises);
    const urls = results.map((result) => result.secure_url);

    res.status(200).json({ success: true, data: { urls } });
  } catch (error) {
    next(error);
  }
};

export { uploadImages };
