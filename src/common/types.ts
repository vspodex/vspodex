// ─── Holodex API Types ──────────────────────────────────────────

export interface HolodexChannel {
  id: string;
  name: string;
  english_name: string | null;
  type: "vtuber" | "subber";
  photo: string | null;
  org?: string | null;
  suborg?: string | null;
  group?: string | null;
  banner?: string | null;
  twitter?: string | null;
  twitch?: string | null;
  video_count?: string | null;
  subscriber_count?: string | null;
  clip_count?: number | null;
  lang?: string | null;
  published_at?: string | null;
  inactive?: boolean;
  description?: string | null;
}

export interface SuggestionChannel {
  id: string;
  name: string;
  english_name: string | null;
  org: string | null;
  photo: string | null;
}

export interface HolodexVideo {
  id: string;
  title: string;
  type: "stream" | "clip";
  topic_id?: string | null;
  published_at?: string | null;
  available_at: string;
  duration: number;
  status: "new" | "upcoming" | "live" | "past" | "missing";
  start_scheduled?: string | null;
  start_actual?: string | null;
  end_actual?: string | null;
  live_viewers?: number | null;
  description?: string | null;
  channel_id?: string;
  channel: HolodexChannel;
}

// ─── Twitch API Types (from Gumbo) ────────────────────────────

export type Dictionary<T> = Record<string, T>;

export interface HelixUser {
  id: string;
  login: string;
  displayName: string;
  broadcasterType: string;
  description: string;
  profileImageUrl: string;
  offlineImageUrl: string;
  createdAt: string;
}

export interface HelixStream {
  id: string;
  userId: string;
  userLogin: string;
  userName: string;
  gameId: string;
  gameName: string;
  type: string;
  title: string;
  tags: null | string[];
  viewerCount: number;
  startedAt: string;
  language: string;
  thumbnailUrl: string;
  isMature: boolean;
}

export interface HelixResponse<T> {
  data: Array<T>;
  pagination: {
    cursor?: string;
  };
}

// ─── Extension Settings Types ─────────────────────────────────

export type FontSize = "smallest" | "small" | "medium" | "large" | "largest";
export type SortDirection = "asc" | "desc";
export type Theme = "system" | "dark" | "light";
export type Language = "en" | "zh" | "ja";

export enum ClickAction {
  OpenChannel,
  OpenChat,
  Popout,
}

export enum ClickBehavior {
  CreateTab,
  CreateWindow,
  CreateCurrentTab,
}

export interface GeneralSettings {
  clickBehavior: ClickBehavior;
  clickAction: ClickAction;
  fontSize: FontSize;
  theme: Theme;
  refreshInterval: number; // minutes
  pastStreamsRefreshInterval: number; // minutes (default 5)
  showCollabStreams: boolean; // show non-followed collab streams in past tab
  sortBy: "viewerCount" | "duration";
  sortOrder: "asc" | "desc";
  language: Language;
}

export interface BadgeSettings {
  enabled: boolean;
  color: string;
}

export interface Settings {
  general: GeneralSettings;
  badge: BadgeSettings;
}

// ─── Store State Types ─────────────────────────────────────────

export type LiveStreamSortField = "channelName" | "startedAt" | "viewerCount";

export interface LiveStreamState {
  sortDirection: SortDirection;
  sortField: LiveStreamSortField;
}

export interface CurrentUser {
  id: string;
  login: string;
  displayName: string;
  profileImageUrl: string;
}

// ─── Unified Stream Type ──────────────────────────────────────

export type StreamSource = "holodex" | "twitch";

export interface UnifiedStream {
  id: string;
  channelId: string;
  title: string;
  channelName: string;
  channelAvatar: string | null;
  viewerCount: number | null;
  startedAt: string | null;
  scheduledAt: string | null;
  status: "live" | "upcoming" | "past";
  source: StreamSource;
  url: string;
  thumbnailUrl: string | null;
  duration?: number | null; // seconds, for past streams
  gameName?: string | null;
  topicId?: string | null;
}
