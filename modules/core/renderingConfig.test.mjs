import { describe, it, expect, beforeEach } from 'vitest';
import { getRendering, setFromAppState } from './renderingConfig.mjs';

const DEFAULTS = {
  parallaxScaleAtMaxZ: 0.9,
  saturationAtMaxZ: 1.0,
  brightnessAtMaxZ: 1.0,
  blurAtMaxZ: 0
};

describe('core/renderingConfig', () => {
  beforeEach(() => {
    setFromAppState(DEFAULTS);
  });

  describe('getRendering', () => {
    it('returns all four keys with default values', () => {
      const r = getRendering();
      expect(r).toEqual(DEFAULTS);
      expect(r).toHaveProperty('parallaxScaleAtMaxZ', 0.9);
      expect(r).toHaveProperty('saturationAtMaxZ', 1.0);
      expect(r).toHaveProperty('brightnessAtMaxZ', 1.0);
      expect(r).toHaveProperty('blurAtMaxZ', 0);
    });

    it('returns a new object each time (copy)', () => {
      const a = getRendering();
      const b = getRendering();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('setFromAppState', () => {
    it('updates all values when given full object', () => {
      setFromAppState({
        parallaxScaleAtMaxZ: 0.5,
        saturationAtMaxZ: 0.6,
        brightnessAtMaxZ: 0.75,
        blurAtMaxZ: 2
      });
      const r = getRendering();
      expect(r.parallaxScaleAtMaxZ).toBe(0.5);
      expect(r.saturationAtMaxZ).toBe(0.6);
      expect(r.brightnessAtMaxZ).toBe(0.75);
      expect(r.blurAtMaxZ).toBe(2);
    });

    it('updates only provided keys (partial merge)', () => {
      setFromAppState({ blurAtMaxZ: 3 });
      const r = getRendering();
      expect(r.parallaxScaleAtMaxZ).toBe(0.9);
      expect(r.saturationAtMaxZ).toBe(1.0);
      expect(r.brightnessAtMaxZ).toBe(1.0);
      expect(r.blurAtMaxZ).toBe(3);
    });

    it('coerces string numbers', () => {
      setFromAppState({
        parallaxScaleAtMaxZ: '0.8',
        saturationAtMaxZ: '0.5',
        brightnessAtMaxZ: '0.9',
        blurAtMaxZ: '1'
      });
      const r = getRendering();
      expect(r.parallaxScaleAtMaxZ).toBe(0.8);
      expect(r.saturationAtMaxZ).toBe(0.5);
      expect(r.brightnessAtMaxZ).toBe(0.9);
      expect(r.blurAtMaxZ).toBe(1);
    });

    it('clamps blurAtMaxZ to at least 0', () => {
      setFromAppState({ blurAtMaxZ: -1 });
      const r = getRendering();
      expect(r.blurAtMaxZ).toBe(0);
    });

    it('ignores undefined rendering (no-op)', () => {
      setFromAppState({ blurAtMaxZ: 5 });
      setFromAppState(undefined);
      const r = getRendering();
      expect(r.blurAtMaxZ).toBe(5);
    });

    it('ignores null rendering (no-op)', () => {
      setFromAppState({ blurAtMaxZ: 5 });
      setFromAppState(null);
      const r = getRendering();
      expect(r.blurAtMaxZ).toBe(5);
    });

    it('ignores non-object (no-op)', () => {
      setFromAppState({ blurAtMaxZ: 5 });
      setFromAppState('invalid');
      const r = getRendering();
      expect(r.blurAtMaxZ).toBe(5);
    });

    it('uses default for parallaxScaleAtMaxZ when value is NaN or 0 (|| fallback)', () => {
      setFromAppState({ parallaxScaleAtMaxZ: 0 });
      const r = getRendering();
      expect(r.parallaxScaleAtMaxZ).toBe(0.9);
    });

    it('keeps 0 for saturationAtMaxZ and brightnessAtMaxZ (?? fallback)', () => {
      setFromAppState({ saturationAtMaxZ: 0, brightnessAtMaxZ: 0 });
      const r = getRendering();
      expect(r.saturationAtMaxZ).toBe(0);
      expect(r.brightnessAtMaxZ).toBe(0);
    });
  });
});
