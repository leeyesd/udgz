import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "어디가지 UDGZ | 오늘 갈 수 있는 가족 나들이";
const description = "아이 나이, 이동시간, 오늘의 기분에 맞춰 지금 갈 수 있는 나들이 장소를 추천해드려요.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);

  return {
    metadataBase: baseUrl,
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og.png", width: 1731, height: 906, alt: "이번 주말 어디가지? 우리 가족 나들이 추천" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
