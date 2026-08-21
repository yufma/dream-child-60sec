const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const startScreen = document.querySelector('#start-screen');
const stageMenu = document.querySelector('#stage-menu');
const endScreen = document.querySelector('#end-screen');
const startButton = document.querySelector('#start-button');
const resumeButton = document.querySelector('#resume-button');
const stageSelectGrid = document.querySelector('#stage-select-grid');
const campaignRouteEl = document.querySelector('#campaign-route');
const restartButton = document.querySelector('#restart-button');
const startTag = startScreen.querySelector('.tag');
const startTitle = startScreen.querySelector('h2');
const startCopy = document.querySelector('#start-copy');
const storyDialogue = document.querySelector('#story-dialogue');
const storyPortrait = document.querySelector('#story-portrait');
const storyPortraitImage = document.querySelector('#story-portrait-image');
const storyPortraitPlaceholder = document.querySelector('#story-portrait-placeholder');
const storyPortraitLabel = document.querySelector('#story-portrait-label');
const storyPortraitPath = document.querySelector('#story-portrait-path');
const storySpeaker = document.querySelector('#story-speaker');
const storyLine = document.querySelector('#story-line');
const storyProgress = document.querySelector('#story-progress');
const endTag = document.querySelector('#end-tag');
const endTitle = document.querySelector('#end-title');
const endCopy = document.querySelector('#end-copy');
const toast = document.querySelector('#toast');
const stageIndexEl = document.querySelector('#stage-index');
const stageNameEl = document.querySelector('#stage-name');
const objectiveEl = document.querySelector('#objective');
const imaginationValueEl = document.querySelector('#imagination-value');
const imaginationFill = document.querySelector('#imagination-fill');
const imaginationStatus = document.querySelector('#imagination-status');
const bossHud = document.querySelector('#boss-hud');
const bossNameEl = document.querySelector('#boss-name');
const bossFill = document.querySelector('#boss-fill');
const bossHealthEl = document.querySelector('#boss-health');
const ruleCards = [...document.querySelectorAll('.rule-card')];
const memoryStatus = document.querySelector('#memory-status');
const echoCards = [...document.querySelectorAll('[data-echo-slot]')];
const ruleStates = {
  bridge: document.querySelector('#bridge-state'),
  gravity: document.querySelector('#gravity-state'),
  time: document.querySelector('#time-state'),
  resonance: document.querySelector('#resonance-state'),
  dash: document.querySelector('#dash-state'),
};

const STAGES = [
  {
    chapter: '하린 · 잃어버린 웃음', name: '첫 접속', type: 'puzzle', skills: [], objective: '꿈의 가장자리까지 걸어가라',
    intro: '전 조수는 말했습니다. “꿈속에서는, 네가 믿는 일이 규칙이 될 수 있어.” 먼저 하린의 꿈 가장자리로 걸어가 봐.',
    layout: 'walk', echoGoal: 0, hint: '← / → 로 움직이고, ↑ 로 점프해 보세요.',
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '상상력의 첫걸음', type: 'puzzle', skills: [], objective: '과거의 나와 함께 기억의 문을 열어라',
    intro: '하린의 기억이 검은 장막에 가로막혔습니다. 조수는 말해요. “꿈에서는 과거의 네가 지금의 너를 도울 수 있어.” ① C로 발판까지의 길을 기록하고 ② 다시 C를 눌러 시간을 되감으세요. ③ 기억의 나는 길을 재생한 뒤 발판을 지키고, 너는 되감긴 자리에서 다음 길을 준비할 수 있어요.',
    layout: 'bridge', echoGoal: 1, hint: '① C 시작 → ② 기억 발판까지 이동 → ③ C 되감기. 기억의 나가 마지막 발판을 지키면 문이 열립니다.',
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '달빛 유원지의 벽', type: 'puzzle', skills: ['bridge', 'gravity'], objective: '악몽의 잔상으로 깊은 틈을 넘어라',
    blockedSkills: ['gravity'],
    intro: '하린이 좋아하던 달빛 유원지가 기계의 벽에 갇혔어. 이 구역의 추출기는 중력의 규칙을 붙잡아 두고 있어. 달의 방향은 바꿀 수 없지만, 잔상 발판만은 기억의 틈에 나타날 수 있어. 과거의 나에게 첫 약속을 맡긴 뒤, 1로 나타나는 발판을 건너자.',
    layout: 'wall', echoGoal: 1, hint: '이 구역에서는 중력 반전이 막힙니다. 기억의 나를 발판에 남기고 1의 잔상 발판으로 깊은 틈을 건너세요.',
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '무너지는 회전목마', type: 'puzzle', skills: ['gravity'], teaches: ['gravity'], blockedSkills: ['bridge'], objective: '중력 전환으로 회전목마 벽을 넘어라',
    intro: '회전목마의 벽은 너무 높아서 뛰어넘을 수 없어. 하지만 꿈속에서는 “아래”가 꼭 발밑일 필요는 없지. 2를 누르고 있으면 달의 방향이 바뀌어 천장으로 올라갈 수 있어. 벽보다 높이 올라간 뒤 오른쪽으로 이동하고, 2를 놓아 반대편으로 내려가 보자.',
    layout: 'carousel', echoGoal: 0, blockedHint: '회전목마 구역에서는 잔상 발판만 고정되어 있습니다. 2를 유지해 벽보다 높은 곳으로 올라가세요.', hint: '2를 누른 채 벽보다 높이 올라가세요 → 오른쪽으로 이동 → 2를 놓아 웃음 코어 쪽으로 내려오세요.',
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '하린이 가장 두려워한 것', type: 'boss', skills: ['time'], objective: '행복한 기억을 맞추고 멈춘 순간으로 하린을 안심시켜라',
    intro: '하린은 모두가 웃는 곳에서 혼자 웃지 못하게 될까 봐 두려워했어. 그 두려움이 “웃음을 훔치는 광대”가 되었다. 여기서는 공격도 탄막도 없어. C로 두 개의 기억 자리에 과거의 나를 남기고, 현재의 나는 마지막 빛 위에 서서 Shift를 잠시 눌러 줘. 시간이 멈춘 그 순간, 하린에게 “너는 혼자가 아니야”라고 전하는 거야.',
    boss: '웃음을 훔치는 광대', bossConfig: { mode: 'calm', visual: 'carousel', calmDuration: 2.1 }, hint: '① 기억의 나 둘을 빛에 남기기 ② 현재의 나는 마지막 빛에 서기 ③ Shift를 2.1초 유지해 하린을 안심시키세요.',
    teaches: ['time'],
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '하린의 웃음이 남긴 빛', type: 'puzzle', skills: ['time'], objective: '되찾은 웃음이 비추는 길을 따라 다음 친구의 꿈으로 건너가라',
    intro: '하린의 웃음이 돌아오자, 그 빛이 다음 꿈의 문까지 길게 이어졌어. 이번에는 싸울 필요가 없어. 되찾은 빛이 가리키는 방향을 따라가며, 다음 친구가 숨어 있는 꿈의 가장자리까지 천천히 건너가자.',
    layout: 'walk', echoGoal: 0, hint: '그냥 오른쪽 문까지 걸어가며 하린의 웃음빛을 따라가세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '별빛 합창의 문', type: 'puzzle', skills: ['resonance'], teaches: ['resonance'], objective: '공명으로 숨은 합창길을 드러내라',
    intro: '두 번째 친구 유나는 숨은 소리를 듣는 아이야. 꿈 추출기는 그 아이의 노래를 접어 숨겨 버렸어. V를 누르면 공명이 퍼져, 보이지 않던 발판과 봉인이 드러난다. 한 번 드러난 길은 마음이 흔들려도 다시 이어질 거야.',
    layout: 'chorus', echoGoal: 1, hint: 'V로 숨은 발판을 드러내고, 기억 발판에 과거의 나를 남겨 합창길을 완성하세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '유나의 빈 의자', type: 'puzzle', skills: ['bridge', 'gravity', 'time', 'resonance'], objective: '빈자리를 기억의 메아리로 채워 유나의 꿈을 완성하라',
    blockedSkills: ['bridge', 'gravity'],
    intro: '유나는 늘 누군가의 자리를 기억하던 아이였어. 꿈 추출기는 교실에서 두 개의 자리를 지워 버렸고, 남은 빈 의자가 더 크게 느껴져. 이 교실에서는 잔상 발판과 중력 반전도 닿지 않아. V로 보이지 않는 합창길을 드러내고, C로 두 빈자리에 과거의 나를 남기자.',
    layout: 'duet', echoGoal: 2, hint: 'V를 누르는 동안만 합창길이 나타납니다. 첫 번째 빈 의자와 두 번째 빈 의자에 기억의 나를 하나씩 남기세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '지워진 악보의 계단', type: 'puzzle', skills: ['resonance'], objective: '사라진 음계를 공명으로 되돌려라',
    intro: '유나의 악보에는 음표 사이사이가 통째로 지워져 있어. V를 누르는 동안에만 빠진 음계와 그 위의 기억 문양이 돌아온다. 먼저 공명으로 세 번째 음계까지 올라가. 그 위에서 C로 짧은 기억을 남기면, 과거의 네가 그 음을 붙잡고 길을 완성할 거야.',
    layout: 'chorus-memory', echoGoal: 1, hint: '① V를 유지해 세 번째 숨은 음계까지 올라가세요. ② 그 위의 기억 문양에서 C를 두 번 눌러 과거의 나를 남기세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '두 사람의 화음', type: 'puzzle', skills: ['resonance'], objective: '두 빈자리를 채워 잃어버린 화음을 완성하라',
    intro: '마지막 한 소절에는 두 사람의 목소리가 필요해. 유나는 자신이 혼자 노래하고 있었다고 믿지만, 두 개의 빈자리에 기억의 나를 남기면 잊었던 화음이 돌아올 거야.',
    layout: 'duet', echoGoal: 2, hint: 'V로 합창길을 보며, 두 빈 의자에 기억의 나를 한 명씩 남기세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '침묵을 삼킨 합창단', type: 'boss', skills: ['resonance'], objective: '공명으로 세 개의 잃어버린 음을 되찾아라',
    intro: '유나는 아무리 크게 노래해도 아무에게도 닿지 않을까 봐 두려웠다. 그 두려움은 “침묵을 삼킨 합창단”이 되어 모든 소리를 지운다. 먼저 과거의 나 둘에게 화음 앵커를 맡겨. 그 다음 V 공명을 유지한 채 차례로 나타나는 네 음을 통과하면, 유나의 목소리가 돌아올 거야. 침묵은 음표 탄막으로 길을 막지만, 옆으로 흐르면 피할 수 있어.',
    boss: '침묵을 삼킨 합창단', bossConfig: {
      mode: 'resonance', visual: 'choir',
      moveBounds: { xMin: 45, xMax: 720, yMin: 86, yMax: 437 },
      memoryPads: [
        { x: 174, y: 142, w: 42, h: 42, label: '낮은 화음' },
        { x: 330, y: 346, w: 42, h: 42, label: '높은 화음' },
      ],
      resonanceGates: [
        { x: 452, y: 116, w: 52, h: 52, label: '첫 음' },
        { x: 532, y: 266, w: 52, h: 52, label: '두 번째 음' },
        { x: 628, y: 390, w: 52, h: 52, label: '마지막 음' },
        { x: 672, y: 202, w: 42, h: 42, label: '되찾은 후렴' },
      ],
    },
    hint: '① 기억의 나 둘을 화음 앵커에 남기기 ② V를 유지한 채 나타나는 음 4개를 순서대로 통과하세요. 침묵 탄막은 옆으로 흘려 보내세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '유나의 노래가 남긴 별', type: 'puzzle', skills: ['resonance'], objective: '되찾은 노랫길을 따라 다음 꿈으로 향하라',
    intro: '유나의 노래가 돌아오자, 별빛 음표들이 다음 꿈으로 가는 길을 그린다. 이번에는 숨은 길을 찾거나 싸울 필요가 없어. 멀리서 들려오는 바람 소리를 따라가 보자.',
    layout: 'walk', echoGoal: 0, hint: '별빛 음표가 가리키는 오른쪽 문까지 걸어가세요.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '바람길의 입구', type: 'puzzle', skills: ['dash'], teaches: ['dash'], objective: '질주로 첫 번째 바람 틈을 넘어라',
    intro: '세 번째 친구 하늘이는 갇힌 꿈에서도 앞으로 달리는 걸 멈추지 않았어. 하지만 이 바람길의 틈은 점프만으로 닿기엔 너무 멀다. X를 누르면 짧게 질주해, 바람을 가르듯 간격을 넘을 수 있어.',
    layout: 'dash', echoGoal: 1, hint: '기억의 나가 출발 신호를 지키면 길이 열립니다. X로 첫 번째 긴 틈을 넘으세요.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '바람을 가르는 달리기', type: 'puzzle', skills: ['resonance', 'dash'], objective: '질주와 공명으로 끊긴 계주길을 이어라',
    blockedSkills: ['bridge', 'gravity'],
    intro: '이 바람길에서는 잔상 발판도, 중력 반전도 바람에 흩어져 버려. 기억의 나에게 출발 신호를 맡기고, X로 첫 틈을 넘은 뒤 V로 숨은 바람길을 찾아가자.',
    layout: 'relay', echoGoal: 1, hint: '기억의 나가 출발 신호를 지키면 바람이 잠잠해집니다. X 질주로 긴 틈을 넘고, V로 다음 길을 찾으세요.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '역풍의 높은 벽', type: 'puzzle', skills: ['bridge', 'gravity', 'dash'], objective: '상상력 기술을 이어 역풍의 벽을 통과하라',
    intro: '하늘의 길에는 깊은 틈과 높은 벽이 한꺼번에 나타났다. 잔상 발판으로 틈을 넘고, 2로 중력을 뒤집어 높은 벽 너머로 올라가자. 앞으로 가는 일은 한 가지 방법만으로는 되지 않아.',
    layout: 'wall', echoGoal: 1, hint: '기억의 나를 약속에 남기고 1로 틈을 넘으세요. 필요하면 2로 벽 위를 지나갈 수 있습니다.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '되돌아오는 표지판', type: 'puzzle', skills: ['resonance', 'dash'], objective: '거짓 길을 지나 마지막 출발점에 닿아라',
    blockedSkills: ['bridge', 'gravity'],
    intro: '표지판은 계속 출발점으로 돌아가라고 속삭여. 하지만 하늘이의 기억은 진짜 길을 알고 있다. V로 숨은 방향을 보고, X로 망설임보다 빨리 달려가자.',
    layout: 'relay', echoGoal: 1, hint: '기억의 나를 출발 신호에 남기고, X와 V로 바람길을 끝까지 이어가세요.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '하늘이의 바람 끝', type: 'boss', skills: ['resonance', 'dash'], objective: '돌풍을 기억의 나에게 유인하고 질주로 바람길을 뚫어라',
    intro: '하늘이는 넘어져도 다시 달리던 아이였어. 하지만 마지막에는 아무리 달려도 제자리라고 느끼는 것이 가장 무서웠다. 그 공포가 모든 길을 되돌려 보내는 검은 연이 되었다. 먼저 C로 두 명의 과거의 나를 출발 깃발에 남겨 돌풍을 유인해. 검은 연이 세 번 잘못된 길을 쫓으면, 열리는 네 개의 바람 고리를 X 질주로 순서대로 통과하자. 이번 보스는 기억을 “자리”가 아니라 “미끼”로 쓰는 추격전이야.',
    boss: '바람을 삼킨 검은 연', bossConfig: {
      mode: 'chase', visual: 'wind', requiredEchoHits: 3, attackTarget: 'echo',
      moveBounds: { xMin: 45, xMax: 720, yMin: 86, yMax: 437 },
      decoyPads: [
        { x: 208, y: 132, w: 42, h: 42, label: '첫 출발' },
        { x: 384, y: 270, w: 42, h: 42, label: '다시 달리기' },
      ],
      windGates: [
        { x: 274, y: 218, w: 34, h: 84, label: '첫 질주' },
        { x: 436, y: 118, w: 34, h: 84, label: '두 번째 질주' },
        { x: 584, y: 328, w: 34, h: 84, label: '마지막 질주' },
        { x: 678, y: 212, w: 30, h: 84, label: '끝의 질주' },
      ],
    },
    hint: '① 기억의 나 둘을 출발 깃발에 남기기 ② 돌풍 유인 3회 ③ 열린 바람 고리 4개를 X 질주로 순서대로 통과하세요.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '하늘이의 발걸음이 남긴 길', type: 'puzzle', skills: ['dash'], objective: '되찾은 바람길을 따라 완벽한 꿈의 문으로 향하라',
    intro: '하늘이의 발걸음이 멈추지 않자, 세 친구의 빛이 한 방향을 가리킨다. 저 멀리, 너무 완벽해서 오히려 낯선 정원이 보인다.',
    layout: 'walk', echoGoal: 0, hint: '세 친구의 빛을 따라 오른쪽 문으로 걸어가세요.',
  },
  {
    chapter: '딸 · 완벽한 꿈의 균열', name: '완벽한 정원', type: 'puzzle', skills: ['resonance'], objective: '정원 아래 숨은 균열을 찾아라',
    intro: '수면 과학자의 딸은 이 정원을 완벽한 집이라고 믿고 있어. 하지만 꽃들이 너무 같은 방향만 보고 있고, 땅 아래에는 친구들의 기억이 갇혀 있어. V로 균열의 길을 찾아가자.',
    layout: 'chorus', echoGoal: 1, hint: 'V로 완벽한 정원 아래의 숨은 길을 드러내고, 기억의 나를 남기세요.',
  },
  {
    chapter: '딸 · 완벽한 꿈의 균열', name: '금이 간 교실', type: 'puzzle', skills: ['resonance'], objective: '사라진 친구들의 자리를 되돌려라',
    intro: '딸의 꿈속 교실에는 친구들이 모두 있지만, 그 모습은 기억을 빼앗긴 뒤의 빈 껍질처럼 조용하다. 두 개의 자리를 기억의 나로 채우면, 딸도 처음으로 이 세계가 이상하다는 것을 보게 될 거야.',
    layout: 'duet', echoGoal: 2, hint: 'V로 숨은 길을 보며 두 개의 기억 자리에 과거의 나를 남기세요.',
  },
  {
    chapter: '딸 · 완벽한 꿈의 균열', name: '완벽한 꿈의 수호자', type: 'boss', skills: ['resonance', 'dash'], objective: '균열을 드러내고 수호자의 거울을 깨워라',
    intro: '딸의 꿈은 스스로를 지키기 위해 “완벽한 꿈의 수호자”를 만들었다. 수호자는 딸을 해치려는 적이 아니라, 슬픔을 보지 않게 하려는 꿈의 방어 본능이야. V로 진짜 균열을 드러내고, X 질주로 네 개의 거울 균열을 통과해. 수호자가 멈추면 딸은 처음으로 친구들의 꿈을 보게 된다.',
    boss: '완벽한 꿈의 수호자', bossConfig: {
      mode: 'mirror', visual: 'mirror',
      moveBounds: { xMin: 45, xMax: 720, yMin: 86, yMax: 437 },
      mirrorGates: [
        { x: 296, y: 128, w: 48, h: 72, label: '첫 균열' },
        { x: 462, y: 316, w: 48, h: 72, label: '두 번째 균열' },
        { x: 610, y: 164, w: 48, h: 72, label: '마지막 균열' },
        { x: 676, y: 320, w: 38, h: 64, label: '진실의 균열' },
      ],
    },
    hint: 'V로 균열을 드러내고, X 질주 상태로 거울 균열 4개를 순서대로 통과하세요. 거울 파편은 질주로 가로지를 수 있습니다.',
  },
  {
    page: 2, chapter: 'PAGE 02 · 현실을 향한 마지막 꿈', name: '수면 과학자의 연구실', type: 'boss', skills: ['bridge', 'gravity', 'time', 'resonance', 'dash'], objective: '기억과 공명을 완성해 거대한 꿈의 수호자를 멈춰라',
    intro: '딸이 친구들의 꿈을 보자, 완벽한 세계 전체가 무너지기 시작한다. 수면 과학자는 딸의 마지막 행복을 지키려 자기 자신을 거대한 꿈의 수호자로 바꾼다. 이제는 그를 쓰러뜨리는 것만으로는 부족해. 세 친구의 기억으로 봉인을 열고, 빼앗은 꿈 에너지를 되돌려 주며 그의 집착을 멈춰야 해.',
    boss: '수면 과학자', bossConfig: {
      mode: 'final', finalChargeNeeded: 1.4,
      attackHp: 12,
      moveBounds: { xMin: 45, xMax: 760, yMin: 86, yMax: 437 },
      memoryPads: [
        { x: 188, y: 122, w: 42, h: 42, label: '하린의 웃음' },
        { x: 372, y: 228, w: 42, h: 42, label: '유나의 노래' },
        { x: 534, y: 356, w: 42, h: 42, label: '하늘의 발걸음' },
      ],
    },
    hint: '① 기억의 나 둘과 현재의 나로 세 봉인에 서기 ② V 공명을 1.4초 유지해 봉인 해제 ③ 3단계 탄막을 피하며 Z 기억 탄환 12발로 맞서세요.',
  },
];

