import type { FirstExpeditionClue } from '@dino-park/shared';
export * from './early-drive';

/** First guided investigation. Input duration is player controlled, never a completion timer. */
export const FIRST_EXPEDITION = {
  id: 'first-iguanodon-v1',
  regionId: 'grassland',
  name: '초원 정찰',
  speciesId: 'iguanodon',
  goldCost: 100,
  energyCost: 5,
  hatchSeconds: 60,
  careXp: 700,
  clues: [
    {
      id: 'trail',
      title: '이어지는 흔적을 찾아요',
      hint: '닥터 진: 풀숲으로 이어지는 발자국을 찾아보세요. 바람이나 돌이 만든 흔적과 구별해봐요.',
      options: [
        {
          id: 'footprints',
          label: '풀숲으로 이어진 발자국',
          description: '같은 모양의 발자국이 나란히 이어져 있어요.',
          kind: 'footprints',
        },
        {
          id: 'reeds',
          label: '흔들리는 갈대',
          description: '바람이 불 때마다 이쪽저쪽으로 흔들려요.',
          kind: 'reeds',
        },
        {
          id: 'rocks',
          label: '비탈 아래의 돌',
          description: '작은 돌이 굴러간 자국이에요.',
          kind: 'rocks',
        },
      ],
      correctChoiceId: 'footprints',
      success: '발자국을 찾았어요. 풀숲 안쪽으로 조심히 따라가요.',
      retry: '움직이는 것만 보고 고르지 말고, 같은 모양이 이어지는 흔적을 찾아봐요.',
    },
    {
      id: 'feeding',
      title: '방금 지나간 길을 골라요',
      hint: '닥터 진: 새로 뜯긴 잎을 찾아보세요. 가장자리의 촉촉한 흔적이 아직 남아 있어요.',
      options: [
        {
          id: 'water',
          label: '잔잔한 물웅덩이',
          description: '물결도 없고 주변 풀은 그대로예요.',
          kind: 'water',
        },
        {
          id: 'leaves',
          label: '막 뜯긴 연한 잎',
          description: '잎 끝이 촉촉하고 발자국이 옆으로 이어져요.',
          kind: 'leaves',
        },
        {
          id: 'stones',
          label: '마른 자갈길',
          description: '햇볕에 말라 있고 먹이 흔적은 없어요.',
          kind: 'stones',
        },
      ],
      correctChoiceId: 'leaves',
      success: '먹이 흔적을 확인했어요. 가까운 곳에 둥지가 있을 것 같아요.',
      retry: '방금 뜯겨 촉촉한 잎이 있는 쪽을 살펴봐요.',
    },
    {
      id: 'nest',
      title: '둥지의 알을 확인해요',
      hint: '닥터 진: 온전한 알이 있는 둥지를 골라 조심스럽게 확인해요. 빈 껍데기와 구별해주세요.',
      options: [
        {
          id: 'shells',
          label: '깨진 빈 알껍데기',
          description: '안에는 아무것도 없어요.',
          kind: 'shells',
        },
        {
          id: 'flowers',
          label: '둥근 꽃송이',
          description: '가까이 보니 작은 꽃들이 모여 있어요.',
          kind: 'flowers',
        },
        {
          id: 'nest',
          label: '온전한 알이 있는 둥지',
          description: '마른 풀 사이에 무늬가 있는 알 한 개가 보여요.',
          kind: 'nest',
        },
      ],
      correctChoiceId: 'nest',
      success: '이구아노돈 알을 찾았어요! 파크로 가져가 부화시켜봐요.',
      retry: '깨진 껍데기가 아니라 온전한 알 한 개가 있는 둥지를 찾아봐요.',
    },
  ] satisfies Array<
    FirstExpeditionClue & { correctChoiceId: string; success: string; retry: string }
  >,
} as const;
