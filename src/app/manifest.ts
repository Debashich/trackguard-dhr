import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrackGuard DHR",
    short_name: "TrackGuard",
    description:
      "Offline track inspection and hazard reporting for the Darjeeling Himalayan Railway.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait",
    categories: ["productivity", "utilities"],
  };
}