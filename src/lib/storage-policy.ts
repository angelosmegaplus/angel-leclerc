export type StorageTier = "primary" | "drive-archive";

export const ANGEL_STORAGE = {
  driveRoot: {
    id: "1m7qMp_XQIlIdnH67uhHwr2cfdAGMFwX8",
    url: "https://drive.google.com/drive/folders/1m7qMp_XQIlIdnH67uhHwr2cfdAGMFwX8",
    label: "Angel OS Storage",
  },
  folders: {
    media: {
      id: "19N8gVfzSDys7e8sCoN2wrSZl0afr6nQS",
      url: "https://drive.google.com/drive/folders/19N8gVfzSDys7e8sCoN2wrSZl0afr6nQS",
    },
    backups: {
      id: "1GYZUZwtKwSWkywKf5fMcFkh-lDthfQoV",
      url: "https://drive.google.com/drive/folders/1GYZUZwtKwSWkywKf5fMcFkh-lDthfQoV",
    },
    attachments: {
      id: "1gHv2kRyEDE4QH-Nacq7BMvAp0TJE4yIR",
      url: "https://drive.google.com/drive/folders/1gHv2kRyEDE4QH-Nacq7BMvAp0TJE4yIR",
    },
    exports: {
      id: "1-Kpwv_JPuLW_q0HFDXMiTWvadttFHe9L",
      url: "https://drive.google.com/drive/folders/1-Kpwv_JPuLW_q0HFDXMiTWvadttFHe9L",
    },
  },
  largeFileThresholdBytes: 25 * 1024 * 1024,
} as const;

export function storageTierForFile(file: Pick<File, "size">): StorageTier {
  return file.size >= ANGEL_STORAGE.largeFileThresholdBytes ? "drive-archive" : "primary";
}

export function driveFolderForMimeType(mime = "") {
  if (/^(image|video|audio)\//i.test(mime)) return ANGEL_STORAGE.folders.media;
  return ANGEL_STORAGE.folders.attachments;
}
