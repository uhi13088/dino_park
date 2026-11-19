#!/usr/bin/env python3
"""Generate the readable growth tables from the owned canonical source only."""
from __future__ import annotations
import argparse
import json
import sys
sys.dont_write_bytecode = True
import park_progression_model_v06 as model


def mdtable(headers, rows):
    def cell(value):
        return str(value).replace('|', '&#124;').replace('\n', ' ')
    return '\n'.join(['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join('---' for _ in headers) + ' |',
                      *['| ' + ' | '.join(cell(c) for c in row) + ' |' for row in rows]])


def render():
    s = model.summary()
    goals, levels = model.goal_rows(), model.level_rows()
    lines = ['# Park5~50 성장 목표·경험치 공급표 0.6', '',
             '**[성장 정본](park-progression.md)에서 생성한 기획 표다. 실제 게임 적용·완주기간 검증을 뜻하지 않는다.**', '',
             f'초반 {s["early_goal_xp"]:,}XP → Park5 잔여{s["park5_carry_xp"]}XP. '
             f'추가 {s["goals"]}개 목표 {s["new_goal_xp"]:,}XP → 누적{s["cumulative_to_park50"]:,}XP, Park50 잔여0.', '',
             '목표는 파크 소유·첫 영웅 개체 수령 후·해당 Park 이상에서 수동 한 번 수령한다. '
             '시설·연구와 일반 현장은 두 대안 중 하나로 완료한다. Park25·30·35 현장은 본편 장 완료 단일조건이다. 정상 선완료 이력을 인정한다. '
             '네 트랙 수령 순서는 자유다. 기존 비용·시간·연구원·부모·허가는 그대로이며 탐험 직접XP는0이다. '
             '입장마다XP를 지급하지 않고 유한한45개 실적 구간만 한 번 보상한다.', '',
             '권장 연구소 준비는 새 Park 해금이 아니다. 장면 링크(story_refs)는 안내이며 '
             'Park25·30·35에 명시한 장 완료 외에 추가 스토리 조건을 붙이지 않는다. '
             '72기술 전체최대·83종 전수집·15합성·전결말·추가 유료연구원·다이아구매는 필수가 아니다. '
             '수급·실제기간·실플레이 완주는 미검증이며 Park50 이후에도 운영·확장·수집을 이어 간다.', '',
             '## 성장 단계', '',
             mdtable(['권장 Park', '단계', '기존 콘텐츠 연결', '장면 ID'],
                     [[f'{r["park_from"]}~{r["park_to"]}', r['label'], r['focus'], ', '.join(r['story_refs']) or '—']
                      for r in model.milestones()]), '', '## 45전환 공급 합계', '',
             '단계 보상은 해당 전환에서 새로 수령하는XP다. 누적 공급은 출발 초반4,800XP를 포함한다. '
             '5→6만 잔여35를 차감하며 이후 각 행은 요구량 전체를 공급한다.', '',
             mdtable(['Park 전환', '전환 요구XP', '새 공급XP', '추가 누적XP', '초반 포함 누적XP', '권장 연구소'],
                     [[f'{r["park_level"]}→{r["next_park_level"]}', f'{model.experience(r["park_level"]):,}',
                       f'{r["new_xp"]:,}', f'{r["cumulative_new_xp"]:,}', f'{r["cumulative_park_xp"]:,}',
                       f'Lv.{r["recommended_lab"]}'] for r in levels]), '']
    for level in levels:
        park = level['park_level']
        lines += [f'## Park{park} → {park+1}', '',
                  f'권장 연구소 Lv.{level["recommended_lab"]}; 기존 선행기술·시설고도화·공사를 거친다. '
                  f'네 목표 합계 {level["new_xp"]:,}XP, 수령 후 전체 누적 {level["cumulative_park_xp"]:,}XP.', '']
        lines += [mdtable(['목표 ID / 트랙', '완료조건: 대안 중 하나', '목표XP', '추가XP 누적 / 초반 포함 누적'],
                          [[f'{g["id"]} / {model.TRACK_LABELS[g["track"]]}', model.goal_condition_label(g),
                            f'{g["xp"]:,}', f'{g["cumulative_new_xp"]:,} / {g["cumulative_park_xp"]:,}']
                           for g in goals if g['park_level'] == park]), '']
        if level['story_refs']:
            lines += ['스토리 안내: ' + ', '.join(level['story_refs']) + '. 장면XP 추가 없음·정상 선완료 인정.', '']
    lines += ['## 원천 지문', '', '```json', json.dumps(model.source_sha256(), ensure_ascii=False, indent=2), '```', '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    content = render()
    if args.write:
        model.OUTPUT.write_text(content)
    else:
        assert model.OUTPUT.read_text() == content, 'Generated growth view differs; run --write'
    print(json.dumps({'status': 'pass', 'output': str(model.OUTPUT.relative_to(model.ROOT)),
                      **model.summary()}, ensure_ascii=False))


if __name__ == '__main__':
    main()
