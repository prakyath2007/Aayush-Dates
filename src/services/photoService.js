import { supabase } from '../lib/supabase.js';

const BUCKET_NAME = 'profile-photos';
const MAX_RETRIES = 3;

/**
 * Uploads a photo to Supabase Storage
 * Falls back to returning a data URL if Supabase is unavailable
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID for organizing uploads
 * @returns {Promise<string>} - The photo URL or data URL
 */
export async function uploadPhoto(file, userId) {
  if (!file || !userId) {
    throw new Error('File and userId are required');
  }

  try {
    // Compress the image first
    const compressed = await compressImage(file);

    // Generate a unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const filename = `${userId}/${timestamp}-${random}.jpg`;

    // If supabase is not available, fall back to data URL immediately
    if (!supabase) {
      console.warn('Supabase not available, using local data URL');
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
    }

    // Attempt to upload to Supabase
    let retries = 0;
    let lastError;

    while (retries < MAX_RETRIES) {
      try {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filename, compressed, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          lastError = error;
          retries++;
          if (retries < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
          }
          continue;
        }

        // Get the public URL
        const { data: publicUrl } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filename);

        return publicUrl.publicUrl;
      } catch (error) {
        lastError = error;
        retries++;
        if (retries < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        }
      }
    }

    // Fallback: return data URL if Supabase fails
    console.warn('Supabase upload failed, using local data URL:', lastError);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(compressed);
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    // Final fallback: return data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Fetches all photos for a user from Supabase Storage
 * @param {string} userId - The user ID
 * @returns {Promise<Array<string>>} - Array of photo URLs
 */
export async function getPhotos(userId) {
  if (!userId || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'asc' },
      });

    if (error) {
      console.warn('Failed to fetch photos from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convert file list to public URLs
    const photoUrls = data.map((file) => {
      const { data: publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${userId}/${file.name}`);
      return publicUrl.publicUrl;
    });

    return photoUrls;
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
}

/**
 * Deletes a photo from Supabase Storage
 * @param {string} photoUrl - The full photo URL or filename
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deletePhoto(photoUrl, userId) {
  if (!photoUrl || !userId) {
    throw new Error('photoUrl and userId are required');
  }

  if (!supabase) {
    console.warn('Supabase not available, cannot delete photo');
    return false;
  }

  try {
    // Extract filename from URL if needed
    let filename;
    if (photoUrl.includes('/')) {
      // It's a full URL, extract the filename
      const parts = photoUrl.split('/');
      filename = parts[parts.length - 1];
    } else {
      // It's already a filename
      filename = photoUrl;
    }

    const filepath = `${userId}/${filename}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filepath]);

    if (error) {
      console.error('Error deleting photo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete photo error:', error);
    return false;
  }
}

/**
 * Compresses an image using canvas
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default: 800)
 * @param {number} quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw the image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

export const photoService = {
  uploadPhoto,
  getPhotos,
  deletePhoto,
  compressImage,
};
