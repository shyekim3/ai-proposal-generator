import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jsdom + 의존성(@exodus/bytes 등) 이 ESM 전환되면서 Vercel serverless 환경에서
  // require() 시 ERR_REQUIRE_ESM 으로 깨짐. external 로 둬서 bundle 단계에서 빼고,
  // 실제 require 시 Node 가 동적으로 처리하게 함.
  serverExternalPackages: ["jsdom", "@mozilla/readability", "html-encoding-sniffer"],
};

export default nextConfig;
