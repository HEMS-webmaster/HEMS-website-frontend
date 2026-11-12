export type TelemetryEventType =
  | "page_view"
  | "mailto_click"
  | "outbound_click"
  | "mailing_signup"
  | "pdf_download";

export type TelemetryDeviceType = "Desktop" | "Mobile" | "Tablet";

export interface TelemetryEventRecord {
  id: string;
  eventType: TelemetryEventType;
  path: string;
  pageTitle: string;
  sessionId: string;
  campaignSlug: string;
  referrerCategory: string;
  referrerHost: string;
  deviceType: TelemetryDeviceType;
  country: string;
  region: string;
  targetLabel: string;
  userUid: string;
  userEmail: string;
  userName: string;
  dateKey: string;
  timestamp: string;
  rolledUp: boolean;
}

export interface DailyTelemetryPoint {
  dateKey: string;
  totalViews: number;
  campaignViews: number;
  conversions: number;
  downloads: number;
}

export interface PageTrafficStat {
  path: string;
  title: string;
  views: number;
  uniqueSessions: number;
  campaignViews: number;
  conversions: number;
  lastVisitedAt: string;
}

export interface CampaignAttributionStat {
  campaignSlug: string;
  campaignSubject: string;
  sentAt: string;
  recipientCount: number;
  views: number;
  uniqueSessions: number;
  conversions: number;
  downloads: number;
  topPages: Array<{ path: string; count: number }>;
  lastSeenAt: string;
}

export interface ReferrerTrafficStat {
  source: string;
  views: number;
  percentage: number;
}

export interface GeoTrafficStat {
  location: string;
  views: number;
  percentage: number;
}

export interface DeviceTrafficStat {
  device: TelemetryDeviceType;
  views: number;
  percentage: number;
}

export interface UserActivityStat {
  uid: string;
  name: string;
  email: string;
  loginCount: number;
  pageViewCount: number;
  downloadCount: number;
  lastLogin: string;
  lastActivePath: string;
  createdAt: string;
}

export interface FileDownloadStat {
  fileName: string;
  downloadCount: number;
  lastDownloaded: string;
  category: string;
  workshopName: string;
}

