// The network's YouTube channels — single source of truth for the homepage
// grid and the Latest Drops feed. Handles + channel IDs verified Aug 2026.
export type Channel = {
  name: string;
  handle: string;
  /** UC… id, used for the no-key RSS feed */
  channelId: string;
  from: string;
  to: string;
};

export const channels: Channel[] = [
  {
    name: "inMOGnito",
    handle: "inMOGnitoBrand",
    channelId: "UCb0fM46SgjFbSJh8sMSguvQ",
    from: "#B9A8F5",
    to: "#7C6BE8",
  },
  {
    name: "Most Remote",
    handle: "MostRemote",
    channelId: "UCmm6NOrz4Hh89SdFhfKnSSg",
    from: "#7DD6E8",
    to: "#38A8C9",
  },
  {
    name: "OTP Daily Doodles",
    handle: "OTPDailyDoodles",
    channelId: "UCsOH8_oyYHrjVwYb_aotR2g",
    from: "#FFC29E",
    to: "#F085C0",
  },
  {
    name: "Cinderella Sports",
    handle: "Cinderella-Sports",
    channelId: "UCgGXS-fQIESBW62yqSNINYQ",
    from: "#A8C6F6",
    to: "#8B72EA",
  },
  {
    name: "lightswitched",
    handle: "lightswitched",
    channelId: "UCMR2KCCG6qv_wPXhyKaCGCw",
    from: "#FFE0A0",
    to: "#FF9A62",
  },
];
