import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoginResponse } from '@dino-park/shared';
import { api, ApiError, tokenManager } from './client';

const fetchMock = vi.fn<typeof fetch>();

// Match the global server TransformInterceptor, including its ISO timestamp.
function successResponse(data: unknown, status = 200) {
  return new Response(
    JSON.stringify({ success: true, data, timestamp: '2026-11-15T00:00:00.000Z' }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('API client server response contract', () => {
  beforeEach(() => {
    tokenManager.clearTokens();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    tokenManager.clearTokens();
    vi.unstubAllGlobals();
  });

  it('returns the login payload from the server envelope', async () => {
    const login: LoginResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isNewUser: true,
      user: { id: 'user-1', nickname: '신입 사육사', level: 1, exp: 0 },
      currency: { gold: 10000, diamond: 100, dna: 0, explorationEnergy: 30 },
      park: { id: 'park-1', name: '신입 사육사의 파크', level: 1 },
    };
    fetchMock.mockResolvedValueOnce(successResponse(login, 201));

    const result = await api.post<LoginResponse>('/auth/toss/login', {
      tossId: 'test-user',
      nickname: '신입 사육사',
    });

    expect(result).toEqual(login);
    expect(result.accessToken).toBe('access-token');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/toss\/login$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ tossId: 'test-user', nickname: '신입 사육사' }),
      }),
    );
  });

  it('returns wrapped list data and sends the stored access token', async () => {
    const dinosaurs = [{ id: 'dinosaur-1', speciesId: 'triceratops' }];
    tokenManager.setTokens('access-token', 'refresh-token');
    fetchMock.mockResolvedValueOnce(successResponse(dinosaurs));

    await expect(api.get('/dinosaurs')).resolves.toEqual(dinosaurs);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/dinosaurs$/),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      }),
    );
  });

  it('reads refreshed tokens from the envelope and retries with the new token', async () => {
    tokenManager.setTokens('expired-access', 'old-refresh');
    const currency = { gold: 10000, diamond: 100, explorationEnergy: 30 };
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        successResponse({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
      )
      .mockResolvedValueOnce(successResponse(currency));

    await expect(api.get('/economy/currency')).resolves.toEqual(currency);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/\/economy\/currency$/),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer new-access' }),
      }),
    );
    expect(tokenManager.getAccessToken()).toBe('new-access');
    expect(tokenManager.getRefreshToken()).toBe('new-refresh');
    expect(localStorage.getItem('accessToken')).toBe('new-access');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  it('preserves empty 204 responses without parsing JSON', async () => {
    const response = new Response(null, { status: 204 });
    const parseJson = vi.spyOn(response, 'json');
    fetchMock.mockResolvedValueOnce(response);

    await expect(api.delete('/dinosaurs/dinosaur-1')).resolves.toBeUndefined();
    expect(parseJson).not.toHaveBeenCalled();
  });

  it('preserves HTTP errors instead of unwrapping them as successful data', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 400,
          timestamp: '2026-11-15T00:00:00.000Z',
          message: '골드가 부족합니다.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const error = await api.post('/buildings', { typeId: 'habitat-grassland' }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'UNKNOWN_ERROR',
      message: '골드가 부족합니다.',
    });
  });
});
