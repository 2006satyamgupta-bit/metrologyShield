import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UploadedLabel } from "@/types";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export class StorageService {
  private static localUploadDir = path.join(process.cwd(), "public", "uploads");

  static validateFile(file: {
    size: number;
    type: string;
    name?: string;
  }): FileValidationResult {
    if (!file) {
      return { valid: false, error: "No file provided." };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds the 15MB limit (provided: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
      };
    }

    const mime = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      return {
        valid: false,
        error: `Unsupported format (${file.type}). Allowed formats: PNG, JPEG, JPG, WEBP.`,
      };
    }

    return { valid: true };
  }

  static async uploadLabelImage(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    analysisId: string,
    userId: string
  ): Promise<UploadedLabel> {
    const fileId = uuidv4();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const extension = path.extname(cleanFileName) || ".jpg";
    const storagePath = `${userId}/${analysisId}/${fileId}${extension}`;

    const supabase = createServerSupabaseClient();
    let url = "";

    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from("labels")
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data } = supabase.storage.from("labels").getPublicUrl(storagePath);
          url = data.publicUrl;
        } else {
          console.warn("Supabase Storage upload warning, using local storage:", uploadError.message);
        }
      } catch (err) {
        console.warn("Supabase Storage exception, using local storage fallback:", err);
      }
    }

    // Try writing to public/uploads (local dev) or os.tmpdir() (serverless)
    const localFileName = `${analysisId}-${fileId}${extension}`;
    try {
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
      const localFilePath = path.join(this.localUploadDir, localFileName);
      fs.writeFileSync(localFilePath, buffer);
      if (!url) {
        url = `/uploads/${localFileName}`;
      }
    } catch {
      // Serverless read-only filesystem: write to os.tmpdir() and use Data URL
      try {
        const tmpDir = path.join(os.tmpdir(), "metroshield_uploads");
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        const tmpFilePath = path.join(tmpDir, localFileName);
        fs.writeFileSync(tmpFilePath, buffer);
      } catch {
        // Ignore tmp write errors
      }

      if (!url) {
        url = `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    }

    const uploadedLabel: UploadedLabel = {
      id: fileId,
      analysisId,
      fileName,
      storagePath,
      mimeType,
      fileSizeBytes: buffer.length,
      url,
      createdAt: new Date().toISOString(),
    };

    return uploadedLabel;
  }

  static getLocalFilePath(urlOrPath: string): string | null {
    if (urlOrPath.startsWith("/uploads/")) {
      const fileName = urlOrPath.replace("/uploads/", "");
      const fullPath = path.join(this.localUploadDir, fileName);
      if (fs.existsSync(fullPath)) return fullPath;
      const tmpPath = path.join(os.tmpdir(), "metroshield_uploads", fileName);
      if (fs.existsSync(tmpPath)) return tmpPath;
    }
    return null;
  }
}
