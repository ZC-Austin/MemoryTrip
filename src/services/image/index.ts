import * as FileSystem from 'expo-file-system/legacy';
import { manipulate, SaveFormat } from 'expo-image-manipulator';

// ─── Path helpers ─────────────────────────────────────────────────────────────

export function getPhotoDir(tripId: string): string {
  return `${FileSystem.documentDirectory}photos/${tripId}/`;
}

export function getThumbDir(tripId: string): string {
  return `${FileSystem.documentDirectory}photos/${tripId}/thumbs/`;
}

export function getPhotoPath(tripId: string, photoId: string): string {
  return `${getPhotoDir(tripId)}${photoId}.jpg`;
}

export function getThumbPath(tripId: string, photoId: string): string {
  return `${getThumbDir(tripId)}${photoId}.jpg`;
}

async function ensurePhotoDirectories(tripId: string): Promise<void> {
  const photoDir = getPhotoDir(tripId);
  const thumbDir = getThumbDir(tripId);
  const photoInfo = await FileSystem.getInfoAsync(photoDir);
  if (!photoInfo.exists) {
    await FileSystem.makeDirectoryAsync(photoDir, { intermediates: true });
  }
  const thumbInfo = await FileSystem.getInfoAsync(thumbDir);
  if (!thumbInfo.exists) {
    await FileSystem.makeDirectoryAsync(thumbDir, { intermediates: true });
  }
}

// ─── File copy ────────────────────────────────────────────────────────────────

export async function copyPhotoToAppStorage(
  sourceUri: string,
  tripId: string,
  photoId: string,
): Promise<string> {
  await ensurePhotoDirectories(tripId);
  const destPath = getPhotoPath(tripId, photoId);
  await FileSystem.copyAsync({ from: sourceUri, to: destPath });
  return destPath;
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

const THUMB_SIZE = 300; // px

export async function generateThumbnail(
  localPath: string,
  tripId: string,
  photoId: string,
): Promise<string | null> {
  try {
    const result = await manipulate(
      localPath,
      [{ resize: { width: THUMB_SIZE, height: THUMB_SIZE } }],
      { compress: 0.7, format: SaveFormat.JPEG },
    );
    const thumbPath = getThumbPath(tripId, photoId);
    await FileSystem.copyAsync({ from: result.uri, to: thumbPath });
    return thumbPath;
  } catch {
    return null;
  }
}

// ─── EXIF extraction ──────────────────────────────────────────────────────────

export interface ExifResult {
  gpsLat:    number | null;
  gpsLng:    number | null;
  takenAt:   string | null;
}

export function extractExifData(exif: Record<string, unknown> | null | undefined): ExifResult {
  if (!exif) return { gpsLat: null, gpsLng: null, takenAt: null };

  let gpsLat = (exif.GPSLatitude as number | null) ?? null;
  let gpsLng = (exif.GPSLongitude as number | null) ?? null;
  const latRef = exif.GPSLatitudeRef  as string | undefined;
  const lngRef = exif.GPSLongitudeRef as string | undefined;

  if (gpsLat != null && latRef === 'S') gpsLat = -gpsLat;
  if (gpsLng != null && lngRef === 'W') gpsLng = -gpsLng;

  let takenAt: string | null = null;
  const raw = (exif.DateTimeOriginal ?? exif.DateTime) as string | undefined;
  if (raw) {
    // "2026:05:14 12:34:56" → ISO
    takenAt = raw.replace(/^(\d{4}):(\d{2}):(\d{2}) /, '$1-$2-$3T') + 'Z';
  }

  return { gpsLat, gpsLng, takenAt };
}

// ─── Full pipeline ────────────────────────────────────────────────────────────

export interface ProcessedPhoto {
  localPath:      string;
  thumbPath:      string | null;
  gpsLat:         number | null;
  gpsLng:         number | null;
  takenAt:        string | null;
  locationSource: 'exif' | 'gps' | null;
}

export interface ProcessPhotoOptions {
  source:    'camera' | 'gallery';
  exif?:     Record<string, unknown> | null;
  cameraGps?: { lat: number; lng: number } | null;
}

export async function processPickedPhoto(
  sourceUri: string,
  tripId: string,
  photoId: string,
  options: ProcessPhotoOptions,
): Promise<ProcessedPhoto> {
  const [localPath, thumbPath] = await Promise.all([
    copyPhotoToAppStorage(sourceUri, tripId, photoId),
    generateThumbnail(sourceUri, tripId, photoId),
  ]);

  const exifData = options.exif ? extractExifData(options.exif) : null;

  let gpsLat: number | null = null;
  let gpsLng: number | null = null;
  let takenAt: string | null = null;
  let locationSource: 'exif' | 'gps' | null = null;

  if (options.source === 'gallery' && exifData?.gpsLat != null) {
    // Gallery: prefer EXIF GPS
    gpsLat          = exifData.gpsLat;
    gpsLng          = exifData.gpsLng;
    takenAt         = exifData.takenAt;
    locationSource  = 'exif';
  } else if (options.source === 'camera' && options.cameraGps) {
    // Camera: use current device GPS
    gpsLat         = options.cameraGps.lat;
    gpsLng         = options.cameraGps.lng;
    takenAt        = exifData?.takenAt ?? new Date().toISOString();
    locationSource = 'gps';
  } else if (exifData) {
    gpsLat   = exifData.gpsLat;
    gpsLng   = exifData.gpsLng;
    takenAt  = exifData.takenAt;
    if (gpsLat != null) locationSource = 'exif';
  }

  return { localPath, thumbPath, gpsLat, gpsLng, takenAt, locationSource };
}

// ─── Batch delete ─────────────────────────────────────────────────────────────

export async function deletePhotoFiles(localPath: string, thumbPath: string | null): Promise<void> {
  try { await FileSystem.deleteAsync(localPath, { idempotent: true }); } catch { /* ignore */ }
  if (thumbPath) {
    try { await FileSystem.deleteAsync(thumbPath, { idempotent: true }); } catch { /* ignore */ }
  }
}