// 완료한 스테이지 번호(0부터 시작)를 키로 쓰는 대화 장면들.
// portrait 값은 나중에 assets/portraits/<portrait>.png 를 넣으면 바로 해당 픽셀 일러스트를 표시한다.
const STORY_BEATS = {
  0: {
    tag: 'DREAM LINK · A SMALL PROMISE', title: '처음으로 닿은 꿈', artId: 'story-00-first-link',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '접속은 성공했어. 네가 한 걸음 내디딜 때마다, 이 꿈은 “아직 돌아올 수 있다”고 대답하고 있어.' },
      { speaker: '주인공', portrait: 'protagonist', text: '그럼 내가 계속 걸을게요. 하린이 혼자 무서워하지 않게.' },
    ],
  },
  1: {
    tag: 'MEMORY LOG · FIRST ECHO', title: '한 명이었던 나는, 둘이 되었다', artId: 'story-01-first-echo',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '봤지? 방금 전의 네가 지금의 너를 기다렸어. 꿈은 혼자 견디는 곳이 아니야.' },
      { speaker: '주인공', portrait: 'protagonist', text: '과거의 나도 같이 도와줄 수 있다면… 하린에게도 혼자가 아니라고 말해 줄 수 있어요.' },
    ],
  },
  2: {
    tag: 'HARIN · THE CAROUSEL LIGHT', title: '꺼져 가는 회전목마', artId: 'story-02-carousel-light',
    lines: [
      { speaker: '하린의 기억', portrait: 'harin', text: '다른 애들은 다 웃고 있는데… 나만 웃지 못하면 어떡하지? 그러면 아무도 나를 찾지 않을 것 같아.' },
      { speaker: '주인공', portrait: 'protagonist', text: '하린아, 네가 못 웃는 날에도 나는 널 찾을 거야. 그러니까 조금만 기다려.' },
    ],
  },
  3: {
    tag: 'HARIN · BEFORE THE FEAR', title: '웃지 못할까 봐 무서웠던 아이', artId: 'story-03-harin-fear',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '광대는 하린을 해치려는 낯선 괴물이 아니야. “혼자 남을까 봐” 떨던 마음이 추출기에 붙잡힌 거야.' },
      { speaker: '주인공', portrait: 'protagonist', text: '그럼 쓰러뜨리지 않을 거예요. 하린이 좋아했던 순간을 다시 보여 줄게요.' },
    ],
  },
  4: {
    tag: 'MEMORY RESTORED · HARIN', title: '하린이 다시 웃었다', artId: 'story-04-harin-smiles-daughter-crack',
    lines: [
      { speaker: '하린', portrait: 'harin', text: '나, 방금 웃었어? 이상하다… 웃는 게 이렇게 따뜻한 거였나 봐.' },
      { speaker: '전 조수', portrait: 'assistant', text: '하린의 감정이 돌아오는 만큼, 누군가가 빌려 쓰던 꿈에는 금이 가고 있어. 그 아이는 아직 아무것도 모르겠지.' },
    ],
  },
  5: {
    tag: 'NEXT DREAM · A VOICE WITHOUT A SONG', title: '노래를 잃어버린 아이', artId: 'story-05-yuna-call',
    lines: [
      { speaker: '유나의 기억', portrait: 'yuna', text: '누가 내 이름을 부른 것 같은데… 대답하려고 하면 목소리가 사라져. 내 노래가 어디에 있는지 모르겠어.' },
      { speaker: '주인공', portrait: 'protagonist', text: '들려, 유나야. 네 노래가 완전히 사라진 건 아니야. 내가 찾으러 갈게.' },
    ],
  },
  6: {
    tag: 'YUNA · THE EMPTY CHAIR', title: '비어 있는 자리의 목소리', artId: 'story-06-yuna-empty-chair',
    lines: [
      { speaker: '유나', portrait: 'yuna', text: '빈자리를 볼 때마다, 내가 누군가에게 잊힌 것 같았어. 그래서 노래를 불러도 아무도 듣지 못할까 봐 무서웠어.' },
      { speaker: '주인공', portrait: 'protagonist', text: '비어 있는 자리는 네가 함께했던 시간을 지우지 못해. 내가 그 자리를 같이 지킬게.' },
    ],
  },
  7: {
    tag: 'YUNA · THE MISSING SCORE', title: '빠진 음표 사이에서', artId: 'story-07-yuna-missing-score',
    lines: [
      { speaker: '유나', portrait: 'yuna', text: '악보의 빈칸을 볼 때마다 내가 잘못 불렀다고 생각했어. 그래서 다음 음을 내는 게 무서웠어.' },
      { speaker: '주인공', portrait: 'protagonist', text: '비어 있는 음도 같이 채우면 돼. 유나가 멈춘 자리부터 다시 시작하자.' },
    ],
  },
  8: {
    tag: 'YUNA · TWO VOICES', title: '혼자 부른 노래가 아니었다', artId: 'story-08-yuna-duet',
    lines: [
      { speaker: '유나', portrait: 'yuna', text: '내가 불렀던 건 혼자만의 노래가 아니었구나. 친구들이 옆에서 음을 이어 줬었어.' },
      { speaker: '전 조수', portrait: 'assistant', text: '마지막 화음이 있는 곳에 침묵이 모이고 있어. 유나의 두려움이 모습을 드러내려 해.' },
    ],
  },
  9: {
    tag: 'YUNA · BEFORE THE SILENCE', title: '목소리가 닿지 않을까 봐', artId: 'story-09-yuna-silence',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '침묵을 삼킨 합창단은 유나가 “아무도 내 목소리를 듣지 않을 거야”라고 믿었던 순간에 태어났어.' },
      { speaker: '주인공', portrait: 'protagonist', text: '그럼 우리가 먼저 들을게요. 유나의 가장 작은 목소리까지.' },
    ],
  },
  10: {
    tag: 'MEMORY RESTORED · YUNA', title: '두 번째 금, 되찾은 노래', artId: 'story-10-yuna-song-returned',
    lines: [
      { speaker: '유나', portrait: 'yuna', text: '들려. 내가 좋아했던 목소리도, 내 목소리도… 사라지지 않았어.' },
      { speaker: '전 조수', portrait: 'assistant', text: '딸의 꿈속 교실에도 두 번째 균열이 생겼어. 균열 사이로 새어 나오는 건 어둠이 아니라, 돌려받은 별빛이야.' },
    ],
  },
  11: {
    tag: 'NEXT DREAM · A ROAD OF WIND', title: '멈춰 버린 발걸음', artId: 'story-11-haneul-call',
    lines: [
      { speaker: '하늘의 기억', portrait: 'haneul', text: '계속 달렸는데… 왜 다시 여기야? 이번에도 못 나가면 어떡하지?' },
      { speaker: '주인공', portrait: 'protagonist', text: '한 번 멈춘다고 길이 없어지는 건 아니야. 이번에는 같이 달리자.' },
    ],
  },
  12: {
    tag: 'HA-NEUL · FIRST RUSH', title: '바람보다 먼저 내딛는 발', artId: 'story-12-haneul-dash',
    lines: [
      { speaker: '하늘', portrait: 'haneul', text: '멀어서 못 갈 것 같으면, 나는 그냥 더 빨리 달렸어. 그런데 이 길은 자꾸 나를 처음으로 돌려보내.' },
      { speaker: '주인공', portrait: 'protagonist', text: '이번에는 되돌아오더라도 괜찮아. 다시 출발할 기억을 남겨 둘게.' },
    ],
  },
  13: {
    tag: 'HA-NEUL · THE TRUE DIRECTION', title: '표지판보다 믿을 수 있는 것', artId: 'story-13-haneul-sign',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '바람은 길을 지우고, 표지판은 거짓말을 해. 하지만 하늘이의 기억만은 계속 앞으로를 가리키고 있어.' },
      { speaker: '주인공', portrait: 'protagonist', text: '그럼 바람이 뭐라고 하든, 우리가 기억한 방향으로 갈 거야.' },
    ],
  },
  14: {
    tag: 'HA-NEUL · ABOVE THE HEADWIND', title: '한 가지 방법만으로는 못 가는 길', artId: 'story-14-haneul-wall',
    lines: [
      { speaker: '하늘', portrait: 'haneul', text: '나는 빨리만 가면 된다고 생각했어. 그런데 혼자 달릴수록 더 멀어지는 느낌이었어.' },
      { speaker: '주인공', portrait: 'protagonist', text: '달리는 것도, 기다리는 것도, 도움을 받는 것도 전부 앞으로 가는 방법이야.' },
    ],
  },
  15: {
    tag: 'HA-NEUL · BEFORE THE KITE', title: '제자리일까 봐 무서웠던 아이', artId: 'story-15-haneul-fear',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '검은 연은 하늘이를 끌어내리려는 괴물이 아니야. 아무리 달려도 달라지지 않을까 봐 떨던 마음이야.' },
      { speaker: '주인공', portrait: 'protagonist', text: '하늘아, 이번에는 네가 달린 길이 여기 남아 있어. 내가 봤어.' },
    ],
  },
  16: {
    tag: 'MEMORY RESTORED · HANEUL', title: '멈추지 않는 발걸음', artId: 'story-16-haneul-restored',
    lines: [
      { speaker: '하늘', portrait: 'haneul', text: '제자리여도 다시 출발하면 되는 거였네. 이번에는 정말 앞으로 간 것 같아.' },
      { speaker: '전 조수', portrait: 'assistant', text: '세 번째 균열이 열렸어. 이제 딸의 꿈이 스스로 유지될 수 없을 만큼 흔들리고 있어.' },
    ],
  },
  17: {
    tag: 'DAUGHTER · THE PERFECT GARDEN', title: '너무 완벽해서 이상한 곳', artId: 'story-17-daughter-garden',
    lines: [
      { speaker: '수면 과학자의 딸', portrait: 'daughter', text: '여기는 매일 꽃이 피고, 친구들도 웃어. 그런데 왜 가끔 누군가 울고 있는 소리가 들리지?' },
      { speaker: '주인공', portrait: 'protagonist', text: '그 소리가 들린다면, 네가 잘못된 게 아니야. 같이 어디에서 오는지 찾아보자.' },
    ],
  },
  18: {
    tag: 'DAUGHTER · THE CRACKED CLASSROOM', title: '친구들이 너무 조용하다', artId: 'story-18-daughter-classroom',
    lines: [
      { speaker: '수면 과학자의 딸', portrait: 'daughter', text: '친구들이 내 곁에 있는데도, 내가 말을 걸면 대답을 못 해. 난 그냥 모두가 행복한 줄 알았어.' },
      { speaker: '전 조수', portrait: 'assistant', text: '이제 진실을 볼 준비가 된 거야. 다만 이 꿈은 그 진실을 쉽게 놓아주지 않을 거야.' },
    ],
  },
  19: {
    tag: 'DAUGHTER · THE DREAM DEFENDS ITSELF', title: '완벽한 세계가 두려워한 균열', artId: 'story-19-perfect-guardian',
    lines: [
      { speaker: '수면 과학자의 딸', portrait: 'daughter', text: '아빠가 만든 이곳이 누군가의 꿈을 빼앗아 만든 거라면… 나는 여기서 웃으면 안 되는 걸까?' },
      { speaker: '주인공', portrait: 'protagonist', text: '네가 웃었던 게 잘못은 아니야. 이제부터는 아무도 울지 않는 방법을 같이 찾으면 돼.' },
    ],
  },
  20: {
    tag: 'PAGE 02 · THE PERFECT DREAM COLLAPSES', title: '아빠가 거대한 꿈이 되었다', artId: 'story-20-page-two-scientist', pageBreak: true,
    lines: [
      { speaker: '수면 과학자의 딸', portrait: 'daughter', text: '아빠, 친구들의 행복을 돌려줘. 나는 혼자만 행복한 꿈을 원하지 않아.' },
      { speaker: '전 조수', portrait: 'assistant', text: '세계가 무너지자 과학자가 직접 수호자가 됐어. 이제부터는 그가 만든 완벽함이 아니라, 현실을 향해 가야 해.' },
    ],
  },
};

