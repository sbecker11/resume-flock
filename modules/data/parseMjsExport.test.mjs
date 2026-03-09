import { describe, it, expect } from 'vitest';
import { parseMjsExport } from './parseMjsExport.mjs';

describe('parseMjsExport', () => {
  describe('resume-parser format compatibility (export const)', () => {
    it('parses export const jobs = [...];', () => {
      const content = 'export const jobs = [{"index":0,"role":"Dev"}];';
      const jobs = parseMjsExport(content, 'jobs');
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toEqual({ index: 0, role: 'Dev' });
    });

    it('parses export const skills = {...};', () => {
      const content = 'export const skills = {"Python":{"url":"https://python.org","img":""}};';
      const skills = parseMjsExport(content, 'skills');
      expect(skills).toEqual({ Python: { url: 'https://python.org', img: '' } });
    });

    it('parses content with no trailing semicolon', () => {
      const content = 'export const jobs = [{"index":0}]';
      const jobs = parseMjsExport(content, 'jobs');
      expect(jobs).toHaveLength(1);
    });

    it('parses export const with trailing semicolon (full export path)', () => {
      const content = 'export const skills = {"A":{}};';
      const skills = parseMjsExport(content, 'skills');
      expect(skills).toEqual({ A: {} });
    });


    it('parses multi-line export const', () => {
      const content = `export const jobs = [
        {"index": 0, "employer": "Acme"}
      ];`;
      const jobs = parseMjsExport(content, 'jobs');
      expect(jobs).toHaveLength(1);
      expect(jobs[0].employer).toBe('Acme');
    });
  });

  describe('alternative format (const without export)', () => {
    it('parses const jobs = [...];', () => {
      const content = 'const jobs = [{"index":0}];';
      const jobs = parseMjsExport(content, 'jobs');
      expect(jobs).toHaveLength(1);
    });

    it('parses const without trailing semicolon', () => {
      const content = 'const jobs = [{"x":1}]';
      const jobs = parseMjsExport(content, 'jobs');
      expect(jobs).toHaveLength(1);
      expect(jobs[0].x).toBe(1);
    });

    it('parses const skills = {...};', () => {
      const content = 'const skills = {"X":{}};';
      const skills = parseMjsExport(content, 'skills');
      expect(skills).toEqual({ X: {} });
    });
  });

  describe('error cases', () => {
    it('throws when variable name is missing', () => {
      const content = 'export const other = [];';
      expect(() => parseMjsExport(content, 'jobs')).toThrow('Missing "jobs"');
    });

    it('throws when content is not valid JSON', () => {
      const content = 'export const jobs = [invalid];';
      expect(() => parseMjsExport(content, 'jobs')).toThrow();
    });
  });
});
