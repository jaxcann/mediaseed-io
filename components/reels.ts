// Reels data. Server-safe (no "use client"), so app/page.tsx or metadata
// routes can import it directly: `import { reels } from "@/components/reels"`.
//
// The Reels section renders only when this array has entries. Fill it with
// real reels only: title, description, views, url, date, plus `src`
// (self-hosted vertical mp4, 1080x1920, H.264, AAC, under ~8 MB) and `poster`
// (1080x1920 jpg, the first frame). Suggested paths: /media/reels/<id>.mp4 and
// /media/reels/<id>.jpg. A reel with an empty `src` renders its poster, or a
// cream title screen if the poster is empty too. It never renders a broken video.

export type ReelClient = "VSA" | "View Finders" | "Other";
export type ReelPlatform = "Instagram" | "TikTok" | "YouTube";

export type Reel = {
  id: string;
  client: ReelClient;
  title: string;
  description: string;
  views: number;
  platform: ReelPlatform;
  url: string;
  src: string;
  poster: string;
  date: string;
};

export const reels: Reel[] = [
  {
    id: "vf-lemurs",
    client: "View Finders",
    title: "Photographing Lemurs in Necker Island",
    description: "",
    views: 0,
    platform: "Instagram",
    url: "",
    src: "/media/reels/lemurs.mp4",
    poster: "/media/reels/lemurs.jpg",
    date: "",
  },
];