const PROGRESS_STORAGE_KEY = 'dream-child-campaign-progress-v1';
const campaign = loadCampaignProgress();

const keys = new Set();
const pressed = new Set();
let toastTimer = 0;
let lastFrame = 0;
let game = {};

function freshPlayer() {
  return { x: 72, y: 452, w: 25, h: 34, vx: 0, vy: 0, grounded: false, facing: 1 };
}

function loadCampaignProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');
    return {
      unlocked: Math.max(0, Math.min(STAGES.length - 1, Number(saved.unlocked) || 0)),
      memories: new Set(Array.isArray(saved.memories) ? saved.memories : []),
      skills: new Set(Array.isArray(saved.skills) ? saved.skills : []),
    };
  } catch {
    return { unlocked: 0, memories: new Set(), skills: new Set() };
  }
}

function saveCampaignProgress() {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ unlocked: campaign.unlocked, memories: [...campaign.memories], skills: [...campaign.skills] }));
  } catch {
    // 게임은 저장소가 제한된 브라우저에서도 현재 세션 진행으로 계속됩니다.
  }
}

function totalStages() {
  return STAGES.length;
}

function stagePage(stage = currentStage()) { return stage?.page || 1; }

function renderCampaignRoute() {
  if (!campaignRouteEl) return;
  campaignRouteEl.innerHTML = STAGES.map((stage, index) => {
    const current = index === game.stageIndex ? ' current' : '';
    const pageMarker = stagePage(stage) === 2 ? 'PAGE 02 · ' : '';
    const bossMarker = stage.type === 'boss' ? ' · BOSS' : '';
    return `<li class="${current.trim()}"><b>${pageMarker}${String(index + 1).padStart(2, '0')}</b><span>${stage.name}</span><small>${stage.chapter || '꿈의 길'}${bossMarker}</small></li>`;
  }).join('');
}

function newGame() {
  game = {
    phase: 'intro', stageIndex: 0, imagination: 100, elapsed: 0, bridge: false, inverted: false,
    player: freshPlayer(), platforms: [], boss: null, dreamShots: [], nightmareShots: [], fireCooldown: 0,
    nextAttack: 1.2, message: '', completed: [], memories: new Set(campaign.memories), learnedSkills: new Set(campaign.skills), fragments: [], echoes: [], recording: null, memoryPads: [], fallZones: [], transition: 'start', stageIntroTimer: null, dashCooldown: 0, dashTimer: 0, dashDirection: 1, watcherResolved: false,
  };
  showStageIntro();
}

function clearStageIntroTimer() {
  if (game.stageIntroTimer) {
    clearTimeout(game.stageIntroTimer);
    game.stageIntroTimer = null;
  }
}

function currentStage() { return STAGES[game.stageIndex]; }
function isSkillBlocked(skill) { return Boolean(currentStage()?.blockedSkills?.includes(skill)); }
function hasSkill(skill) {
  return !isSkillBlocked(skill) && Boolean(game.learnedSkills?.has(skill) || currentStage()?.skills.includes(skill));
}

function showStoryPortrait(line) {
  const portrait = line.portrait || 'protagonist';
  const assetPath = `assets/portraits/${portrait}.png`;
  storyPortrait.dataset.portrait = portrait;
  storyPortrait.className = `story-portrait portrait-${portrait}`;
  storyPortrait.classList.remove('has-art');
  storyPortraitLabel.textContent = line.speaker;
  storyPortraitPath.textContent = assetPath;
  storyPortraitImage.alt = `${line.speaker} 대화 일러스트`;
  storyPortraitImage.onload = () => storyPortrait.classList.add('has-art');
  storyPortraitImage.onerror = () => storyPortrait.classList.remove('has-art');
  storyPortraitImage.src = assetPath;
}

function renderStoryLine() {
  const beat = game.storyBeat;
  const lines = beat?.lines || [];
  const line = lines[game.storyLineIndex] || lines[0];
  if (!line) return;
  storySpeaker.textContent = line.speaker;
  storyLine.textContent = line.text;
  storyProgress.textContent = `${String(game.storyLineIndex + 1).padStart(2, '0')} / ${String(lines.length).padStart(2, '0')}`;
  showStoryPortrait(line);
  const lastLine = game.storyLineIndex >= lines.length - 1;
  const finishLabel = beat.pageBreak ? '2페이지 시작' : '다음 스테이지로';
  startButton.innerHTML = `${lastLine ? finishLabel : '다음 대사'} <span>↵</span>`;
}

function showStoryBeat(beat) {
  clearStageIntroTimer();
  game.phase = 'story';
  game.storyBeat = beat;
  game.storyLineIndex = 0;
  startTag.textContent = beat.tag;
  startTitle.textContent = beat.title;
  startCopy.textContent = '';
  storyDialogue.classList.remove('hidden');
  renderStoryLine();
  startScreen.classList.add('story-mode');
  startScreen.classList.remove('hidden');
  stageMenu.classList.add('hidden');
  endScreen.classList.add('hidden');
  renderCampaignRoute();
  updateHud();
}

function continueStoryBeat() {
  if (game.phase !== 'story') return;
  const totalLines = game.storyBeat?.lines?.length || 0;
  if (game.storyLineIndex < totalLines - 1) {
    game.storyLineIndex += 1;
    renderStoryLine();
    return;
  }
  game.storyBeat = null;
  game.storyLineIndex = 0;
  showStageIntro();
}

function showStageIntro() {
  const stage = currentStage();
  clearStageIntroTimer();
  startScreen.classList.remove('story-mode');
  storyDialogue.classList.add('hidden');
  // 보스 스테이지는 인트로 화면이 떠 있는 동안에도 전투 장면을 준비한다.
  // 자동 전환 타이머와 렌더 루프가 엇갈려도 빈 캔버스가 보이지 않게 한다.
  if (stage.type === 'boss') ensureBossStage();
  game.phase = 'intro';
  const pagePrefix = stagePage(stage) === 2 ? 'DREAM LINK · PAGE 02 · FINAL' : 'DREAM LINK';
  startTag.textContent = `${pagePrefix} · STAGE ${String(game.stageIndex + 1).padStart(2, '0')} / ${String(totalStages()).padStart(2, '0')}`;
  startTitle.textContent = stage.name;
  startCopy.textContent = stage.intro;
  startButton.innerHTML = `${stage.type === 'boss' ? '악몽에 맞서기' : '꿈속으로 들어가기'} <span>↵</span>`;
  startScreen.classList.remove('hidden');
  stageMenu.classList.add('hidden');
  endScreen.classList.add('hidden');
  if (stage.type === 'boss') {
    const stageIndex = game.stageIndex;
    game.stageIntroTimer = setTimeout(() => {
      if (game.phase === 'intro' && game.stageIndex === stageIndex && currentStage()?.type === 'boss') startStage();
    }, 950);
  }
  renderCampaignRoute();
  updateHud();
}

function renderStageMenu() {
  stageSelectGrid.innerHTML = STAGES.map((stage, index) => {
    const current = index === game.stageIndex;
    return `<button class="stage-select-button${current ? ' current' : ''}" data-stage="${index}">
      <b>${stagePage(stage) === 2 ? 'PAGE 02 · ' : ''}STAGE ${String(index + 1).padStart(2, '0')}</b>
      <strong>${stage.name}</strong>
      <small>${index < campaign.unlocked ? 'CLEAR · 재도전 가능' : 'CURRENT · 도전 가능'}</small>
    </button>`;
  }).join('');
  stageSelectGrid.querySelectorAll('[data-stage]').forEach((button) => button.addEventListener('click', () => selectStage(Number(button.dataset.stage))));
}

function openStageMenu() {
  if (game.phase !== 'playing') return;
  game.resumePhase = 'playing';
  game.phase = 'menu';
  renderStageMenu();
  stageMenu.classList.remove('hidden');
  updateHud();
}

function closeStageMenu() {
  if (game.phase !== 'menu') return;
  game.phase = game.resumePhase || 'playing';
  stageMenu.classList.add('hidden');
  updateHud();
}

function selectStage(index) {
  game.stageIndex = index;
  game.memories = new Set(campaign.memories);
  game.fragments = [];
  game.boss = null;
  showStageIntro();
}

function fallOffStage(message = '낙사! 기억이 시작점으로 되돌아갔어.') {
  if (game.phase !== 'playing') return;
  game.player = freshPlayer();
  game.player.vx = 0;
  game.player.vy = 0;
  game.player.grounded = false;
  game.imagination = Math.max(0, game.imagination - 12);
  say(message);
  if (game.imagination <= 0) disconnect();
  updateHud();
}

function removeLatestEcho() {
  if (game.phase !== 'playing') return;
  if (game.recording) {
    game.recording = null;
    say('기억 기록을 취소했습니다.');
    updateHud();
    return;
  }
  if (!game.echoes.length) {
    say('지울 기억의 나가 없습니다.');
    return;
  }
  game.echoes.pop();
  say('가장 최근 기억의 나를 지웠습니다.');
  updateHud();
}

function startStage() {
  const stage = currentStage();
  clearStageIntroTimer();
  startScreen.classList.remove('story-mode');
  game.phase = 'playing';
  game.imagination = 100;
  game.elapsed = 0;
  game.bridge = false;
  game.inverted = false;
  game.player = freshPlayer();
  game.dreamShots = [];
  game.nightmareShots = [];
  game.echoes = [];
  game.recording = null;
  game.memoryPads = [];
  game.platforms = [];
  game.exit = null;
  game.fireCooldown = 0;
  game.nextAttack = 1.1;
  game.nightmareHitCooldown = 0;
  game.watcherResolved = false;
  game.bottomIsVoid = false;
  game.watcherHitCooldown = 0;
  game.carouselGateOpened = false;
  game.message = stage.hint;
  if (stage.type === 'puzzle') {
    game.boss = null;
    setupPuzzle(stage.layout, stage.echoGoal || 0);
  } else ensureBossStage(true);
  bossHud.classList.toggle('hidden', stage.type !== 'boss');
  startScreen.classList.add('hidden');
  stageMenu.classList.add('hidden');
  endScreen.classList.add('hidden');
  say(stage.hint);
  updateHud();
}

