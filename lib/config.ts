import "server-only";

export type MissingSetting = {
  name: string;
  why: string;
  how: string;
};

/**
 * Environment a production deployment cannot start without.
 *
 * Local development can use embedded SQLite. Hosted Vercel deployments need
 * a persistent PostgreSQL database. SESSION_SECRET only needs
 * checking in production: locally, lib/auth/session.ts falls back to a fixed
 * dev-only secret so a fresh clone never gets stuck on a setup screen. A real
 * deployment must not run on that fallback, so it's flagged here instead.
 */
export function missingSettings(): MissingSetting[] {
  const missing: MissingSetting[] = [];

  if (process.env.NODE_ENV === "production") {
    if (process.env.VERCEL === "1" && !/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL ?? "")) {
      missing.push({
        name: "DATABASE_URL",
        why: "Vercel memerlukan penyimpanan permanen untuk akun, daftar pantauan, dan katalog BEI. Berkas SQLite lokal tidak dapat dipakai sebagai basis data hosting.",
        how: "Supabase → Connect → ORM → Prisma: masukkan URL transaction pooler ke DATABASE_URL di Vercel. Lihat docs/SUPABASE.md.",
      });
    }
    const secret = process.env.SESSION_SECRET ?? "";
    if (!secret) {
      missing.push({
        name: "SESSION_SECRET",
        why: "Kunci untuk cookie sesi masuk. Wajib di produksi; nilai bawaan pengembangan tidak digunakan di sini.",
        how: 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      });
    } else if (secret.length < 32) {
      missing.push({
        name: "SESSION_SECRET",
        why: `Panjang minimal 32 karakter; saat ini ${secret.length} karakter.`,
        how: 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      });
    }
  }

  return missing;
}
