// Simpan foto base64 ke /public/uploads → URL lokal (server-side).
import fs from "fs";
import path from "path";
import { shortId } from "@/lib/slug";

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export function saveImagesToUploads(images = []) {
  if (!images.length) return [];
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const urls = [];
  for (const img of images.slice(0, 12)) {
    const ext = EXT[img.media_type] || "jpg";
    const name = `${Date.now().toString(36)}-${shortId()}.${ext}`;
    fs.writeFileSync(path.join(dir, name), Buffer.from(img.data, "base64"));
    urls.push(`/uploads/${name}`);
  }
  return urls;
}
