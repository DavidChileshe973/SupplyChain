"use client";
import { useEffect } from "react";

export default function LeafletStyles() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet/dist/leaflet.css");
    }
  }, []);
  return null;
}
