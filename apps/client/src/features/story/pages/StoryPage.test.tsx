import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StoryPage from './StoryPage';

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  advance: vi.fn(),
}));

vi.mock('@/stores', () => ({
  useAuthStore: (select: (state: { isAuthenticated: boolean }) => boolean) =>
    select({ isAuthenticated: true }),
}));
vi.mock('@/api/queries', () => ({
  useStoryChapters: () => ({
    isPending: false,
    data: [
      {
        chapter: { id: 'chapter-4', order: 4, titleKo: '심연의 비밀', totalScenes: 5 },
        isUnlocked: true,
        isStarted: true,
        isCompleted: false,
        completedScenes: 1,
      },
      {
        chapter: { id: 'chapter-5', order: 5, titleKo: '파크의 위기', totalScenes: 5 },
        isUnlocked: false,
        isStarted: false,
        isCompleted: false,
        unlockRequirement: '심연의 비밀을 먼저 마쳐주세요.',
      },
    ],
  }),
  useStartChapter: () => ({ mutateAsync: mocks.start, isPending: false }),
  useAdvanceScene: () => ({ mutateAsync: mocks.advance, isPending: false }),
}));

beforeEach(() => {
  mocks.start.mockReset();
  mocks.advance.mockReset();
});

describe('story handoff', () => {
  it('reads locked scene dialogue, links the gate, checks it again and advances the exact scene', async () => {
    const currentScene = {
      id: 'ch4-scene-2',
      title: '해양관 프로젝트',
      dialogues: [{ speaker: 'olivia', text: '해양관을 준비해요.' }],
    };
    mocks.start
      .mockResolvedValueOnce({
        currentScene,
        requirement: {
          kind: 'research',
          technologyId: 'care-marine',
          level: 1,
          message: '해양 생물 관리 Lv.1 연구를 완료하세요.',
        },
      })
      .mockResolvedValueOnce({ currentScene });
    mocks.advance.mockResolvedValue({ currentScene: null, isChapterComplete: true, rewards: [] });
    render(
      <MemoryRouter initialEntries={['/story?chapter=chapter-4&stage=14&from=growth']}>
        <StoryPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: '← 성장 목표' })).toHaveAttribute(
      'href',
      '/park?panel=growth&stage=14',
    );
    expect(screen.getByRole('button', { name: /5장 파크의 위기/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /4장 심연의 비밀/ }));
    expect(await screen.findByRole('heading', { name: '해양관 프로젝트' })).toBeVisible();
    const reveal = screen.queryByRole('button', { name: '대사 전체 보기' });
    if (reveal) fireEvent.click(reveal);
    expect(await screen.findByRole('link', { name: '연구 보기' })).toHaveAttribute(
      'href',
      '/research?returnChapter=chapter-4&stage=14&technology=care-marine&level=1',
    );
    expect(screen.queryByRole('button', { name: '다음 장면' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '조건 다시 확인' }));
    fireEvent.click(await screen.findByRole('button', { name: '다음 장면' }));
    expect(mocks.advance).toHaveBeenCalledWith({
      chapterId: 'chapter-4',
      sceneId: 'ch4-scene-2',
      choiceId: undefined,
    });
    await waitFor(() => {
      expect(screen.getByText('심연의 비밀 이야기를 마쳤어요.')).toBeVisible();
    });
  });
});
