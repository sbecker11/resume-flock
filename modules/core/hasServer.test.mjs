// modules/core/hasServer.test.mjs
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('hasServer', () => {
    const savedWindow = globalThis.window;
    const savedLocation = globalThis.window?.location;

    afterEach(() => {
        vi.resetModules();
        globalThis.window = savedWindow;
        if (globalThis.window && savedLocation) globalThis.window.location = savedLocation;
    });

    it('returns true when origin does not include github.io', async () => {
        if (typeof globalThis.window === 'undefined') return;
        globalThis.window.location = { ...(globalThis.window.location || {}), origin: 'http://localhost' };
        const { hasServer } = await import('./hasServer.mjs');
        expect(hasServer()).toBe(true);
        expect(hasServer()).toBe(true);
    });

    it('returns false when origin includes github.io', async () => {
        if (typeof globalThis.window === 'undefined') return;
        globalThis.window.location = { ...(globalThis.window.location || {}), origin: 'https://user.github.io' };
        vi.resetModules();
        const { hasServer } = await import('./hasServer.mjs');
        expect(hasServer()).toBe(false);
        expect(hasServer()).toBe(false);
    });

    it('returns false when window is undefined', async () => {
        const win = globalThis.window;
        globalThis.window = undefined;
        vi.resetModules();
        const { hasServer } = await import('./hasServer.mjs');
        expect(hasServer()).toBe(false);
        globalThis.window = win;
    });

    it('attaches function to window when window exists', async () => {
        if (typeof globalThis.window === 'undefined') return;
        vi.resetModules();
        await import('./hasServer.mjs');
        expect(typeof globalThis.window.hasServer).toBe('function');
        expect(globalThis.window.hasServer()).toBe(globalThis.window.location?.origin?.includes('github.io') ? false : true);
    });
});
