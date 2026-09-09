import type { NextConfig } from "next";

const scriptPolicy = process.env.NODE_ENV === "development"
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.google.com https://accounts.google.com"
  : "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com https://www.google.com https://accounts.google.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptPolicy,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.googleusercontent.com",
              "font-src 'self' data:",
              [
                "connect-src 'self'",
                "https://*.googleapis.com",
                "https://*.google.com",
                "https://apis.google.com",
                "https://accounts.google.com",
                "https://*.firebaseio.com",
                "https://*.cloudfunctions.net",
                "wss://*.firebaseio.com",
                "https://identitytoolkit.googleapis.com",
                "https://securetoken.googleapis.com",
                "https://firestore.googleapis.com",
                "https://firebaseinstallations.googleapis.com",
                "https://fcm.googleapis.com",
                "https://fcmregistrations.googleapis.com",
              ].join(" "),
              "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.google.com",
              "object-src 'none'",
              "worker-src 'self' blob:",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com https://*.firebaseapp.com",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
