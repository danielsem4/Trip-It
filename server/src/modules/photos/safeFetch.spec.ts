import { describe, expect, it } from 'vitest';
import { createSafeFetch, isPublicAddress, type Transport } from './safeFetch';

function setup(hops: Record<string, { status?: number; location?: string; body?: string }>) {
  const asked: string[] = [];
  const transport: Transport = async (url) => {
    asked.push(url.href);
    const { status = 200, location = null, body = '' } = hops[url.href] ?? { status: 404 };
    return { status, location, contentType: 'text/html', body: Buffer.from(body) };
  };
  return { fetch: createSafeFetch(transport), asked };
}

describe('isPublicAddress', () => {
  it('accepts addresses on the internet', () => {
    expect(isPublicAddress('93.184.216.34')).toBe(true);
    expect(isPublicAddress('2606:2800:220:1:248:1893:25c8:1946')).toBe(true);
  });

  it('refuses this machine, the local network and cloud metadata', () => {
    for (const address of [
      '127.0.0.1',
      '0.0.0.0',
      '10.1.2.3',
      '172.20.0.1',
      '192.168.1.10',
      '169.254.169.254',
      '100.64.0.1',
      '::1',
      '::',
      '::ffff:127.0.0.1',
      '::ffff:7f00:1',
      'fd00::1',
      'fe80::1',
      'not an address',
    ]) {
      expect(isPublicAddress(address), address).toBe(false);
    }
  });
});

describe('safe fetch', () => {
  it('follows redirects and reports where the content came from', async () => {
    const { fetch } = setup({
      'http://cafe.example/': { status: 301, location: 'https://www.cafe.example/home' },
      'https://www.cafe.example/home': { body: 'hello' },
    });
    const file = await fetch('http://cafe.example/', 1000);
    expect(file.url).toBe('https://www.cafe.example/home');
    expect(file.body.toString()).toBe('hello');
  });

  it('refuses links that are not http and literal private addresses without asking', async () => {
    const { fetch, asked } = setup({});
    for (const url of ['file:///etc/passwd', 'ftp://cafe.example/', 'http://127.0.0.1:4000/', 'http://169.254.169.254/', 'http://[::1]/', 'http://[::ffff:127.0.0.1]/']) {
      await expect(fetch(url, 1000), url).rejects.toThrow(/refusing/);
    }
    expect(asked).toEqual([]);
  });

  it('refuses a redirect into a private address', async () => {
    const { fetch, asked } = setup({
      'https://cafe.example/': { status: 302, location: 'http://192.168.1.1/admin' },
    });
    await expect(fetch('https://cafe.example/', 1000)).rejects.toThrow(/refusing/);
    expect(asked).toEqual(['https://cafe.example/']);
  });

  it('gives up on a redirect loop and on an error answer', async () => {
    const loop = setup({ 'https://cafe.example/': { status: 302, location: '/' } });
    await expect(loop.fetch('https://cafe.example/', 1000)).rejects.toThrow(/redirects/);
    expect(loop.asked).toHaveLength(4);
    await expect(setup({}).fetch('https://cafe.example/', 1000)).rejects.toThrow(/404/);
  });
});
