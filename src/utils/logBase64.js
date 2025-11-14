export default function logBase64(key, b64, max = 200) {
  try {
    const length = b64 ? b64.length : 0;
    const preview = b64 ? b64.slice(0, max) : "";
    console.log(`Captured photo key=${key} length=${length}`);
    console.log(`base64_preview(${Math.min(max, length)}): ${preview}`);
  } catch (e) {
    console.warn("Failed to log base64 preview", e?.message || e);
  }
}
