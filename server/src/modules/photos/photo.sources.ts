import type { GeoTags } from '../map/map.types';

const COMMONS_WIDTH = 640;

// Where a photo might come from. Tried in order; the first that yields a usable image wins.
export type PhotoSource =
  | { kind: 'image'; url: string }
  | { kind: 'wikidata'; id: string }
  | { kind: 'wikipedia'; lang: string; title: string }
  | { kind: 'website'; url: string };

const isHttpUrl = (text: string) => /^https?:\/\/\S+$/i.test(text);

// A Wikimedia Commons file, scaled down by Commons itself.
export function commonsFileUrl(file: string): string {
  const name = file.replace(/^(File|Image):/i, '').trim().replace(/ /g, '_');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${COMMONS_WIDTH}`;
}

function fromImageTag(value: string): string | null {
  const text = value.trim();
  if (/^File:/i.test(text)) return commonsFileUrl(text);
  if (!isHttpUrl(text)) return null;
  // Often a link to the file's Commons page rather than to the image.
  const page = /^https?:\/\/commons\.wikimedia\.org\/wiki\/(File:[^?#]+)/i.exec(text);
  if (!page) return text;
  try {
    return commonsFileUrl(decodeURIComponent(page[1]!));
  } catch {
    return null;
  }
}

// The map's own knowledge of the place first, then the place's website (the user's, else the map's).
export function photoSources(tags: GeoTags, website: string | null): PhotoSource[] {
  const sources: PhotoSource[] = [];

  const image = tags['image'] ? fromImageTag(tags['image']) : null;
  if (image) sources.push({ kind: 'image', url: image });

  const commons = tags['wikimedia_commons']?.trim();
  if (commons && /^File:/i.test(commons)) sources.push({ kind: 'image', url: commonsFileUrl(commons) });

  const wikidata = tags['wikidata']?.trim();
  if (wikidata && /^Q\d+$/.test(wikidata)) sources.push({ kind: 'wikidata', id: wikidata });

  const wikipedia = /^([a-z][a-z-]{1,11}):(.+)$/.exec(tags['wikipedia']?.trim() ?? '');
  if (wikipedia) sources.push({ kind: 'wikipedia', lang: wikipedia[1]!, title: wikipedia[2]! });

  const site = [website, tags['website'], tags['contact:website']].find((url) => url && isHttpUrl(url.trim()));
  if (site) sources.push({ kind: 'website', url: site.trim() });

  return sources;
}

export function wikidataClaimsUrl(id: string): string {
  const params = new URLSearchParams({ action: 'wbgetclaims', entity: id, property: 'P18', format: 'json' });
  return `https://www.wikidata.org/w/api.php?${params}`;
}

// P18 is Wikidata's "image" property: the name of a Commons file.
export function imageFromClaims(body: unknown): string | null {
  const claims = (body as { claims?: { P18?: { mainsnak?: { datavalue?: { value?: unknown } } }[] } })?.claims?.P18;
  const file = Array.isArray(claims) ? claims[0]?.mainsnak?.datavalue?.value : null;
  return typeof file === 'string' && file ? commonsFileUrl(file) : null;
}

export function wikipediaImageUrl(lang: string, title: string): string {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: String(COMMONS_WIDTH),
    redirects: '1',
    format: 'json',
  });
  return `https://${lang}.wikipedia.org/w/api.php?${params}`;
}

export function imageFromPageImages(body: unknown): string | null {
  const pages = (body as { query?: { pages?: Record<string, { thumbnail?: { source?: unknown } }> } })?.query?.pages;
  if (!pages || typeof pages !== 'object') return null;
  for (const page of Object.values(pages)) {
    const source = page?.thumbnail?.source;
    if (typeof source === 'string' && isHttpUrl(source)) return source;
  }
  return null;
}

const PREVIEW_KEYS = ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'];

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

// The image a page offers for link previews, as an absolute URL.
export function previewImage(html: string, pageUrl: string): string | null {
  const found = new Map<string, string>();
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = new Map<string, string>();
    for (const [, name, double, single, bare] of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
      attrs.set(name!.toLowerCase(), decodeEntities(double ?? single ?? bare ?? ''));
    }
    const key = (attrs.get('property') ?? attrs.get('name'))?.toLowerCase();
    const content = attrs.get('content')?.trim();
    if (key && content && !found.has(key)) found.set(key, content);
  }
  for (const key of PREVIEW_KEYS) {
    const content = found.get(key);
    if (!content) continue;
    try {
      const url = new URL(content, pageUrl);
      if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
    } catch {
      // Not a usable link: try the next one.
    }
  }
  return null;
}
