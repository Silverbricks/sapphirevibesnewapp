import { cn } from "@/lib/utils";

type Parsed =
  | { kind: "youtube" | "instagram" | "tiktok"; src: string; vertical: boolean }
  | { kind: "link" };

function parse(url: string): Parsed {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", src: `https://www.youtube.com/embed/${yt[1]}`, vertical: false };

  const ig = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)/);
  if (ig) return { kind: "instagram", src: `https://www.instagram.com/p/${ig[1]}/embed`, vertical: true };

  const tt = url.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (tt) return { kind: "tiktok", src: `https://www.tiktok.com/embed/v2/${tt[1]}`, vertical: true };

  return { kind: "link" };
}

export function VideoEmbed({ url }: { url: string }) {
  const v = parse(url);

  if (v.kind === "link") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-line-gold px-5 py-3 text-sm text-gold hover:bg-gold/10"
      >
        ▶ Watch video
      </a>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-panel border border-line bg-[#0d1015]",
        v.vertical ? "mx-auto aspect-[9/16] max-w-sm" : "aspect-video w-full",
      )}
    >
      <iframe
        src={v.src}
        title="Product video"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
