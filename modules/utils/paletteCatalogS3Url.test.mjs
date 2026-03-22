import { describe, it, expect } from 'vitest';
import { resolvePaletteCatalogS3Url, resolvePaletteCatalogS3UrlFromRecord } from './paletteCatalogS3Url.mjs';

describe('resolvePaletteCatalogS3UrlFromRecord', () => {
    it('returns full URL when S3_COLOR_PALETTES_JSON_URL is set', () => {
        expect(
            resolvePaletteCatalogS3UrlFromRecord({
                S3_COLOR_PALETTES_JSON_URL: '  https://bucket.s3.us-west-1.amazonaws.com/metadata/color_palettes.jsonl  ',
            })
        ).toBe('https://bucket.s3.us-west-1.amazonaws.com/metadata/color_palettes.jsonl');
    });

    it('builds URL from S3_IMAGES_BUCKET + AWS_REGION + S3_PALETTES_JSONL_KEY (CPM)', () => {
        expect(
            resolvePaletteCatalogS3UrlFromRecord({
                S3_IMAGES_BUCKET: 'sbecker11-color-palette-images',
                AWS_REGION: 'us-west-1',
                S3_PALETTES_JSONL_KEY: 'metadata/color_palettes.jsonl',
            })
        ).toBe(
            'https://sbecker11-color-palette-images.s3.us-west-1.amazonaws.com/metadata/color_palettes.jsonl'
        );
    });

    it('legacy: S3_BUCKET + S3_REGION + S3_COLOR_PALETTES_OBJECT_KEY', () => {
        expect(
            resolvePaletteCatalogS3UrlFromRecord({
                S3_BUCKET: 'legacy-bucket',
                S3_REGION: 'eu-west-1',
                S3_COLOR_PALETTES_OBJECT_KEY: 'metadata/color_palettes.jsonl',
            })
        ).toBe('https://legacy-bucket.s3.eu-west-1.amazonaws.com/metadata/color_palettes.jsonl');
    });
});

describe('resolvePaletteCatalogS3Url', () => {
    it('returns full URL when S3_COLOR_PALETTES_JSON_URL is set (CPM-ts style)', () => {
        const url = resolvePaletteCatalogS3Url({
            S3_COLOR_PALETTES_JSON_URL: '  https://bucket.s3.us-west-1.amazonaws.com/metadata/color_palettes.jsonl  ',
            S3_IMAGES_BUCKET: 'ignored',
            AWS_REGION: 'ignored',
            S3_PALETTES_JSONL_KEY: 'ignored',
        });
        expect(url).toBe('https://bucket.s3.us-west-1.amazonaws.com/metadata/color_palettes.jsonl');
    });

    it('builds URL from S3_IMAGES_BUCKET + AWS_REGION + S3_PALETTES_JSONL_KEY', () => {
        const url = resolvePaletteCatalogS3Url({
            S3_IMAGES_BUCKET: 'sbecker11-color-palette-images',
            AWS_REGION: 'us-west-1',
            S3_PALETTES_JSONL_KEY: 'metadata/color_palettes.jsonl',
        });
        expect(url).toBe(
            'https://sbecker11-color-palette-images.s3.us-west-1.amazonaws.com/metadata/color_palettes.jsonl'
        );
    });

    it('strips leading slashes from object key', () => {
        expect(
            resolvePaletteCatalogS3Url({
                S3_IMAGES_BUCKET: 'b',
                AWS_REGION: 'us-east-1',
                S3_PALETTES_JSONL_KEY: '/path/to/file.jsonl',
            })
        ).toBe('https://b.s3.us-east-1.amazonaws.com/path/to/file.jsonl');
    });

    it('returns empty string when nothing configured', () => {
        expect(resolvePaletteCatalogS3Url({})).toBe('');
    });

    it('returns empty when bucket/region/key incomplete', () => {
        expect(resolvePaletteCatalogS3Url({ S3_IMAGES_BUCKET: 'x', AWS_REGION: 'y' })).toBe('');
    });
});
