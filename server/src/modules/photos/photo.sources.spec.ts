import { describe, expect, it } from 'vitest';
import {
  commonsFileUrl,
  imageFromClaims,
  imageFromPageImages,
  photoSources,
  previewImage,
} from './photo.sources';

describe('photoSources', () => {
  it('tries the map\'s own image, then Wikimedia, then the website', () => {
    const sources = photoSources(
      {
        image: 'https://example.org/casino.jpg',
        wikimedia_commons: 'File:Holland Casino.jpg',
        wikidata: 'Q2982262',
        wikipedia: 'nl:Holland Casino',
        website: 'https://osm.example/',
      },
      'https://hollandcasino.nl/',
    );
    expect(sources).toEqual([
      { kind: 'image', url: 'https://example.org/casino.jpg' },
      { kind: 'image', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Holland_Casino.jpg?width=640' },
      { kind: 'wikidata', id: 'Q2982262' },
      { kind: 'wikipedia', lang: 'nl', title: 'Holland Casino' },
      { kind: 'website', url: 'https://hollandcasino.nl/' },
    ]);
  });

  it('falls back to the website the map knows', () => {
    expect(photoSources({ 'contact:website': 'https://cafe.example' }, null)).toEqual([
      { kind: 'website', url: 'https://cafe.example' },
    ]);
  });

  it('turns a link to a Commons page into the file itself', () => {
    const [source] = photoSources({ image: 'https://commons.wikimedia.org/wiki/File:Caf%C3%A9.jpg' }, null);
    expect(source).toEqual({ kind: 'image', url: commonsFileUrl('File:Café.jpg') });
  });

  it('ignores tags it cannot use', () => {
    const tags = { image: 'casino.jpg', wikimedia_commons: 'Category:Casinos', wikidata: 'P18', website: 'ftp://x' };
    expect(photoSources(tags, null)).toEqual([]);
  });
});

describe('Wikimedia answers', () => {
  it('reads the image file from Wikidata claims', () => {
    const body = { claims: { P18: [{ mainsnak: { datavalue: { value: 'Rijksmuseum Amsterdam.jpg' } } }] } };
    expect(imageFromClaims(body)).toBe(commonsFileUrl('Rijksmuseum Amsterdam.jpg'));
    expect(imageFromClaims({ claims: {} })).toBeNull();
    expect(imageFromClaims(null)).toBeNull();
  });

  it('reads the thumbnail of a Wikipedia page', () => {
    const body = { query: { pages: { 42: { thumbnail: { source: 'https://upload.wikimedia.org/a.jpg' } } } } };
    expect(imageFromPageImages(body)).toBe('https://upload.wikimedia.org/a.jpg');
    expect(imageFromPageImages({ query: { pages: { '-1': {} } } })).toBeNull();
  });
});

describe('previewImage', () => {
  it('prefers og:image over twitter:image, whatever the attribute order', () => {
    const html = `<head>
      <meta name="twitter:image" content="https://cafe.example/tw.jpg">
      <meta content='https://cafe.example/og.jpg?a=1&amp;b=2' property='og:image' />
    </head>`;
    expect(previewImage(html, 'https://cafe.example/')).toBe('https://cafe.example/og.jpg?a=1&b=2');
  });

  it('resolves a relative link against the page', () => {
    const html = '<meta name="twitter:image" content="/img/front.png">';
    expect(previewImage(html, 'https://cafe.example/menu/')).toBe('https://cafe.example/img/front.png');
  });

  it('finds nothing on a page without one, or with a link that is not http', () => {
    expect(previewImage('<title>Cafe</title>', 'https://cafe.example/')).toBeNull();
    expect(previewImage('<meta property="og:image" content="data:image/png;base64,AAAA">', 'https://cafe.example/')).toBeNull();
  });
});