function setupPuzzle(layout, echoGoal) {
  const common = [
    { x: 0, y: 500, w: 235, h: 40, label: 'MEMORY SHORE' },
    { x: 650, y: 500, w: 310, h: 40, label: 'CORE ROOM' },
  ];
  if (layout === 'walk') {
    game.platforms = [{ x: 0, y: 500, w: 960, h: 40, label: 'DREAM EDGE' }];
    game.exit = { x: 875, y: 418, w: 36, h: 82, label: 'DREAM GATE' };
    game.fallZones = [];
  } else if (layout === 'duet') {
    game.platforms = [
      { x: 0, y: 500, w: 210, h: 40, label: 'EMPTY DESK A' },
      { x: 465, y: 500, w: 145, h: 40, label: 'EMPTY DESK B' },
      { x: 760, y: 500, w: 200, h: 40, label: 'CHOIR EXIT' },
      { x: 254, y: 430, w: 110, h: 16, hidden: true, label: '숨은 음계 1' },
      { x: 382, y: 356, w: 92, h: 16, hidden: true, label: '숨은 음계 2' },
      { x: 630, y: 410, w: 102, h: 16, hidden: true, label: '마지막 화음' },
    ];
    game.exit = { x: 886, y: 418, w: 36, h: 82, label: 'DUET GATE' };
    game.fallZones = [
      { x: 210, y: 500, w: 255, h: 40 },
      { x: 610, y: 500, w: 150, h: 40 },
    ];
  } else if (layout === 'relay') {
    game.platforms = [
      { x: 0, y: 500, w: 175, h: 40, label: 'RELAY START' },
      { x: 465, y: 500, w: 90, h: 40, label: 'WIND MARK 1' },
      { x: 795, y: 500, w: 165, h: 40, label: 'RELAY END' },
      { x: 615, y: 402, w: 102, h: 16, hidden: true, label: '숨은 바람길' },
    ];
    game.exit = { x: 910, y: 418, w: 36, h: 82, label: 'RUSH GATE' };
    game.fallZones = [
      { x: 175, y: 500, w: 290, h: 40 },
      { x: 555, y: 500, w: 240, h: 40 },
    ];
  } else if (layout === 'chorus') {
    game.platforms = [
      { x: 0, y: 500, w: 190, h: 40, label: 'CHOIR FLOOR' },
      { x: 246, y: 500, w: 150, h: 40, label: 'ECHO FLOOR' },
      { x: 446, y: 500, w: 136, h: 40, label: 'MELODY FLOOR' },
      { x: 650, y: 500, w: 310, h: 40, label: 'RESONANCE HALL' },
      { x: 180, y: 400, w: 96, h: 14, hidden: true, label: '숨은 음계' },
      { x: 344, y: 336, w: 120, h: 14, hidden: true, label: '반향 다리' },
      { x: 522, y: 276, w: 120, h: 14, hidden: true, label: '합창 난간' },
      { x: 712, y: 214, w: 110, h: 14, hidden: true, label: '별빛 파동' },
    ];
    game.exit = { x: 862, y: 418, w: 36, h: 82, label: 'SONG GATE' };
    game.fallZones = [
      { x: 190, y: 500, w: 56, h: 40 },
      { x: 396, y: 500, w: 50, h: 40 },
      { x: 582, y: 500, w: 68, h: 40 },
    ];
  } else if (layout === 'chorus-memory') {
    // 9스테이지는 중간 바닥을 없애 공명을 유지한 숨은 음계만으로 건너야 한다.
    game.platforms = [
      { x: 0, y: 500, w: 190, h: 40, label: 'CHOIR START' },
      { x: 650, y: 500, w: 310, h: 40, label: 'RESONANCE HALL' },
      // 기본 점프로도 닿는 높이: 첫 공명 발판에서 중력 반전을 요구하지 않는다.
      { x: 180, y: 420, w: 96, h: 14, hidden: true, label: '숨은 음계 1' },
      { x: 344, y: 336, w: 120, h: 14, hidden: true, label: '반향 다리' },
      { x: 522, y: 276, w: 120, h: 14, hidden: true, label: '기억의 음계' },
      { x: 712, y: 214, w: 110, h: 14, hidden: true, label: '별빛 파동' },
    ];
    game.exit = { x: 862, y: 418, w: 36, h: 82, label: 'SONG GATE' };
    game.fallZones = [
      { x: 190, y: 500, w: 460, h: 40 },
    ];
  } else if (layout === 'dash') {
    game.platforms = [
      { x: 0, y: 500, w: 175, h: 40, label: 'RUN START' },
      { x: 445, y: 500, w: 110, h: 40, label: 'RUSH STEP' },
      { x: 660, y: 500, w: 100, h: 40, label: 'WIND STEP' },
      { x: 865, y: 500, w: 95, h: 40, label: 'RUN END' },
      { x: 214, y: 392, w: 112, h: 14, hidden: true, label: '질주 발판' },
      { x: 438, y: 326, w: 122, h: 14, hidden: true, label: '숨은 경사' },
      { x: 636, y: 268, w: 96, h: 14, hidden: true, label: '바람 통로' },
      { x: 384, y: 436, w: 74, h: 18, label: 'MEMORY TETHER' },
    ];
    game.exit = { x: 894, y: 418, w: 36, h: 82, label: 'RUSH GATE' };
    game.fallZones = [
      { x: 175, y: 500, w: 270, h: 40 },
      { x: 555, y: 500, w: 105, h: 40 },
      { x: 760, y: 500, w: 105, h: 40 },
    ];
  } else if (layout === 'bridge') {
    game.platforms = [
      { x: 0, y: 500, w: 960, h: 40, label: 'MEMORY WALKWAY' },
      { x: 500, y: 270, w: 60, h: 230, wall: true, label: 'MEMORY GATE' },
    ];
    game.exit = { x: 875, y: 418, w: 36, h: 82, label: 'MEMORY GATE' };
    game.fallZones = [];
  } else if (layout === 'wall') {
    game.platforms = [
      { x: 0, y: 500, w: 235, h: 40, label: 'MEMORY SHORE' },
      { x: 510, y: 500, w: 450, h: 40, label: 'MOONLIGHT SHORE' },
      { x: 650, y: 180, w: 80, h: 320, wall: true, label: 'DREAM EXTRACTOR' },
      { x: 745, y: 352, w: 125, h: 18, label: 'MOONLIGHT SHELF' },
      { x: 300, y: 420, w: 112, h: 14, hidden: true, label: '기억의 박동' },
      { x: 476, y: 356, w: 118, h: 14, hidden: true, label: '공포 숨결' },
    ];
    game.exit = { x: 900, y: 418, w: 36, h: 82, label: 'LAUGH CORE' };
    game.fallZones = [{ x: 235, y: 500, w: 275, h: 40 }];
  } else if (layout === 'carousel') {
    game.platforms = [
      { x: 0, y: 500, w: 960, h: 40, label: 'CAROUSEL FLOOR' },
      { x: 650, y: 180, w: 80, h: 320, wall: true, persistentWall: true, label: 'CAROUSEL WALL' },
      { x: 762, y: 352, w: 124, h: 18, label: 'LAUGH LIGHT' },
    ];
    game.exit = { x: 900, y: 418, w: 36, h: 82, label: 'LAUGH CORE' };
    game.fallZones = [];
  } else {
    game.platforms = [
      { x: 0, y: 500, w: 960, h: 40, label: 'MEMORY SHORE' },
      { x: 620, y: 180, w: 80, h: 320, wall: true, label: 'DREAM EXTRACTOR GATE' },
      { x: 760, y: 352, w: 125, h: 18, label: 'MOONLIGHT SHELF' },
    ];
    game.exit = { x: 900, y: 418, w: 36, h: 82, label: 'LAUGH CORE' };
    game.fallZones = [];
  }
  game.layout = layout;
  // 퍼즐 구역의 화면 맨 아래는 어디서든 꿈의 바깥입니다.
  // 발판 사이로 빠진 뒤 캔버스 하단을 걸어서 우회하지 못하도록 통일합니다.
  game.bottomIsVoid = true;
  game.fragments = [];
  const padsByLayout = {
    walk: [],
    bridge: [{ x: 165, y: 462, w: 30, h: 28, label: '첫 약속' }],
    wall: [{ x: 165, y: 462, w: 30, h: 28, label: '별빛 약속' }],
    chorus: [{ x: 382, y: 462, w: 30, h: 28, label: '노래 기억' }],
    // 9스테이지: 공명으로 계단을 드러낸 뒤에만 도달할 수 있는 세 번째 음계 위의 기억 발판.
    'chorus-memory': [{ x: 564, y: 248, w: 30, h: 28, label: '세 번째 음의 기억', hidden: true }],
    duet: [
      { x: 150, y: 462, w: 30, h: 28, label: '첫 번째 빈 의자' },
      { x: 520, y: 462, w: 30, h: 28, label: '두 번째 빈 의자' },
    ],
    relay: [{ x: 135, y: 462, w: 30, h: 28, label: '출발 신호' }],
    dash: [{ x: 138, y: 462, w: 30, h: 28, label: '질주 기억' }],
    carousel: [],
    watcher: [
      { x: 500, y: 462, w: 16, h: 28, label: '회전목마' },
      { x: 550, y: 462, w: 16, h: 28, label: '함께 웃기' },
    ],
  };
  game.memoryPads = padsByLayout[layout] || [];
  game.echoGoal = echoGoal;
}

function setupBoss(name, config = {}) {
  game.platforms = [];
  game.exit = null;
  game.memoryPads = [];
  game.fallZones = [];
  game.player = { x: 112, y: 248, w: 34, h: 38, vx: 0, vy: 0, facing: 1 };
  const bossHp = config.attackHp || (config.mode === 'final' ? 6 : 4);
  const defaultMemoryPads = (config.mode === 'calm' || config.mode === 'final') ? [
    { x: 226, y: 122, w: 42, h: 42, label: '별빛 보기' },
    { x: 382, y: 258, w: 42, h: 42, label: '회전목마 타기' },
    { x: 518, y: 382, w: 42, h: 42, label: '함께 웃기' },
  ] : [];
  game.boss = {
    name, x: config.x || 734, y: config.y || 168, w: config.w || 164, h: config.h || 205, maxHp: bossHp, hp: bossHp, flash: 0, attack: 0, attackIndex: 0,
    phase: 1, reflections: 0, memoryShield: 0, calmed: false, mode: config.mode || 'standard', resolving: false,
    attackUnlocked: false, visual: config.visual || 'clown', attackTarget: config.attackTarget || 'player',
    requiredEchoHits: Number(config.requiredEchoHits) || 0, echoHits: 0,
    calmDuration: Number(config.calmDuration) || 1.4, calmProgress: 0,
    decoyPads: (config.decoyPads || []).map((pad) => ({ ...pad })), windGates: (config.windGates || []).map((gate) => ({ ...gate })), chaseProgress: 0,
    resonanceGates: (config.resonanceGates || []).map((gate) => ({ ...gate })), resonanceProgress: 0,
    mirrorGates: (config.mirrorGates || []).map((gate) => ({ ...gate })), mirrorProgress: 0,
    finalChargeNeeded: Number(config.finalChargeNeeded) || 1.4, finalCharge: 0,
    moveBounds: config.moveBounds || { xMin: 45, xMax: 565, yMin: 86, yMax: 437 },
    memoryPads: (config.memoryPads || defaultMemoryPads).map((pad) => ({ ...pad })),
  };
}

function ensureBossStage(reset = false) {
  const stage = currentStage();
  if (stage?.type !== 'boss') return;
  if (reset || !game.boss || !game.player || !Array.isArray(game.boss.memoryPads)) setupBoss(stage.boss, stage.bossConfig || {});
}

function isStageFiveBossBattle() {
  return game.phase === 'playing' && game.stageIndex === 4 && currentStage()?.type === 'boss';
}

function triggerBossShot() {
  if (game.phase !== 'playing' || currentStage()?.type !== 'boss' || game.boss?.mode !== 'final' || !game.boss?.attackUnlocked || game.fireCooldown > 0) return;
  if (!spend(6)) return;
  const p = game.player;
  const direction = p.facing >= 0 ? 1 : -1;
  const origin = { x: direction > 0 ? p.x + p.w : p.x - 19, y: p.y + p.h / 2 - 3 };
  game.dreamShots.push({ x: origin.x, y: origin.y, w: 19, h: 7, vx: direction * 720, vy: 0, life: 0 });
  game.fireCooldown = 0.22;
  say('기억 탄막을 발사했다.');
}

function echoOverlapsPad(echo, pad) {
  return echo.holding && overlaps({ x: echo.x, y: echo.y, w: echo.w, h: echo.h }, pad);
}

function padRequirementMet(pad) {
  if (!pad.requiresSkill) return true;
  const techniques = activeTechniques();
  return Boolean(techniques[pad.requiresSkill] || hasSkill(pad.requiresSkill));
}

function activeMemoryPads(pads, includePresentSelf = false) {
  return pads.filter((pad) => {
    if (!padRequirementMet(pad)) return false;
    const echoIsHolding = game.echoes.some((echo) => echoOverlapsPad(echo, pad));
    return echoIsHolding || (includePresentSelf && game.player && overlaps(game.player, pad));
  }).length;
}

function beginMemoryRecording() {
  if (game.echoes.length >= 3) {
    say('기억의 나는 세 명까지 남길 수 있습니다.');
    return;
  }
  if (!spend(8)) return;
  const p = game.player;
  game.recording = {
    start: { x: p.x, y: p.y, w: p.w, h: p.h },
    frames: [{ x: p.x, y: p.y, w: p.w, h: p.h }],
    duration: 0,
    sampleClock: 0,
  };
  say('① 기록 시작: 상상력을 조금 사용합니다. ② 목표 발판까지 이동하세요. ③ C를 다시 누르면 되감기고, 기억의 나가 길을 재생합니다.');
}

function finishMemoryRecording() {
  const recording = game.recording;
  if (!recording || recording.duration < .35) {
    game.recording = null;
    say('조금 더 움직인 뒤 기억을 남겨 보세요.');
    return;
  }
  const echo = {
    frames: recording.frames,
    step: recording.duration / Math.max(1, recording.frames.length - 1),
    elapsed: 0,
    x: recording.start.x,
    y: recording.start.y,
    w: recording.start.w,
    h: recording.start.h,
    holding: false,
  };
  game.echoes.push(echo);
  Object.assign(game.player, { ...recording.start, vx: 0, vy: 0, grounded: false });
  game.recording = null;
  say('되감기 완료. 기억의 나가 방금 전 길을 재생해 마지막 발판을 지킵니다. 현재의 나는 다음 기억을 만들러 가세요.');
}

function toggleMemoryRecording() {
  if (game.phase !== 'playing') return;
  if (game.recording) finishMemoryRecording();
  else beginMemoryRecording();
  updateHud();
}

function updateMemoryLoops(dt) {
  if (game.recording) {
    game.recording.duration += dt;
    game.recording.sampleClock += dt;
    if (game.recording.sampleClock >= .055) {
      const p = game.player;
      game.recording.frames.push({ x: p.x, y: p.y, w: p.w, h: p.h });
      game.recording.sampleClock = 0;
    }
    if (game.recording.duration >= 5.5) finishMemoryRecording();
  }
  game.echoes.forEach((echo) => {
    echo.elapsed += dt;
    echo.flash = Math.max(0, (echo.flash || 0) - dt);
    const index = Math.min(echo.frames.length - 1, Math.floor(echo.elapsed / echo.step));
    const frame = echo.frames[index];
    Object.assign(echo, frame);
    echo.holding = index >= echo.frames.length - 1;
  });
}

function say(text) {
  toast.textContent = text;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function spend(amount) {
  game.imagination = Math.max(0, game.imagination - amount);
  if (game.imagination <= 0) disconnect();
  updateHud();
  return game.phase === 'playing';
}

function activeTechniques() {
  return {
    bridge: game.phase === 'playing' && hasSkill('bridge') && keys.has('Digit1') && game.imagination > 0,
    gravity: game.phase === 'playing' && hasSkill('gravity') && keys.has('Digit2') && game.imagination > 0,
    time: game.phase === 'playing' && hasSkill('time') && (keys.has('ShiftLeft') || keys.has('ShiftRight')) && game.imagination > 0,
    resonance: game.phase === 'playing' && hasSkill('resonance') && keys.has('KeyV') && game.imagination > 0,
  };
}

function triggerDash() {
  if (game.phase !== 'playing' || !hasSkill('dash') || game.dashCooldown > 0) return;
  if (!spend(12)) return;
  const p = game.player;
  game.dashDirection = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0) || p.facing || 1;
  game.dashTimer = 0.16;
  game.dashCooldown = 0.6;
  p.vy *= 0.35;
  say('질주! 숨은 길을 가로질러라.');
}

