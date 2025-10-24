export interface CloudinaryUploadResult {
  event: string;
  info: {
    secure_url: string;
    original_filename: string;
  };
}

export interface CloudinaryWidget {
  open(): void;
  openUploadWidget(
    options: any,
    callback: (error: any, result: CloudinaryUploadResult | null) => void
  ): void;
}

export interface Window {
  cloudinary: {
    openUploadWidget(
      options: any,
      callback: (error: any, result: CloudinaryUploadResult | null) => void
    ): CloudinaryWidget;
  };
}