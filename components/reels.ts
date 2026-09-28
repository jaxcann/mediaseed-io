// Reels data. Server-safe (no "use client"), so app/page.tsx or metadata
// routes can import it directly: `import { reels } from "@/components/reels"`.
//
// The Reels section renders only when this array has entries. Views, dates,
// descriptions, and URLs are hidden in the UI when empty, so never invent them.
// Files live in /public/media/reels/<id>.mp4 (810x1440 H.264) + <id>.jpg poster.

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
    id: "vf-branson",
    client: "View Finders",
    title: "Necker Island with Richard Branson",
    description:
      "View Finders on Necker Island. Cut for Instagram from the Season 4 shoot, with titles and graphics built in After Effects.",
    views: 0,
    platform: "Instagram",
    url: "",
    src: "/media/reels/vf-branson.mp4",
    poster: "/media/reels/vf-branson.jpg",
    date: "",
  },
  {
    id: "vsa-ultrasound",
    client: "VSA",
    title: "Inside a venous duplex ultrasound",
    description:
      "A follow-along with our ultrasound tech, Ann Marie, so a nervous patient could see exactly what the test looks like. The most shared post on the account.",
    views: 28000,
    platform: "TikTok",
    url: "https://www.tiktok.com/@vascularsurgical/video/7485482915217050926",
    src: "/media/reels/vsa-ultrasound.mp4",
    poster: "/media/reels/vsa-ultrasound.jpg",
    date: "Mar 2025",
  },
  {
    id: "vsa-lipedema",
    client: "VSA",
    title: "Think you might have lipedema?",
    description:
      "A condition most people have never heard of, explained plainly by the practice that treats it. 103 saves on a 523-follower account.",
    views: 17600,
    platform: "TikTok",
    url: "https://www.tiktok.com/@vascularsurgical/video/7607967193065622814",
    src: "/media/reels/vsa-lipedema.mp4",
    poster: "/media/reels/vsa-lipedema.jpg",
    date: "Feb 2026",
  },
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
  {
    id: "vsa-ultrasound-babies",
    client: "VSA",
    title: "Ultrasounds are not just for babies",
    description:
      "How a vein ultrasound catches valvular dysfunction. One hook, one idea, under a minute.",
    views: 9185,
    platform: "TikTok",
    url: "https://www.tiktok.com/@vascularsurgical/video/7529614197471071518",
    src: "/media/reels/vsa-ultrasound-babies.mp4",
    poster: "/media/reels/vsa-ultrasound-babies.jpg",
    date: "Jul 2025",
  },
  {
    id: "vsa-carotid",
    client: "VSA",
    title: "A quick look at your carotid arteries",
    description:
      "How the practice checks for blockages that raise stroke risk. Shot in the clinic, cut the same day.",
    views: 8117,
    platform: "TikTok",
    url: "https://www.tiktok.com/@vascularsurgical/video/7510189584530312494",
    src: "/media/reels/vsa-carotid.mp4",
    poster: "/media/reels/vsa-carotid.jpg",
    date: "May 2025",
  },
];
