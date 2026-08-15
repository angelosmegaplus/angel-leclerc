export type DriveStorageItem = {
  id: string;
  name: string;
  url: string;
  type: "image" | "audio" | "archive" | "fichier";
  size?: number | null;
  folder: "Media" | "Backups" | "Attachments" | "Exports";
  updatedAt?: string;
};

/**
 * Index maintained by Angel OS automation when files are archived to Google Drive.
 * The browser never pretends to upload directly to Drive without a real server-side
 * Google authorization. Existing storage remains operational in parallel.
 */
export const DRIVE_STORAGE_INDEX: DriveStorageItem[] = [];
