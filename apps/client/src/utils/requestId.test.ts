import { expect, it, vi } from 'vitest';
import { createRequestId } from './requestId';

it('uses browser randomness to create a v4 UUID when randomUUID is unavailable', () => {
  const getRandomValues = vi.fn((bytes: Uint8Array) => {
    bytes.set([0, 1, 2, 3, 4, 5, 0xf6, 7, 0xf8, 9, 10, 11, 12, 13, 14, 15]);
    return bytes;
  });
  vi.stubGlobal('crypto', { getRandomValues });
  try {
    expect(createRequestId()).toBe('00010203-0405-4607-b809-0a0b0c0d0e0f');
    expect(getRandomValues).toHaveBeenCalledOnce();
  } finally {
    vi.unstubAllGlobals();
  }
});
