import { useSyncExternalStore } from 'react';
import { MediaViewer, ViewerStorage } from '../MediaViewer';

export function useStorage<K extends keyof ViewerStorage>(viewer: MediaViewer, pluginName: K): ViewerStorage[K] {
    return useSyncExternalStore(
        (cb) => viewer.subscribe(pluginName as string, cb),
        () => viewer.storage[pluginName]
    );
}
