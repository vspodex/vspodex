import { defaultsDeep, isObject } from "es-toolkit/compat";
import { Storage } from "webextension-polyfill";

import { DEFAULT_VSPO_CHANNELS } from "./constants";
import {
  ClickBehavior,
  ClickAction,
  HolodexChannel,
  HolodexVideo,
  HelixStream,
  HelixUser,
  LiveStreamState,
  Settings,
  UnifiedStream,
  SuggestionChannel,
} from "./types";

// ─── Store Implementation (from Gumbo) ──────────────────────

export type StoreAreaName = "local" | "session" | "sync";

export interface StoreOptions<T> {
  defaultValue: T;
}

export interface StoreState<T> {
  version: number;
  value: T;
}

export type StoreChange<T> = (newValue: T, oldValue?: T) => void;

export class Store<T> {
  private listeners = new Set<StoreChange<T>>();

  private get areaStorage() {
    return browser.storage[this.areaName];
  }

  constructor(
    readonly areaName: StoreAreaName,
    readonly name: string,
    readonly options: StoreOptions<T>,
  ) {}

  applyChange(changes: Record<string, Storage.StorageChange>, areaName: string) {
    if (areaName !== this.areaName) {
      return;
    }

    const { [this.name]: change } = changes;

    if (change?.newValue == null) {
      return;
    }

    this.listeners.forEach((listener) => {
      listener(change.newValue?.value, change.oldValue?.value);
    });
  }

  onChange(listener: StoreChange<T>) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async getState() {
    const state: StoreState<T> = {
      value: this.options.defaultValue,
      version: 1,
    };

    try {
      const { [this.name]: item } = await this.areaStorage.get(this.name);

      if (item) {
        state.value = isObject(item.value)
          ? defaultsDeep(item.value, this.options.defaultValue)
          : item.value;
      }
    } catch {} // eslint-disable-line no-empty

    return state;
  }

  async setState(state: StoreState<T>) {
    await this.areaStorage.set({ [this.name]: state });
  }

  async get() {
    return (await this.getState()).value;
  }

  async set(value: T): Promise<void>;
  async set(updater: (value: T) => T): Promise<void>;
  async set(value: any) {
    const state = await this.getState();

    if (typeof value === "function") {
      value = value(state.value);
    }

    await this.setState({
      version: state.version,
      value,
    });
  }

  async reset() {
    await this.set(this.options.defaultValue);
  }

  async restore(state: StoreState<T>) {
    await this.setState(state);
  }
}

// ─── Store Instances ────────────────────────────────────────

export const stores = {
  // Holodex
  holodexApiKey: new Store<string | null>("local", "holodexApiKey", {
    defaultValue: null,
  }),

  followedChannels: new Store<string[]>("local", "followedChannels", {
    defaultValue: DEFAULT_VSPO_CHANNELS.map(c => c.id),
  }),

  channelCache: new Store<HolodexChannel[]>("local", "channelCache", {
    defaultValue: DEFAULT_VSPO_CHANNELS.map(c => ({
      id: c.id,
      name: c.name,
      english_name: c.english_name,
      type: "vtuber",
      photo: null,
      twitch: c.twitch,
      group: c.group,
    })),
  }),

  customChannelsMigrated: new Store<boolean>("local", "customChannelsMigrated", {
    defaultValue: false,
  }),

  searchChannelsList: new Store<SuggestionChannel[]>("local", "searchChannelsList", {
    defaultValue: [],
  }),

  searchChannelsLastUpdated: new Store<number>("local", "searchChannelsLastUpdated", {
    defaultValue: 0,
  }),

  liveStreams: new Store<UnifiedStream[]>("session", "liveStreams", {
    defaultValue: [],
  }),

  upcomingStreams: new Store<UnifiedStream[]>("session", "upcomingStreams", {
    defaultValue: [],
  }),

  pastStreams: new Store<UnifiedStream[]>("session", "pastStreams", {
    defaultValue: [],
  }),

  pastStreamsOffset: new Store<number>("session", "pastStreamsOffset", {
    defaultValue: 0,
  }),

  // Twitch
  twitchAccessToken: new Store<string | null>("local", "twitchAccessToken", {
    defaultValue: null,
  }),

  twitchUser: new Store<HelixUser | null>("session", "twitchUser", {
    defaultValue: null,
  }),

  twitchStreams: new Store<HelixStream[]>("session", "twitchStreams", {
    defaultValue: [],
  }),

  // Settings
  settings: new Store<Settings>("local", "settings", {
    defaultValue: {
      general: {
        clickBehavior: ClickBehavior.CreateTab,
        clickAction: ClickAction.OpenChannel,
        fontSize: "medium",
        theme: "system",
        refreshInterval: 1,
        pastStreamsRefreshInterval: 5,
        showCollabStreams: false,
        sortBy: "viewerCount",
        sortOrder: "desc",
        language: "en",
      },
      badge: {
        enabled: true,
        color: "#6366f1",
      },
    },
  }),

  liveStreamState: new Store<LiveStreamState>("local", "liveStreamState", {
    defaultValue: {
      sortField: "viewerCount",
      sortDirection: "desc",
    },
  }),
};

browser.storage.onChanged.addListener((changes, areaName) => {
  for (const store of Object.values(stores)) {
    store.applyChange(changes, areaName);
  }
});
