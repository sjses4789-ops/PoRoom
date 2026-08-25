import type { Metadata } from "next";
import { PrivacyContent } from "./privacy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | PoRoom",
  description:
    "How PoRoom collects, uses, and protects your personal information, including Google sign-in and the optional Google Drive (PomoWriter) import feature.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
