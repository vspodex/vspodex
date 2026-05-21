import { useEffect, useState } from "react";

import { Store, stores } from "~/common/stores";
import {
  HolodexChannel,
  LiveStreamState,
  LiveStreamSortField,
  Settings,
  SortDirection,
  UnifiedStream,
  HelixStream,
  HelixUser,
  SuggestionChannel,
} from "~/common/types";

// ─── Store Loader (from Gumbo) ─────────────────────────────

interface StoreLoader<T> {
  status: "pending" | "resolved" | "rejected";
  error?: Error;
  promise: Promise<T>;
  value: T;
}

const storeLoaders = new WeakMap<Store<any>, StoreLoader<any>>();

function fetchLoader<T>(store: Store<T>): StoreLoader<T> {
  let loader = storeLoaders.get(store);

  if (loader == null) {
    const factory = () => {
      const promise = store.get();

      const loader: StoreLoader<T> = {
        value: store.options.defaultValue,
        status: "pending",
        promise,
      };

      promise.then(
        (value) => {
          loader.status = "resolved";
          loader.value = value;

          store.onChange((value) => {
            loader.value = value;
          });

          return value;
        },
        (error) => {
          loader.status = "rejected";
          loader.error = error;

          throw error;
        },
      );

      return loader;
    };

    storeLoaders.set(store, (loader = factory()));
  }

  return loader;
}

// ─── useStore Hook ─────────────────────────────────────────

export interface UseStoreOptions {
  suspense?: boolean;
}

export interface UseStoreState<T> {
  isLoading: boolean;
  value: T;
}

export type UseStoreReturn<T> = [
  T,
  {
    isLoading: boolean;
    set(value: T): Promise<void>;
    set(updater: (value: T) => T): Promise<void>;
  },
];

export function useStore<T>(store: Store<T>, options: UseStoreOptions = {}): UseStoreReturn<T> {
  const loader = fetchLoader(store);

  if (options.suspense) {
    switch (loader.status) {
      case "pending":
        throw loader.promise;

      case "rejected":
        throw loader.error;
    }
  }

  const [state, setState] = useState<UseStoreState<T>>({
    isLoading: loader.status === "pending",
    value: loader.value,
  });

  useEffect(() => {
    if (state.isLoading) {
      loader.promise.then((value) => {
        setState({ value, isLoading: false });
      });
    }

    return store.onChange((value) => {
      setState((state) => ({ ...state, value }));
    });
  }, []);

  return [state.value, { ...state, set: store.set.bind(store) }];
}

// ─── Typed Store Hooks ─────────────────────────────────────

export function useSettings(options?: UseStoreOptions) {
  return useStore(stores.settings, options);
}

export function useLiveStreams(options?: UseStoreOptions) {
  return useStore(stores.liveStreams, options);
}

export function useUpcomingStreams(options?: UseStoreOptions) {
  return useStore(stores.upcomingStreams, options);
}

export function usePastStreams(options?: UseStoreOptions) {
  return useStore(stores.pastStreams, options);
}

export function usePastStreamsOffset(options?: UseStoreOptions) {
  return useStore(stores.pastStreamsOffset, options);
}

export function usePastTwitchStreams(options?: UseStoreOptions) {
  return useStore(stores.pastTwitchStreams, options);
}

export function useFollowedChannels(options?: UseStoreOptions) {
  return useStore(stores.followedChannels, options);
}

export function useChannelCache(options?: UseStoreOptions) {
  return useStore(stores.channelCache, options);
}

export function useHolodexApiKey(options?: UseStoreOptions) {
  return useStore(stores.holodexApiKey, options);
}

export function useSearchChannelsList(options?: UseStoreOptions) {
  return useStore(stores.searchChannelsList, options);
}

export function useSearchChannelsLastUpdated(options?: UseStoreOptions) {
  return useStore(stores.searchChannelsLastUpdated, options);
}

export function useTwitchAccessToken(options?: UseStoreOptions) {
  return useStore(stores.twitchAccessToken, options);
}

export function useTwitchUser(options?: UseStoreOptions) {
  return useStore(stores.twitchUser, options);
}

export function useTwitchStreams(options?: UseStoreOptions) {
  return useStore(stores.twitchStreams, options);
}

export type UseLiveStreamStateReturn = [
  LiveStreamState,
  {
    setSortDirection(value: SortDirection): void;
    setSortField(value: LiveStreamSortField): void;
  },
];

export function useLiveStreamState(options?: UseStoreOptions): UseLiveStreamStateReturn {
  const [value, store] = useStore(stores.liveStreamState, options);

  return [
    value,
    {
      setSortDirection: (value) => store.set((state) => ({ ...state, sortDirection: value })),
      setSortField: (value) => store.set((state) => ({ ...state, sortField: value })),
    },
  ];
}
