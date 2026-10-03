import { getCurrentUser } from "@/lib/auth/session";

export async function streamWriter(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return null;
  return getCurrentUser();
}

export function validatePhoto(input: unknown): string | null | undefined {
  if (input == null || input === "") return null;
  if (typeof input !== "string" || input.length > 490_000) return undefined;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input);
  if (!match) return undefined;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 350 * 1024 || bytes.length < 16) return undefined;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!(match[1] === "png" && png || match[1] === "jpeg" && jpeg || match[1] === "webp" && webp)) return undefined;
  return input;
}
