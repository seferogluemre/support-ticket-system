import { UAParser } from 'ua-parser-js';

/**
 * Extract client IP address from request
 * 
 * Tries to get IP from (in order):
 * 1. X-Forwarded-For header (proxy/load balancer)
 * 2. X-Real-IP header (nginx reverse proxy)
 * 3. CF-Connecting-IP header (Cloudflare)
 * 
 * @returns IP address or null if not found
 */
export function getClientIp(request: Request): string | null {
  // Check X-Forwarded-For (can contain multiple IPs, first one is client)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // X-Forwarded-For can be: "client, proxy1, proxy2"
    const ips = xForwardedFor.split(',').map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  // Check X-Real-IP
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp;

  // Check Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  // Return null if no IP found
  return null;
}

/**
 * Parse user agent and extract device information from request
 * 
 * Uses ua-parser-js library for accurate parsing
 * 
 * Returns all fields expected by VisitorSession:
 * - ipAddress: Client IP address
 * - userAgent: Raw user agent string
 * - referrer: Referrer URL
 * - deviceType: Device type (mobile, tablet, desktop, console, smarttv, wearable, embedded, xr, unknown)
 * - deviceVendor: Device manufacturer (Apple, Samsung, etc.)
 * - deviceModel: Device model (iPhone, Galaxy S21, etc.)
 * - browserName: Browser name (Chrome, Safari, Firefox, etc.)
 * - browserVersion: Full browser version
 * - browserMajor: Major browser version
 * - osName: Operating system name
 * - osVersion: OS version
 * - engineName: Browser engine (Blink, WebKit, Gecko, etc.)
 * - engineVersion: Engine version
 * - cpuArchitecture: CPU architecture (amd64, arm64, etc.)
 */
export function parseUserAgent(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'console' | 'smarttv' | 'wearable' | 'embedded' | 'xr' | null;
  deviceVendor: string | null;
  deviceModel: string | null;
  browserName: string | null;
  browserVersion: string | null;
  browserMajor: string | null;
  osName: string | null;
  osVersion: string | null;
  engineName: string | null;
  engineVersion: string | null;
  cpuArchitecture: string | null;
} {

  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get('user-agent');
  const referrer = request.headers.get('referer') || request.headers.get('referrer');

  // Default values
  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'console' | 'smarttv' | 'wearable' | 'embedded' | 'xr' | null = null;
  let deviceVendor: string | null = null;
  let deviceModel: string | null = null;
  let browserName: string | null = null;
  let browserVersion: string | null = null;
  let browserMajor: string | null = null;
  let osName: string | null = null;
  let osVersion: string | null = null;
  let engineName: string | null = null;
  let engineVersion: string | null = null;
  let cpuArchitecture: string | null = null;

  if (userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Device information
    if (result.device?.type) {
      // UAParser returns 'mobile', 'tablet', 'console', 'smarttv', 'wearable', 'embedded'
      // Return the value as-is (lowercase)
      const type = result.device.type.toLowerCase();
      if (['mobile', 'tablet', 'console', 'smarttv', 'wearable', 'embedded'].includes(type)) {
        deviceType = type as 'mobile' | 'tablet' | 'console' | 'smarttv' | 'wearable' | 'embedded';
      } else {
        deviceType = 'desktop';
      }
    } else {
      // If no device type specified, assume desktop
      deviceType = 'desktop';
    }

    deviceVendor = result.device?.vendor || null;
    deviceModel = result.device?.model || null;

    // Browser information
    browserName = result.browser?.name || null;
    browserVersion = result.browser?.version || null;
    browserMajor = result.browser?.major || null;

    // OS information
    osName = result.os?.name || null;
    osVersion = result.os?.version || null;

    // Engine information
    engineName = result.engine?.name || null;
    engineVersion = result.engine?.version || null;

    // CPU architecture
    cpuArchitecture = result.cpu?.architecture || null;
  }

  return {
    ipAddress,
    userAgent,
    referrer,
    deviceType,
    deviceVendor,
    deviceModel,
    browserName,
    browserVersion,
    browserMajor,
    osName,
    osVersion,
    engineName,
    engineVersion,
    cpuArchitecture,
  };
}

/**
 * Extract domain/hostname from various request sources
 * 
 * Tries to get domain from:
 * 1. Origin header (CORS requests)
 * 2. Referer header (embedded widget)
 * 3. X-Forwarded-Host header (proxied requests)
 * 4. Host header (direct requests)
 * 5. Request URL fallback
 */
export function getRequestDomain(request: Request | URL | string): string {
  if (request instanceof Request) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const xForwardedHost = request.headers.get('x-forwarded-host');
    const host = request.headers.get('host');

    let urlHref = origin || referer || xForwardedHost || host;

    // If we got host header without protocol, add http://
    if (urlHref && !urlHref.startsWith('http://') && !urlHref.startsWith('https://')) {
      urlHref = `http://${urlHref}`;
    }

    const hostname = new URL(urlHref || request.url).hostname;

      return hostname;
  }

  if (request instanceof URL) {
    return request.hostname;
  }

  // String URL
  return new URL(request).hostname;
}
