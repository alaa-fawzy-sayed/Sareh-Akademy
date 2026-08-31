export interface UploadResult {
  key: string;       // internal storage key
  url: string;       // public URL (if applicable)
  sizeBytes: number;
  mimeType: string;
}

export interface StorageProvider {
  /**
   * Upload a file to storage
   */
  upload(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Generate a time-limited signed URL for private content
   */
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;

  /**
   * Get a public URL for public content
   */
  getPublicUrl(key: string): string;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Download a file buffer from storage
   */
  getBuffer(key: string): Promise<Buffer>;
}
