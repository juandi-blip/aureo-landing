// One-off: upload the demo video to Vercel Blob (public).
//
// Usage (PowerShell):
//   $env:BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_xxx"
//   node scripts/upload-video-to-blob.mjs
//
// Get the token from Vercel → Storage → your Blob store → ".env.local" tab,
// or run `vercel env pull`. The script prints the public URL — paste it into
// NEXT_PUBLIC_DEMO_VIDEO_URL (locally in .env.local and in Vercel project env).

import { put } from "@vercel/blob";
import { readFile } from "node:fs/promises";

const FILE = "public/aureo-video.mp4";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Missing BLOB_READ_WRITE_TOKEN env var.");
  process.exit(1);
}

const data = await readFile(FILE);
const blob = await put("aureo-video.mp4", data, {
  access: "public",
  contentType: "video/mp4",
  allowOverwrite: true,
  cacheControlMaxAge: 31536000, // 1 year — the demo video is immutable
});

console.log("\nUploaded. Public URL:\n" + blob.url + "\n");
console.log("Set this as NEXT_PUBLIC_DEMO_VIDEO_URL in .env.local and Vercel.");
