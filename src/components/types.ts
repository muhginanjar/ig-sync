export type ShareFile = {
  id: string;
  type: "IMAGE" | "VIDEO";
  contentType: string;
  sizeBytes: number;
  displayUrl: string; // for <img>/<video>
  fileUrl: string; // same-origin bytes for sharing/downloading
  filename: string;
};