function updateDash(dt) {
  if (game.dashCooldown > 0) game.dashCooldown = Math.max(0, game.dashCooldown - dt);
  if (game.dashTimer > 0) game.dashTimer = Math.max(0, game.dashTimer - dt);
}

function frozenTime() { return activeTechniques().time; }

function imaginationRegen(dt, techniques) {
  const drain = (techniques.bridge ? 16 : 0) + (techniques.gravity ? 28 : 0) + (techniques.time ? 28 : 0) + (techniques.resonance ? 14 : 0);
  if (drain > 0) {
    game.imagination = Math.max(0, game.imagination - drain * dt);
    if (game.imagination <= 0) disconnect();
  } else game.imagination = Math.min(100, game.imagination + 11 * dt);
}

function getBridge() {
  return { x: 313 + Math.sin(game.elapsed * 2.2) * 56, y: 452, w: 92, h: 18 };
}

function getWatcher() {
  // 감시선은 고정한다. 플레이어는 "기억을 기록 → 그 기억이 눈을 지날 때 시간 정지"의 한 가지 규칙에 집중한다.
  return { x: 354, y: 452, w: 36, h: 31 };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolveWallHorizontal(player, wall, oldX) {
  const verticallyOverlaps = player.y < wall.y + wall.h && player.y + player.h > wall.y;
  if (!verticallyOverlaps) return;
  const crossedFromLeft = oldX + player.w <= wall.x + 5 && player.x + player.w >= wall.x;
  const crossedFromRight = oldX >= wall.x + wall.w - 5 && player.x <= wall.x + wall.w;
  if (crossedFromLeft) {
    player.x = wall.x - player.w;
    player.vx = 0;
  } else if (crossedFromRight) {
    player.x = wall.x + wall.w;
    player.vx = 0;
  }
}

function resolveWallVertical(player, wall, oldY) {
  const horizontallyOverlaps = player.x < wall.x + wall.w && player.x + player.w > wall.x;
  if (!horizontallyOverlaps) return;
  if (player.vy >= 0 && oldY + player.h <= wall.y + 6 && player.y + player.h >= wall.y) {
    player.y = wall.y - player.h;
    player.vy = 0;
    player.grounded = !game.inverted;
    return;
  }
  if (player.vy < 0 && oldY >= wall.y + wall.h - 6 && player.y <= wall.y + wall.h) {
    player.y = wall.y + wall.h;
    player.vy = 0;
    player.grounded = game.inverted;
    return;
  }
  if (!overlaps(player, wall)) return;

  // 고속 질주나 프레임 경계에서 벽 안으로 들어간 경우에는 가장 가까운 면 밖으로 밀어낸다.
  const options = [
    { amount: player.x + player.w - wall.x, side: 'left' },
    { amount: wall.x + wall.w - player.x, side: 'right' },
    { amount: player.y + player.h - wall.y, side: 'top' },
    { amount: wall.y + wall.h - player.y, side: 'bottom' },
  ].sort((a, b) => a.amount - b.amount);
  const side = options[0].side;
  if (side === 'left') { player.x = wall.x - player.w; player.vx = 0; }
  else if (side === 'right') { player.x = wall.x + wall.w; player.vx = 0; }
  else if (side === 'top') { player.y = wall.y - player.h; player.vy = 0; player.grounded = !game.inverted; }
  else { player.y = wall.y + wall.h; player.vy = 0; player.grounded = game.inverted; }
}

function updatePuzzle(dt) {
  const stage = currentStage();
  const techniques = activeTechniques();
  const frozen = techniques.time;
  game.watcherHitCooldown = Math.max(0, (game.watcherHitCooldown || 0) - dt);
  updateDash(dt);
  imaginationRegen(dt, techniques);
  if (game.phase !== 'playing') return;
  game.bridge = techniques.bridge;
  if (game.inverted !== techniques.gravity) {
    game.inverted = techniques.gravity;
    game.player.vy = game.inverted ? -120 : 120;
  }
  if (!frozen) game.elapsed += dt;
  const p = game.player;
  const axis = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
  const accel = p.grounded ? 2100 : 1120;
  if (axis) { p.vx += axis * accel * dt; p.facing = axis; } else p.vx *= Math.pow(0.0007, dt);
  p.vx = Math.max(-290, Math.min(290, p.vx));
  const jump = pressed.has('Space') || pressed.has('ArrowUp');
  if (jump && p.grounded) { p.vy = game.inverted ? 470 : -470; p.grounded = false; }
  p.vy += (game.inverted ? -1220 : 1220) * dt;
  p.vy = Math.max(-720, Math.min(720, p.vy));
  const oldX = p.x;
  p.x = Math.max(0, Math.min(W - p.w, p.x + p.vx * dt));
  if (game.dashTimer > 0) {
    p.x = Math.max(0, Math.min(W - p.w, p.x + game.dashDirection * 520 * dt));
    p.facing = game.dashDirection;
    p.vx = game.dashDirection * 340;
  }
  const memoryPadsReadyAtFrameStart = game.echoGoal === 0 || activeMemoryPads(game.memoryPads) >= game.echoGoal;
  const memoryGateOpen = memoryPadsReadyAtFrameStart && (stage.layout !== 'watcher' || game.watcherResolved);
  const solidWalls = game.platforms.filter((item) => item.wall && (item.persistentWall || !memoryGateOpen));
  solidWalls.forEach((wall) => resolveWallHorizontal(p, wall, oldX));
  const oldY = p.y;
  p.y += p.vy * dt;
  p.grounded = false;
  const colliders = game.platforms.filter((item) => !item.wall && (!item.hidden || techniques.resonance));
  if (game.bridge) colliders.push(getBridge());
  // 기억의 나는 단순 스위치가 아니라, 필요할 때 한 칸 더 올라설 수 있는 움직이는 기억 발판이다.
  const echoColliders = game.echoes.map((echo) => ({ x: echo.x, y: echo.y, w: echo.w, h: echo.h, memoryEcho: true }));
  colliders.push(...echoColliders);
  for (const platform of colliders) {
    if (p.x + p.w <= platform.x + 2 || p.x >= platform.x + platform.w - 2) continue;
    if (p.vy >= 0 && oldY + p.h <= platform.y + 5 && p.y + p.h >= platform.y) {
      p.y = platform.y - p.h; p.vy = 0; p.grounded = !game.inverted;
    } else if (p.vy < 0 && oldY >= platform.y + platform.h - 5 && p.y <= platform.y + platform.h) {
      p.y = platform.y + platform.h; p.vy = 0; p.grounded = game.inverted;
    }
  }
  solidWalls.forEach((wall) => resolveWallVertical(p, wall, oldY));
  if (p.y <= 0) { p.y = 0; p.vy = 0; p.grounded = game.inverted; }
  if (p.y + p.h >= H) {
    const inPit = game.bottomIsVoid || (game.fallZones || []).some((zone) => p.x + p.w * 0.5 >= zone.x && p.x + p.w * 0.5 <= zone.x + zone.w);
    if (inPit) {
      fallOffStage('낙사! 기억의 발판으로 다시 돌아왔어.');
      return;
    }
    p.y = H - p.h; p.vy = 0; p.grounded = !game.inverted;
  }
  updateMemoryLoops(dt);
  if (stage.layout === 'watcher' && !game.watcherResolved) {
    const watcher = getWatcher();
    const echoCrossingWatcher = game.echoes.some((echo) => !echo.holding && overlaps(echo, watcher));
    if (frozen && echoCrossingWatcher) {
      game.watcherResolved = true;
      say('성공! 멈춘 시간 속에서 기억의 내가 감시선을 끊었습니다. 두 개의 발판을 채우세요.');
    } else if (!frozen && overlaps(p, watcher) && game.watcherHitCooldown <= 0) {
      game.watcherHitCooldown = .75;
      hitByNightmare('감시선에 포착됐습니다. C로 기록한 뒤, 기억의 내가 눈을 지날 때 Shift를 누르세요.', 12, true);
    }
  }
  const memoryPadsReady = activeMemoryPads(game.memoryPads) >= game.echoGoal;
  const watcherReady = stage.layout !== 'watcher' || game.watcherResolved;
  if (overlaps(p, game.exit)) {
    if (!watcherReady) say('먼저 과거의 나를 감시선 앞으로 기록하고, 그 기억이 지나갈 때 Shift로 시간을 멈추세요.');
    else if (!memoryPadsReady) say('먼저 기억의 나를 모든 기억 발판에 남겨야 합니다.');
    else completeStage();
  }
}

function hitByNightmare(message, cost, reset) {
  game.imagination = Math.max(0, game.imagination - cost);
  if (reset) game.player = freshPlayer();
  say(message);
  if (game.imagination <= 0) disconnect();
}

function shotAngle(origin, target) {
  return Math.atan2(target.y + target.h / 2 - origin.y, target.x + target.w / 2 - origin.x);
}

function launchNightmareShot(origin, angle, options = {}) {
  const speed = options.speed || 250;
  game.nightmareShots.push({
    x: origin.x, y: origin.y, r: options.r || 10,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    kind: options.kind || 'nightmare', decoyShot: Boolean(options.decoyShot),
  });
}

function launchNightmareFan(origin, target, count, spread, options = {}) {
  const center = shotAngle(origin, target);
  for (let index = 0; index < count; index += 1) {
    const ratio = count === 1 ? 0 : index / (count - 1) - .5;
    launchNightmareShot(origin, center + ratio * spread, options);
  }
}

function launchNightmareRing(origin, count, options = {}) {
  const offset = options.offset || 0;
  for (let index = 0; index < count; index += 1) {
    launchNightmareShot(origin, offset + Math.PI * 2 * index / count, options);
  }
}

function finalBossPhase(b) {
  if (!b.attackUnlocked) return 1;
  if (b.hp <= Math.ceil(b.maxHp / 3)) return 3;
  if (b.hp <= Math.ceil(b.maxHp * 2 / 3)) return 2;
  return 1;
}

function nextBossAttackDelay(b) {
  if (b.mode === 'final') return b.phase === 3 ? .52 : b.phase === 2 ? .68 : .82;
  if (b.mode === 'mirror') return .94;
  if (b.mode === 'resonance') return 1.02;
  if (b.mode === 'chase') return .88;
  return 1.05;
}

function spawnNightmarePattern() {
  const b = game.boss;
  const p = game.player;
  const origin = { x: b.x + 8, y: b.y + 92 };
  const attackNumber = ++b.attackIndex;

  if (b.mode === 'chase') {
    const decoy = b.echoHits < b.requiredEchoHits ? getHoldingDecoy(b) : null;
    const pattern = attackNumber % 3;
    if (pattern === 1 && decoy) {
      launchNightmareFan(origin, decoy, 1, 0, { speed: 315, r: 13, kind: 'wind', decoyShot: true });
      return;
    }
    if (pattern === 2) launchNightmareFan(origin, p, 3, .48, { speed: 260, r: 9, kind: 'wind' });
    else launchNightmareRing(origin, 6, { speed: 205, r: 8, kind: 'wind', offset: game.elapsed * .9 });
    return;
  }

  if (b.mode === 'resonance') {
    if (attackNumber % 3 === 0) launchNightmareRing(origin, 7, { speed: 205, r: 9, kind: 'note', offset: game.elapsed * .7 });
    else launchNightmareFan(origin, p, 3, .52, { speed: 265, r: 10, kind: 'note' });
    return;
  }

  if (b.mode === 'mirror') {
    if (attackNumber % 2 === 0) launchNightmareRing(origin, 8, { speed: 230, r: 8, kind: 'shard', offset: Math.PI / 8 + game.elapsed * .45 });
    else launchNightmareFan(origin, p, 4, .72, { speed: 285, r: 9, kind: 'shard' });
    return;
  }

  b.phase = finalBossPhase(b);
  if (b.phase === 1) {
    if (attackNumber % 2) launchNightmareFan(origin, p, 3, .44, { speed: 270, r: 10, kind: 'memory' });
    else launchNightmareRing(origin, 6, { speed: 200, r: 8, kind: 'memory', offset: game.elapsed * .6 });
  } else if (b.phase === 2) {
    if (attackNumber % 2) launchNightmareFan(origin, p, 5, .76, { speed: 300, r: 10, kind: 'memory' });
    else launchNightmareRing(origin, 9, { speed: 235, r: 8, kind: 'memory', offset: game.elapsed * .85 });
  } else {
    launchNightmareFan(origin, p, 5, .86, { speed: 325, r: 10, kind: 'memory' });
    launchNightmareRing(origin, 8, { speed: 255, r: 8, kind: 'memory', offset: game.elapsed * 1.15 });
  }
}

function getHoldingDecoy(b) {
  return game.echoes.find((echo) => b.decoyPads.some((pad) => echoOverlapsPad(echo, pad))) || null;
}

function resolveBoss(b, message) {
  if (b.resolving) return;
  b.resolving = true;
  say(message);
  setTimeout(completeStage, 1000);
}

function updateWindGates(b) {
  const nextGate = b.windGates[b.chaseProgress];
  if (!nextGate || game.dashTimer <= 0 || !overlaps(game.player, nextGate)) return;
  b.chaseProgress += 1;
  b.flash = .22;
  say(b.chaseProgress >= b.windGates.length ? '마지막 바람 고리를 통과했습니다!' : `질주 성공! 바람길 ${b.chaseProgress} / ${b.windGates.length}`);
}

function updateResonanceGates(b, techniques) {
  const nextGate = b.resonanceGates[b.resonanceProgress];
  if (!nextGate || !techniques.resonance || !overlaps(game.player, nextGate)) return;
  b.resonanceProgress += 1;
  b.flash = .24;
  say(b.resonanceProgress >= b.resonanceGates.length ? '마지막 음이 돌아왔습니다!' : `공명 성공! 되찾은 음 ${b.resonanceProgress} / ${b.resonanceGates.length}`);
}

function updateMirrorGates(b, techniques) {
  const nextGate = b.mirrorGates[b.mirrorProgress];
  if (!nextGate || !techniques.resonance || game.dashTimer <= 0 || !overlaps(game.player, nextGate)) return;
  b.mirrorProgress += 1;
  b.flash = .3;
  say(b.mirrorProgress >= b.mirrorGates.length ? '마지막 거울이 갈라졌습니다!' : `거울 균열 통과 ${b.mirrorProgress} / ${b.mirrorGates.length}`);
}

function updateBoss(dt) {
  ensureBossStage();
  const p = game.player;
  const b = game.boss;
  const techniques = activeTechniques();
  const frozen = techniques.time;
  updateDash(dt);
  imaginationRegen(dt, techniques);
  if (game.phase !== 'playing') return;
  if (!frozen) game.elapsed += dt;
  if (game.fireCooldown > 0) game.fireCooldown = Math.max(0, game.fireCooldown - dt);
  game.nightmareHitCooldown = Math.max(0, (game.nightmareHitCooldown || 0) - dt);
  b.flash = Math.max(0, (b.flash || 0) - dt);
  const horizontal = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
  const vertical = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
  const bounds = b.moveBounds || { xMin: 45, xMax: 565, yMin: 86, yMax: 437 };
  p.x = Math.max(bounds.xMin, Math.min(bounds.xMax, p.x + horizontal * 310 * dt));
  if (game.dashTimer > 0) {
    p.x = Math.max(bounds.xMin, Math.min(bounds.xMax, p.x + game.dashDirection * 560 * dt));
    p.facing = game.dashDirection;
  }
  p.y = Math.max(bounds.yMin, Math.min(bounds.yMax, p.y + vertical * 310 * dt));
  if (horizontal) p.facing = horizontal;
  if (!frozen) {
    b.y = b.mode === 'calm' ? 166 + Math.sin(game.elapsed * 1.1) * 18 : 160 + Math.sin(game.elapsed * 1.45) * 56;
    if (b.mode !== 'calm') {
      game.nextAttack -= dt;
      if (game.nextAttack <= 0) { spawnNightmarePattern(); game.nextAttack = nextBossAttackDelay(b); }
    }
  }
  if (!frozen) {
    for (const shot of game.nightmareShots) { shot.x += shot.vx * dt; shot.y += shot.vy * dt; }
  }
  game.nightmareShots = game.nightmareShots.filter((shot) => {
    const rect = { x: shot.x - shot.r, y: shot.y - shot.r, w: shot.r * 2, h: shot.r * 2 };
    const echoHit = game.echoes.find((echo) => overlaps(rect, echo));
    if (echoHit) {
      echoHit.flash = .24;
      const validDecoyHit = b.mode === 'chase' && shot.decoyShot && b.decoyPads.some((pad) => echoOverlapsPad(echoHit, pad));
      if (validDecoyHit && b.requiredEchoHits > 0 && b.echoHits < b.requiredEchoHits) {
        b.echoHits += 1;
        say(`검은 연이 과거의 나를 따라갔습니다. 바람 유인 ${b.echoHits} / ${b.requiredEchoHits}`);
      }
      return false;
    }
    if (overlaps(rect, p) && b.memoryShield > 0) {
      game.dreamShots.push({ x: p.x + p.w, y: p.y + p.h / 2 - 3, w: 19, h: 7, vx: 680, reflected: true });
      say('회전목마 방패가 공포 탄환을 돌려보냈습니다!');
      return false;
    }
    if (overlaps(rect, p) && game.dashTimer > 0) {
      say('질주로 공포 탄막을 가로질렀습니다!');
      return false;
    }
    if (overlaps(rect, p)) {
      if (game.nightmareHitCooldown <= 0) {
        game.nightmareHitCooldown = .45;
        hitByNightmare('공포가 상상력 연결을 갉아먹습니다.', shot.kind === 'memory' ? 15 : 12, false);
      }
      return false;
    }
    return shot.x > -40 && shot.y > -40 && shot.y < H + 40;
  });
  updateMemoryLoops(dt);
  // 보스전에서는 기억의 나 둘과 현재의 내가 각자 한 자리를 맡는다.
  if (!frozen && game.dreamShots.length) {
    game.dreamShots = game.dreamShots.filter((shot) => {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life = (shot.life || 0) + dt;
      const rect = { x: shot.x, y: shot.y, w: shot.w, h: shot.h };
      if (overlaps(rect, b)) {
        const previousPhase = finalBossPhase(b);
        b.flash = .18;
        b.hp = Math.max(0, b.hp - 1);
        if (b.mode === 'final') {
          b.phase = finalBossPhase(b);
          if (b.phase > previousPhase && b.hp > 0) say(`수면 과학자의 꿈이 더 거세졌습니다. 공격 단계 ${b.phase}!`);
        }
        game.nextAttack = Math.min(game.nextAttack + .16, b.mode === 'final' ? 1.12 : 1.0);
        return false;
      }
      return shot.life < 1.8 && shot.x > -40 && shot.x < W + 40 && shot.y > -40 && shot.y < H + 40;
    });
  }
  if (b.mode === 'calm') {
    b.activePads = activeMemoryPads(b.memoryPads, true);
    b.phase = b.activePads + 1;
    if (b.activePads >= b.memoryPads.length && frozen) b.calmProgress = Math.min(b.calmDuration, b.calmProgress + dt);
    else if (b.activePads < b.memoryPads.length) b.calmProgress = Math.max(0, b.calmProgress - dt * .35);
    if (b.calmProgress >= b.calmDuration) resolveBoss(b, '멈춘 순간에 세 개의 기억이 겹쳤습니다. 광대의 가면이 사라지고 하린이 다시 웃습니다.');
    return;
  }
  if (b.mode === 'chase') {
    b.activePads = activeMemoryPads(b.decoyPads);
    b.phase = Math.min(3, b.chaseProgress + 1);
    if (b.echoHits >= b.requiredEchoHits) {
      updateWindGates(b);
      if (b.chaseProgress >= b.windGates.length) resolveBoss(b, '하늘이가 끝까지 달려 나갔습니다. 검은 연의 바람이 조용해집니다.');
    }
    return;
  }
  if (b.mode === 'resonance') {
    b.activePads = activeMemoryPads(b.memoryPads);
    b.phase = Math.min(3, b.resonanceProgress + 1);
    if (b.activePads >= b.memoryPads.length) {
      updateResonanceGates(b, techniques);
      if (b.resonanceProgress >= b.resonanceGates.length) resolveBoss(b, '침묵이 갈라지고 유나의 노래가 꿈 전체에 울려 퍼집니다.');
    }
    return;
  }
  if (b.mode === 'mirror') {
    b.activePads = 0;
    b.phase = Math.min(3, b.mirrorProgress + 1);
    updateMirrorGates(b, techniques);
    if (b.mirrorProgress >= b.mirrorGates.length) resolveBoss(b, '완벽한 꿈의 수호자가 멈췄습니다. 딸은 균열 너머의 친구들을 바라봅니다.');
    return;
  }
  b.activePads = activeMemoryPads(b.memoryPads, true);
  if (!b.attackUnlocked) b.phase = 1;
  const requiredPads = b.memoryPads.length;
  if (b.activePads >= requiredPads && techniques.resonance && !b.attackUnlocked) {
    b.finalCharge = Math.min(b.finalChargeNeeded, b.finalCharge + dt);
  } else if (b.activePads < requiredPads && !b.attackUnlocked) {
    b.finalCharge = Math.max(0, b.finalCharge - dt * .25);
  }
  if (b.finalCharge >= b.finalChargeNeeded && !b.attackUnlocked) {
    b.attackUnlocked = true;
    b.hp = b.maxHp;
    b.phase = 1;
    say('세 개의 봉인이 공명했습니다. 이제 Z로 수면 과학자를 공격하자.');
  }
  if (b.attackUnlocked && b.hp <= 0 && !b.resolving) {
    resolveBoss(b, '수면 과학자의 수호자가 멈췄습니다.');
  }
}

function completeStage() {
  if (game.phase !== 'playing') return;
  game.completed.push(game.stageIndex);
  const stage = currentStage();
  if (Array.isArray(stage?.teaches)) {
    stage.teaches.forEach((skill) => {
      campaign.skills.add(skill);
      game.learnedSkills.add(skill);
    });
  }
  campaign.unlocked = Math.max(campaign.unlocked, Math.min(STAGES.length - 1, game.stageIndex + 1));
  saveCampaignProgress();
  if (game.stageIndex < STAGES.length - 1) {
    const completedStageIndex = game.stageIndex;
    game.stageIndex += 1;
    const storyBeat = STORY_BEATS[completedStageIndex];
    if (storyBeat) showStoryBeat(storyBeat);
    else showStageIntro();
  } else showChapterEnd();
}

function disconnect() {
  if (game.phase !== 'playing') return;
  game.phase = 'failed';
  endTag.textContent = 'DREAM LINK LOST';
  endTitle.textContent = '꿈과의 연결이 끊어졌어.';
  endCopy.textContent = '상상력이 모두 사라지자 하린의 악몽이 화면을 덮었습니다. 기술을 쓴 뒤 잠시 쉬어 게이지를 회복하고, 보스전에서는 꼭 필요한 순간에만 시간을 멈추세요.';
  restartButton.innerHTML = '이 스테이지 다시 연결 <span>↻</span>';
  endScreen.classList.remove('hidden');
}

function showChapterEnd() {
  game.phase = 'chapter-complete';
  bossHud.classList.add('hidden');
  endTag.textContent = 'DREAMS RETURNED · PAGE 02 COMPLETE';
  endTitle.textContent = '행복은 빼앗아 지킬 수 없어.';
  endCopy.innerHTML = '수면 과학자의 거대한 꿈이 멈추자, 세 친구에게서 빼앗긴 기억과 감정이 모두 돌아갑니다. 딸은 자신을 위해 친구들의 행복이 희생됐다는 진실을 마주하고, 아버지의 손을 잡습니다. 완벽한 꿈은 사라지지만, 둘은 처음으로 현실의 슬픔과 내일을 함께 받아들이기로 합니다.';
  restartButton.innerHTML = '처음부터 다시 보기 <span>↻</span>';
  endScreen.classList.remove('hidden');
}

function showFinalTruth() {
  game.phase = 'truth';
  endTag.textContent = 'EPILOGUE · A NEW DREAM';
  endTitle.textContent = '새로운 기억은 함께 만들 수 있어.';
  endCopy.innerHTML = '연구실의 기록에는 딸이 사고 뒤 의식을 되찾지 못했다는 사실과, 아버지가 꿈을 훔치기 시작한 이유가 남아 있습니다. 딸은 친구들의 행복을 돌려달라고 선택하고, 아버지는 마침내 현실의 슬픔을 받아들입니다. 마지막 장면에서 아이들은 꿈을 빼앗기지 않은 채 새 기억을 만들기 위해 딸의 곁에 앉습니다.';
  restartButton.innerHTML = '첫 장부터 다시 하기 <span>↻</span>';
  endScreen.classList.remove('hidden');
}

function updateHud() {
  const stage = currentStage() || STAGES[0];
  stageIndexEl.textContent = `${stagePage() === 2 ? 'PAGE 02 · ' : ''}STAGE ${String(game.stageIndex + 1).padStart(2, '0')} / ${String(totalStages()).padStart(2, '0')}`;
  stageNameEl.textContent = stage.name;
  objectiveEl.textContent = stage.objective;
  const value = Math.ceil(game.imagination ?? 100);
  imaginationValueEl.textContent = value;
  imaginationFill.style.width = `${value}%`;
  imaginationStatus.textContent = value <= 20 ? '연결이 흐려지고 있어요. 기술을 멈추세요.' : '상상력은 사용하지 않으면 회복됩니다.';
  canvas.classList.toggle('connection-weak', value <= 35 && value > 10);
  canvas.classList.toggle('connection-critical', value <= 10);
  if (game.boss) {
    bossNameEl.textContent = game.boss.name;
    const active = game.boss.activePads || 0;
    if (game.boss.mode === 'calm') {
      bossFill.style.width = `${game.boss.calmProgress / game.boss.calmDuration * 100}%`;
      bossHealthEl.textContent = `안심의 순간 ${game.boss.calmProgress.toFixed(1)} / ${game.boss.calmDuration.toFixed(1)}초`;
    } else if (game.boss.mode === 'resonance' && game.boss.activePads < game.boss.memoryPads.length) {
      bossFill.style.width = `${game.boss.activePads / Math.max(1, game.boss.memoryPads.length) * 100}%`;
      bossHealthEl.textContent = `화음 앵커 ${game.boss.activePads} / ${game.boss.memoryPads.length}`;
    } else if (game.boss.mode === 'resonance') {
      bossFill.style.width = `${game.boss.resonanceProgress / Math.max(1, game.boss.resonanceGates.length) * 100}%`;
      bossHealthEl.textContent = `되찾은 음 ${game.boss.resonanceProgress} / ${game.boss.resonanceGates.length}`;
    } else if (game.boss.mode === 'chase' && game.boss.echoHits < game.boss.requiredEchoHits) {
      bossFill.style.width = `${game.boss.echoHits / game.boss.requiredEchoHits * 100}%`;
      bossHealthEl.textContent = `바람 유인 ${game.boss.echoHits} / ${game.boss.requiredEchoHits}`;
    } else if (game.boss.mode === 'chase') {
      bossFill.style.width = `${game.boss.chaseProgress / Math.max(1, game.boss.windGates.length) * 100}%`;
      bossHealthEl.textContent = `질주 돌파 ${game.boss.chaseProgress} / ${game.boss.windGates.length}`;
    } else if (game.boss.mode === 'mirror') {
      bossFill.style.width = `${game.boss.mirrorProgress / Math.max(1, game.boss.mirrorGates.length) * 100}%`;
      bossHealthEl.textContent = `거울 균열 ${game.boss.mirrorProgress} / ${game.boss.mirrorGates.length}`;
    } else if (game.boss.attackUnlocked) {
      bossFill.style.width = `${Math.max(0, game.boss.hp) / Math.max(1, game.boss.maxHp) * 100}%`;
      bossHealthEl.textContent = `공격 단계 ${game.boss.phase} · HP ${Math.max(0, game.boss.hp)} / ${game.boss.maxHp}`;
    } else {
      bossFill.style.width = `${game.boss.finalCharge / game.boss.finalChargeNeeded * 100}%`;
      bossHealthEl.textContent = `공명 해제 ${game.boss.finalCharge.toFixed(1)} / ${game.boss.finalChargeNeeded.toFixed(1)}초`;
    }
  }
  const techniques = activeTechniques();
  ruleStates.bridge.textContent = techniques.bridge ? 'HOLDING · DRAIN 16 / SEC' : 'HOLD 1 · DRAIN 16 / SEC';
  ruleStates.gravity.textContent = techniques.gravity ? 'HOLDING · DRAIN 28 / SEC' : 'HOLD 2 · DRAIN 28 / SEC';
  ruleStates.time.textContent = techniques.time ? 'HOLDING · DRAIN 28 / SEC' : 'HOLD SHIFT · DRAIN 28 / SEC';
  if (ruleStates.resonance) ruleStates.resonance.textContent = techniques.resonance ? 'HOLDING · DRAIN 14 / SEC' : 'HOLD V · DRAIN 14 / SEC';
  if (ruleStates.dash) ruleStates.dash.textContent = game.dashCooldown > 0 ? `COOLDOWN ${game.dashCooldown.toFixed(1)}s` : 'HOLD X · DASH FORWARD';
  ruleCards.forEach((card) => {
    const rule = card.dataset.rule;
    const active = Boolean(techniques[rule]);
    card.classList.toggle('active', active || (rule === 'dash' && game.dashCooldown > 0));
    card.classList.toggle('locked', !hasSkill(rule));
  });
  updateMemoryLoopUI();
}

function updateMemoryLoopUI() {
  echoCards.forEach((card, index) => {
    const echo = game.echoes?.[index];
    card.classList.toggle('found', Boolean(echo));
    card.querySelector('small').textContent = !echo ? 'EMPTY' : echo.holding ? 'HOLDING A MEMORY' : 'REPLAYING';
  });
  const boss = game.boss;
  if (game.recording) {
    memoryStatus.textContent = `기억 기록 중 · ${game.recording.duration.toFixed(1)}초 · C로 되감고, Backspace/Delete로 취소할 수 있습니다.`;
  } else if (boss) {
    const active = boss.activePads || 0;
    if (boss.mode === 'calm') {
      memoryStatus.textContent = active < boss.memoryPads.length
        ? `행복한 기억 ${active} / ${boss.memoryPads.length} · 기억의 나 둘과 현재의 나를 세 빛에 맞추세요.`
        : `안심의 순간 ${boss.calmProgress.toFixed(1)} / ${boss.calmDuration.toFixed(1)}초 · 마지막 빛 위에서 Shift를 유지하세요.`;
    } else if (boss.mode === 'resonance') {
      memoryStatus.textContent = active < boss.memoryPads.length
        ? `화음 앵커 ${active} / ${boss.memoryPads.length} · 두 기억의 나를 앵커에 남기세요.`
        : `되찾은 음 ${boss.resonanceProgress} / ${boss.resonanceGates.length} · V를 유지한 채 다음 음을 통과하세요.`;
    } else if (boss.mode === 'chase' && boss.echoHits < boss.requiredEchoHits) {
      memoryStatus.textContent = `바람 유인 ${boss.echoHits} / ${boss.requiredEchoHits} · 기억의 나를 남기면 검은 연의 돌풍이 과거의 나를 따라갑니다. X로 피하세요.`;
    } else if (boss.mode === 'chase') {
      memoryStatus.textContent = `바람 고리 ${boss.chaseProgress} / ${boss.windGates.length} · 다음 고리의 높이에 맞춰 X로 질주하세요.`;
    } else if (boss.mode === 'mirror') {
      memoryStatus.textContent = `거울 균열 ${boss.mirrorProgress} / ${boss.mirrorGates.length} · V로 균열을 드러낸 뒤 X 질주로 다음 균열을 통과하세요.`;
    } else if (boss.attackUnlocked) {
      memoryStatus.textContent = `공격 단계 · Z로 수면 과학자의 체력을 모두 깎으세요.`;
    } else {
      memoryStatus.textContent = active < boss.memoryPads.length
        ? `봉인 위치 ${active} / ${boss.memoryPads.length} · 기억의 나 둘과 현재의 나를 세 봉인에 맞추세요.`
        : `공명 해제 ${boss.finalCharge.toFixed(1)} / ${boss.finalChargeNeeded.toFixed(1)}초 · V를 유지해 꿈 에너지를 되돌리세요.`;
    }
  } else {
    const active = activeMemoryPads(game.memoryPads || []);
    const goal = game.echoGoal || 0;
    memoryStatus.textContent = goal ? `기억 발판 ${active} / ${goal} · C를 눌러 과거의 나를 남기세요.` : 'C로 이동을 기록하면, 다음 스테이지에서 과거의 나와 협동할 수 있습니다.';
  }
}

function drawBackground(boss = false, bossLabel = '') {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, boss ? '#26112c' : '#0a1231');
  g.addColorStop(.53, boss ? '#190d25' : '#0a0e20');
  g.addColorStop(1, boss ? '#300c25' : '#160d29');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = boss ? .2 : .32; ctx.strokeStyle = boss ? '#a03d70' : '#334878'; ctx.lineWidth = 1;
  for (let x = -80; x < W + 100; x += 48) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 260, 0); ctx.stroke(); }
  for (let y = 40; y < H; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.fillStyle = 'rgba(226, 239, 255, .72)';
  for (let i = 0; i < 38; i += 1) { const x = (i * 137 + 37) % W; const y = 22 + ((i * 71) % 250); ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1); }
  ctx.fillStyle = boss ? '#ff9db1' : '#a7c6ff'; ctx.font = '700 10px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(boss ? (bossLabel || 'DREAM FEAR · THE EMPTY STAGE') : "HARIN'S DREAM · THE MOONLIGHT FAIR", 25, 31); ctx.restore();
}

