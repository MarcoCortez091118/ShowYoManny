import { FirebaseApiClient, firebaseApiClient } from "@/integrations/firebase/apiClient";
import { firebaseAuthService } from "./authService";

export interface UploadBillboardAssetInput {
  file: File;
  folder?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface UploadBillboardAssetResult {
  filePath: string;
  publicUrl: string;
  contentType: string;
  size: number;
}

export class FirebaseStorageService {
  constructor(
    private readonly api: FirebaseApiClient,
    private readonly auth = firebaseAuthService
  ) {}

  async uploadBillboardAsset(input: UploadBillboardAssetInput): Promise<UploadBillboardAssetResult> {
    const form = new FormData();
    form.append("file", input.file);

    if (input.folder) {
      form.append("folder", input.folder);
    }

    if (input.metadata) {
      form.append("metadata", JSON.stringify(input.metadata));
    }

    return this.api.request<UploadBillboardAssetResult>("storage/upload", {
      method: "POST",
      body: form,
      token: this.auth.token,
    });
  }

  async getPublicUrl(filePath: string): Promise<string> {
    const { publicUrl } = await this.api.request<{ publicUrl: string }>("storage/public-url", {
      method: "GET",
      query: { path: filePath },
      token: this.auth.token,
    });

    return publicUrl;
  }

  async deleteAsset(filePath: string): Promise<void> {
    await this.api.request("storage/delete", {
      method: "DELETE",
      body: { path: filePath },
      token: this.auth.token,
    });
  }
}

export const firebaseStorageService = new FirebaseStorageService(firebaseApiClient);
