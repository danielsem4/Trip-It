import dns from 'dns';
import http from 'http';
import https from 'https';
import net from 'net';
import { USER_AGENT } from '../map/geocoder';

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

export interface FetchedFile {
  // Where the content came from, after redirects.
  url: string;
  contentType: string;
  body: Buffer;
}

// Fetches a URL that came from a user or from a third party. Throws on anything but a 2xx answer.
export type SafeFetch = (url: string, maxBytes: number) => Promise<FetchedFile>;

interface Hop {
  status: number;
  location: string | null;
  contentType: string;
  body: Buffer;
}

// One request, redirects not followed.
export type Transport = (url: URL, maxBytes: number) => Promise<Hop>;

// Everything that isn't the public internet: this machine, the local network, cloud metadata.
const blocked = new net.BlockList();
for (const [prefix, bits] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 3],
] as const) {
  blocked.addSubnet(prefix, bits, 'ipv4');
}
for (const [prefix, bits] of [
  ['::', 127], // unspecified and loopback
  ['64:ff9b::', 96],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blocked.addSubnet(prefix, bits, 'ipv6');
}

export function isPublicAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 0) return false;
  // IPv4 written as IPv6 is judged by the IPv4 rules.
  return !blocked.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

// Checks the address the connection is actually made to, so a hostname can't point inwards.
const publicLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 0);
    const refused = addresses.find(({ address }) => !isPublicAddress(address));
    if (refused || addresses.length === 0) {
      return callback(new Error(`refusing to fetch from ${hostname}`), '', 0);
    }
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0]!.address, addresses[0]!.family);
  });
};

const httpTransport: Transport = (url, maxBytes) =>
  new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.get(
      url,
      {
        lookup: publicLookup,
        timeout: TIMEOUT_MS,
        headers: { 'User-Agent': USER_AGENT, Accept: '*/*', 'Accept-Encoding': 'identity' },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) return req.destroy(new Error('response too large'));
          chunks.push(chunk);
        });
        res.on('error', reject);
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            location: res.headers.location ?? null,
            contentType: (res.headers['content-type'] ?? '').split(';')[0]!.trim().toLowerCase(),
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    // The socket timeout only covers silence; this caps the whole exchange.
    const deadline = setTimeout(() => req.destroy(new Error('request timed out')), TIMEOUT_MS);
    req.on('timeout', () => req.destroy(new Error('request timed out')));
    req.on('error', reject);
    req.on('close', () => clearTimeout(deadline));
  });

function checked(raw: string, base?: URL): URL {
  const url = new URL(raw, base);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`refusing to fetch ${url.protocol} links`);
  // A literal address never goes through the lookup, so it is checked here.
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) !== 0 && !isPublicAddress(host)) throw new Error(`refusing to fetch from ${host}`);
  return url;
}

export function createSafeFetch(transport: Transport = httpTransport): SafeFetch {
  return async (raw, maxBytes) => {
    let url = checked(raw);
    for (let redirects = 0; ; redirects++) {
      const hop = await transport(url, maxBytes);
      if (hop.status >= 300 && hop.status < 400 && hop.location) {
        if (redirects >= MAX_REDIRECTS) throw new Error('too many redirects');
        // Each hop is checked again: a public page may redirect to a private address.
        url = checked(hop.location, url);
        continue;
      }
      if (hop.status < 200 || hop.status >= 300) throw new Error(`responded ${hop.status}`);
      return { url: url.href, contentType: hop.contentType, body: hop.body };
    }
  };
}
