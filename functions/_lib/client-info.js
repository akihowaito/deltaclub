const MAX_IP_LENGTH = 64;
const MAX_USER_AGENT_LENGTH = 512;

function cleanIp(value) {
  const ip = String(value || "").trim();
  if (!ip || ip.length > MAX_IP_LENGTH || !/^[0-9a-f:.]+$/iu.test(ip)) return null;
  return ip;
}

export function getClientIp(request) {
  return cleanIp(request.headers.get("CF-Connecting-IP"));
}

function browserName(userAgent) {
  if (/MicroMessenger\//iu.test(userAgent)) return "微信浏览器";
  if (/Edg(?:A|iOS)?\//iu.test(userAgent)) return "Edge";
  if (/OPR\//iu.test(userAgent)) return "Opera";
  if (/Firefox\/|FxiOS\//iu.test(userAgent)) return "Firefox";
  if (/Chrome\/|CriOS\//iu.test(userAgent)) return "Chrome";
  if (/Safari\//iu.test(userAgent)) return "Safari";
  return "浏览器";
}

function androidModel(userAgent) {
  const match = userAgent.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build[/;]|\))/iu);
  const model = match?.[1]?.replace(/^zh-cn;\s*/iu, "").trim();
  if (!model || /^(wv|mobile)$/iu.test(model) || model.length > 42) return "Android 手机";
  return model;
}

function deviceName(userAgent, platformHint) {
  if (/iPad/iu.test(userAgent)) return "iPad";
  if (/iPhone|iPod/iu.test(userAgent)) return "iPhone";
  if (/Android/iu.test(userAgent)) return androidModel(userAgent);
  if (/Windows/iu.test(userAgent) || /Windows/iu.test(platformHint)) return "Windows 电脑";
  if (/Macintosh|Mac OS X/iu.test(userAgent) || /macOS/iu.test(platformHint)) return "Mac";
  if (/CrOS/iu.test(userAgent) || /Chrome OS/iu.test(platformHint)) return "Chromebook";
  if (/Linux/iu.test(userAgent) || /Linux/iu.test(platformHint)) return "Linux 电脑";
  return "其他设备";
}

export function getDeviceLabel(request) {
  const userAgent = String(request.headers.get("User-Agent") || "").slice(0, MAX_USER_AGENT_LENGTH);
  if (!userAgent) return "未知设备";
  const platformHint = String(request.headers.get("Sec-CH-UA-Platform") || "").replaceAll('"', "").slice(0, 40);
  return `${deviceName(userAgent, platformHint)} · ${browserName(userAgent)}`;
}