function drawPlatform(item) {
  if (item.wall) {
    if (item.persistentWall) {
      const wallGradient = ctx.createLinearGradient(item.x, item.y, item.x + item.w, item.y);
      wallGradient.addColorStop(0, '#2b114d');
      wallGradient.addColorStop(.5, '#67235d');
      wallGradient.addColorStop(1, '#2b114d');
      ctx.save();
      ctx.shadowBlur = 30; ctx.shadowColor = '#ff5f9b';
      ctx.fillStyle = wallGradient; ctx.fillRect(item.x, item.y, item.w, item.h);
      ctx.shadowBlur = 0; ctx.strokeStyle = '#ffd36e'; ctx.lineWidth = 4; ctx.strokeRect(item.x + 2, item.y + 2, item.w - 4, item.h - 4);
      ctx.strokeStyle = '#ff8eb8'; ctx.lineWidth = 2; ctx.strokeRect(item.x + 9, item.y + 9, item.w - 18, item.h - 18);
      for (let y = item.y + 24; y < item.y + item.h - 12; y += 30) {
        ctx.fillStyle = y % 60 === item.y % 60 ? '#ff7eae' : '#7f3c83';
        ctx.fillRect(item.x + 16, y, item.w - 32, 12);
      }
      ctx.fillStyle = '#fff0a2';
      ctx.beginPath(); ctx.moveTo(item.x + item.w / 2, item.y + 30); ctx.lineTo(item.x + 22, item.y + 64); ctx.lineTo(item.x + item.w - 22, item.y + 64); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a1a51'; ctx.font = '900 22px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText('↑', item.x + item.w / 2, item.y + 57);
      ctx.translate(item.x + item.w / 2, item.y + item.h / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#fff5c2'; ctx.font = '900 12px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText('GRAVITY WALL', 0, -7);
      ctx.fillStyle = '#ffcf74'; ctx.font = '800 9px ui-monospace, monospace'; ctx.fillText('HOLD 2 · RISE ABOVE', 0, 11);
      ctx.restore();
      return;
    }
    ctx.fillStyle = '#202956'; ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = '#6b70bf'; ctx.fillRect(item.x + 8, item.y, 4, item.h);
    ctx.strokeStyle = 'rgba(161,177,255,.4)'; ctx.strokeRect(item.x + .5, item.y + .5, item.w - 1, item.h - 1);
    ctx.save(); ctx.translate(item.x + 47, item.y + 190); ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#a2afe1'; ctx.font = '700 10px ui-monospace, monospace'; ctx.fillText('DREAM EXTRACTOR', -52, 0); ctx.restore();
  } else {
    ctx.fillStyle = '#202a4d'; ctx.fillRect(item.x, item.y, item.w, item.h); ctx.fillStyle = '#687dd8'; ctx.fillRect(item.x, item.y, item.w, 4);
    ctx.fillStyle = 'rgba(147,174,255,.13)'; for (let x = item.x + 12; x < item.x + item.w; x += 20) ctx.fillRect(x, item.y + 13, 8, 3);
  }
}

function drawBridge(bridge) {
  ctx.save(); ctx.translate(bridge.x + bridge.w / 2, bridge.y + bridge.h / 2); ctx.shadowBlur = game.bridge ? 24 : 10; ctx.shadowColor = game.bridge ? '#61faff' : '#ff6d90';
  ctx.fillStyle = game.bridge ? '#2b8da7' : 'rgba(196,54,106,.34)'; ctx.fillRect(-bridge.w / 2, -bridge.h / 2, bridge.w, bridge.h);
  ctx.strokeStyle = game.bridge ? '#8fffff' : '#ff7895'; ctx.lineWidth = 2; ctx.strokeRect(-bridge.w / 2 + 1, -bridge.h / 2 + 1, bridge.w - 2, bridge.h - 2);
  ctx.fillStyle = game.bridge ? '#d2ffff' : '#ffbbc8'; ctx.font = '800 9px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText(game.bridge ? 'MEMORY PATH' : 'NIGHTMARE ECHO', 0, 4); ctx.restore();
}

function drawWatcher(watcher, frozen, resolved = false) {
  const fill = resolved ? '#315e69' : frozen ? '#6e7893' : '#c73a64';
  const glow = resolved ? '#9effea' : frozen ? '#9ea9c6' : '#ff4e78';
  ctx.save(); ctx.translate(watcher.x + watcher.w / 2, watcher.y + watcher.h / 2); ctx.shadowBlur = resolved ? 14 : frozen ? 12 : 25; ctx.shadowColor = glow; ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe7ee'; ctx.fillRect(-8, -2, 16, 4); ctx.fillStyle = resolved ? '#9effea' : '#fffbfd'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.fillStyle = resolved ? '#aaffed' : frozen ? '#aebbd1' : '#ff92aa'; ctx.font = '700 8px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText(resolved ? 'MEMORY LOOP COMPLETE' : frozen ? 'DREAM PAUSED' : 'EXTRACTOR EYE', watcher.x + watcher.w / 2, watcher.y - 9);
}

function drawExit() {
  const x = game.exit.x, y = game.exit.y;
  ctx.save(); ctx.shadowBlur = 27; ctx.shadowColor = '#55f6ff'; ctx.fillStyle = '#153d57'; ctx.fillRect(x, y, 36, 82); ctx.fillStyle = '#4af3fb'; ctx.fillRect(x + 4, y + 5, 28, 73); ctx.fillStyle = '#0d2045'; ctx.fillRect(x + 8, y + 10, 20, 63); ctx.fillStyle = '#ffe88c'; ctx.beginPath(); ctx.arc(x + 18, y + 37, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d7ffff'; ctx.font = '800 8px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText(game.exit.label, x + 18, y - 10); ctx.restore();
}

function drawFallZone(zone) {
  ctx.save();
  const gradient = ctx.createLinearGradient(zone.x, zone.y, zone.x, zone.y + zone.h);
  gradient.addColorStop(0, 'rgba(7, 9, 20, .2)');
  gradient.addColorStop(1, 'rgba(2, 4, 10, .9)');
  ctx.fillStyle = gradient;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  ctx.strokeStyle = 'rgba(120, 145, 220, .08)';
  ctx.strokeRect(zone.x + .5, zone.y + .5, zone.w - 1, zone.h - 1);
  ctx.restore();
}

function drawMemoryFragment(fragment) {
  const styles = {
    star: { symbol: '✦', color: '#ffe37d', label: '별빛 기억' },
    carousel: { symbol: '◌', color: '#9effea', label: '회전목마 기억' },
    laugh: { symbol: '☺', color: '#ffb5d7', label: '웃음 기억' },
  };
  const style = styles[fragment.name];
  const pulse = 1 + Math.sin(game.elapsed * 4 + fragment.x) * .08;
  ctx.save();
  ctx.translate(fragment.x + fragment.w / 2, fragment.y + fragment.h / 2);
  ctx.scale(pulse, pulse);
  ctx.shadowBlur = 20; ctx.shadowColor = style.color;
  ctx.fillStyle = 'rgba(17, 25, 59, .88)'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = style.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = style.color; ctx.font = '800 18px "Segoe UI Symbol", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(style.symbol, 0, 6);
  ctx.restore();
  ctx.fillStyle = style.color; ctx.font = '700 9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(style.label, fragment.x + fragment.w / 2, fragment.y - 11);
}

function drawMemoryPad(pad, active, index, role = 'normal') {
  const colors = ['#ffe37d', '#9effea', '#ffb5d7'];
  const roleStyles = {
    normal: { fill: 'rgba(21, 26, 59, .8)', icon: '○' },
    echo: { label: '기억', badge: '기억', badgeFill: 'rgba(30, 74, 88, .9)', badgeStroke: '#9effea', fill: 'rgba(18, 57, 72, .9)', icon: '✦' },
    present: { label: '현재', badge: '현재', badgeFill: 'rgba(102, 73, 38, .95)', badgeStroke: '#ffe37d', fill: 'rgba(76, 56, 18, .9)', icon: '◆' },
    truth: { label: '공명', badge: '진실', badgeFill: 'rgba(106, 67, 20, .96)', badgeStroke: '#ffd56d', fill: 'rgba(95, 55, 9, .92)', icon: '✦' },
  };
  const style = roleStyles[role] || roleStyles.normal;
  const color = colors[index % colors.length];
  const radius = Math.max(pad.w, pad.h) / 2;
  ctx.save();
  ctx.translate(pad.x + pad.w / 2, pad.y + pad.h / 2);
  ctx.shadowBlur = active ? 27 : 9;
  ctx.shadowColor = role === 'present' ? '#ffe37d' : color;
  ctx.fillStyle = active ? 'rgba(255, 244, 181, .28)' : style.fill;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = role === 'present' ? '#ffe37d' : color;
  ctx.lineWidth = active ? 3 : role === 'present' ? 2.2 : 1.5;
  ctx.beginPath(); ctx.arc(0, 0, radius - 2, 0, Math.PI * 2); ctx.stroke();
  if (role === 'present') {
    ctx.strokeStyle = 'rgba(255, 231, 140, .34)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, radius + 6, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = role === 'present' ? '#fff4c4' : color;
  ctx.font = '800 16px "Segoe UI Symbol", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(active ? '♥' : style.icon, 0, 6);
  ctx.restore();
  if (role !== 'normal') {
    ctx.save();
    ctx.fillStyle = style.badgeFill;
    ctx.strokeStyle = style.badgeStroke;
    ctx.lineWidth = 1;
    const badgeWidth = 34;
    const badgeHeight = 15;
    const badgeX = pad.x + pad.w / 2 - badgeWidth / 2;
    const badgeY = pad.y - 25;
    ctx.beginPath();
    ctx.moveTo(badgeX + 5, badgeY);
    ctx.lineTo(badgeX + badgeWidth - 5, badgeY);
    ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + 5);
    ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - 5);
    ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - 5, badgeY + badgeHeight);
    ctx.lineTo(badgeX + 5, badgeY + badgeHeight);
    ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - 5);
    ctx.lineTo(badgeX, badgeY + 5);
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + 5, badgeY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = role === 'present' ? '#fff4c4' : role === 'truth' ? '#ffe48b' : '#b9ffef';
    ctx.font = '700 8px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(style.badge, pad.x + pad.w / 2, badgeY + badgeHeight / 2 + 0.5);
    ctx.restore();
  } else {
    ctx.fillStyle = active ? color : '#a9b6d4'; ctx.font = '700 9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(pad.label, pad.x + pad.w / 2, pad.y - 10);
  }
}

