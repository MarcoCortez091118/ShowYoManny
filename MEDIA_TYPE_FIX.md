# Media Type Normalization Fix

## Problem

The upload flow was failing when creating orders in the database because of a mismatch between the MIME type format sent from the frontend and the expected format in the database.

**Error Observed:**
```
POST https://ijekgmegdixbxzgwsenc.supabase.co/rest/v1/queue_items
Status: 400 Bad Request
```

**Request was sending:**
```json
{
  "media_type": "image/png"
}
```

**Database expects:**
```
"image" or "video"
```

## Root Cause

The `queue_items` table has a `media_type` column that only accepts simplified values:
- `"image"` for any image files
- `"video"` for any video files

However, the frontend was sending full MIME types like:
- `"image/png"`
- `"image/jpeg"`
- `"video/mp4"`
- `"video/quicktime"`

This caused the database insert to fail.

## Solution

Added media type normalization in the order service to convert full MIME types to simplified format.

### Implementation

**File:** `src/services/supabaseOrderService.ts`

**Added Normalization Logic:**
```typescript
// Normalize media_type to "image" or "video" (remove MIME type)
const normalizedMediaType = input.fileType.startsWith('image/') ? 'image' :
                             input.fileType.startsWith('video/') ? 'video' :
                             input.fileType;
```

**Store Full MIME Type in Metadata:**
```typescript
const metadata = {
  user_email: input.userEmail,
  pricing_option_id: input.pricingOptionId,
  price_cents: input.priceCents,
  // ... other fields
  original_mime_type: input.fileType, // Preserve full MIME type
};
```

**Use Normalized Value:**
```typescript
const { data, error } = await supabase
  .from('queue_items')
  .insert({
    user_id: userId,
    media_url: input.filePath,
    media_type: normalizedMediaType, // "image" or "video"
    // ... other fields
    metadata: metadata, // Contains original_mime_type
  })
```

## Benefits

1. **Database Compatibility**
   - Values match database expectations
   - No more 400 errors on insert
   - Simplified querying by media type

2. **Preserved Information**
   - Full MIME type stored in `metadata.original_mime_type`
   - Can be retrieved later if needed
   - No information loss

3. **Flexible Handling**
   - Works with any image MIME type (`image/*`)
   - Works with any video MIME type (`video/*`)
   - Fallback to original value if neither

## Data Format

### Before (Incorrect)
```json
{
  "media_type": "image/png",
  "metadata": {
    "user_email": "guest@showyo.app",
    "pricing_option_id": "photo-clean"
  }
}
```

### After (Correct)
```json
{
  "media_type": "image",
  "metadata": {
    "user_email": "guest@showyo.app",
    "pricing_option_id": "photo-clean",
    "original_mime_type": "image/png"
  }
}
```

## Supported Media Types

### Images
All image MIME types are normalized to `"image"`:
- `image/png` → `"image"`
- `image/jpeg` → `"image"`
- `image/jpg` → `"image"`
- `image/gif` → `"image"`
- `image/webp` → `"image"`
- `image/svg+xml` → `"image"`

### Videos
All video MIME types are normalized to `"video"`:
- `video/mp4` → `"video"`
- `video/quicktime` → `"video"`
- `video/x-msvideo` → `"video"`
- `video/webm` → `"video"`
- `video/ogg` → `"video"`

## Testing

### 1. Upload Image

**Input:**
```typescript
{
  fileType: "image/png",
  fileName: "test-image.png",
  filePath: "https://...storage.../content/test-image.png"
}
```

**Expected Result:**
```sql
INSERT INTO queue_items (media_type, metadata, ...)
VALUES ('image', '{"original_mime_type": "image/png"}', ...)
```

**Verify:**
```sql
SELECT media_type, metadata->>'original_mime_type' as original_type
FROM queue_items
WHERE file_name = 'test-image.png';
```

Should return:
```
media_type | original_type
-----------|--------------
image      | image/png
```

### 2. Upload Video

**Input:**
```typescript
{
  fileType: "video/mp4",
  fileName: "test-video.mp4",
  filePath: "https://...storage.../content/test-video.mp4"
}
```

**Expected Result:**
```sql
INSERT INTO queue_items (media_type, metadata, ...)
VALUES ('video', '{"original_mime_type": "video/mp4"}', ...)
```

**Verify:**
```sql
SELECT media_type, metadata->>'original_mime_type' as original_type
FROM queue_items
WHERE file_name = 'test-video.mp4';
```

Should return:
```
media_type | original_type
-----------|--------------
video      | video/mp4
```

### 3. Test Complete Upload Flow

1. Go to: `https://showyotest.netlify.app/upload`
2. Upload an image file (PNG, JPEG, etc.)
3. Edit with zoom/position
4. Click "Apply Changes"
5. Select plan (e.g., "Clean Photo")
6. Click "Pay & Upload Content"

**Expected:**
- ✅ File uploads to Supabase Storage
- ✅ Order created in `queue_items` with `media_type = "image"`
- ✅ Stripe Checkout opens
- ✅ No 400 errors in console

**Check Database:**
```sql
SELECT
  id,
  media_type,
  media_url,
  file_name,
  metadata->>'original_mime_type' as mime_type,
  created_at
FROM queue_items
ORDER BY created_at DESC
LIMIT 1;
```

## Error Handling

### If Normalization Fails

The code has a fallback:
```typescript
const normalizedMediaType = input.fileType.startsWith('image/') ? 'image' :
                             input.fileType.startsWith('video/') ? 'video' :
                             input.fileType; // Fallback to original
```

This means if a file type doesn't start with `image/` or `video/`, it will use the original value. This could happen with:
- Audio files (`audio/mp3`)
- Documents (`application/pdf`)
- Other file types

For these cases, you may want to add additional handling or validation.

## Database Schema

The `queue_items` table expects:

```sql
CREATE TABLE queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL,  -- "image" or "video"
  file_name text,
  metadata jsonb,            -- Contains original_mime_type
  -- ... other columns
);
```

## Querying by Media Type

Now you can easily query by media type:

```sql
-- Get all images
SELECT * FROM queue_items WHERE media_type = 'image';

-- Get all videos
SELECT * FROM queue_items WHERE media_type = 'video';

-- Get all PNGs (using metadata)
SELECT * FROM queue_items
WHERE metadata->>'original_mime_type' = 'image/png';

-- Count by media type
SELECT media_type, COUNT(*)
FROM queue_items
GROUP BY media_type;
```

## Related Files

- ✅ `src/services/supabaseOrderService.ts` - Updated with normalization
- ✅ `src/pages/ContentUpload.tsx` - Sends fileType (unchanged)
- ✅ `src/services/supabaseStorageService.ts` - Handles file uploads

## Build Status

✅ **Build Successful** (11.11s)
- No compilation errors
- TypeScript types validated
- Ready for deployment

## Important Notes

1. **Backward Compatibility:** The change is backward compatible. Existing code that reads `media_type` will work the same way.

2. **MIME Type Preservation:** The original MIME type is preserved in `metadata.original_mime_type` for any future needs.

3. **Database Queries:** Simplified media_type makes queries more efficient and easier to write.

4. **Admin Display:** Admin interfaces can use either the simplified type or the original MIME type as needed.

## Summary

The fix ensures that the `media_type` column receives the correct format (`"image"` or `"video"`) expected by the database, while preserving the full MIME type in metadata for future reference. This resolves the 400 error when creating orders and allows the upload flow to complete successfully.
