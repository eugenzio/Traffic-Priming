/**
 * Collect browser and device information for analysis
 */

export interface DeviceInfo {
  // Browser
  browser: string;
  browserVersion: string;

  // Device
  deviceType: 'desktop' | 'tablet' | 'mobile';
  os: string;

  // Screen
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;

  // Features
  touchSupport: boolean;

  // Timestamp
  collectedAt: string;
}

/**
 * Detect browser name and version
 */
function detectBrowser(): { browser: string; version: string } {
  const ua = navigator.userAgent;

  // Edge
  if (ua.indexOf('Edg/') > -1) {
    const match = ua.match(/Edg\/(\d+)/);
    return { browser: 'Edge', version: match ? match[1] : 'unknown' };
  }

  // Chrome
  if (ua.indexOf('Chrome/') > -1 && ua.indexOf('Edg/') === -1) {
    const match = ua.match(/Chrome\/(\d+)/);
    return { browser: 'Chrome', version: match ? match[1] : 'unknown' };
  }

  // Firefox
  if (ua.indexOf('Firefox/') > -1) {
    const match = ua.match(/Firefox\/(\d+)/);
    return { browser: 'Firefox', version: match ? match[1] : 'unknown' };
  }

  // Safari
  if (ua.indexOf('Safari/') > -1 && ua.indexOf('Chrome/') === -1) {
    const match = ua.match(/Version\/(\d+)/);
    return { browser: 'Safari', version: match ? match[1] : 'unknown' };
  }

  return { browser: 'Unknown', version: 'unknown' };
}

/**
 * Detect operating system
 */
function detectOS(): string {
  const ua = navigator.userAgent;

  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'macOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';

  return 'Unknown';
}

/**
 * Detect device type
 */
function detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  const ua = navigator.userAgent;

  // Mobile devices
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'mobile';
  }

  // Tablets
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) {
    return 'tablet';
  }

  // Desktop
  return 'desktop';
}

/**
 * Detect touch support
 */
function hasTouchSupport(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Collect all device information
 */
export function collectDeviceInfo(): DeviceInfo {
  const { browser, version } = detectBrowser();

  return {
    browser,
    browserVersion: version,
    deviceType: detectDeviceType(),
    os: detectOS(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    touchSupport: hasTouchSupport(),
    collectedAt: new Date().toISOString()
  };
}