function drawEcho(echo, index) {
  const hues = ['#9effea', '#9eb9ff', '#ffb5d7'];
  ctx.save();
  ctx.globalAlpha = echo.holding ? .86 : .54;
  ctx.shadowBlur = echo.flash > 0 ? 34 : 18; ctx.shadowColor = echo.flash > 0 ? '#ffffff' : hues[index % hues.length];
  ctx.fillStyle = echo.flash > 0 ? '#ffffff' : hues[index % hues.length];
  ctx.fillRect(echo.x, echo.y, echo.w, echo.h);
  ctx.fillStyle = 'rgba(12, 21, 57, .88)'; ctx.fillRect(echo.x + 5, echo.y + 8, echo.w - 10, 6);
  ctx.strokeStyle = '#e9ffff'; ctx.lineWidth = 1; ctx.strokeRect(echo.x + .5, echo.y + .5, echo.w - 1, echo.h - 1);
  ctx.restore();
}

function drawChild(player, bossMode = false) {
  const { x, y, w, h } = player;
  ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = '#ffe57d'; ctx.fillStyle = '#f5b94e'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#59405e'; ctx.fillRect(x + 3, y + 4, w - 6, 11); ctx.fillStyle = '#ffd4b4'; ctx.fillRect(x + 5, y + 8, w - 10, 8); ctx.fillStyle = '#2c3c66'; ctx.fillRect(x + (player.facing > 0 ? w - 12 : 6), y + 9, 3, 3); ctx.fillStyle = '#e66c75'; ctx.fillRect(x + 4, y + h - 13, w - 8, 8); ctx.fillStyle = '#fff0a6'; ctx.beginPath(); ctx.arc(x + w / 2, y - 4, bossMode ? 5 : 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawPuzzle() {
  drawBackground(false);
  const techniques = activeTechniques();
  const gateOpen = (game.echoGoal === 0 || activeMemoryPads(game.memoryPads) >= game.echoGoal) && (game.layout !== 'watcher' || game.watcherResolved);
  (game.fallZones || []).forEach(drawFallZone);
  game.platforms.forEach((platform) => {
    const hidden = platform.hidden && !techniques.resonance;
    if (platform.wall && gateOpen && game.layout === 'carousel' && !platform.persistentWall) {
      return;
    } else if (platform.wall && gateOpen) {
      ctx.save(); ctx.globalAlpha = .16; drawPlatform(platform); ctx.restore();
    } else if (hidden) {
      ctx.save(); ctx.globalAlpha = .14; drawPlatform(platform); ctx.restore();
    } else drawPlatform(platform);
  });
  if (game.layout === 'wall') drawBridge(getBridge());
  if (game.layout === 'watcher') drawWatcher(getWatcher(), frozenTime(), game.watcherResolved);
  game.memoryPads.forEach((pad, index) => {
    // 공명이 꺼져 있을 때는 9스테이지의 기억 발판도 함께 감춘다.
    if (!pad.hidden || techniques.resonance) drawMemoryPad(pad, activeMemoryPads([pad]) > 0, index);
  });
  game.echoes.forEach(drawEcho);
  if (game.exit) drawExit();
  if (game.player) drawChild(game.player);
  if (game.phase === 'playing') {
    ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#b6c5e6'; ctx.fillText(currentStage().hint, W / 2, H - 22);
  }
}

