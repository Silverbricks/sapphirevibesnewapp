import { db } from "@/lib/db";

export async function getMediaAssets(opts?: { folder?: string; q?: string }) {
  const where: { folder?: string; OR?: object[] } = {};
  if (opts?.folder && opts.folder !== "all") where.folder = opts.folder;
  if (opts?.q) {
    where.OR = [
      { alt: { contains: opts.q, mode: "insensitive" } },
      { url: { contains: opts.q, mode: "insensitive" } },
      { tags: { has: opts.q } },
    ];
  }
  return db.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function getMediaFolders(): Promise<string[]> {
  const rows = await db.mediaAsset.findMany({ distinct: ["folder"], select: { folder: true }, orderBy: { folder: "asc" } });
  return rows.map((r) => r.folder);
}

export async function getMediaStats() {
  const [count, agg] = await Promise.all([
    db.mediaAsset.count(),
    db.mediaAsset.aggregate({ _sum: { bytes: true } }),
  ]);
  return { count, bytes: agg._sum.bytes ?? 0 };
}
