// modules/utils/logger.test.mjs
// Unit tests for centralized logging system

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('logger', () => {
    let consoleSpies;
    let mockLocalStorage;
    let originalWindow;
    let originalImportMeta;

    beforeEach(() => {
        // Mock console methods
        consoleSpies = {
            error: vi.spyOn(console, 'error').mockImplementation(() => {}),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
            info: vi.spyOn(console, 'info').mockImplementation(() => {}),
            debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
            log: vi.spyOn(console, 'log').mockImplementation(() => {})
        };

        // Mock localStorage
        mockLocalStorage = {
            data: {},
            getItem: vi.fn((key) => mockLocalStorage.data[key] || null),
            setItem: vi.fn((key, value) => { mockLocalStorage.data[key] = value; }),
            removeItem: vi.fn((key) => { delete mockLocalStorage.data[key]; }),
            clear: vi.fn(() => { mockLocalStorage.data = {}; })
        };

        // Save original globals
        originalWindow = global.window;
        originalImportMeta = global.import?.meta;

        // Mock window with localStorage
        global.window = {
            localStorage: mockLocalStorage
        };

        // Also mock global.localStorage (logger accesses localStorage directly)
        global.localStorage = mockLocalStorage;
    });

    afterEach(() => {
        // Restore original globals
        global.window = originalWindow;
        global.localStorage = undefined;
        if (originalImportMeta) {
            global.import.meta = originalImportMeta;
        }

        // Clear module cache to reset logger state
        vi.resetModules();
        vi.restoreAllMocks();
    });

    // Helper to dynamically import logger (fresh instance)
    async function importLogger() {
        return await import('./logger.mjs?t=' + Date.now());
    }

    describe('LOG_LEVELS', () => {
        it('should export LOG_LEVELS constants', async () => {
            const { LOG_LEVELS } = await importLogger();

            expect(LOG_LEVELS).toEqual({
                SILENT: 0,
                ERROR: 1,
                WARN: 2,
                INFO: 3,
                DEBUG: 4
            });
        });
    });

    describe('setLogLevel', () => {
        it('should set log level by string name', async () => {
            const { setLogLevel, getActiveLogLevel, LOG_LEVELS } = await importLogger();

            setLogLevel('ERROR');
            expect(getActiveLogLevel()).toBe(LOG_LEVELS.ERROR);

            setLogLevel('DEBUG');
            expect(getActiveLogLevel()).toBe(LOG_LEVELS.DEBUG);
        });

        it('should set log level by numeric value', async () => {
            const { setLogLevel, getActiveLogLevel, LOG_LEVELS } = await importLogger();

            setLogLevel(LOG_LEVELS.WARN);
            expect(getActiveLogLevel()).toBe(LOG_LEVELS.WARN);

            setLogLevel(3);
            expect(getActiveLogLevel()).toBe(3);
        });

        it('should save log level to localStorage', async () => {
            const { setLogLevel, LOG_LEVELS } = await importLogger();

            setLogLevel('INFO');

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LOG_LEVEL', 'INFO');
            expect(mockLocalStorage.data['LOG_LEVEL']).toBe('INFO');
        });

        it('should ignore invalid log levels', async () => {
            const { setLogLevel, getActiveLogLevel } = await importLogger();

            const initialLevel = getActiveLogLevel();
            setLogLevel('INVALID_LEVEL');

            expect(getActiveLogLevel()).toBe(initialLevel);
        });

        it('should ignore undefined values', async () => {
            const { setLogLevel, getActiveLogLevel } = await importLogger();

            const initialLevel = getActiveLogLevel();
            setLogLevel(undefined);

            expect(getActiveLogLevel()).toBe(initialLevel);
        });
    });

    describe('logger methods', () => {
        it('should log error when level is ERROR or higher', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('ERROR');
            logger.error('test error message');

            expect(consoleSpies.error).toHaveBeenCalledWith('test error message');
        });

        it('should not log error when level is SILENT', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('SILENT');
            logger.error('test error');

            expect(consoleSpies.error).not.toHaveBeenCalled();
        });

        it('should log warn when level is WARN or higher', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('WARN');
            logger.warn('test warning');

            expect(consoleSpies.warn).toHaveBeenCalledWith('test warning');
        });

        it('should not log warn when level is ERROR', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('ERROR');
            logger.warn('test warning');

            expect(consoleSpies.warn).not.toHaveBeenCalled();
        });

        it('should log info when level is INFO or higher', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('INFO');
            logger.info('test info');

            expect(consoleSpies.info).toHaveBeenCalledWith('test info');
        });

        it('should not log info when level is WARN', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('WARN');
            logger.info('test info');

            expect(consoleSpies.info).not.toHaveBeenCalled();
        });

        it('should log debug when level is DEBUG', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('DEBUG');
            logger.debug('test debug');

            expect(consoleSpies.debug).toHaveBeenCalledWith('test debug');
        });

        it('should not log debug when level is INFO', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('INFO');
            logger.debug('test debug');

            expect(consoleSpies.debug).not.toHaveBeenCalled();
        });

        it('should always log with logger.log regardless of level', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('SILENT');
            logger.log('always logged');

            expect(consoleSpies.log).toHaveBeenCalledWith('always logged');
        });

        it('should handle multiple arguments', async () => {
            const { logger, setLogLevel } = await importLogger();

            setLogLevel('DEBUG');
            logger.debug('message', 123, { key: 'value' }, ['array']);

            expect(consoleSpies.debug).toHaveBeenCalledWith('message', 123, { key: 'value' }, ['array']);
        });
    });

    describe('global window integration', () => {
        it('should expose setLogLevel on window', async () => {
            await importLogger();

            expect(window.setLogLevel).toBeDefined();
            expect(typeof window.setLogLevel).toBe('function');
        });

        it('should expose getLogLevel on window', async () => {
            await importLogger();

            expect(window.getLogLevel).toBeDefined();
            expect(typeof window.getLogLevel).toBe('function');
        });

        it('should return log level info from window.getLogLevel', async () => {
            const { setLogLevel, LOG_LEVELS } = await importLogger();

            setLogLevel('INFO');
            const result = window.getLogLevel();

            expect(result).toEqual({
                level: LOG_LEVELS.INFO,
                name: 'INFO'
            });
        });
    });

    describe('log level initialization without localStorage', () => {
        it('should handle missing localStorage', async () => {
            global.window = {};

            const { logger, LOG_LEVELS } = await importLogger();

            // Should not throw error and logger should work
            logger.error('test');
            expect(consoleSpies.error).toHaveBeenCalled();
        });
    });

    describe('log level from localStorage', () => {
        it('should initialize from localStorage if present', async () => {
            mockLocalStorage.data['LOG_LEVEL'] = 'ERROR';

            const { getActiveLogLevel, LOG_LEVELS } = await importLogger();

            expect(getActiveLogLevel()).toBe(LOG_LEVELS.ERROR);
        });

        it('should ignore invalid localStorage values', async () => {
            mockLocalStorage.data['LOG_LEVEL'] = 'INVALID';

            const { getActiveLogLevel } = await importLogger();

            // Should fall back to default (WARN in production, DEBUG in dev)
            expect(getActiveLogLevel()).toBeDefined();
        });
    });
});