function drawWindGate(gate, index, active, cleared) {
  ctx.save();
  ctx.translate(gate.x + gate.w / 2, gate.y + gate.h / 2);
  ctx.globalAlpha = cleared ? .22 : active ? 1 : .32;
  ctx.strokeStyle = cleared ? '#9effea' : active ? '#f4fdff' : '#6a95b4';
  ctx.shadowBlur = active ? 24 : 0;
  ctx.shadowColor = '#a9f6ff';
  ctx.lineWidth = active ? 4 : 2;
  ctx.beginPath(); ctx.ellipse(0, 0, gate.w / 2, gate.h / 2, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(0, 0, gate.w / 2 + 9, gate.h / 2 + 9, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = cleared ? '#8bc6c1' : active ? '#d7fbff' : '#7391ad'; ctx.font = '800 9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(gate.label, gate.x + gate.w / 2, gate.y - 12);
}

function drawDreamGate(gate, active, cleared, kind = 'resonance', revealed = true) {
  const color = kind === 'mirror' ? '#ffb5df' : '#9effea';
  ctx.save();
  ctx.translate(gate.x + gate.w / 2, gate.y + gate.h / 2);
  ctx.globalAlpha = cleared ? .2 : revealed ? active ? 1 : .5 : .08;
  ctx.shadowBlur = active ? 26 : 8; ctx.shadowColor = color;
  ctx.strokeStyle = color; ctx.lineWidth = active ? 4 : 2;
  if (kind === 'mirror') {
    ctx.rotate(Math.PI / 4); ctx.strokeRect(-gate.w / 2, -gate.h / 2, gate.w, gate.h);
    ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(4, -3); ctx.lineTo(-8, 7); ctx.lineTo(17, 22); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0, 0, gate.w / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, gate.w / 2 + 9, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = cleared ? '#8bc6c1' : active ? '#f4fff9' : '#a9c8c7'; ctx.font = '800 9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(gate.label, gate.x + gate.w / 2, gate.y - 12);
}

function drawBoss() {
  ensureBossStage();
  const b = game.boss;
  const bossBackdrop = b.visual === 'wind' ? "HANEUL'S FEAR · THE ENDLESS HEADWIND"
    : b.visual === 'choir' ? "YUNA'S FEAR · THE SILENT CHOIR"
      : b.visual === 'mirror' ? "DAUGHTER'S DREAM · PERFECT MIRROR"
        : b.mode === 'final' ? 'THE SCIENTIST · DREAM LAB' : "HARIN'S FEAR · THE EMPTY STAGE";
  drawBackground(true, bossBackdrop);
  ctx.save(); ctx.fillStyle = 'rgba(255, 137, 176, .12)'; ctx.beginPath(); ctx.arc(b.x + 80, b.y + 102, 150, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const scale = b.mode === 'final'
    ? (b.attackUnlocked ? 1.14 + (b.phase - 1) * .13 : 1.14)
    : b.phase === 1 ? 1.18 : b.phase === 2 ? .9 : .62;
  const windFear = b.visual === 'wind';
  const choirFear = b.visual === 'choir';
  const mirrorFear = b.visual === 'mirror';
  const bossShadow = b.mode === 'final' ? '#7be9ff' : windFear ? '#9cdbff' : choirFear ? '#9effd7' : mirrorFear ? '#ffb5df' : '#ff4d7c';
  const bossBody = b.mode === 'final' ? '#19475e' : windFear ? '#173857' : choirFear ? '#174c4c' : mirrorFear ? '#5f346b' : '#6e1745';
  const bossFace = b.mode === 'final' ? '#8adcf2' : windFear ? '#b4ecff' : choirFear ? '#bfffe8' : mirrorFear ? '#ffd5eb' : '#f6b2ca';
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(scale, scale); ctx.shadowBlur = 34; ctx.shadowColor = bossShadow; ctx.fillStyle = b.flash > 0 ? '#ffe4ef' : bossBody;
  if (windFear) { ctx.rotate(.78); ctx.fillRect(-62, -62, 124, 124); ctx.strokeStyle = '#d0f7ff'; ctx.lineWidth = 4; ctx.strokeRect(-62, -62, 124, 124); ctx.rotate(-.78); }
  else if (mirrorFear) { ctx.rotate(Math.PI / 4); ctx.fillRect(-66, -66, 132, 132); ctx.strokeStyle = '#ffe3f4'; ctx.lineWidth = 4; ctx.strokeRect(-66, -66, 132, 132); ctx.rotate(-Math.PI / 4); }
  else { ctx.beginPath(); ctx.ellipse(0, 0, 72, 92, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = bossFace; ctx.beginPath(); ctx.arc(-27, -12, 24, 0, Math.PI * 2); ctx.arc(27, -12, 24, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = b.mode === 'final' ? '#0f2432' : windFear ? '#102030' : '#1f1027'; ctx.fillRect(-41, -18, 22, 8); ctx.fillRect(19, -18, 22, 8); ctx.strokeStyle = windFear ? '#d0f7ff' : choirFear ? '#bfffe8' : mirrorFear ? '#ffe3f4' : b.mode === 'final' ? '#8cf0ff' : '#ffc4d9'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 29, 23, 0, Math.PI); ctx.stroke(); ctx.fillStyle = '#f8df77'; ctx.beginPath(); ctx.arc(0, -80, 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.fillStyle = b.mode === 'final' || windFear || choirFear ? '#aeefff' : mirrorFear ? '#ffe0f2' : '#ffc4d5'; ctx.font = '800 12px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.name, b.x + b.w / 2, b.y - 17);
  const bossPads = b.mode === 'chase' ? b.decoyPads : b.mode === 'resonance' || b.mode === 'calm' || b.mode === 'final' ? b.memoryPads : [];
  const presentCanFillPad = b.mode === 'calm' || b.mode === 'final';
  bossPads.forEach((pad, index) => {
    const role = b.mode === 'chase' || index < 2 ? 'echo' : 'present';
    drawMemoryPad(pad, activeMemoryPads([pad], presentCanFillPad) > 0, index, b.mode === 'final' && index < 2 ? 'truth' : role);
  });
  if (b.mode === 'chase') b.windGates.forEach((gate, index) => drawWindGate(gate, index, index === b.chaseProgress, index < b.chaseProgress));
  if (b.mode === 'resonance') b.resonanceGates.forEach((gate, index) => drawDreamGate(gate, index === b.resonanceProgress, index < b.resonanceProgress, 'resonance', activeTechniques().resonance));
  if (b.mode === 'mirror') b.mirrorGates.forEach((gate, index) => drawDreamGate(gate, index === b.mirrorProgress, index < b.mirrorProgress, 'mirror', activeTechniques().resonance));
  if (b.mode === 'calm') {
    ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.strokeStyle = '#ffe37e'; ctx.lineWidth = 3; ctx.globalAlpha = .4 + Math.sin(game.elapsed * 5) * .12;
    ctx.beginPath(); ctx.arc(0, 12, 108, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 12, 128, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#ffe9a1'; ctx.font = '800 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('NO ATTACK · STAY WITH HARIN', W / 2, 54);
  }
  game.echoes.forEach(drawEcho);
  for (const shot of game.dreamShots) { ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = '#ffe57d'; ctx.fillStyle = '#fff1a4'; ctx.fillRect(shot.x, shot.y, shot.w, shot.h); ctx.restore(); }
  for (const shot of game.nightmareShots) {
    const shotColor = shot.kind === 'wind' ? '#a6efff'
      : shot.kind === 'note' ? '#c7a3ff'
        : shot.kind === 'shard' ? '#ffb5df'
          : shot.kind === 'memory' ? '#7be9ff' : '#ff5a83';
    ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = shotColor; ctx.fillStyle = frozenTime() ? '#9e9ab5' : shotColor;
    ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  if (b.memoryShield > 0) {
    const p = game.player;
    ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.strokeStyle = '#9effea'; ctx.lineWidth = 3; ctx.shadowBlur = 18; ctx.shadowColor = '#9effea'; ctx.beginPath(); ctx.arc(0, 0, 38 + Math.sin(game.elapsed * 8) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  drawChild(game.player, true);
  ctx.fillStyle = '#f7dfe7'; ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(currentStage().hint, W / 2, H - 22);
}

function update(dt) {
  if (game.phase !== 'playing') return;
  if (currentStage().type === 'boss') updateBoss(dt); else updatePuzzle(dt);
  updateHud();
}

function draw() {
  // 인트로/자동 전환 중에도 보스 장면을 그려 전환 상태가 멈춘 것처럼 보이지 않게 한다.
  if (currentStage()?.type === 'boss') drawBoss(); else drawPuzzle();
}

function loop(time) {
  const dt = Math.min((time - lastFrame) / 1000 || 0, .035);
  lastFrame = time; update(dt); draw(); pressed.clear(); requestAnimationFrame(loop);
}

startButton.addEventListener('click', () => {
  if (game.phase === 'story') continueStoryBeat();
  else startStage();
});
resumeButton.addEventListener('click', closeStageMenu);
restartButton.addEventListener('click', () => {
  if (game.phase === 'failed') startStage();
  else if (game.phase === 'chapter-complete') showFinalTruth();
  else if (game.phase === 'truth') newGame();
});
ruleCards.forEach((card) => {
  const keyForRule = { bridge: 'Digit1', gravity: 'Digit2', time: 'ShiftLeft', resonance: 'KeyV', dash: 'KeyX' }[card.dataset.rule];
  card.addEventListener('pointerdown', () => {
    if (hasSkill(card.dataset.rule)) {
      if (card.dataset.rule === 'dash') triggerDash();
      else keys.add(keyForRule);
    } else if (isSkillBlocked(card.dataset.rule)) say('이 구역의 꿈 규칙 때문에 이 상상력 기술은 사용할 수 없습니다.');
    else say('이 기술은 다음 스테이지에서 배웁니다.');
    updateHud();
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((eventName) => card.addEventListener(eventName, () => { if (keyForRule) keys.delete(keyForRule); updateHud(); }));
});
window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape') {
    if (game.phase === 'playing') openStageMenu();
    else if (game.phase === 'menu') closeStageMenu();
    return;
  }
  if (!keys.has(event.code)) pressed.add(event.code);
  keys.add(event.code);
  const skillByKey = { Digit1: 'bridge', Digit2: 'gravity', ShiftLeft: 'time', ShiftRight: 'time', KeyV: 'resonance', KeyX: 'dash' };
  const requestedSkill = skillByKey[event.code];
  if (!event.repeat && requestedSkill && isSkillBlocked(requestedSkill)) say(currentStage().blockedHint || '이 구역의 꿈 규칙 때문에 이 상상력 기술은 사용할 수 없습니다.');
  if (event.code === 'Digit3' && !event.repeat) say(hasSkill('time') ? '1·2·Shift는 누르고 있는 동안 상상력을 계속 소모합니다.' : '이 기술은 다음 스테이지에서 배웁니다.');
  if (!event.repeat && event.code === 'KeyC') toggleMemoryRecording();
  if (!event.repeat && event.code === 'KeyZ') triggerBossShot();
  if (!event.repeat && event.code === 'KeyX') triggerDash();
  if (!event.repeat && (event.code === 'Backspace' || event.code === 'Delete')) removeLatestEcho();
  if (event.code === 'Enter' && game.phase === 'story') continueStoryBeat();
  else if (event.code === 'Enter' && game.phase === 'intro') startStage();
  updateHud();
});
window.addEventListener('keyup', (event) => { keys.delete(event.code); updateHud(); });
window.addEventListener('blur', () => { keys.clear(); updateHud(); });

newGame();
requestAnimationFrame(loop);
