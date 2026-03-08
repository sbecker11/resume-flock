import { describe, it, expect } from 'vitest';
import { enrichJobsWithSkills } from './enrichedJobs.mjs';

describe('enrichedJobs', () => {
  it('enrichJobsWithSkills returns array with references and job-skills', () => {
    const rawJobs = [
      { index: 0, employer: 'Test', role: 'Dev', Description: 'Used [Python] and [AWS].' }
    ];
    const skills = {
      Python: { url: 'https://python.org', img: '' },
      AWS: { url: 'https://aws.amazon.com', img: '' }
    };
    const jobs = enrichJobsWithSkills(rawJobs, skills);
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBe(1);
    expect(jobs[0]).toHaveProperty('references');
    expect(jobs[0]).toHaveProperty('job-skills');
    expect(Array.isArray(jobs[0].references)).toBe(true);
    expect(jobs[0]['job-skills']).toHaveProperty('Python');
    expect(jobs[0]['job-skills']).toHaveProperty('AWS');
  });
  it('enrichJobsWithSkills handles empty jobs', () => {
    expect(enrichJobsWithSkills([], {})).toEqual([]);
  });
  it('enrichJobsWithSkills handles missing skills', () => {
    const rawJobs = [{ index: 0, Description: 'No brackets.' }];
    const jobs = enrichJobsWithSkills(rawJobs, {});
    expect(jobs[0].references).toEqual([]);
    expect(jobs[0]['job-skills']).toEqual({});
  });
});
