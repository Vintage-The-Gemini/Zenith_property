import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload function for property images with organized folder structure
export const uploadPropertyImage = async (fileBuffer, fileName, propertyId, imageType = 'gallery') => {
  try {
    return new Promise((resolve, reject) => {
      const folderPath = `palvoria-properties/${propertyId}/${imageType}`;
      
      cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          public_id: `${imageType}-${Date.now()}-${fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, '_')}`,
          resource_type: 'auto',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Upload property main/featured image
export const uploadPropertyMainImage = async (fileBuffer, fileName, propertyId) => {
  return uploadPropertyImage(fileBuffer, fileName, propertyId, 'main');
};

// Upload property gallery images
export const uploadPropertyGalleryImage = async (fileBuffer, fileName, propertyId) => {
  return uploadPropertyImage(fileBuffer, fileName, propertyId, 'gallery');
};

// Upload property floor plans
export const uploadPropertyFloorPlan = async (fileBuffer, fileName, propertyId) => {
  return uploadPropertyImage(fileBuffer, fileName, propertyId, 'floor-plans');
};

// Upload property documents (PDFs, etc.)
export const uploadPropertyDocument = async (fileBuffer, fileName, propertyId) => {
  try {
    return new Promise((resolve, reject) => {
      const folderPath = `palvoria-properties/${propertyId}/documents`;
      
      cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          public_id: `doc-${Date.now()}-${fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, '_')}`,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Cloudinary document upload failed: ${error.message}`);
  }
};

// Delete function for property images/documents
export const deletePropertyAsset = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

// Get all assets for a property (for cleanup)
export const getPropertyAssets = async (propertyId) => {
  try {
    const result = await cloudinary.search
      .expression(`folder:palvoria-properties/${propertyId}/*`)
      .sort_by([['created_at', 'desc']])
      .max_results(500)
      .execute();
    return result;
  } catch (error) {
    throw new Error(`Cloudinary search failed: ${error.message}`);
  }
};

// Delete entire property folder and all its contents
export const deletePropertyFolder = async (propertyId) => {
  try {
    // Get all assets in the property folder
    const assets = await getPropertyAssets(propertyId);
    
    // Delete all assets
    const deletePromises = assets.resources.map(asset => 
      deletePropertyAsset(asset.public_id)
    );
    
    await Promise.all(deletePromises);
    
    // Delete the empty folders (Cloudinary automatically removes empty folders)
    return { success: true, deletedCount: assets.resources.length };
  } catch (error) {
    throw new Error(`Property folder cleanup failed: ${error.message}`);
  }
};

export default cloudinary;