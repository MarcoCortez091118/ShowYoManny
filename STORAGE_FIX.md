# Storage Service Fix - Firebase to Supabase Migration

## Problem

The ContentUpload page was attempting to use Firebase Storage via `firebaseStorageService.uploadBillboardAsset()`, which failed with the error:

```
Error: Firebase API base URL is not configured
```

This occurred because:
1. The project has migrated to Supabase for data storage
2. Firebase configuration (`VITE_FIREBASE_API_BASE_URL`) was not set
3. The ContentUpload component hadn't been updated to use Supabase Storage

## Solution

Migrated the file upload functionality from Firebase Storage to Supabase Storage.

### Changes Made

#### 1. Updated ContentUpload.tsx Import

**Before:**
```typescript
import { firebaseStorageService } from "@/domain/services/firebase/storageService";
```

**After:**
```typescript
import { supabaseStorageService } from "@/services/supabaseStorageService";
```

#### 2. Updated Upload Logic

**Before:**
```typescript
const uploadResult = await firebaseStorageService.uploadBillboardAsset({
  file: processedFile,
  folder: "content",
  metadata,
});

// Used uploadResult.filePath
filePath: uploadResult.filePath,
```

**After:**
```typescript
// Generate unique filename
const timestamp = Date.now();
const fileName = `content/${timestamp}_${processedFile.name}`;

// Upload to Supabase Storage
const uploadResult = await supabaseStorageService.uploadFile(
  processedFile,
  fileName,
  (progress) => console.log(`Upload progress: ${progress}%`)
);

if (uploadResult.error || !uploadResult.url) {
  throw new Error(uploadResult.error?.message || 'Failed to upload file');
}

// Use uploadResult.url instead of uploadResult.filePath
filePath: uploadResult.url,
```

## Supabase Storage Configuration

### Storage Bucket

- **Bucket name:** `media`
- **Max file size:** 5 GB
- **Path structure:** `content/{timestamp}_{filename}`

### File Size Limits

The service includes intelligent file size warnings:

| Size | Warning Level | Message |
|------|---------------|---------|
| > 1 GB | Danger | Very large file, will take significant time |
| > 500 MB | Warning | Large file, may take several minutes |
| > 100 MB | Info | May take some time |
| ≤ 100 MB | None | Normal upload |

### Features

- ✅ Progress tracking during upload
- ✅ Automatic public URL generation
- ✅ File size validation before upload
- ✅ Detailed error handling
- ✅ Console logging for debugging

## Supabase Storage Service API

### uploadFile()

```typescript
async uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: any }>
```

**Parameters:**
- `file`: The File object to upload
- `path`: Storage path (e.g., `content/123456_video.mp4`)
- `onProgress`: Optional callback for progress updates (0-100)

**Returns:**
- `url`: Public URL of uploaded file (if successful)
- `error`: Error object (if failed)

### deleteFile()

```typescript
async deleteFile(path: string): Promise<{ error: any }>
```

### getPublicUrl()

```typescript
getPublicUrl(path: string): string
```

### Utility Methods

- `isFileTooLarge(file: File): boolean`
- `formatFileSize(bytes: number): string`
- `getFileSizeWarningLevel(file: File): 'none' | 'info' | 'warning' | 'danger'`

## Benefits of Supabase Storage

1. **Unified Backend:** All data now in Supabase (database + storage)
2. **Better Integration:** Direct integration with Supabase Auth and RLS
3. **No External Config:** No need for Firebase API base URL
4. **Built-in CDN:** Automatic global CDN distribution
5. **Better DX:** Simpler API, less configuration needed

## Testing

### Test Upload Flow

1. Go to `/upload` page
2. Select a file (image or video)
3. Adjust settings in the editor
4. Select a pricing plan
5. Click "Pay & Upload Content"
6. File uploads to Supabase Storage bucket `media`
7. Public URL is generated and stored in order
8. Stripe checkout session opens

### Verify Upload

Check Supabase Dashboard:
1. Go to **Storage → media bucket**
2. Navigate to `content/` folder
3. Verify file exists with format: `{timestamp}_{filename}`
4. Click file to get public URL
5. Verify URL matches the one in database

## Database Impact

The `filePath` field in orders now stores the **full public URL** from Supabase Storage instead of a Firebase Storage path.

**Example:**
```
Before: gs://showyo-20c51.appspot.com/content/1234567890_video.mp4
After:  https://ijekgmegdixbxzgwsenc.supabase.co/storage/v1/object/public/media/content/1234567890_video.mp4
```

## Rollback (If Needed)

If you need to revert to Firebase Storage:

1. Configure Firebase:
   ```bash
   VITE_FIREBASE_API_BASE_URL=https://us-central1-showyo-20c51.cloudfunctions.net
   ```

2. Revert ContentUpload.tsx:
   ```typescript
   import { firebaseStorageService } from "@/domain/services/firebase/storageService";

   const uploadResult = await firebaseStorageService.uploadBillboardAsset({
     file: processedFile,
     folder: "content",
     metadata,
   });
   ```

3. Update filePath reference:
   ```typescript
   filePath: uploadResult.filePath,
   ```

## Related Files

- `/src/pages/ContentUpload.tsx` - Main upload page (updated)
- `/src/services/supabaseStorageService.ts` - Supabase Storage service
- `/src/domain/services/firebase/storageService.ts` - Old Firebase service (deprecated)
- `/src/lib/supabase.ts` - Supabase client configuration

## Migration Status

| Component | Status | Storage Backend |
|-----------|--------|-----------------|
| ContentUpload | ✅ Migrated | Supabase Storage |
| AdminQueue | ⚠️ Check needed | Unknown |
| AdminHistory | ⚠️ Check needed | Unknown |
| KioskDisplay | ⚠️ Check needed | Unknown |

## Next Steps

1. ✅ Fixed ContentUpload to use Supabase Storage
2. ⚠️ Verify other components using storage
3. ⚠️ Consider removing Firebase Storage service if no longer used
4. ⚠️ Update any admin tools that manage uploaded content

## Build Status

✅ Build successful after migration (10.24s)
- No compilation errors
- No runtime errors expected
- All imports resolved correctly
