import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { StoryScene } from '@dino-park/shared';
import { Button } from '@/components/ui';

const speakerNames: Record<string, string> = {
  narrator: '내레이션',
  player: '나',
  jin: '진',
  marco: '마르코',
  olivia: '올리비아',
  robert: '로버트',
  thomas: '토마스',
  natalie: '나탈리',
  daniel: '다니엘',
  victor: '빅터',
  naomi: '나오미',
  arthur: '아서',
  elizabeth: '엘리자베스',
};

interface StoryPlayerProps {
  scene: StoryScene;
  chapterTitle: string;
  onExit: () => void;
  onAdvance: (choiceId?: string) => void;
  onRefresh: () => void;
  busy: boolean;
  error?: string;
  requirement?: { message: string; href: string; label: string } | null;
}

export function StoryPlayer({
  scene,
  chapterTitle,
  onExit,
  onAdvance,
  onRefresh,
  busy,
  error,
  requirement,
}: StoryPlayerProps) {
  const [index, setIndex] = useState(0);
  const dialogue = scene.dialogues[index];
  const last = index >= scene.dialogues.length - 1;
  const [revealedText, setRevealedText] = useState('');
  const [revealAll, setRevealAll] = useState(false);
  const text = dialogue?.text ?? '';
  const visibleText = revealAll ? text : revealedText;
  const typed = visibleText === text;

  useEffect(() => {
    if (!text || revealAll) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setRevealAll(true);
      return;
    }
    let length = 0;
    const timer = window.setInterval(() => {
      length += 1;
      setRevealedText(text.slice(0, length));
      if (length >= text.length) window.clearInterval(timer);
    }, 22);
    return () => window.clearInterval(timer);
  }, [text, index, revealAll]);

  const nextDialogue = () => {
    if (!typed) {
      setRevealAll(true);
    } else if (!last) {
      setRevealedText('');
      setRevealAll(false);
      setIndex(index + 1);
    } else {
      onAdvance();
    }
  };

  return (
    <section className="game-story game-story--scene" aria-labelledby="story-scene-title">
      <header className="game-story__header">
        <button type="button" onClick={onExit} aria-label="스토리 목록" disabled={busy}>
          ← 목록
        </button>
        <div>
          <p>{chapterTitle}</p>
          <h1 id="story-scene-title">{scene.title ?? chapterTitle}</h1>
        </div>
      </header>
      <div className="game-story__scene">
        <div className="game-story__dialogue">
          {dialogue && (
            <>
              <strong>{speakerNames[dialogue.speaker] ?? dialogue.speaker}</strong>
              <p>{visibleText}</p>
            </>
          )}
        </div>
        {error && (
          <p role="alert" className="game-story__error">
            {error}
          </p>
        )}
        {last && typed && requirement && (
          <div className="game-story__requirement">
            <p>{requirement.message}</p>
            <div>
              <Link to={requirement.href}>{requirement.label}</Link>
              <button type="button" onClick={onRefresh} disabled={busy}>
                조건 다시 확인
              </button>
            </div>
          </div>
        )}
        {last && typed && !requirement && !!scene.choices?.length && (
          <div className="game-story__choices">
            {scene.choices.map((choice) => (
              <Button
                key={choice.id}
                variant="secondary"
                disabled={busy}
                onClick={() => onAdvance(choice.id)}
              >
                {choice.text}
              </Button>
            ))}
          </div>
        )}
        <div className="game-story__steps">
          <span>{scene.dialogues.length ? `${index + 1} / ${scene.dialogues.length}` : ''}</span>
          {(!last || !typed || (!requirement && !scene.choices?.length)) && (
            <Button disabled={busy} onClick={nextDialogue}>
              {!typed ? '대사 전체 보기' : last ? '다음 장면' : '계속'}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
