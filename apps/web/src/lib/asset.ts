import { env } from "#config/env";

export const getAsset = (path: string) => {
  if (!path) return '';
  
  // Pass through absolute URLs and data URLs
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  
  // Remove leading /storage/ prefix if present
  const cleanPath = path.startsWith('/storage/') ? path.slice('/storage/'.length) : path;
  
  return `${env.cdnUrl}/storage/${cleanPath}`;
};
