const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const PLAYER_IDLE_SPRITE_PATH = 'assets/player/character-idle.png';
const PLAYER_RUN_SPRITE_PATHS = Object.freeze(
  Array.from({ length: 12 }, (_, index) => `assets/player/run/frame-${String(index + 1).padStart(2, '0')}.png`),
);
const PLAYER_JUMP_SPRITE_PATHS = Object.freeze(
  Array.from({ length: 12 }, (_, index) => `assets/player/jump/frame-${String(index + 1).padStart(2, '0')}.png`),
);
const HARIN_BACKGROUND_PATHS = Object.freeze(
  [
    'assets/backgrounds/harin-stage-01-v2.png',
    'assets/backgrounds/harin-stage-02-side-base-v3.png',
    // main의 웃음등 거리 배경은 유지하고, 4스테이지만 탑뷰 회전목마 실험 원화를 사용한다.
    'assets/backgrounds/harin-stage-03.png',
    'assets/backgrounds/harin-stage-04-topdown-carousel-v5.png',
    'assets/backgrounds/harin-stage-05.png',
    'assets/backgrounds/harin-stage-06.png',
  ],
);
const HARIN_STAGE_MUSIC_PATHS = Object.freeze([
  'assets/audio/harin-stage-themes-v12-flute-test/stage-01-harin-theme-loop-soft-flute-v12.wav',
  'assets/audio/harin-stage-themes-v12-flute-test/stage-02-remembered-theme-loop-soft-flute-v12.wav',
  'assets/audio/harin-stage-themes-v11/stage-03-fractured-theme-332-loop-v11.wav',
  'assets/audio/harin-stage-themes-v12-flute-test/stage-04-carousel-theme-waltz-loop-soft-flute-v12.wav',
  'assets/audio/harin-stage-themes-v11/stage-05-darkened-harin-theme-60s-v11.wav',
  'assets/audio/harin-stage-themes-v12-flute-test/stage-06-resolved-harin-theme-loop-soft-flute-v12.wav',
]);
// 원본 음원의 평균 음량을 오디오 자산 단계에서 통일했으므로, 챕터별 임의 보정은 최소화한다.
const CHARACTER_BGM_TRIM = Object.freeze({ harin: .98, yuna: .98, haneul: .98, daughter: .98, scientist: .98 });
const YUNA_BACKGROUND_PATHS = Object.freeze(
  [
    'assets/backgrounds/yuna-stage-07.png',
    'assets/backgrounds/yuna-stage-08.png',
    'assets/backgrounds/yuna-stage-09-v2.png',
    'assets/backgrounds/yuna-stage-10.png',
    'assets/backgrounds/yuna-stage-11.png',
    'assets/backgrounds/yuna-stage-12.png',
  ],
);
const HANEUL_BACKGROUND_PATHS = Object.freeze(
  [
    'assets/backgrounds/haneul-stage-13.png',
    'assets/backgrounds/haneul-stage-14.png',
    // 직립 바람탑은 별도 스프라이트로만 그려, 붕괴 조각 뒤에서 배경 탑이 다시 드러나지 않게 한다.
    'assets/backgrounds/haneul-stage-15-no-pillar-v2.png',
    'assets/backgrounds/haneul-stage-16-v2.png',
    'assets/backgrounds/haneul-stage-17.png',
    'assets/backgrounds/haneul-stage-18.png',
  ],
);
const DAUGHTER_BACKGROUND_PATHS = Object.freeze([
  'assets/backgrounds/daughter-stage-19-perfect-garden-v1.png',
  'assets/backgrounds/daughter-stage-20-fractured-classroom-v1.png',
  'assets/backgrounds/daughter-stage-21-mirror-court-v1.png',
]);
const SCIENTIST_BACKGROUND_PATH = 'assets/backgrounds/scientist-stage-22-dream-lab-v1.png';
const FINAL_CHAPTER_STAGE_MUSIC_PATHS = Object.freeze([
  'assets/audio/daughter-perfect-garden-v1.wav',
  'assets/audio/daughter-fractured-classroom-v1.wav',
  'assets/audio/daughter-mirror-guardian-v1.wav',
  'assets/audio/scientist-true-imagination-final-v1.wav',
]);
// 마지막 일러스트는 보스전의 격정적인 트랙 대신, 하린의 해결 테마를 느린 페이드인으로 사용한다.
// 친구들의 꿈이 돌아왔다는 감정을 먼저 들려 준 뒤, 아버지의 선택을 보여 주기 위한 전용 큐다.
const ENDING_BGM_SOURCE = 'assets/audio/harin-stage-themes-v12-flute-test/stage-06-resolved-harin-theme-loop-soft-flute-v12.wav';
const HANEUL_STAGE_MUSIC_PATHS = Object.freeze([
  'assets/audio/haneul-wind-path-v1.wav',
  'assets/audio/haneul-wind-path-v1.wav',
  'assets/audio/haneul-headwind-cliff-v1.wav',
  'assets/audio/haneul-headwind-cliff-v1.wav',
  'assets/audio/haneul-black-kite-boss-v1.wav',
  'assets/audio/haneul-clear-sky-v1.wav',
]);
const HARIN_STAGE_02_GATE_PATHS = Object.freeze({
  blocked: 'assets/backgrounds/harin-stage-02-wall-ruined-consistent-v2.png',
  open: 'assets/backgrounds/harin-stage-02-wall-restored-side10-clean-dark-outline-alpha-v15.png',
});
const HARIN_STAGE_02_GATE_DRAW = Object.freeze({
  scale: .38,
  roadOverlap: 18,
  // 붕괴·완성 원화가 같은 성문을 기준으로 제작되어, 입구와 기초석의 기준점도 공유한다.
  // 오른쪽 잔해만 아주 조금 남기고 넘친 돌무더기는 잘라 완성 성문보다 밑변이 넓어지지 않게 한다.
  blocked: Object.freeze({ entranceCenterSourceX: 555, splitSourceX: 555, groundSourceY: 1078, sourceRight: 1000 }),
  open: Object.freeze({ entranceCenterSourceX: 555, splitSourceX: 555, groundSourceY: 1072 }),
});
// 중간 복원 일러스트는 완성 성문 위에 겹치는 '기억 마법의 잔상'으로만 사용한다.
// 실제 충돌과 최종 구조는 동일 원화의 블록 조립으로 유지한다.
const HARIN_STAGE_02_MAGIC_FRAME_DRAW = Object.freeze({
  awakening: Object.freeze({ entranceCenterSourceX: 265, splitSourceX: 320, groundSourceY: 1405, scaleX: .223, scaleY: .302 }),
  restoring: Object.freeze({ entranceCenterSourceX: 272, splitSourceX: 320, groundSourceY: 1452, scaleX: .24, scaleY: .294 }),
});
const HARIN_STAGE_02_RESTORATION_SECONDS = 2;
const HARIN_STAGE_02_RESTORATION_COMPLETE = .999;
const HARIN_BACKGROUND_Y_OFFSETS = Object.freeze([40, 0, 0, 0, 0, 0]);
const HARIN_STAGE_02_ROAD_ALIGNMENT = Object.freeze({ sourceY: 718, targetY: 500 });
const FAILURE_ART_PATHS = Object.freeze({
  harin: 'assets/failure/harin-empty-clown-v1.png',
  yuna: 'assets/failure/yuna-silent-choir-v1.png',
  haneul: 'assets/failure/haneul-endless-wind-v1.png',
  daughter: 'assets/failure/daughter-mirror-guardian-v1.png',
  scientist: 'assets/failure/scientist-dream-extractor-v1.png',
  wakeup: 'assets/failure/dream-link-wakeup-v1.png',
});
const YUNA_BGM_PATHS = Object.freeze({
  tide: 'assets/audio/yuna-tide-lullaby-v1.wav',
  glass: 'assets/audio/yuna-glass-choir-v1.wav',
  silent: 'assets/audio/yuna-silent-choir-v1.wav',
  resonance: 'assets/audio/yuna-resonance-run-v1.wav',
});
const PLAYER_RUN_FRAME_DURATIONS = Object.freeze([83, 83, 84, 83, 83, 84, 83, 83, 84, 83, 83, 84]);
const PLAYER_RUN_CYCLE_MS = PLAYER_RUN_FRAME_DURATIONS.reduce((total, duration) => total + duration, 0);
const PLAYER_SPRITE_SIZE = Object.freeze({ width: 48, height: 72, feetY: 70 });
const PLAYER_SPRITE_SOURCE_FACING = -1;
const DASH_VISUAL_DURATION = .24;
const spriteSources = new WeakMap();

function loadSprite(source) {
  const image = new Image();
  // 모든 챕터의 대형 일러스트를 제목 화면에서 한꺼번에 받지 않는다.
  // 실제 꿈에 들어갈 때 해당 챕터의 이미지에만 src를 붙여 첫 접속을 가볍게 만든다.
  spriteSources.set(image, source);
  return image;
}

function ensureSprite(image) {
  if (!image || image.src) return image;
  const source = spriteSources.get(image);
  if (source) image.src = source;
  return image;
}

function ensureSprites(items) {
  items.flat(Infinity).forEach(ensureSprite);
}
const playerSprites = Object.freeze({
  idle: loadSprite(PLAYER_IDLE_SPRITE_PATH),
  run: PLAYER_RUN_SPRITE_PATHS.map(loadSprite),
  jump: PLAYER_JUMP_SPRITE_PATHS.map(loadSprite),
});
const harinBackgrounds = Object.freeze(HARIN_BACKGROUND_PATHS.map(loadSprite));
const yunaBackgrounds = Object.freeze(YUNA_BACKGROUND_PATHS.map(loadSprite));
const haneulBackgrounds = Object.freeze(HANEUL_BACKGROUND_PATHS.map(loadSprite));
const daughterBackgrounds = Object.freeze(DAUGHTER_BACKGROUND_PATHS.map(loadSprite));
const scientistBackground = loadSprite(SCIENTIST_BACKGROUND_PATH);
const harinStage02GateSprites = Object.freeze({
  blocked: loadSprite(HARIN_STAGE_02_GATE_PATHS.blocked),
  open: loadSprite(HARIN_STAGE_02_GATE_PATHS.open),
});
const harinStage02MagicFrames = Object.freeze({
  awakening: loadSprite('assets/backgrounds/harin-stage-02-wall-awakening-memory-v1.png'),
  restoring: loadSprite('assets/backgrounds/harin-stage-02-wall-restoring-memory-v1.png'),
});
const failureArt = Object.freeze(Object.fromEntries(Object.entries(FAILURE_ART_PATHS).map(([key, source]) => [key, loadSprite(source)])));
const bossSprites = Object.freeze({
  harinClown: loadSprite('assets/bosses/harin-laugh-thief-clown-sprite-v1.png'),
  harinClownMini: loadSprite('assets/bosses/harin-laugh-thief-clown-mini-sprite-v1.png'),
  harinLaughterMask: loadSprite('assets/bosses/harin-stage-05-laughter-mask-v1.png'),
  yunaChoir: loadSprite('assets/bosses/yuna-silent-choir-sprite-v1.png'),
  haneulKite: loadSprite('assets/bosses/haneul-black-kite-sprite-v1.png'),
  daughterGuardian: loadSprite('assets/bosses/daughter-perfect-guardian-sprite-v1.png'),
  scientistGuardian: loadSprite('assets/bosses/scientist-dream-guardian-sprite-v1.png'),
  scientistGuardianAwakened: loadSprite('assets/bosses/scientist-dream-guardian-awakened-v1.png'),
});
const platformSprites = Object.freeze({
  harinCarouselPlatform: loadSprite('assets/platforms/harin-carousel-platform-v1.png'),
  harinCarouselWalkway: loadSprite('assets/structures/harin-stage-04-carousel-walkway-v3.png'),
  harinCarouselRingTile: loadSprite('assets/structures/harin-stage-04-carousel-ring-tile-v3.png'),
  harinEchoBridge: loadSprite('assets/platforms/harin-echo-bridge-v1.png'),
  haneulWindLedge: loadSprite('assets/platforms/haneul-wind-ledge-v1.png'),
  yunaResonancePad: loadSprite('assets/platforms/yuna-resonance-pad-v1.png'),
  daughterGarden: loadSprite('assets/platforms/daughter-garden-platform-v1.png'),
  daughterFracturedClassroom: loadSprite('assets/platforms/daughter-fractured-classroom-platform-v1.png'),
});
const carouselLockSprites = Object.freeze({
  star: loadSprite('assets/structures/harin-stage-04-star-lock-v1.png'),
  ribbon: loadSprite('assets/structures/harin-stage-04-ribbon-lock-v1.png'),
});
const carouselStructureSprites = Object.freeze({
  deck: loadSprite('assets/structures/harin-stage-04-carousel-deck-v4.png'),
  pillar: loadSprite('assets/structures/harin-stage-04-carousel-pillar-v4.png'),
  joint: loadSprite('assets/structures/harin-stage-04-carousel-joint-v4.png'),
  horseMedallion: loadSprite('assets/structures/harin-stage-04-carousel-horse-medallion-v4.png'),
  ring: loadSprite('assets/structures/harin-stage-04-carousel-ring-v4.png'),
});
const gateSprites = Object.freeze({
  harin: loadSprite('assets/gates/harin-carousel-gate-v1.png'),
  yuna: loadSprite('assets/gates/yuna-piano-gate-v1.png'),
  haneul: loadSprite('assets/gates/haneul-wind-gate-v1.png'),
  daughter: loadSprite('assets/gates/daughter-mirror-gate-v1.png'),
  scientist: loadSprite('assets/gates/scientist-core-gate-v1.png'),
});
const memoryPadSprites = Object.freeze({
  harin: loadSprite('assets/memory-pads/harin-carousel-memory-pad-v1.png'),
  harinRelay: loadSprite('assets/memory-pads/harin-laugh-relay-memory-pad-v1.png'),
  distortion: loadSprite('assets/memory-pads/harin-distorted-memory-trap-v1.png'),
  yuna: loadSprite('assets/memory-pads/yuna-piano-memory-pad-v1.png'),
  haneul: loadSprite('assets/memory-pads/haneul-wind-memory-pad-v1.png'),
  daughter: loadSprite('assets/memory-pads/daughter-photo-memory-pad-v1.png'),
  scientist: loadSprite('assets/memory-pads/scientist-core-memory-pad-v1.png'),
});
// 배경에 섞이지 않으면서도 각 꿈의 고유 소재를 바로 읽게 하는 핵심 기믹 일러스트.
const objectSprites = Object.freeze({
  harinLaughCollector: loadSprite('assets/objects/harin-laugh-collector-v1.png'),
  harinRelayBulb: loadSprite('assets/objects/harin-relay-carnival-bulb-v1.png'),
  harinCarouselWall: loadSprite('assets/objects/harin-carousel-wall-v1.png'),
  yunaStage08BoyGhostSinger: loadSprite('assets/objects/yuna-stage-08-boy-ghost-singer-v1.png'),
  yunaStage08GirlGhostSinger: loadSprite('assets/objects/yuna-stage-08-girl-ghost-singer-v1.png'),
  haneulTrueSignpost: loadSprite('assets/objects/haneul-true-signpost-v1.png'),
  haneulWindCompassArrow: loadSprite('assets/objects/haneul-wind-compass-arrow-v1.png'),
  haneulWindPinwheel: loadSprite('assets/objects/haneul-stage-17-wind-pinwheel-v1.png'),
  haneulHeadwindPillar: loadSprite('assets/objects/haneul-headwind-pillar-v1.png'),
  haneulHeadwindRubble: loadSprite('assets/objects/haneul-headwind-pillar-rubble-v1.png'),
  haneulDashRiftGate: loadSprite('assets/objects/haneul-dash-rift-gate-v1.png'),
  daughterTrueCrack: loadSprite('assets/objects/daughter-true-crack-v1.png'),
  scientistDaughterVoiceAltar: loadSprite('assets/objects/scientist-daughter-voice-altar-v1.png'),
});
const projectileSprites = Object.freeze({
  // 윤호가 쏘는 탄환도 단색 막대가 아니라, 별빛과 기억 조각이 감긴 상상력의 혜성으로 읽힌다.
  yunhoImaginationBolt: loadSprite('assets/projectiles/yunho-imagination-bolt-v1.png'),
  // 검은 연이 찢어 낸 천 조각과 돌풍이 섞인 전용 탄환. 단색 원형 탄막 대신 위협의 정체를 읽게 한다.
  haneulWindShard: loadSprite('assets/projectiles/haneul-black-kite-wind-shard-v1.png'),
  daughterMirrorShard: loadSprite('assets/projectiles/daughter-perfect-guardian-mirror-shard-v1.png'),
  scientistDreamCore: loadSprite('assets/projectiles/scientist-stolen-dream-core-v1.png'),
});
// 기억의 나가 남긴 이동 경로는 점선 UI가 아니라, 실제 꿈의 빛 조각으로 보이게 한다.
const memoryEffectSprites = Object.freeze({
  resonanceTrail: loadSprite('assets/effects/memory-resonance-trail-v1.png'),
  anchor: loadSprite('assets/effects/memory-resonance-anchor-v1.png'),
  // 16스테이지의 상승기류는 선으로만 그리지 않고, 하늘 꿈의 바람 정령처럼 읽히는 전용 원화를 사용한다.
  haneulUpdraftLift: loadSprite('assets/effects/haneul-updraft-lift-v1.png'),
  finalMemoryBraid: loadSprite('assets/effects/final-memory-braid-v2.png'),
});
const finalTruthPortraits = Object.freeze({
  harin: loadSprite('assets/portraits/harin.png'),
  yuna: loadSprite('assets/portraits/yuna.png'),
  haneul: loadSprite('assets/portraits/haneul.png'),
});
const endingCinematicSprites = Object.freeze({
  promise: loadSprite('assets/cinematics/ending-promise-v1.png'),
  hospital: loadSprite('assets/cinematics/ending-hospital-v1.png'),
  machine: loadSprite('assets/cinematics/ending-machine-v1.png'),
  cost: loadSprite('assets/cinematics/ending-cost-v1.png'),
  choice: loadSprite('assets/cinematics/ending-choice-v1.png'),
  // 딸은 깨어나지 않지만, 친구들의 마음을 느끼며 평온한 미소를 띤다.
  // 과학자의 씁쓸한 미소와 함께 "잃지 않고 받아들인 결말"을 보여 주는 최종 컷.
  morning: loadSprite('assets/cinematics/ending-morning-v3-sleeping.png'),
});

const startScreen = document.querySelector('#start-screen');
const stageMenu = document.querySelector('#stage-menu');
const endScreen = document.querySelector('#end-screen');
const disconnectIllustration = document.querySelector('#disconnect-illustration');
const disconnectIllustrationImage = document.querySelector('#disconnect-illustration-image');
const disconnectIllustrationLabel = document.querySelector('#disconnect-illustration-label');
const disconnectSkipButton = document.querySelector('#disconnect-skip');
const startButton = document.querySelector('#start-button');
const storyButton = document.querySelector('#story-button');
const settingsButton = document.querySelector('#settings-button');
const titleSettings = document.querySelector('#title-settings-modal');
const settingsCloseButton = document.querySelector('#settings-close-button');
const storySummaryModal = document.querySelector('#story-summary-modal');
const storyCloseButton = document.querySelector('#story-close-button');
const mainMenuButton = document.querySelector('#main-menu-button');
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
const challengeCard = document.querySelector('#challenge-card');
const challengeValueEl = document.querySelector('#challenge-value');
const challengeStatusEl = document.querySelector('#challenge-status');
const imaginationValueEl = document.querySelector('#imagination-value');
const imaginationFill = document.querySelector('#imagination-fill');
const imaginationStatus = document.querySelector('#imagination-status');
const gameHud = document.querySelector('.hud');
const bossHud = document.querySelector('#boss-hud');
const bgmControls = document.querySelector('#bgm-controls');
const bgmToggleButton = document.querySelector('#bgm-toggle');
const bgmVolumeSlider = document.querySelector('#bgm-volume');
const bgmVolumeValue = document.querySelector('#bgm-volume-value');
const pauseBgmVolumeSlider = document.querySelector('#pause-bgm-volume');
const pauseBgmVolumeValue = document.querySelector('#pause-bgm-volume-value');
const bossNameEl = document.querySelector('#boss-name');
const bossFill = document.querySelector('#boss-fill');
const bossHealthEl = document.querySelector('#boss-health');
const ruleCards = [...document.querySelectorAll('.rule-card')];
const memoryStatus = document.querySelector('#memory-status');
const echoCards = [...document.querySelectorAll('[data-echo-slot]')];
const ruleStates = {
  time: document.querySelector('#time-state'),
  resonance: document.querySelector('#resonance-state'),
  dash: document.querySelector('#dash-state'),
};
const loadingSplash = document.querySelector('#loading-splash');
const loadingTitle = document.querySelector('#loading-title');
const loadingFill = document.querySelector('#loading-fill');
const loadingCopy = document.querySelector('#loading-copy');
const contextControls = document.querySelector('#context-controls');
const friendReaction = document.querySelector('#friend-reaction');
const friendReactionImage = document.querySelector('#friend-reaction-image');
const friendReactionSpeaker = document.querySelector('#friend-reaction-speaker');
const friendReactionLine = document.querySelector('#friend-reaction-line');

disconnectIllustrationImage.addEventListener('error', () => disconnectIllustration.classList.remove('has-art'));

const STAGES = [
  {
    chapter: '하린 · 잃어버린 웃음', name: '첫 접속', type: 'puzzle', skills: [], objective: '꿈의 가장자리까지 걸어가라',
    intro: '전 조수는 말했습니다. “꿈속에서는, 네가 믿는 일이 규칙이 될 수 있어.” 먼저 하린의 꿈 가장자리로 걸어가 봐.',
    layout: 'walk', echoGoal: 0, hint: 'A / D 로 움직이고, W 로 점프해 보세요.',
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '상상력의 첫걸음', type: 'puzzle', skills: [], objective: '과거의 나와 함께 기억의 문을 열어라',
    intro: '하린의 기억이 검은 장막에 가로막혔습니다. 조수는 말해요. “꿈에서는 과거의 네가 지금의 너를 도울 수 있어.” ① K로 발판까지의 길을 기록하고 ② 다시 K를 눌러 시간을 되감으세요. ③ 기억의 나는 길을 재생한 뒤 발판을 지키고, 너는 되감긴 자리에서 다음 길을 준비할 수 있어요.',
    layout: 'bridge', echoGoal: 1, hint: '① K 시작 → ② 기억 발판까지 이동 → ③ K 되감기. 기억의 나가 마지막 발판을 지키면 문이 열립니다.',
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '웃음을 모으는 거리', type: 'puzzle', skills: ['resonance'], objective: '거리 세 곳에 기억의 나를 남겨 빼앗긴 웃음등을 모두 밝혀라',
    intro: '웃음 수집탑은 거리 곳곳에 남은 하린의 추억을 빨아들여 광대의 억지웃음으로 바꾸고 있어. 낮은 달빛길, 높은 별풍선 지붕, 회전목마 앞의 웃음등에 과거의 나를 하나씩 남겨 줘. 세 추억이 동시에 빛나면 탑에 붙은 가짜 미소가 무너지고 다음 꿈으로 가는 통로가 열릴 거야.',
    layout: 'wall', echoGoal: 3, hint: '① L 공명 파장으로 중앙 공명 길 드러내기 ② 교차로에서 K 기록 시작 ③ 낮은 길·높은 공명 길·오른쪽 길의 추억등에 각각 기억의 나 남기기 ④ 세 등불이 모두 켜지면 출구로 이동.',
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '무너지는 회전목마', type: 'puzzle', skills: [], blockedSkills: ['bridge', 'dash'], objective: '세 기억 장치를 자유로운 순서로 복구하고 출구 구멍을 맞춰라',
    intro: '위에서 내려다본 회전목마 바닥이 다섯 개의 기억 구역으로 갈라져 있어. 중앙 회전축을 둘러싼 원형벽에는 단 하나의 구멍만 있고, P/Y로 구멍을 각 방사형 통로와 맞춰야 바깥 원주로 건너갈 수 있어. K 기록은 언제나 중앙 보랏빛 허브에서 시작해. 북서쪽에는 K로 고정할 하린의 기억, 북동쪽과 남동쪽에는 직접 밟아 켜는 별빛·리본 잠금 장치가 있어. 세 장치는 어떤 순서로 찾아도 돼. 모두 복구한 뒤 동쪽 구멍을 출구 통로와 맞추면 다음 꿈의 문이 열린다.',
    layout: 'carousel', echoGoal: 1, blockedHint: '이 회전목마에서는 Space 질주 대신 어디서든 P/Y로 원형벽의 구멍을 양방향 회전할 수 있습니다.', hint: 'K는 항상 원 중앙 보랏빛 발판에서 시작합니다. 남동 리본 길은 중앙 허브에서 ↓/S로 하단 방사로에 내려가세요. 어디서든 P/Y로 세 장치를 원하는 순서로 복구한 뒤 동쪽 출구 구멍을 맞추세요.',
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '하린이 가장 두려워한 것', type: 'boss', skills: ['time'], objective: '기억 탄환으로 가짜 기억을 되찾고 가면을 광대에게 되돌려라',
    intro: '하린은 모두가 웃는 곳에서 혼자 웃지 못하게 될까 봐 두려워했어. 그 두려움이 “웃음을 훔치는 광대”가 되었다. 처음에는 진짜와 가짜 기억이 똑같이 보여. K로 남긴 기억의 나가 가짜에 닿으면, 가짜 기억이 잔상을 훔쳐 달아나. WASD로 탄환 방향을 잡고 J 기억 탄환을 두 번 맞혀 훔쳐 간 잔상을 지워. 진짜 기억 세 곳은 본체나 유지 중인 잔상 중 어느 쪽으로든 동시에 밝혀. 세 기억을 완성하면 2페이즈가 시작돼. 무대가 비워지고 작아진 광대와 가면 셋이 전역을 떠돌며, 이때부터 천천히 퍼지는 웃음 탄막이 나와. Shift로 가면만 잠시 멈춘 뒤, 가면 가까이에서 조준선을 잡고 J로 현재 조준 방향으로 직선 발사해 광대의 동선을 예측해.',
    boss: '웃음을 훔치는 광대', bossConfig: {
      mode: 'calm', visual: 'carousel', calmDuration: 2.1,
      distortedMemoryPads: [
        { x: 128, y: 316, w: 42, h: 42, label: '혼자 웃기' },
        { x: 470, y: 132, w: 42, h: 42, label: '텅 빈 관람석' },
      ],
    }, hint: '① 똑같은 기억 후보를 K 잔상으로 확인 ② 가짜가 잔상을 훔치면 WASD로 조준해 J 탄환 2회 ③ 세 진짜 기억을 본체/잔상 조합으로 동시 활성화 ④ 2페이즈부터 웃음 탄막 회피 ⑤ 가면 가까이에서 조준선을 잡고 J로 직선 발사해 광대를 맞히세요.',
    teaches: ['time'],
  },
  {
    chapter: '하린 · 잃어버린 웃음', name: '하린의 웃음이 남긴 빛', type: 'puzzle', skills: ['time'], objective: '달빛 등불섬을 건너 다음 친구의 꿈으로 향하라',
    intro: '하린의 웃음이 돌아오자, 빛은 곧장 길이 되지 않고 어두운 강 위에 작은 등불섬들을 만들었어. 각 섬의 높이가 달라서, 점프의 리듬을 따라 다음 친구가 있는 꿈의 가장자리까지 건너가야 해.',
    layout: 'lantern-river', echoGoal: 0, hint: '낮은 등불섬에서 높은 등불섬으로 점프하며 오른쪽 꿈의 문까지 건너가세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '별빛 합창의 문', type: 'puzzle', skills: ['resonance'], teaches: ['resonance'], objective: '끊어지는 건반 계단을 공명으로 올라가라',
    intro: '두 번째 친구 유나는 숨은 소리를 듣는 아이야. 꿈 추출기는 그 아이의 노래를 접어 숨겨 버렸어. L을 누르면 공명이 퍼져, 보이지 않던 건반이 드러난다. 하지만 공명을 멈추면 길도 다시 희미해져. 짧은 숨은 건반 사이에서 점프하고, 밝은 흰 건반에 닿았을 때만 잠시 숨을 고르자. 마지막에는 첫 음에 도착한 윤호의 기억을 남겨, 그 소리가 사라지지 않게 해야 해.',
    layout: 'chorus', echoGoal: 1, hint: 'L을 유지해 끊어진 건반 계단을 잇고 기억 문양까지 이동하세요. 문양 위에서 K로 기록을 시작한 뒤 되감으면 기억의 내가 첫 음을 계속 울립니다.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '유나의 빈 의자', type: 'puzzle', skills: ['time', 'resonance'], objective: '갈라진 옥타브를 올라 두 빈자리를 연결하라',
    intro: '유나는 늘 누군가의 자리를 기억하던 아이였어. 꿈 추출기는 교실의 낮은 자리와 가장 높은 합창 발코니를 멀리 갈라 놓았어. 낮은 건반 길을 오른 뒤 한 번 내려서, 다시 높은 옥타브까지 올라가 두 빈자리를 연결하자. 두 자리의 기억은 서로를 바라볼 때만 하나의 화음이 된다.',
    layout: 'choir-balcony', echoGoal: 2, hint: '두 빈자리에 기억을 남긴 뒤, 각 발판 위에서 서로를 향해 방향을 돌리고 K로 되감으세요. 그 다음 M자 건반길을 끝까지 이어가세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '지워진 악보의 계단', type: 'puzzle', skills: ['resonance'], objective: '오르내리는 반음계 길을 공명으로 되돌려라',
    intro: '유나의 악보에는 음표 사이사이가 통째로 지워져 있어. L을 누르는 동안에만 빠진 음계와 그 위의 기억 문양이 돌아온다. 빠르게 높은 음까지 오른 뒤, 아래로 떨어지는 반음계를 타고 다시 올라가야 해. 같은 방향으로만 걷는 길이 아니니, 다음 건반의 높이를 보고 점프하자.',
    layout: 'chorus-memory', echoGoal: 1, hint: 'L로 짧은 반음계를 이어 높은 기억 단까지 오른 뒤, 내려가는 건반과 마지막 상승 구간을 정확히 연결하세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '두 사람의 화음', type: 'puzzle', skills: ['resonance'], objective: '두 사람의 기억으로 나선형 화음을 완성하라',
    intro: '마지막 한 소절은 직선이 아니라, 위아래로 감긴 악보에 숨어 있어. 낮은 화음과 높은 화음의 기억이 서로를 향할 때에만, 비어 있던 음 사이에 선율이 이어진다. 두 자리에서 방향까지 맞춘 뒤, 공명으로 위쪽 건반을 드러내 다음 후렴으로 가자.',
    layout: 'harmony-spiral', echoGoal: 2, hint: '낮은·높은 화음의 기억이 서로를 향하게 K로 다시 기록한 뒤, L로 위쪽 건반을 드러내 나선형 길을 이어가세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '침묵을 삼킨 합창단', type: 'boss', skills: ['resonance'], objective: '여섯 음을 되찾고 20초간 불협화음을 버텨라',
    intro: '유나는 아무리 크게 노래해도 아무에게도 닿지 않을까 봐 두려웠다. 그 두려움은 “침묵을 삼킨 합창단”이 되어 모든 소리를 지운다. 먼저 과거의 나 둘에게 서로 다른 화음 앵커를 맡겨. 그 다음 보스 바깥에 떠 있는 별빛 고리가 밝아지는 박자에 맞춰 L을 짧게 눌러, 여섯 음을 순서대로 되찾자. 마지막 음이 돌아오면 합창단은 무너지는 불협화음으로 20초간 발악한다. 그 시간을 피하면 유나의 노래가 완성된다.',
    boss: '침묵을 삼킨 합창단', bossConfig: {
      mode: 'resonance', visual: 'choir', x: 420, y: 76, w: 120, h: 170, codaDuration: 20,
      // 11스테이지는 불협화음 회피를 위해 화면 안 전체를 이동 공간으로 연다.
      moveBounds: { xMin: 0, xMax: W - 25, yMin: 0, yMax: H - 34 },
      // 화음 앵커는 불협화음 세 번을 받아내면 사라진다. 이후 K로 다시 남길 수 있다.
      echoHitLimit: 3, echoAttackCadence: 3,
      memoryPads: [
        { x: 174, y: 142, w: 42, h: 42, label: '낮은 화음' },
        { x: 330, y: 346, w: 42, h: 42, label: '높은 화음' },
      ],
      resonanceGates: [
        { x: 676, y: 104, w: 52, h: 52, label: '첫 음' },
        { x: 690, y: 232, w: 52, h: 52, label: '두 번째 음' },
        { x: 638, y: 386, w: 52, h: 52, label: '세 번째 음' },
        { x: 388, y: 432, w: 52, h: 52, label: '네 번째 음' },
        { x: 150, y: 392, w: 52, h: 52, label: '다섯 번째 음' },
        { x: 68, y: 232, w: 52, h: 52, label: '되찾은 후렴' },
      ],
    },
    hint: '① 기억의 나 둘을 화음 앵커에 남기기 ② 불협화음이 앵커의 기억의 나를 3번 맞히면 사라지므로 K로 다시 남기기 ③ 보스 바깥의 밝아지는 고리에서 L을 짧게 눌러 음 6개를 순서대로 되찾기 ④ 마지막에는 20초간 불협화음 음표 탄막을 피하세요.',
  },
  {
    chapter: '유나 · 사라진 노래', name: '유나의 노래가 남긴 별', type: 'puzzle', skills: ['resonance'], objective: '되찾은 노랫길을 따라 다음 꿈으로 향하라',
    intro: '유나의 노래가 돌아오자, 별빛 음표들이 다음 꿈으로 가는 길을 그린다. 이번에는 숨은 길을 찾거나 싸울 필요가 없어. 멀리서 들려오는 바람 소리를 따라가 보자.',
    layout: 'walk', echoGoal: 0, hint: '별빛 음표가 가리키는 오른쪽 문까지 걸어가세요.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '바람길의 입구', type: 'puzzle', skills: ['dash'], teaches: ['dash'], objective: '질주로 첫 번째 바람 틈을 넘어라',
    intro: '세 번째 친구 하늘이는 갇힌 꿈에서도 앞으로 달리는 걸 멈추지 않았어. 하지만 이 바람길의 틈은 점프만으로 닿기엔 너무 멀다. Space를 누르면 짧게 질주해, 바람을 가르듯 간격을 넘을 수 있어.',
    layout: 'dash', echoGoal: 1, hint: '기억의 나가 출발 신호를 지키면 길이 열립니다. Space로 첫 번째 긴 틈을 넘으세요.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '바람을 가르는 달리기', type: 'puzzle', skills: ['resonance', 'dash'], objective: '바람 터널의 위아래 길을 질주와 공명으로 이어라',
    intro: '거대한 바람 터널은 낮은 길과 높은 길을 번갈아 막아. 기억의 나에게 출발 신호를 맡기고, Space로 첫 틈을 넘은 뒤 L로 위쪽 숨은 바람길을 찾아가자.',
    layout: 'wind-tunnel', echoGoal: 1, hint: '출발 신호에 기억을 남긴 뒤, Space로 터널 틈을 넘고 L로 위쪽 바람길을 드러내세요.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '역풍의 높은 벽', type: 'puzzle', skills: ['dash'], blockedSkills: ['resonance'], objective: '출발 약속의 기억으로 거대한 바람 기둥을 무너뜨려라',
    intro: '하늘의 길은 이제 벽 하나가 아니라 여러 높이로 갈라진 절벽이 되었어. 기둥이 서 있는 동안에는 역풍이 점프와 질주까지 되밀어. 먼저 출발 약속에 기억의 나를 남겨, 길을 막던 거대한 기둥을 무너뜨리자. 바람이 멎으면 높은 선반을 따라가고 마지막 좁은 틈은 Space 질주로 가른다.',
    layout: 'wind-cliff', echoGoal: 1, hint: '① 출발 약속 위에서 K로 기억 남기기 ② 기억이 재생되면 역풍 기둥이 무너짐 ③ 점프로 높은 바람 선반 오르기 ④ Space로 마지막 틈 돌파.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '바람을 접는 화살표', type: 'puzzle', skills: ['resonance', 'dash'], objective: '세 바람 화살표로 상승·횡단·질주 길을 직접 설계하라',
    intro: '이 표지판들은 길을 알려 주는 게 아니야. 바람의 방향을 접어서 새로운 길을 만들어 내는 장치지. 먼저 K로 출발 신호에 기억의 나를 남겨. 첫 화살표는 위로 향해 공중 승강기를 만들고, 두 번째 화살표는 하늘에 S자 바람 다리를 엮어. 마지막 화살표는 출구를 향한 질주 제트를 발사한다. L로 화살표를 진짜 방향까지 돌린 뒤, 네가 만든 바람길을 직접 타고 지나가자.',
    layout: 'signpost-maze', echoGoal: 1, hint: '① K로 출발 신호에 기억 남기기 ② L로 상승 화살표를 돌려 바람 승강기 타기 ③ 두 번째 화살표로 S자 바람 다리 만들기 ④ 마지막 화살표 뒤 Space 질주로 출구 제트에 올라타기.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '하늘이의 바람 끝', type: 'boss', skills: ['resonance', 'dash'], objective: '순풍 릴레이를 완성하고 바람개비로 검은 연을 되돌려 보내라',
    intro: '하늘이는 넘어져도 다시 달리던 아이였어. 하지만 마지막에는 아무리 달려도 제자리라고 느끼는 것이 가장 무서웠다. 그 공포가 모든 길을 되돌려 보내는 검은 연이 되었다. 1페이즈에서 K로 두 명의 과거의 나를 출발 깃발에 남기고, 기준점으로 향하는 되돌림 바람을 Space 질주로 가로질러 순풍 고리 세 개를 완성해. 2페이즈가 시작되면 맵 아래쪽에 바람개비가 나타나고 검은 연은 2시·10시·12시 방향을 섞어 이동해. 보스가 화면 전체로 뿌리는 작은 검은 연은 바람을 타고 불규칙한 곡선으로 굽이쳐. 그중 하나를 바람개비에 태워 되돌려 보내고, P/Y를 누르는 동안 반사 방향을 직접 조절해.',
    boss: '바람을 삼킨 검은 연', bossConfig: {
      mode: 'chase', visual: 'wind', relayTurns: 3, relayEchoProtected: true, attackTarget: 'player',
      moveBounds: { xMin: 45, xMax: 720, yMin: 86, yMax: 437 },
      decoyPads: [
        { x: 208, y: 132, w: 42, h: 42, label: '첫 출발' },
        { x: 384, y: 270, w: 42, h: 42, label: '다시 달리기' },
      ],
      windGates: [
        { x: 274, y: 218, w: 34, h: 84, label: '첫 순풍' },
        { x: 456, y: 118, w: 34, h: 84, label: '두 번째 순풍' },
        { x: 624, y: 328, w: 34, h: 84, label: '마지막 순풍' },
      ],
    },
    hint: '① K로 두 기억 기준점 완성 ② 되돌림 바람을 Space로 가로채기 ③ 순풍 고리 세 개 통과 ④ P/Y 유지로 총 6회 반사 ⑤ 명중할 때마다 좌우 사이드 연이 파동당 1개씩 증가 ⑥ 2·4회 명중 뒤 탄막 수·빈도·곡률도 강화됨.',
  },
  {
    chapter: '하늘 · 멈춰 버린 발걸음', name: '하늘이의 발걸음이 남긴 길', type: 'puzzle', skills: ['dash'], objective: '바람 위에 남은 발자국 섬을 따라 완벽한 꿈의 문으로 향하라',
    intro: '하늘이의 발걸음이 멈추지 않자, 세 친구의 빛이 공중의 발자국 섬을 만들었다. 저 멀리 너무 완벽해서 오히려 낯선 정원이 보여. 마지막 길은 점프만으로는 닿지 않는 섬 하나가 있으니, Space 질주로 건너가 보자.',
    layout: 'starlight-ferry', echoGoal: 0, hint: '작은 발자국 섬을 건너고, 가장 긴 간격은 Space 질주로 넘어 오른쪽 꿈의 문으로 가세요.',
  },
  {
    chapter: '딸 · 완벽한 꿈의 균열', name: '완벽한 정원', type: 'puzzle', skills: ['resonance'], objective: '정원의 뿌리 사이 숨은 균열을 찾아라',
    intro: '수면 과학자의 딸은 이 정원을 완벽한 집이라고 믿고 있어. 하지만 꽃들이 너무 같은 방향만 보고 있고, 땅 아래에는 친구들의 기억이 갇혀 있어. L을 누르면 지상 길이 아니라 뿌리 사이의 층층 길이 드러나. 그 균열을 따라 내려가 보자. 마지막에는 뿌리 아래에서 들은 목소리를 윤호의 기억으로 남겨, 가짜 정원이 듣지 못한 노래를 계속 울려야 해.',
    layout: 'garden-roots', echoGoal: 1, hint: 'L로 뿌리 사이 숨은 발판을 따라 기억 표식까지 이동하세요. 표식 위에서 K로 기록을 남기면 되감긴 기억의 내가 뿌리 아래의 목소리를 이어 줍니다.',
  },
  {
    chapter: '딸 · 완벽한 꿈의 균열', name: '금이 간 교실', type: 'puzzle', skills: ['resonance'], objective: '갈라진 교실의 서로 다른 층에 있는 친구 자리를 되돌려라',
    intro: '딸의 꿈속 교실에는 친구들이 모두 있지만, 그 모습은 기억을 빼앗긴 뒤의 빈 껍질처럼 조용하다. 교실 바닥은 금이 가며 위·아래 두 층으로 갈라졌어. L로 균열 사이의 책상 길을 보고, 두 층에 흩어진 친구들의 자리를 기억의 나로 채우자. 두 기억이 서로를 바라봐야 조용했던 친구들이 다시 서로를 부를 수 있어.',
    layout: 'classroom-fracture', echoGoal: 2, hint: 'L로 책상 길을 보며 낮은·높은 자리에 기억을 남기고, 두 기억이 서로 마주보게 방향을 맞춘 뒤 K로 되감으세요.',
  },
  {
    chapter: '딸 · 완벽한 꿈의 균열', name: '완벽한 꿈의 수호자', type: 'boss', skills: ['resonance', 'dash'], objective: '진짜 기억으로 가짜 풍경을 지우고 수호자의 거울을 깨워라',
    intro: '딸의 꿈은 스스로를 지키기 위해 “완벽한 꿈의 수호자”를 만들었다. 수호자는 딸을 해치려는 적이 아니라, 슬픔을 보지 않게 하려는 꿈의 방어 본능이야. 먼저 K로 딸이 간직한 진짜 사진의 자리에 기억의 나를 남겨 줘. 그러면 가짜 균열이 사라지고, L로 드러나는 진짜 균열만 Space 질주로 통과할 수 있어.',
    boss: '완벽한 꿈의 수호자', bossConfig: {
      mode: 'mirror', visual: 'mirror',
      moveBounds: { xMin: 45, xMax: 720, yMin: 86, yMax: 437 },
      memoryPads: [{ x: 184, y: 270, w: 42, h: 42, label: '딸의 진짜 사진', backdropDimming: .18 }],
      fakeMirrorGates: [
        { x: 334, y: 344, w: 44, h: 60, label: '가짜 웃음' },
        { x: 548, y: 116, w: 44, h: 60, label: '가짜 친구' },
      ],
      mirrorGates: [
        { x: 296, y: 128, w: 48, h: 72, label: '첫 균열' },
        { x: 462, y: 316, w: 48, h: 72, label: '두 번째 균열' },
        { x: 610, y: 164, w: 48, h: 72, label: '마지막 균열' },
        { x: 676, y: 320, w: 38, h: 64, label: '진실의 균열' },
      ],
    },
    hint: '① K로 딸의 진짜 사진에 기억의 나를 남기기 ② 가짜 풍경이 사라지면 L로 진짜 균열을 드러내기 ③ Space 질주로 균열 4개를 통과하세요.',
  },
  {
    page: 2, chapter: 'PAGE 02 · 현실을 향한 마지막 꿈', name: '수면 과학자의 연구실', type: 'boss', skills: ['time', 'resonance', 'dash'], objective: '기억과 공명을 완성해 거대한 꿈의 수호자를 멈춰라',
    intro: '딸이 친구들의 꿈을 보자, 완벽한 세계 전체가 무너지기 시작한다. 수면 과학자는 딸의 마지막 행복을 지키려 자기 자신을 거대한 꿈의 수호자로 바꾼다. 이제는 그를 쓰러뜨리는 것만으로는 부족해. 세 친구의 기억으로 봉인을 열고, 빼앗은 꿈 에너지를 되돌려 주며 그의 집착을 멈춰야 해.',
    boss: '수면 과학자', bossConfig: {
      mode: 'final', finalChargeNeeded: 1.4,
      attackHp: 12,
      // 22스테이지는 탄막을 피할 세로 여유를 화면 전체로 연다.
      moveBounds: { xMin: 45, xMax: 760, yMin: 0, yMax: H - 34 },
      memoryPads: [
        { x: 188, y: 122, w: 42, h: 42, label: '하린의 웃음' },
        { x: 372, y: 228, w: 42, h: 42, label: '유나의 노래' },
        { x: 534, y: 356, w: 42, h: 42, label: '하늘의 발걸음' },
      ],
      truthTargets: [
        { x: 234, y: 386, w: 44, h: 44, label: '하린의 진짜 웃음', art: 'harin', color: '#ffcf88', motion: { xRange: 90, yRange: 0, speed: 1.75, phase: 0 } },
        { x: 438, y: 112, w: 44, h: 44, label: '유나의 진짜 노래', art: 'yuna', color: '#9effd7', motion: { xRange: 0, yRange: 75, speed: 1.45, phase: 1.1 } },
        { x: 610, y: 278, w: 44, h: 44, label: '하늘의 진짜 길', art: 'haneul', color: '#a6efff', motion: { xRange: 70, yRange: 45, speed: 1.8, phase: 2.2 } },
      ],
      voiceGate: { x: 662, y: 408, w: 58, h: 44, label: '딸의 목소리' },
    },
    hint: '① 세 기억 봉인을 채우기 ② L로 꿈 에너지 분리하기 ③ J로 방어막을 깨기 ④ 움직이는 진짜 기억만 맞히기 ⑤ 딸의 목소리를 전달하기.',
  },
];

// 몇 개의 핵심 퍼즐은 기억 발판의 개수를 채우는 데서 끝나지 않는다.
// 과거의 내가 어느 방향을 바라보며 장면을 재생하는지가 현재 길의 규칙을 바꾼다.
const PUZZLE_ROLE_RULES = Object.freeze({
  chorus: Object.freeze({
    title: '첫 음을 남기는 기억',
    prompt: 'K로 기록해, 기억의 나에게 첫 음을 맡기세요',
    readyText: '기억의 나가 첫 음을 계속 울립니다. 끊어진 건반이 화음으로 이어졌어요.',
  }),
  'choir-balcony': Object.freeze({
    title: '마주 보는 듀엣',
    prompt: '두 빈자리의 기억이 서로를 바라보게 하세요',
    directions: Object.freeze([1, -1]),
    readyText: '두 목소리가 서로를 향합니다. 끊어진 옥타브가 화음으로 이어졌어요.',
  }),
  'harmony-spiral': Object.freeze({
    title: '서로를 향한 화음',
    prompt: '두 기억이 서로를 바라보게 하세요',
    directions: Object.freeze([1, -1]),
    readyText: '두 화음이 서로에게 닿습니다. 나선형 선율이 돌아왔어요.',
  }),
  'classroom-fracture': Object.freeze({
    title: '서로를 부르는 두 자리',
    prompt: '두 친구 자리에 남은 기억이 서로를 바라보게 하세요',
    directions: Object.freeze([1, -1]),
    readyText: '두 자리가 서로를 부릅니다. 가짜 교실의 균열이 열렸어요.',
  }),
  'garden-roots': Object.freeze({
    title: '뿌리 아래의 목소리',
    prompt: 'K로 기록해, 기억의 나에게 뿌리 아래의 노래를 맡기세요',
    readyText: '기억의 나가 뿌리 아래의 목소리를 되풀이합니다. 완벽한 잔디에 진짜 균열이 생겼어요.',
  }),
});

// 기억이 실제로 친구의 감정을 되돌리는 순간을, 긴 대사 대신 짧은 인게임 반응으로 남긴다.
const FRIEND_REACTION_EVENTS = Object.freeze({
  2: Object.freeze([
    Object.freeze({ id: 'first-relay', active: 1, portrait: 'harin', speaker: '하린의 기억', line: '어딘가에서… 내가 웃었던 소리가 들렸어.' }),
    Object.freeze({ id: 'all-relays', active: 3, portrait: 'harin', speaker: '하린의 기억', line: '세 개의 불빛이 이어졌어. 나 혼자가 아니었구나.' }),
  ]),
  3: Object.freeze([
    Object.freeze({ id: 'carousel-turns', active: 1, portrait: 'harin', speaker: '하린의 기억', line: '회전목마가 다시 움직여. 누군가 내 손을 잡아 준 것 같아.' }),
  ]),
  6: Object.freeze([
    Object.freeze({ id: 'first-note', role: true, portrait: 'yuna', speaker: '유나의 기억', line: '내가 남긴 첫 음이… 아직 여기에서 울리고 있어.' }),
  ]),
  9: Object.freeze([
    Object.freeze({ id: 'silent-key', role: true, portrait: 'yuna', speaker: '유나의 기억', line: '침묵이 나를 삼킨 게 아니야. 내가 서로의 목소리를 잊고 있었어.' }),
  ]),
  14: Object.freeze([
    Object.freeze({ id: 'headwind-promise', role: true, portrait: 'haneul', speaker: '하늘의 기억', line: '바람이 불어도, 뒤돌아보지 않아도 되는 길이 생겼어.' }),
  ]),
  18: Object.freeze([
    Object.freeze({ id: 'roots-sing', role: true, portrait: 'daughter', speaker: '수면 과학자의 딸', line: '정원 아래에서 친구들 목소리가 들려. 꽃들이 왜 울고 있었는지 알 것 같아.' }),
  ]),
  19: Object.freeze([
    Object.freeze({ id: 'desks-call', role: true, portrait: 'daughter', speaker: '수면 과학자의 딸', line: '친구들이 서로를 보고 있어. 이 교실은 처음부터 완벽하지 않았어.' }),
  ]),
});

function puzzleRoleRule(layout = game?.layout) {
  return PUZZLE_ROLE_RULES[layout] || null;
}

function echoHoldingPad(pad) {
  return (game.echoes || []).find((echo) => echoOverlapsPad(echo, pad)) || null;
}

function puzzleRoleState() {
  const rule = puzzleRoleRule();
  if (!rule) return { ready: true, rule: null, matched: 0, total: 0 };
  const echoes = (game.memoryPads || []).map(echoHoldingPad);
  const total = rule.directions?.length || game.memoryPads.length;
  const matched = echoes.reduce((count, echo, index) => {
    if (!echo?.holding) return count;
    if (rule.directions) return count + Number(echo.facing === rule.directions[index]);
    return count + 1;
  }, 0);
  return { ready: matched === total, rule, matched, total, echoes };
}

const SIGNPOST_RESONANCE_SECONDS = .72;

function createSignpostMazeState() {
  return {
    activeIndex: 0,
    charge: 0,
    noticedId: '',
    liftHintShown: false,
    jetHintShown: false,
    jetPulse: 0,
    unmasked: false,
    anchored: false,
    exitAligned: false,
    signposts: [
      {
        id: 'updraft-arrow', x: 266, groundY: 440, scale: .82,
        startAngle: Math.PI, targetAngle: -Math.PI / 2, directionGlyph: '↑',
        unlock: 'unmasked', label: '상승 화살표', action: '상승기류 가동', next: '하늘 선반',
      },
      {
        id: 'weave-arrow', x: 508, groundY: 242, scale: .86,
        startAngle: Math.PI / 2, targetAngle: 0, directionGlyph: '→',
        unlock: 'anchored', label: '횡단 화살표', action: 'S자 바람 다리 엮기', next: '질주 화살표',
      },
      {
        id: 'launch-arrow', x: 778, groundY: 318, scale: .8,
        startAngle: Math.PI, targetAngle: 0, directionGlyph: '→',
        unlock: 'exitAligned', label: '질주 화살표', action: '출구 제트 발사', next: '진짜 꿈의 문',
      },
    ],
  };
}

function activeSignpost(state = game.signpostMaze) {
  return state?.signposts?.[state.activeIndex] || null;
}

function signpostMazeComplete(state = game.signpostMaze) {
  return Boolean(state && state.activeIndex >= state.signposts.length);
}

function signpostPathRevealed(platform, techniques = activeTechniques()) {
  if (!platform.hidden) return true;
  if (platform.signpostReveal) return Boolean(game.signpostMaze?.[platform.signpostReveal]);
  return Boolean(techniques?.resonance);
}

function playerNearSignpost(sign) {
  const player = game.player;
  if (!player || !sign) return false;
  const centerX = player.x + player.w / 2;
  const feet = player.y + player.h;
  return Math.abs(centerX - sign.x) <= Math.max(42, sign.scale * 48)
    && feet >= sign.groundY - 40
    && feet <= sign.groundY + 12;
}

// 모든 상호작용은 "멀리서는 빛의 문양, 가까이서는 짧은 키 안내"라는 한 규칙을 공유한다.
// 충돌 박스보다 조금 넓은 시각 반경을 사용해, 발판·문·표지판마다 안내가 튀지 않게 한다.
function playerNearObject(target, radius = 86) {
  const player = game.player;
  if (!player || !target) return false;
  const targetX = target.x + (target.w || 0) / 2;
  const targetY = target.y + (target.h || 0) / 2;
  const playerX = player.x + player.w / 2;
  const playerY = player.y + player.h / 2;
  return Math.hypot(playerX - targetX, playerY - targetY) <= radius;
}

function updateSignpostMaze(dt, techniques) {
  const maze = game.signpostMaze;
  const sign = activeSignpost(maze);
  if (!maze) return;
  maze.jetPulse = Math.max(0, (maze.jetPulse || 0) - dt);
  if (!sign) return;
  const memoryReady = activeMemoryPads(game.memoryPads || []) >= game.echoGoal;
  const near = playerNearSignpost(sign);
  if (near && maze.noticedId !== sign.id) {
    maze.noticedId = sign.id;
    say(memoryReady
      ? `${sign.label} 앞입니다. L을 잠시 유지해 “${sign.action}” 하세요.`
      : '먼저 왼쪽 출발 신호까지 K로 기록한 뒤, 기억의 나를 남겨야 바람의 말을 들을 수 있어요.');
  }
  const tuning = memoryReady && near && techniques.resonance;
  if (!tuning) {
    maze.charge = Math.max(0, maze.charge - dt * .55);
    return;
  }
  maze.charge = Math.min(SIGNPOST_RESONANCE_SECONDS, maze.charge + dt);
  if (maze.charge < SIGNPOST_RESONANCE_SECONDS) return;
  maze[sign.unlock] = true;
  maze.activeIndex += 1;
  maze.charge = 0;
  maze.noticedId = '';
  const finished = signpostMazeComplete(maze);
  const releaseLine = `${sign.label}이 ${sign.action}을 완성했습니다. ${sign.next}이 바람 속에서 형태를 얻습니다.`;
  say(finished
    ? '마지막 표지판이 출구를 향했습니다. 되돌림 바람이 멎고 진짜 꿈의 문이 열립니다.'
    : releaseLine);
  updateHud();
}

function applySignpostMazeWindPhysics(player, dt, stage = currentStage()) {
  if (stage?.layout !== 'signpost-maze') return;
  const maze = game.signpostMaze;
  if (!maze || !player) return;
  const centerX = player.x + player.w / 2;
  const feet = player.y + player.h;
  // 첫 화살표가 만든 기류는 단순 발판이 아니라, 실제로 윤호를 하늘 선반 높이까지 들어 올린다.
  const insideUpdraft = maze.unmasked
    && centerX >= 286 && centerX <= 366
    && feet >= 244 && feet <= 478;
  if (insideUpdraft) {
    const heightRatio = Math.max(0, Math.min(1, (feet - 244) / 234));
    player.vy = Math.min(player.vy, -300 - heightRatio * 150);
    if (!maze.liftHintShown) {
      maze.liftHintShown = true;
      say('상승 화살표가 바람 승강기를 만들었습니다. 오른쪽으로 몸을 기울여 하늘 선반에 착지하세요.');
    }
  }
  // 두 번째 화살표의 S자 기류는 점프 중에는 살짝 앞으로 미끄러지게 해, 공중 다리의 흐름을 체감시킨다.
  const insideWeave = maze.anchored
    && centerX >= 548 && centerX <= 836
    && feet >= 184 && feet <= 352;
  if (insideWeave && !player.grounded) player.vx = Math.min(340, player.vx + 170 * dt);
  // 마지막 화살표는 질주한 플레이어만 잡아 주는 짧은 제트다. 일반 점프 길과 다른 마무리 감각을 만든다.
  const insideJet = maze.exitAligned
    && centerX >= 792 && centerX <= 886
    && feet >= 238 && feet <= 354;
  if (insideJet && game.dashTimer > 0 && game.dashDirection > 0) {
    player.vx = Math.max(player.vx, 470);
    player.vy = Math.min(player.vy, -135);
    game.dashTimer = Math.max(game.dashTimer, .075);
    maze.jetPulse = .42;
    if (!maze.jetHintShown) {
      maze.jetHintShown = true;
      say('질주 제트가 윤호를 붙잡았습니다. 바람을 타고 마지막 출구 선반으로 날아가세요!');
    }
  }
}

function puzzleObjectiveReady() {
  if (game.layout === 'carousel') return Boolean(game.carouselGateOpened);
  const padsReady = game.echoGoal === 0 || activeMemoryPads(game.memoryPads || []) >= game.echoGoal;
  const signsReady = game.layout !== 'signpost-maze' || signpostMazeComplete();
  return padsReady && puzzleRoleState().ready && signsReady;
}

function decoratePuzzleRolePads() {
  const rule = puzzleRoleRule();
  if (!rule) return;
  game.memoryPads.forEach((pad, index) => {
    pad.roleDirection = rule.directions?.[index] || 0;
    pad.roleTechnique = '';
    pad.rolePrompt = rule.prompt;
  });
}

let friendReactionTimer = 0;

function hideFriendReaction() {
  clearTimeout(friendReactionTimer);
  friendReaction.classList.remove('visible');
}

function showFriendReaction(event) {
  friendReactionImage.src = `assets/portraits/${event.portrait}.png`;
  friendReactionImage.alt = `${event.speaker} 반응 일러스트`;
  friendReactionSpeaker.textContent = event.speaker;
  friendReactionLine.textContent = event.line;
  friendReaction.classList.add('visible');
  clearTimeout(friendReactionTimer);
  friendReactionTimer = setTimeout(() => friendReaction.classList.remove('visible'), 4200);
}

function updateFriendReactions(stage = currentStage()) {
  if (stage?.type !== 'puzzle') return;
  const events = FRIEND_REACTION_EVENTS[game.stageIndex] || [];
  if (!events.length) return;
  const active = activeMemoryPads(game.memoryPads || []);
  const roleReady = puzzleRoleState().ready;
  events.forEach((event) => {
    const reactionId = `${game.stageIndex}:${event.id}`;
    const ready = event.role ? roleReady && active >= game.echoGoal : active >= event.active;
    if (!ready || game.reactionSeen?.has(reactionId)) return;
    game.reactionSeen.add(reactionId);
    showFriendReaction(event);
  });
}

function stageSpriteSet(stageIndex = game?.stageIndex || 0) {
  const stage = STAGES[Math.max(0, Math.min(STAGES.length - 1, stageIndex))] || STAGES[0];
  const sprites = [playerSprites.idle, playerSprites.run, playerSprites.jump, memoryEffectSprites.resonanceTrail, memoryEffectSprites.anchor];
  if (stageIndex < 6) {
    // 1~6은 모두 같은 유원지 발판 원화를 쓴다. 4스테이지를 한 번 열어야만
    // 스프라이트가 로드되던 조건을 없애, 재진입 여부와 상관없이 같은 디자인을 유지한다.
    sprites.push(harinBackgrounds[stageIndex], gateSprites.harin, memoryPadSprites.harin, platformSprites.harinCarouselPlatform);
    if (stageIndex === 1) sprites.push(harinStage02GateSprites.blocked, harinStage02GateSprites.open, harinStage02MagicFrames.awakening, harinStage02MagicFrames.restoring);
    if (stageIndex === 2) sprites.push(objectSprites.harinLaughCollector, objectSprites.harinRelayBulb, memoryPadSprites.harinRelay, platformSprites.harinEchoBridge);
    if (stageIndex === 3) sprites.push(
      carouselStructureSprites.deck,
      carouselStructureSprites.pillar,
      carouselStructureSprites.joint,
      carouselStructureSprites.horseMedallion,
      carouselStructureSprites.ring,
      carouselLockSprites.star,
      carouselLockSprites.ribbon,
    );
    if (stage.type === 'boss') sprites.push(bossSprites.harinClown, bossSprites.harinClownMini, bossSprites.harinLaughterMask, memoryPadSprites.distortion, projectileSprites.yunhoImaginationBolt);
  } else if (stageIndex < 12) {
    sprites.push(yunaBackgrounds[stageIndex - 6], gateSprites.yuna, memoryPadSprites.yuna, platformSprites.yunaResonancePad);
    // 8·10스테이지 모두 기억 발판 위의 유령 합창 잔상을 사용한다.
    if (stageIndex === 7 || stageIndex === 9) sprites.push(objectSprites.yunaStage08BoyGhostSinger, objectSprites.yunaStage08GirlGhostSinger);
    if (stage.type === 'boss') sprites.push(bossSprites.yunaChoir);
  } else if (stageIndex < 18) {
    sprites.push(haneulBackgrounds[stageIndex - 12], gateSprites.haneul, memoryPadSprites.haneul, platformSprites.haneulWindLedge);
    if (stageIndex === 14) sprites.push(objectSprites.haneulHeadwindPillar, objectSprites.haneulHeadwindRubble);
    if (stageIndex === 15) sprites.push(objectSprites.haneulTrueSignpost, objectSprites.haneulWindCompassArrow, memoryEffectSprites.haneulUpdraftLift);
    if (stage.type === 'boss') sprites.push(bossSprites.haneulKite, objectSprites.haneulDashRiftGate, objectSprites.haneulWindPinwheel, projectileSprites.haneulWindShard);
  } else if (stageIndex < 21) {
    sprites.push(daughterBackgrounds[stageIndex - 18], gateSprites.daughter, memoryPadSprites.daughter, platformSprites.daughterGarden, platformSprites.daughterFracturedClassroom, objectSprites.daughterTrueCrack);
    if (stage.type === 'boss') sprites.push(bossSprites.daughterGuardian, projectileSprites.daughterMirrorShard);
  } else {
    sprites.push(scientistBackground, gateSprites.scientist, memoryPadSprites.scientist, bossSprites.scientistGuardian, bossSprites.scientistGuardianAwakened, projectileSprites.scientistDreamCore, finalTruthPortraits.harin, finalTruthPortraits.yuna, finalTruthPortraits.haneul, objectSprites.scientistDaughterVoiceAltar, memoryEffectSprites.finalMemoryBraid);
  }
  if (stage.bossConfig?.mode === 'final') sprites.push(projectileSprites.yunhoImaginationBolt);
  return sprites.flat(Infinity).filter(Boolean);
}

function ensureStageVisualAssets(stageIndex = game?.stageIndex || 0) {
  ensureSprites(stageSpriteSet(stageIndex));
}

function waitForSprite(image) {
  ensureSprite(image);
  if (image.complete) return Promise.resolve();
  return new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  });
}

let loadingRun = 0;
let stagePreviewRun = 0;

async function establishFirstDreamLink(onReady) {
  const run = ++loadingRun;
  const initialSprites = stageSpriteSet(0);
  const portraitSources = ['assets/portraits/assistant.png', 'assets/portraits/protagonist.png'];
  const portraitPreloads = portraitSources.map((source) => {
    const image = new Image();
    image.src = source;
    return image;
  });
  const assets = [...initialSprites, ...portraitPreloads];
  let loaded = 0;
  loadingTitle.textContent = '첫 번째 꿈을 불러오는 중';
  loadingCopy.textContent = '하린의 기억과 연결하고 있어요. 잠시만 기다려 주세요.';
  loadingFill.style.width = '4%';
  loadingSplash.classList.remove('hidden');
  await Promise.all(assets.map((image) => new Promise((resolve) => {
    const done = () => {
      loaded += 1;
      loadingFill.style.width = `${Math.round(8 + loaded / assets.length * 92)}%`;
      loadingCopy.textContent = `꿈의 장면 ${loaded} / ${assets.length} 준비 완료`;
      resolve();
    };
    ensureSprite(image);
    if (image.complete) done();
    else {
      image.addEventListener('load', done, { once: true });
      image.addEventListener('error', done, { once: true });
    }
  })));
  if (run !== loadingRun) return;
  loadingTitle.textContent = '연결 준비 완료';
  loadingCopy.textContent = '하린의 꿈이 너의 상상을 기다리고 있어요.';
  await new Promise((resolve) => setTimeout(resolve, 220));
  if (run !== loadingRun) return;
  loadingSplash.classList.add('hidden');
  onReady();
}

// 완료한 스테이지 번호(0부터 시작)를 키로 쓰는 대화 장면들.
// portrait 값은 나중에 assets/portraits/<portrait>.png 를 넣으면 바로 해당 픽셀 일러스트를 표시한다.
const PROLOGUE_STORY = Object.freeze({
  tag: 'DREAM LINK · PROLOGUE',
  title: '꿈을 빼앗긴 밤',
  finishLabel: '하린의 꿈으로',
  lines: [
    { speaker: '하린', portrait: 'harin', text: '어제도 웃는 꿈을 꿨는데… 깨어나니까 왜 웃었는지 기억이 안 나. 요즘은 웃는 게 조금 무서워.' },
    { speaker: '전 조수', portrait: 'assistant', text: '하린뿐만이 아니야. 누군가 아이들의 꿈과 감정을 빼앗아, 한 아이만을 위한 완벽한 꿈을 유지하고 있어.' },
    { speaker: '윤호', portrait: 'protagonist', text: '그 아이도 우리 친구잖아요. 누군가의 행복 때문에 다른 친구가 울면 안 돼요.' },
    { speaker: '전 조수', portrait: 'assistant', text: '이 장치로 하린의 꿈에 들어가. 꿈속에서는 네가 믿는 상상력이 규칙을 바꿀 수 있어. 부수는 게 아니라, 빼앗긴 기억을 돌려주는 거야.' },
    { speaker: '윤호', portrait: 'protagonist', text: '그럼 하린의 웃음부터 찾아올게요. 모두가 다시 자기 꿈을 꾸게 될 때까지.' },
  ],
});

const STORY_BEATS = {
  0: {
    tag: 'DREAM LINK · A SMALL PROMISE', title: '처음으로 닿은 꿈', artId: 'story-00-first-link',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '접속은 성공했어. 네가 한 걸음 내디딜 때마다, 이 꿈은 “아직 돌아올 수 있다”고 대답하고 있어.' },
      { speaker: '윤호', portrait: 'protagonist', text: '그럼 제가 계속 걸을게요. 하린이 혼자 무서워하지 않게.' },
    ],
  },
  1: {
    tag: 'MEMORY LOG · FIRST ECHO', title: '한 명이었던 나는, 둘이 되었다', artId: 'story-01-first-echo',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '봤지? 방금 전의 네가 지금의 너를 기다렸어. 꿈은 혼자 견디는 곳이 아니야.' },
      { speaker: '윤호', portrait: 'protagonist', text: '과거의 나도 같이 도와줄 수 있다면… 하린에게도 혼자가 아니라고 말해 줄 수 있어요.' },
    ],
  },
  2: {
    tag: 'HARIN · THE CAROUSEL LIGHT', title: '꺼져 가는 회전목마', artId: 'story-02-carousel-light',
    lines: [
      { speaker: '하린의 기억', portrait: 'harin', text: '다른 애들은 다 웃고 있는데… 나만 웃지 못하면 어떡하지? 그러면 아무도 나를 찾지 않을 것 같아.' },
      { speaker: '윤호', portrait: 'protagonist', text: '하린아, 네가 못 웃는 날에도 나는 널 찾을 거야. 그러니까 조금만 기다려.' },
    ],
  },
  3: {
    tag: 'HARIN · BEFORE THE FEAR', title: '웃지 못할까 봐 무서웠던 아이', artId: 'story-03-harin-fear',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '광대는 하린을 해치려는 낯선 괴물이 아니야. “혼자 남을까 봐” 떨던 마음이 추출기에 붙잡힌 거야.' },
      { speaker: '윤호', portrait: 'protagonist', text: '그럼 쓰러뜨리지 않을 거예요. 하린이 좋아했던 순간을 다시 보여 줄게요.' },
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
      { speaker: '윤호', portrait: 'protagonist', text: '들려, 유나야. 네 노래가 완전히 사라진 건 아니야. 내가 찾으러 갈게.' },
    ],
  },
  6: {
    tag: 'YUNA · THE EMPTY CHAIR', title: '비어 있는 자리의 목소리', artId: 'story-06-yuna-empty-chair',
    lines: [
      { speaker: '유나', portrait: 'yuna', text: '빈자리를 볼 때마다, 내가 누군가에게 잊힌 것 같았어. 그래서 노래를 불러도 아무도 듣지 못할까 봐 무서웠어.' },
      { speaker: '윤호', portrait: 'protagonist', text: '비어 있는 자리는 네가 함께했던 시간을 지우지 못해. 내가 그 자리를 같이 지킬게.' },
    ],
  },
  7: {
    tag: 'YUNA · THE MISSING SCORE', title: '빠진 음표 사이에서', artId: 'story-07-yuna-missing-score',
    lines: [
      { speaker: '유나', portrait: 'yuna', text: '악보의 빈칸을 볼 때마다 내가 잘못 불렀다고 생각했어. 그래서 다음 음을 내는 게 무서웠어.' },
      { speaker: '윤호', portrait: 'protagonist', text: '비어 있는 음도 같이 채우면 돼. 유나가 멈춘 자리부터 다시 시작하자.' },
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
      { speaker: '윤호', portrait: 'protagonist', text: '그럼 우리가 먼저 들을게요. 유나의 가장 작은 목소리까지.' },
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
      { speaker: '윤호', portrait: 'protagonist', text: '한 번 멈춘다고 길이 없어지는 건 아니야. 이번에는 같이 달리자.' },
    ],
  },
  12: {
    tag: 'HA-NEUL · FIRST RUSH', title: '바람보다 먼저 내딛는 발', artId: 'story-12-haneul-dash',
    lines: [
      { speaker: '하늘', portrait: 'haneul', text: '멀어서 못 갈 것 같으면, 나는 그냥 더 빨리 달렸어. 그런데 이 길은 자꾸 나를 처음으로 돌려보내.' },
      { speaker: '윤호', portrait: 'protagonist', text: '이번에는 되돌아오더라도 괜찮아. 다시 출발할 기억을 남겨 둘게.' },
    ],
  },
  13: {
    tag: 'HA-NEUL · THE TRUE DIRECTION', title: '표지판보다 믿을 수 있는 것', artId: 'story-13-haneul-sign',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '바람은 길을 지우고, 표지판은 거짓말을 해. 하지만 하늘이의 기억만은 계속 앞으로를 가리키고 있어.' },
      { speaker: '윤호', portrait: 'protagonist', text: '그럼 바람이 뭐라고 하든, 우리가 기억한 방향으로 갈 거야.' },
    ],
  },
  14: {
    tag: 'HA-NEUL · ABOVE THE HEADWIND', title: '한 가지 방법만으로는 못 가는 길', artId: 'story-14-haneul-wall',
    lines: [
      { speaker: '하늘', portrait: 'haneul', text: '나는 빨리만 가면 된다고 생각했어. 그런데 혼자 달릴수록 더 멀어지는 느낌이었어.' },
      { speaker: '윤호', portrait: 'protagonist', text: '달리는 것도, 기다리는 것도, 도움을 받는 것도 전부 앞으로 가는 방법이야.' },
    ],
  },
  15: {
    tag: 'HA-NEUL · BEFORE THE KITE', title: '제자리일까 봐 무서웠던 아이', artId: 'story-15-haneul-fear',
    lines: [
      { speaker: '전 조수', portrait: 'assistant', text: '검은 연은 하늘이를 끌어내리려는 괴물이 아니야. 아무리 달려도 달라지지 않을까 봐 떨던 마음이야.' },
      { speaker: '윤호', portrait: 'protagonist', text: '하늘아, 이번에는 네가 달린 길이 여기 남아 있어. 내가 봤어.' },
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
      { speaker: '윤호', portrait: 'protagonist', text: '그 소리가 들린다면, 네가 잘못된 게 아니야. 같이 어디에서 오는지 찾아보자.' },
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
      { speaker: '윤호', portrait: 'protagonist', text: '네가 웃었던 게 잘못은 아니야. 이제부터는 아무도 울지 않는 방법을 같이 찾으면 돼.' },
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

// 최종전 뒤에는 결과 화면 대신 과학자의 기억을 따라가는 짧은 시네마틱을 재생한다.
// 실제 픽셀 일러스트가 추가되면 각 kind에 맞는 이미지로 교체할 수 있도록 장면의 의미를 분리해 둔다.
const ENDING_CINEMATIC_SCENES = [
  {
    kind: 'promise', duration: 4.6, tag: 'MEMORY 01 · A SMALL PROMISE', title: '딸이 가장 좋아하던 꿈',
    caption: '사고 전, 아버지와 딸은 친구들과 같은 꿈을 나누던 사이였다.',
    speaker: '수면 과학자', line: '“오늘 밤도 꿈에서 회전목마를 타자.” 그 약속만은 지켜주고 싶었다.',
  },
  {
    kind: 'hospital', duration: 5.1, tag: 'MEMORY 02 · THE SILENT ROOM', title: '눈을 뜨지 못하는 딸',
    caption: '사고 뒤 딸은 살아 있었지만, 현실에서는 아무것도 경험할 수 없었다.',
    speaker: '수면 과학자', line: '“현실에서 아무것도 해줄 수 없다면… 꿈에서만이라도 웃게 해줘.”',
  },
  {
    kind: 'machine', duration: 5.0, tag: 'MEMORY 03 · THE DREAM MACHINE', title: '행복을 붙잡는 기계',
    caption: '꿈을 연결하는 장치는 완벽한 세계를 만들었지만, 유지하려면 누군가의 기억이 필요했다.',
    speaker: '전 조수', line: '“그 기계는 꿈을 살리는 대신, 다른 아이들의 감정까지 연료로 삼기 시작했어요.”',
  },
  {
    kind: 'cost', duration: 5.0, tag: 'MEMORY 04 · THE PRICE', title: '넘어서는 안 될 선',
    caption: '딸의 꿈이 밝아질수록, 친구들의 밤은 악몽이 되고 웃음은 조금씩 사라졌다.',
    speaker: '수면 과학자', line: '“한 번만 더… 내 딸에게는 이 꿈밖에 남지 않았어.”',
  },
  {
    kind: 'choice', duration: 5.1, tag: 'MEMORY 05 · HER CHOICE', title: '딸이 고른 행복',
    caption: '진실을 알게 된 딸은, 자신을 위한 꿈보다 친구들의 행복을 먼저 선택했다.',
    speaker: '수면 과학자의 딸', line: '“아빠, 나 혼자 웃는 건 행복이 아니야. 친구들의 꿈을 돌려줘.”',
  },
  {
    kind: 'morning', duration: 5.4, tag: 'MEMORY 06 · A NEW MORNING', title: '현실을 향한 아침',
    caption: '완벽한 꿈은 사라지지만, 누구의 행복도 빼앗기지 않은 새 기억이 시작된다.',
    speaker: '수면 과학자', line: '“미안하다. 이제는 네 곁에서, 현실의 슬픔도 함께 견딜게.”',
  },
];

const PROGRESS_STORAGE_KEY = 'dream-child-campaign-progress-v2';
const BGM_VOLUME_STORAGE_KEY = 'dream-child-bgm-volume-v2';
const LEGACY_BGM_VOLUME_STORAGE_KEY = 'dream-child-bgm-volume-v1';
const BOSS_MEMORY_COLLAPSE_SECONDS = 60;
const campaign = loadCampaignProgress();

const keys = new Set();
const pressed = new Set();
let toastTimer = 0;
let lastFrame = 0;
let game = {};
const stageBgm = {
  enabled: true,
  key: null,
  family: null,
  audio: null,
  nextAudio: null,
  crossfadeFrame: 0,
  mix: null,
  masterVolume: loadBgmMasterVolume(),
  targetVolume: .65,
  fadeFrame: 0,
  frozen: false,
  playBlocked: false,
};
let gameSfxContext = null;
const yunaLoopStation = { active: false, stageIndex: -1, key: null, level: 0, maxLevel: 0, milestones: new Set() };
const YUNA_LOOP_LAYER_NAMES = Object.freeze(['저음 레이어', '리듬 레이어', '멜로디 레이어', '합창 잔향']);

const MOVEMENT_TUNING = {
  puzzle: { maxSpeed: 290, accelerationTime: .16, stopTime: .11, turnTime: .18, airControl: .55 },
  boss: { maxSpeed: 310, accelerationTime: .16, stopTime: .11, turnTime: .18 },
};
// 화면 기준 시계 방향 순서. P는 시계 방향, Y는 반시계 방향으로 자유롭게 순환한다.
const CAROUSEL_PHASES = Object.freeze([
  Object.freeze({ id: 'moon', label: '서쪽 · 달빛', color: '#ffe37d' }),
  Object.freeze({ id: 'memory', label: '북서쪽 · 기억', color: '#c6a5ff' }),
  Object.freeze({ id: 'star', label: '북동쪽 · 별빛 잠금', color: '#8ff5e8' }),
  Object.freeze({ id: 'exit', label: '동쪽 · 출구', color: '#fff0a8' }),
  Object.freeze({ id: 'ribbon', label: '남동쪽 · 리본 잠금', color: '#ff9fcf' }),
]);
const CAROUSEL_RING_CENTER = Object.freeze({ x: 480, y: 270 });
const CAROUSEL_RING_RADIUS = 170;
const CAROUSEL_RING_SEGMENT_SIZE = 20;
const CAROUSEL_RING_SEGMENT_COUNT = 72;
const CAROUSEL_RING_GAP_HALF_ANGLE = Math.PI * 21 / 180;
const CAROUSEL_RING_ROTATIONS = Object.freeze({
  moon: 0,
  memory: Math.PI / 4,
  star: Math.PI * 3 / 4,
  exit: -Math.PI,
  ribbon: -Math.PI * 2 / 3,
});
const CAROUSEL_ROTATION_SECONDS = .62;
const CAROUSEL_REQUIRED_RELAYS = 2;
const PLATFORM_DROP_THROUGH_SECONDS = .16;
const WIND_GATE_OUTER_PADDING = 9;
const HANEUL_VANE_BOSS_HP = 6;
const HANEUL_VANE_KITE_DAMAGE = 16;
const HANEUL_VANE_CAPTURE_LENGTH = 116;
const HANEUL_VANE_CAPTURE_HALF_WIDTH = 42;
const HANEUL_VANE_TURN_SPEED = Math.PI * 3 / 4;
const HANEUL_VANE_BOSS_POSITIONS = Object.freeze({
  '2': { x: 700, y: 42, label: '2시' },
  '10': { x: 124, y: 42, label: '10시' },
  '12': { x: 412, y: 20, label: '12시' },
});
const HANEUL_VANE_DIRECTIONS = Object.freeze([
  { angle: -Math.PI / 2, label: '위' },
  { angle: -Math.PI / 4, label: '오른쪽 위' },
  { angle: 0, label: '오른쪽' },
  { angle: Math.PI / 4, label: '오른쪽 아래' },
  { angle: Math.PI / 2, label: '아래' },
  { angle: Math.PI * 3 / 4, label: '왼쪽 아래' },
  { angle: Math.PI, label: '왼쪽' },
  { angle: -Math.PI * 3 / 4, label: '왼쪽 위' },
]);

function moveToward(value, target, maxDelta) {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}

function acceleratedVelocity(value, axis, tuning, dt, control = 1) {
  const target = axis * tuning.maxSpeed;
  const reversing = axis !== 0 && value !== 0 && Math.sign(axis) !== Math.sign(value);
  const rate = axis === 0
    ? tuning.maxSpeed / tuning.stopTime
    : reversing
      ? tuning.maxSpeed * 2 / tuning.turnTime
      : tuning.maxSpeed / tuning.accelerationTime;
  return moveToward(value, target, rate * control * dt);
}

function horizontalInput() {
  return (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0)
    - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
}

function verticalInput() {
  return (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0)
    - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
}

function freshPlayer() {
  return { x: 72, y: 452, w: 25, h: 34, vx: 0, vy: 0, grounded: false, facing: 1 };
}

function loadCampaignProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || localStorage.getItem('dream-child-campaign-progress-v1') || '{}');
    return {
      unlocked: Math.max(0, Math.min(STAGES.length - 1, Number(saved.unlocked) || 0)),
      memories: new Set(Array.isArray(saved.memories) ? saved.memories : []),
      skills: new Set(Array.isArray(saved.skills) ? saved.skills.filter((skill) => skill !== 'gravity') : []),
      cleared: new Set(Array.isArray(saved.cleared) ? saved.cleared.map(Number).filter(Number.isInteger) : []),
      bossRecords: saved.bossRecords && typeof saved.bossRecords === 'object' ? saved.bossRecords : {},
      puzzleRecords: saved.puzzleRecords && typeof saved.puzzleRecords === 'object' ? saved.puzzleRecords : {},
      routeMode: saved.routeMode === 'campaign' ? 'campaign' : 'development',
    };
  } catch {
    return { unlocked: 0, memories: new Set(), skills: new Set(), cleared: new Set(), bossRecords: {}, puzzleRecords: {}, routeMode: 'development' };
  }
}

function saveCampaignProgress() {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
      unlocked: campaign.unlocked,
      memories: [...campaign.memories],
      skills: [...campaign.skills],
      cleared: [...campaign.cleared],
      bossRecords: campaign.bossRecords,
      puzzleRecords: campaign.puzzleRecords,
      routeMode: campaign.routeMode,
    }));
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

function freshGameState(phase = 'intro') {
  return {
    phase, stageIndex: 0, imagination: 100, elapsed: 0,
    player: freshPlayer(), platforms: [], boss: null, dreamShots: [], nightmareShots: [], fireCooldown: 0,
    nextAttack: 1.2, message: '', completed: [], memories: new Set(campaign.memories), learnedSkills: new Set(campaign.skills), fragments: [], echoes: [], recording: null, memoryRecordsUsed: 0, reactionSeen: new Set(), rewindExpressionTimer: 0, dreamTrails: [], dashTrailClock: 0, dashVisualTimer: 0, memoryPads: [], fallZones: [], transition: 'start', stageIntroTimer: null, dashCooldown: 0, dashTimer: 0, dashDirection: 1, watcherResolved: false,
    carouselRelays: new Set(), carouselSwitches: [],
    stageRealElapsed: 0, challenge: null, bossGuideKey: '', bossGuideUntil: 0, bossGuideStarted: 0,
    windPillarCollapse: 0, windPillarReleased: false, windPillarCollapseAnnounced: false, headwindHintShown: false, signpostMaze: null,
    stage02Restoration: 0, stage02RestorationAnnounced: false,
  };
}

function newGame() {
  stopStageBgm();
  endScreen.classList.remove('epilogue-screen');
  gameHud.classList.remove('hidden');
  game = freshGameState();
  establishFirstDreamLink(() => showStoryBeat(PROLOGUE_STORY));
}

function startGameFromTitle() {
  // 타이틀에서 시작해도 첫 접속 대화와 프롤로그를 거친 뒤 스테이지 1로 들어간다.
  newGame();
}

function closeTitleSettings() {
  titleSettings?.classList.add('hidden');
  settingsButton?.setAttribute('aria-expanded', 'false');
}

function closeStorySummary() {
  storySummaryModal?.classList.add('hidden');
}

function closeTitleModals() {
  closeTitleSettings();
  closeStorySummary();
}

function showTitleScreen() {
  window.scrollTo(0, 0);
  loadingRun += 1;
  loadingSplash.classList.add('hidden');
  contextControls.classList.add('hidden');
  hideFriendReaction();
  stopStageBgm();
  game = freshGameState('title');
  document.body.classList.add('title-screen-active');
  gameHud.classList.add('hidden');
  bossHud.classList.add('hidden');
  storyDialogue.classList.add('hidden');
  closeTitleModals();
  startScreen.classList.remove('story-mode', 'boss-intro');
  startScreen.classList.add('title-mode');
  startTag.textContent = '꿈의 연결';
  startTitle.textContent = '꿈을 잇는 아이';
  startCopy.textContent = '빼앗긴 친구들의 꿈을 되돌리기 위한 첫 번째 접속. 하린의 웃음이 사라지기 전에, 꿈의 문을 열어주세요.';
  startButton.innerHTML = '게임 시작 <span>↵</span>';
  startScreen.classList.remove('hidden');
  stageMenu.classList.add('hidden');
  endScreen.classList.remove('epilogue-screen');
  endScreen.classList.add('hidden');
  renderCampaignRoute();
}

function clearStageIntroTimer() {
  if (game.stageIntroTimer) {
    clearTimeout(game.stageIntroTimer);
    game.stageIntroTimer = null;
  }
}

function currentStage() { return STAGES[game.stageIndex]; }

function loadBgmMasterVolume() {
  try {
    const stored = localStorage.getItem(BGM_VOLUME_STORAGE_KEY);
    if (stored === null) {
      const legacy = Number(localStorage.getItem(LEGACY_BGM_VOLUME_STORAGE_KEY));
      return Number.isFinite(legacy) && legacy > 0 && legacy <= 1 ? legacy : .65;
    }
    const saved = Number(stored);
    if (Number.isFinite(saved) && saved >= 0 && saved <= 1) return saved;
  } catch {
    // 저장소가 제한된 브라우저에서는 기본 음량으로 계속됩니다.
  }
  return .65;
}

function saveBgmMasterVolume() {
  try {
    localStorage.setItem(BGM_VOLUME_STORAGE_KEY, stageBgm.masterVolume.toFixed(2));
  } catch {
    // 저장 실패는 현재 세션의 음량 조절을 막지 않습니다.
  }
}

function stageBgmKey(stage = currentStage()) {
  const chapter = stage?.chapter || '';
  if (chapter.includes('하린') && HARIN_STAGE_MUSIC_PATHS[game.stageIndex]) return `harin-${game.stageIndex + 1}`;
  if (chapter.includes('하늘') && HANEUL_STAGE_MUSIC_PATHS[game.stageIndex - 12]) return `haneul-${game.stageIndex + 1}`;
  // 22스테이지는 PAGE 02 챕터명이라 인물 이름이 제목에 없더라도, 최종장 음악은 스테이지 번호로 확정한다.
  if (game.stageIndex >= 18 && FINAL_CHAPTER_STAGE_MUSIC_PATHS[game.stageIndex - 18]) return `final-${game.stageIndex + 1}`;
  if (!chapter.includes('유나')) return null;
  if (stage.type === 'boss') return 'resonance';
  return ({ 7: 'tide', 8: 'glass', 9: 'silent', 10: 'glass', 12: 'tide' })[game.stageIndex + 1] || 'tide';
}

function normalizedBgmSource(source) {
  // Work files stay as WAV in `normalized`; the shipped build uses the
  // matching compressed MP3 files so the first dream can begin promptly.
  return source
    ?.replace(/^assets\/audio\//, 'assets/audio/compressed/')
    .replace(/\.wav$/i, '.mp3');
}

function stageBgmConfig(key) {
  if (key === 'ending') {
    return {
      family: 'ending',
      source: normalizedBgmSource(ENDING_BGM_SOURCE),
      volume: .78,
      loop: true,
      fadeInDuration: 1250,
    };
  }
  if (key?.startsWith('harin-')) {
    const stageNumber = Number(key.slice('harin-'.length));
    const source = HARIN_STAGE_MUSIC_PATHS[stageNumber - 1];
    if (!source) return null;
    return { family: 'harin', source: normalizedBgmSource(source), volume: CHARACTER_BGM_TRIM.harin, loop: stageNumber !== 5 };
  }
  if (key?.startsWith('haneul-')) {
    const stageNumber = Number(key.slice('haneul-'.length));
    const source = HANEUL_STAGE_MUSIC_PATHS[stageNumber - 13];
    return source ? { family: 'haneul', source: normalizedBgmSource(source), volume: CHARACTER_BGM_TRIM.haneul, loop: true } : null;
  }
  if (key?.startsWith('final-')) {
    const stageNumber = Number(key.slice('final-'.length));
    const source = FINAL_CHAPTER_STAGE_MUSIC_PATHS[stageNumber - 19];
    if (!source) return null;
    const family = stageNumber === 22 ? 'scientist' : 'daughter';
    return { family, source: normalizedBgmSource(source), volume: CHARACTER_BGM_TRIM[family], loop: true };
  }
  const source = YUNA_BGM_PATHS[key];
  return source ? { family: 'yuna', source: normalizedBgmSource(source), volume: CHARACTER_BGM_TRIM.yuna, loop: true } : null;
}

function updateBgmVolumeControl() {
  const percent = Math.round(stageBgm.masterVolume * 100);
  [[bgmVolumeSlider, bgmVolumeValue], [pauseBgmVolumeSlider, pauseBgmVolumeValue]].forEach(([slider, value]) => {
    if (!slider || !value) return;
    slider.value = String(percent);
    slider.setAttribute('aria-valuetext', `${percent}%`);
    value.value = `${percent}%`;
    value.textContent = `${percent}%`;
  });
}

function setBgmMasterVolume(value, persist = false) {
  stageBgm.masterVolume = Math.max(0, Math.min(1, Number(value) || 0));
  const config = stageBgmConfig(stageBgm.key);
  if (config) stageBgm.targetVolume = Math.min(1, config.volume * stageBgm.masterVolume);
  if (stageBgm.audio) {
    cancelStageBgmFade();
    stageBgm.audio.volume = stageBgm.enabled ? (game.phase === 'story' ? storyBgmVolume() : stageBgm.targetVolume) : 0;
    if (stageBgm.enabled && stageBgm.audio.paused && !stageBgm.frozen && (game.phase === 'playing' || game.phase === 'ending-cinematic' || game.phase === 'truth')) playStageBgm();
  }
  updateBgmVolumeControl();
  if (persist) saveBgmMasterVolume();
}

function updateBgmToggle(key = stageBgm.key) {
  const visible = Boolean(key);
  if (bgmControls) bgmControls.classList.toggle('hidden', !visible);
  else bgmToggleButton.classList.toggle('hidden', !visible);
  bgmToggleButton.classList.toggle('off', !stageBgm.enabled);
  const stateLabel = !stageBgm.enabled ? '꺼짐' : stageBgm.playBlocked ? '다시 재생' : '켜짐';
  bgmToggleButton.innerHTML = `음악 <span>${stateLabel}</span>`;
  bgmToggleButton.setAttribute('aria-label', stageBgm.playBlocked ? '배경음악 재생 다시 시도' : stageBgm.enabled ? '배경음악 끄기' : '배경음악 켜기');
}

function cancelStageBgmFade() {
  if (!stageBgm.fadeFrame) return;
  cancelAnimationFrame(stageBgm.fadeFrame);
  stageBgm.fadeFrame = 0;
}

function fadeStageBgm(targetVolume, duration = 260, onComplete = null) {
  const audio = stageBgm.audio;
  if (!audio) return;
  cancelStageBgmFade();
  const initialVolume = audio.volume;
  const startedAt = performance.now();
  const tick = (now) => {
    if (stageBgm.audio !== audio) return;
    const progress = Math.max(0, Math.min(1, (now - startedAt) / Math.max(1, duration)));
    audio.volume = Math.max(0, Math.min(1, initialVolume + (targetVolume - initialVolume) * progress));
    if (progress < 1) stageBgm.fadeFrame = requestAnimationFrame(tick);
    else {
      stageBgm.fadeFrame = 0;
      if (onComplete) onComplete(audio);
    }
  };
  stageBgm.fadeFrame = requestAnimationFrame(tick);
}

function playStageBgm(volume = stageBgm.targetVolume, fadeDuration = 260) {
  if (!stageBgm.enabled || !stageBgm.audio || stageBgm.frozen) return;
  const audio = stageBgm.audio;
  audio.muted = false;
  audio.defaultMuted = false;
  const fadeIn = () => {
    if (stageBgm.audio !== audio) return;
    stageBgm.playBlocked = false;
    updateBgmToggle(stageBgm.key);
    fadeStageBgm(volume, fadeDuration);
  };
  const markBlocked = () => {
    if (stageBgm.audio !== audio) return;
    stageBgm.playBlocked = true;
    updateBgmToggle(stageBgm.key);
  };
  const playback = audio.play();
  if (playback?.then) playback.then(fadeIn).catch(markBlocked);
  else fadeIn();
}

function bgmVolume(key = stageBgm.key) {
  const config = stageBgmConfig(key);
  return config ? Math.min(1, config.volume * stageBgm.masterVolume) : stageBgm.targetVolume;
}

function cancelBgmCrossfade({ discardNext = true } = {}) {
  if (stageBgm.crossfadeFrame) cancelAnimationFrame(stageBgm.crossfadeFrame);
  stageBgm.crossfadeFrame = 0;
  if (discardNext && stageBgm.nextAudio) {
    stageBgm.nextAudio.pause();
    stageBgm.nextAudio.currentTime = 0;
    stageBgm.nextAudio = null;
  }
  if (stageBgm.audio) stageBgm.audio.volume = bgmVolume();
}

function startResonanceCrossfade(outgoing) {
  if (!stageBgm.enabled || stageBgm.key !== 'resonance' || stageBgm.audio !== outgoing || stageBgm.nextAudio) return;
  const config = stageBgmConfig('resonance');
  if (!config) return;
  const incoming = new Audio(config.source);
  incoming.loop = false;
  incoming.preload = 'auto';
  incoming.volume = 0;
  stageBgm.nextAudio = incoming;
  const fadeDuration = 1250;
  const beginFade = () => {
    const startedAt = performance.now();
    const fade = (now) => {
      if (!stageBgm.enabled || stageBgm.audio !== outgoing || stageBgm.nextAudio !== incoming) return;
      const progress = Math.min(1, (now - startedAt) / fadeDuration);
      outgoing.volume = bgmVolume() * (1 - progress);
      incoming.volume = bgmVolume() * progress;
      if (progress < 1) {
        stageBgm.crossfadeFrame = requestAnimationFrame(fade);
        return;
      }
      outgoing.pause();
      outgoing.currentTime = 0;
      stageBgm.audio = incoming;
      stageBgm.nextAudio = null;
      stageBgm.crossfadeFrame = 0;
      watchResonanceLoop(incoming);
    };
    stageBgm.crossfadeFrame = requestAnimationFrame(fade);
  };
  const started = incoming.play();
  if (started?.then) started.then(beginFade).catch(() => cancelBgmCrossfade());
  else beginFade();
}

function watchResonanceLoop(audio) {
  audio.addEventListener('timeupdate', () => {
    if (stageBgm.key !== 'resonance' || stageBgm.audio !== audio || stageBgm.nextAudio || !Number.isFinite(audio.duration)) return;
    if (audio.currentTime >= audio.duration - 1.6) startResonanceCrossfade(audio);
  });
  audio.addEventListener('ended', () => {
    if (stageBgm.key === 'resonance' && stageBgm.audio === audio && !stageBgm.nextAudio && stageBgm.enabled) {
      audio.currentTime = 0;
      playStageBgm();
    }
  });
}

function createStageBgmAudio(key, config = stageBgmConfig(key)) {
  if (!config) return null;
  const audio = new Audio(config.source);
  audio.loop = key === 'resonance' ? false : config.loop;
  audio.preload = 'auto';
  audio.volume = bgmVolume(key);
  if (key === 'resonance') watchResonanceLoop(audio);
  return audio;
}

function startStageBgm(stage = currentStage(), { storyMode = false, key: requestedKey = null } = {}) {
  const key = requestedKey || stageBgmKey(stage);
  const config = stageBgmConfig(key);
  if (!key || !config) {
    stopStageBgm();
    return;
  }
  if (stageBgm.key !== key || !stageBgm.audio) {
    cancelStageBgmFade();
    cancelBgmCrossfade();
    stopYunaLoopStation();
    if (stageBgm.audio) stageBgm.audio.pause();
    stageBgm.key = key;
    stageBgm.family = config.family;
    stageBgm.audio = createStageBgmAudio(key, config);
    stageBgm.mix = null;
  } else {
    cancelStageBgmFade();
    cancelBgmCrossfade();
    stageBgm.audio.currentTime = 0;
  }
  stageBgm.targetVolume = Math.min(1, config.volume * stageBgm.masterVolume);
  stageBgm.audio.volume = 0;
  stageBgm.frozen = false;
  stageBgm.playBlocked = false;
  updateBgmToggle(key);
  if (config.family === 'yuna') {
    if (key !== 'resonance') setupYunaLoopMix();
    startYunaLoopStation(stage);
  } else stopYunaLoopStation();
  playStageBgm(storyMode ? storyBgmVolume(key) : stageBgm.targetVolume, config.fadeInDuration || 260);
}

function storyBgmVolume(key = stageBgm.key) {
  return stageBgm.enabled ? bgmVolume(key) * .48 : 0;
}

function continueStoryBgm() {
  if (!stageBgm.enabled) return;
  if (!stageBgm.audio) {
    // 첫 프롤로그에는 아직 이전 스테이지가 없으므로, 첫 꿈의 음악을 잔잔하게 연다.
    startStageBgm(currentStage(), { storyMode: true });
    return;
  }
  if (stageBgm.frozen) return;
  if (stageBgm.audio.ended) stageBgm.audio.currentTime = 0;
  if (stageBgm.audio.paused) playStageBgm(storyBgmVolume());
  else fadeStageBgm(storyBgmVolume(), 420);
}

function pauseStageBgm() {
  cancelStageBgmFade();
  cancelBgmCrossfade();
  const audio = stageBgm.audio;
  if (!audio || audio.paused) return;
  fadeStageBgm(0, 180, (finishedAudio) => {
    if (stageBgm.audio === finishedAudio) finishedAudio.pause();
  });
}

function keepEndingBgmForEpilogue() {
  const config = stageBgmConfig('ending');
  if (!config || !stageBgm.enabled) return;
  const epilogueVolume = Math.min(1, bgmVolume('ending') * .82);
  // 시네마틱 마지막 장면에서 바로 끊지 않고, 같은 루프의 현재 재생 지점을 낮은 볼륨으로 이어 간다.
  // 예외적으로 오디오가 없을 때만 결말 테마를 새로 연다.
  if (stageBgm.key !== 'ending' || !stageBgm.audio) {
    startStageBgm(null, { key: 'ending' });
    return;
  }
  stageBgm.frozen = false;
  stageBgm.targetVolume = epilogueVolume;
  if (stageBgm.audio.paused) playStageBgm(epilogueVolume, 900);
  else fadeStageBgm(epilogueVolume, 1150);
}

function resumeStageBgm() {
  if (game.phase === 'story') continueStoryBgm();
  else if (stageBgm.key) playStageBgm();
}

function stopStageBgm() {
  cancelStageBgmFade();
  stopYunaLoopStation();
  cancelBgmCrossfade();
  if (stageBgm.audio) {
    stageBgm.audio.pause();
    stageBgm.audio.currentTime = 0;
    stageBgm.audio.volume = 0;
  }
  stageBgm.key = null;
  stageBgm.family = null;
  stageBgm.audio = null;
  stageBgm.mix = null;
  stageBgm.frozen = false;
  stageBgm.playBlocked = false;
  updateBgmToggle(null);
}

function primeGameAudio() {
  primeGameSfx();
  if ((game.phase === 'playing' || game.phase === 'ending-cinematic' || game.phase === 'truth') && stageBgm.enabled && stageBgm.audio?.paused && !stageBgm.frozen) playStageBgm();
}

function syncBossBgmTimeStop() {
  // 정지 능력은 꿈속 오브젝트에만 적용하고 BGM의 재생 시간은 계속 흐르게 한다.
  // 이전 실행 상태에서 이미 멈춘 오디오가 남아 있다면 한 번만 정상 재생으로 복구한다.
  const wasFrozen = stageBgm.frozen;
  stageBgm.frozen = false;
  if (wasFrozen && game.phase === 'playing' && stageBgm.enabled && stageBgm.audio?.paused) playStageBgm();
}

function primeGameSfx() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!gameSfxContext) gameSfxContext = new AudioContextClass();
  if (gameSfxContext.state === 'suspended') gameSfxContext.resume().catch(() => {});
  return gameSfxContext;
}

// BGM과 별개로 재생되는 짧은 저음 킥이다. 소리를 끈 플레이어도 박자 판정은 귀로 읽을 수 있다.
function playResonanceBassHit(strong = false) {
  const audio = primeGameSfx();
  if (!audio || audio.state !== 'running') return;
  const now = audio.currentTime;
  const duration = strong ? .31 : .2;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(strong ? 94 : 76, now);
  oscillator.frequency.exponentialRampToValueAtTime(strong ? 42 : 50, now + duration);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(strong ? .16 : .075, now + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + .02);
}

function rampYunaOrchestraMaster(value, duration = .26) {
  const master = yunaOrchestra.master;
  const audio = gameSfxContext;
  if (!master || !audio) return;
  const now = audio.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(Math.max(.0001, master.gain.value), now);
  master.gain.linearRampToValueAtTime(Math.max(.0001, value), now + duration);
}

function stopYunaOrchestra() {
  yunaOrchestra.timers.forEach((timer) => clearInterval(timer));
  const audio = gameSfxContext;
  const now = audio?.currentTime || 0;
  yunaOrchestra.voices.forEach((voice) => {
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.linearRampToValueAtTime(.0001, now + .08);
      voice.osc.stop(now + .1);
    } catch {}
  });
  if (yunaOrchestra.master) {
    try { yunaOrchestra.master.disconnect(); } catch {}
  }
  yunaOrchestra.active = false;
  yunaOrchestra.stageIndex = -1;
  yunaOrchestra.master = null;
  yunaOrchestra.voices = [];
  yunaOrchestra.timers = [];
  yunaOrchestra.layers = new Set();
}

function setupYunaOrchestra(stage = currentStage()) {
  const key = stageBgmKey(stage);
  stopYunaOrchestra();
  if (!key) return;
  const audio = primeGameSfx();
  if (!audio) return;
  const master = audio.createGain();
  master.gain.value = .0001;
  master.connect(audio.destination);
  yunaOrchestra.active = true;
  yunaOrchestra.stageIndex = game.stageIndex;
  yunaOrchestra.master = master;
  rampYunaOrchestraMaster(stageBgm.enabled ? .76 : .0001, .38);
}

function createYunaOrchestraVoice(frequency, type, volume, filterFrequency) {
  const audio = gameSfxContext;
  const master = yunaOrchestra.master;
  if (!audio || !master) return null;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFrequency, now);
  filter.Q.value = .55;
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + .55);
  osc.connect(filter).connect(gain).connect(master);
  osc.start(now);
  const voice = { osc, gain };
  yunaOrchestra.voices.push(voice);
  return voice;
}

function yunaOrchestraRoot() {
  return YUNA_ORCHESTRA_ROOTS[stageBgm.key] || 146.83;
}

function playYunaPianoTone(frequency, startAt, volume = .065) {
  const audio = gameSfxContext;
  const master = yunaOrchestra.master;
  if (!audio || !master) return;
  const tone = audio.createOscillator();
  const sparkle = audio.createOscillator();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  tone.type = 'triangle'; sparkle.type = 'sine';
  tone.frequency.setValueAtTime(frequency, startAt);
  sparkle.frequency.setValueAtTime(frequency * 2, startAt);
  filter.type = 'lowpass'; filter.frequency.setValueAtTime(2100, startAt); filter.Q.value = .45;
  gain.gain.setValueAtTime(.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + .012);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * .26), startAt + .16);
  gain.gain.exponentialRampToValueAtTime(.0001, startAt + .84);
  tone.connect(filter).connect(gain).connect(master);
  sparkle.connect(gain);
  tone.start(startAt); sparkle.start(startAt);
  tone.stop(startAt + .88); sparkle.stop(startAt + .62);
}

function playYunaGlockTone(frequency, startAt, volume = .05) {
  const audio = gameSfxContext;
  const master = yunaOrchestra.master;
  if (!audio || !master) return;
  const tone = audio.createOscillator();
  const overtone = audio.createOscillator();
  const gain = audio.createGain();
  tone.type = 'sine'; overtone.type = 'sine';
  tone.frequency.setValueAtTime(frequency, startAt);
  overtone.frequency.setValueAtTime(frequency * 2.76, startAt);
  gain.gain.setValueAtTime(.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + .01);
  gain.gain.exponentialRampToValueAtTime(.0001, startAt + 1.15);
  tone.connect(gain).connect(master);
  overtone.connect(gain);
  tone.start(startAt); overtone.start(startAt);
  tone.stop(startAt + 1.2); overtone.stop(startAt + .78);
}

function playYunaPianoArpeggio() {
  if (!yunaOrchestra.active || !yunaOrchestra.master) return;
  const audio = gameSfxContext;
  if (!audio) return;
  const root = yunaOrchestraRoot();
  const highRoot = root < 100 ? root * 4 : root * 2;
  const notes = [highRoot, highRoot * 1.18921, highRoot * 1.5, highRoot * 1.7818, highRoot * 1.5, highRoot * 1.18921];
  notes.forEach((note, index) => playYunaPianoTone(note, audio.currentTime + index * .19, index === 0 ? .072 : .048));
}

function playYunaGlockChord() {
  if (!yunaOrchestra.active || !yunaOrchestra.master) return;
  const audio = gameSfxContext;
  if (!audio) return;
  const root = yunaOrchestraRoot();
  const highRoot = root < 100 ? root * 4 : root * 2;
  [highRoot, highRoot * 1.18921, highRoot * 1.5].forEach((note, index) => playYunaGlockTone(note, audio.currentTime + index * .12, index === 0 ? .055 : .04));
}

function activateYunaOrchestraLayer(level) {
  if (!yunaOrchestra.active || yunaOrchestra.layers.has(level)) return;
  const audio = gameSfxContext;
  if (!audio || !yunaOrchestra.master) return;
  yunaOrchestra.layers.add(level);
  const root = yunaOrchestraRoot();
  if (level === 1) {
    // 첫 건반은 곡의 바닥을 잡는 첼로 저음으로, 원곡의 저역을 과도하게 덮지 않게 얇게 깐다.
    createYunaOrchestraVoice(root, 'triangle', .028, 430);
    createYunaOrchestraVoice(root * 2, 'sine', .012, 620);
    playYunaPianoTone(root * 2, audio.currentTime, .055);
  } else if (level === 2) {
    playYunaPianoArpeggio();
    yunaOrchestra.timers.push(setInterval(playYunaPianoArpeggio, 2400));
  } else if (level === 3) {
    // 현악과 합창은 D단조 화음의 지속음이라, 원곡의 박자와 무관하게 자연스럽게 겹친다.
    const chordRoot = root < 100 ? root * 2 : root;
    createYunaOrchestraVoice(chordRoot, 'sine', .013, 940);
    createYunaOrchestraVoice(chordRoot * 1.18921, 'triangle', .011, 1280);
    createYunaOrchestraVoice(chordRoot * 1.5, 'sine', .01, 1500);
    playYunaPianoArpeggio();
  } else if (level === 4) {
    playYunaGlockChord();
    yunaOrchestra.timers.push(setInterval(playYunaGlockChord, 3600));
  }
}

function setYunaOrchestraMuted(muted) {
  if (!yunaOrchestra.active) return;
  rampYunaOrchestraMaster(muted ? .0001 : .76, muted ? .12 : .24);
}

function startYunaLoopStation(stage = currentStage()) {
  const key = stageBgmKey(stage);
  if (!key) {
    stopYunaLoopStation();
    return;
  }
  yunaLoopStation.active = true;
  yunaLoopStation.stageIndex = game.stageIndex;
  yunaLoopStation.key = key;
  yunaLoopStation.level = 0;
  yunaLoopStation.maxLevel = stage.type === 'boss' ? 4 : 3;
  yunaLoopStation.milestones = new Set();
  // 보스 이후의 짧은 길은 유나가 되찾은 완성된 노래를 들려주는 보상 구간이다.
  if (stage.layout === 'walk') {
    yunaLoopStation.level = yunaLoopStation.maxLevel;
    yunaLoopStation.milestones.add('recovered-song');
  }
  applyYunaLoopMix();
}

function stopYunaLoopStation() {
  yunaLoopStation.active = false;
  yunaLoopStation.stageIndex = -1;
  yunaLoopStation.key = null;
  yunaLoopStation.level = 0;
  yunaLoopStation.maxLevel = 0;
  yunaLoopStation.milestones = new Set();
}

// 유나의 기본 BGM은 브라우저의 미디어 출력으로 직접 재생한다.
// Web Audio가 일시 정지된 환경에서도 원곡이 무음으로 빠지지 않게 한다.
function setupYunaLoopMix() {
  if (!stageBgm.audio || !stageBgm.key || stageBgm.mix) return;
  stageBgm.mix = { unavailable: true, direct: true };
}

function rampYunaMixGain(gain, value) {
  if (!gain || !stageBgm.mix?.audio) return;
  const now = stageBgm.mix.audio.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(value, now + .38);
}

function applyYunaLoopMix() {
  const mix = stageBgm.mix;
  if (!mix || mix.unavailable) return;
  const level = yunaLoopStation.active ? yunaLoopStation.level : 0;
  rampYunaMixGain(mix.bassGain, level >= 1 ? .34 : 0);
  rampYunaMixGain(mix.rhythmGain, level >= 2 ? .14 : 0);
  rampYunaMixGain(mix.melodyGain, level >= 3 ? .1 : 0);
  rampYunaMixGain(mix.roomGain, level >= 4 ? .07 : 0);
}

function unlockYunaMusicLayer(milestone) {
  if (!yunaLoopStation.active || yunaLoopStation.milestones.has(milestone)) return;
  yunaLoopStation.milestones.add(milestone);
  if (yunaLoopStation.level >= yunaLoopStation.maxLevel) return;
  yunaLoopStation.level += 1;
  applyYunaLoopMix();
  const name = YUNA_LOOP_LAYER_NAMES[yunaLoopStation.level - 1];
  say(`LOOP ${String(yunaLoopStation.level).padStart(2, '0')} · ${name}가 유나의 노래에 쌓였습니다.`);
}

function playerIsHoldingYunaPlatform(platform) {
  const p = game.player;
  return Boolean(p && p.x + p.w > platform.x + 3 && p.x < platform.x + platform.w - 3 && Math.abs(p.y + p.h - platform.y) < 10);
}

function updateYunaPuzzleMusic(techniques) {
  if (!yunaLoopStation.active || currentStage()?.type !== 'puzzle') return;
  if (techniques.resonance) {
    game.platforms.filter((platform) => platform.hidden && playerIsHoldingYunaPlatform(platform)).forEach((platform) => {
      unlockYunaMusicLayer(`resonance-path:${platform.label}`);
    });
  }
  game.memoryPads.forEach((pad) => {
    if (activeMemoryPads([pad]) > 0) unlockYunaMusicLayer(`memory-pad:${pad.label}`);
  });
}

function updateYunaBossMusic(b) {
  if (!yunaLoopStation.active || b.mode !== 'resonance') return;
  b.memoryPads.forEach((pad) => {
    if (activeMemoryPads([pad]) > 0) unlockYunaMusicLayer(`harmony-anchor:${pad.label}`);
  });
  for (let index = 0; index < b.resonanceProgress; index += 1) unlockYunaMusicLayer(`restored-note:${index}`);
}

function isSkillBlocked(skill) {
  return Boolean(currentStage()?.blockedSkills?.includes(skill));
}
function hasSkill(skill) {
  return !isSkillBlocked(skill) && Boolean(game.learnedSkills?.has(skill) || currentStage()?.skills.includes(skill));
}

function dreamTheme(stage = currentStage()) {
  const chapter = stage?.chapter || '';
  if (stage?.bossConfig?.mode === 'final' || stage?.page === 2) {
    return { id: 'scientist', label: '수면 과학자의 연구실', top: '#211536', mid: '#132d49', bottom: '#0a172c', line: '#6f77bb', accent: '#7be9ff', soft: '#d4b5ff', platform: '#243e69', edge: '#8cf0ff' };
  }
  if (chapter.includes('유나')) {
    return { id: 'yuna', label: '유나의 잃어버린 합창', top: '#08373e', mid: '#092a45', bottom: '#10153d', line: '#4f93a2', accent: '#9effd7', soft: '#c7a3ff', platform: '#174d5a', edge: '#9effd7' };
  }
  if (chapter.includes('하늘')) {
    return { id: 'haneul', label: '하늘의 바람길', top: '#153d67', mid: '#123456', bottom: '#102141', line: '#70abd1', accent: '#a6efff', soft: '#c5dcff', platform: '#245071', edge: '#a6efff' };
  }
  if (chapter.includes('딸')) {
    return { id: 'daughter', label: '딸의 완벽한 꿈', top: '#4a2854', mid: '#35305c', bottom: '#182c50', line: '#b67bb3', accent: '#ffb5df', soft: '#b8ffcf', platform: '#5a3b72', edge: '#ffb5df' };
  }
  return { id: 'harin', label: '하린의 달빛 유원지', top: '#10143d', mid: '#17275e', bottom: '#0b163a', line: '#665ba8', accent: '#78cfff', soft: '#9183d5', gold: '#ffd65a', platform: '#292c60', edge: '#ffd65a' };
}

function bossEntryLine(stage = currentStage()) {
  const mode = stage?.bossConfig?.mode;
  if (mode === 'calm') return '하린의 “혼자 남을까 봐”라는 두려움이 광대가 되었습니다. 쓰러뜨리지 말고, 함께했던 기억을 보여 주세요.';
  if (mode === 'resonance') return '침묵의 합창단이 유나의 목소리를 삼키고 있습니다. 박자를 듣고 화음을 되찾으세요.';
  if (mode === 'chase') return '검은 연이 하늘의 발걸음을 출발점으로 되돌립니다. 두 기억 기준점을 남긴 뒤, 그 기준점을 향해 날아오는 되돌림 바람을 Space 질주로 가로채세요. 뒤집힌 바람이 만든 순풍 고리를 세 번 통과하면 길은 앞으로만 이어집니다.';
  if (mode === 'mirror') return '수호자는 딸을 지키려 가짜 풍경을 만들었습니다. 진짜 사진을 재생해 균열을 구분하세요.';
  if (mode === 'final') return '꿈이 무너지자 과학자가 직접 수호자가 되었습니다. 이 싸움의 끝은 승리가 아니라, 놓아주는 선택입니다.';
  return stage?.intro || '';
}

function bossBriefForStage(stage = currentStage()) {
  const mode = stage?.bossConfig?.mode;
  if (mode === 'calm') return '① 똑같이 보이는 기억 후보를 K 잔상으로 확인  ② WASD 조준 + J 탄환으로 가짜 2회 명중\n③ 세 기억을 본체/잔상 조합으로 동시 활성화  ④ 2페이즈부터 웃음 탄막 회피  ⑤ 가면 가까이에서 J로 직선 발사';
  if (mode === 'resonance') return '① K로 화음 앵커 두 곳 재생  ② 앵커가 불협화음 3회에 사라지기 전 다시 기록  ③ 별빛 박자에 맞춰 L을 짧게 6회  ④ 앵커·잔상 없이 마지막 불협화음 20초 회피';
  if (mode === 'chase') return '① K로 두 바람 기준점 준비  ② 되돌림 바람을 Space로 가로채 순풍 고리 세 개 통과\n③ P/Y 유지로 총 6회 반사  ④ 명중마다 사이드 연 +1  ⑤ 2·4회 명중 뒤 풍압 강화';
  if (mode === 'mirror') return '① K로 진짜 사진 재생  ② L로 진짜 균열만 드러내기  ③ Space 질주로 균열 네 곳 통과';
  if (mode === 'final') return '① K로 세 친구의 봉인 완성  ② L로 꿈 에너지 분리  ③ J로 첫 기억 반환\n④ 움직이는 진짜 기억 추적  ⑤ 부서진 수호자 체력 모두 해체  ⑥ 마지막에는 딸의 목소리에 L 유지';
  return '기억의 역할을 완성해 공포의 규칙을 바꾸세요.';
}

function guideKeyHints() {
  const stage = currentStage() || STAGES[0];
  const boss = game.boss;
  if (stage.type !== 'boss') {
    const basics = [{ key: 'A / D', label: '이동' }, { key: 'W', label: '점프' }];
    if (game.recording) return [...basics, { key: 'K', label: '되감기' }, { key: 'I', label: '기록 취소' }];
    if (stage.layout === 'carousel') return [
      ...basics,
      { key: 'S', label: '하단 방사로' },
      { key: 'P / Y', label: '원형벽 회전' },
      ...(!game.carouselCoreLatched && !(game.echoes || []).some((echo) => !echo.holding)
        ? [{ key: 'K', label: '중앙 발판 기록' }]
        : []),
      ...((game.echoes || []).length ? [{ key: 'I', label: '기억 삭제' }] : []),
    ];
    if (stage.layout === 'wall') return [...basics, { key: 'L', label: '공명 길' }, { key: 'K', label: '기억 기록' }];
    if (stage.layout === 'signpost-maze') return [...basics, { key: 'L', label: '화살표 공명' }, { key: 'Space', label: '바람길 질주' }, { key: 'K', label: '출발 기억' }];
    if ((stage.chapter || '').includes('유나')) return [...basics, { key: 'L', label: '공명 길' }, { key: 'K', label: '기억 역할' }];
    if ((stage.chapter || '').includes('하늘')) return [...basics, { key: 'Space', label: '질주' }, { key: 'K', label: '출발 기억' }];
    if ((stage.chapter || '').includes('딸')) return [...basics, { key: 'L', label: '숨은 균열' }, { key: 'K', label: '친구 기억' }];
    return [...basics, ...(stage.echoGoal ? [{ key: 'K', label: '기억 기록' }] : [])];
  }
  if (!boss) return [{ key: 'A / D', label: '이동' }, { key: 'W / S', label: '회피' }];
  if (boss.mode === 'calm') {
    if (boss.calmReflectionActive) return [{ key: 'W / S', label: '웃음 탄막 회피' }, { key: 'J', label: '가면 직선 발사' }, { key: 'Shift', label: '가면만 정지' }];
    const state = calmMemoryState(boss);
    if (activeCalmFakeMemories(boss).length) return [{ key: 'WASD', label: '탄환 조준' }, { key: 'J', label: '기억 탄환' }, { key: 'K', label: '새 기억 기록' }];
    if (state.trueMemoryCount < state.memoryTargetCount) return [{ key: 'K', label: '기억 배치' }, { key: '이동', label: '본체로 활성화' }, { key: 'I', label: '최근 잔상 삭제' }];
    return [{ key: '이동', label: '반사전 준비' }];
  }
  if (boss.mode === 'resonance') return boss.codaActive
    ? [{ key: 'W / S', label: '음표 회피' }, { key: 'Space', label: '긴급 질주' }]
    : boss.activePads < boss.memoryPads.length
      ? [{ key: 'K', label: '화음 앵커' }]
      : [{ key: 'L', label: '별빛 박자 공명' }];
  if (boss.mode === 'chase') {
    if (boss.windVanePhase) return [
      { key: 'P', label: '누르는 동안 시계 회전' },
      { key: 'Y', label: '누르는 동안 반시계 회전' },
      { key: '이동', label: '검은 연 유도' },
      { key: 'Space', label: '사이드 연 회피' },
    ];
    return boss.activePads < boss.decoyPads.length
      ? [{ key: 'K', label: '바람 기준점' }, { key: 'W / S', label: '기준점 이동' }]
      : boss.relayPhase === 'sprint'
        ? [{ key: 'Space', label: '순풍 고리 질주' }]
        : [{ key: 'Space', label: '되돌림 바람 가르기' }, { key: 'W / S', label: '가로채기 위치' }];
  }
  if (boss.mode === 'mirror') return boss.mirrorProgress < boss.mirrorGates.length && boss.activePads >= boss.memoryPads.length
    ? [{ key: 'L', label: '진짜 균열' }, { key: 'Space', label: '균열 질주' }]
    : [{ key: 'K', label: '진짜 사진' }];
  if (!boss.attackUnlocked) return [{ key: 'K', label: '세 기억 봉인' }, { key: 'L', label: '공명 해제' }];
  if (finalBossPhase(boss) === 2) return [{ key: 'J', label: 'TRUE 기억 발사' }, { key: 'W / S', label: '탄막 회피' }];
  if (finalBossPhase(boss) === 4) return [{ key: 'L', label: '딸의 목소리 전달' }];
  if (finalBossPhase(boss) === 3) return [{ key: 'J', label: '수호자 해체' }, { key: 'Space', label: '탄막 질주' }];
  return [{ key: 'J', label: '기억 탄환' }, { key: 'Space', label: '탄막 질주' }];
}

function phaseGuide() {
  const stage = currentStage() || STAGES[0];
  const boss = game.boss;
  if (stage.type !== 'boss') {
    const active = activeMemoryPads(game.memoryPads || []);
    const goal = game.echoGoal || 0;
    const yunaRoute = (stage.chapter || '').includes('유나') && ['chorus', 'choir-balcony', 'chorus-memory', 'harmony-spiral'].includes(stage.layout);
    if (yunaRoute && goal > active && !activeTechniques().resonance) {
      return { step: 'STEP 1 / 3', text: 'L을 유지해 좁은 악보 발판을 드러내세요. 공명을 멈추면 발판도 사라집니다.', compact: 'L로 공명 길을 유지하라' };
    }
    if (stage.layout === 'carousel') {
      if (game.carouselGateOpened && game.carouselRotationTimer <= 0) {
        const exitAligned = carouselPhaseInfo().id === 'exit';
        return exitAligned
          ? { step: 'EAST OPENING', text: '원형벽의 동쪽 틈과 잠금 해제된 꿈의 문이 연결됐습니다. 오른쪽 램프로 빠져나가세요.', compact: '동쪽 틈 → 열린 꿈의 문' }
          : { step: 'GATE UNLOCKED', text: '꿈의 문 잠금은 풀렸습니다. P/Y로 원형벽을 계속 자유롭게 돌려 오른쪽으로 갈 길을 만드세요.', compact: '문 잠금 해제 · P/Y 자유 회전' };
      }
      if (game.carouselRotationTimer > 0) {
        const target = carouselPhaseInfo(game.carouselTargetPhase);
        return { step: 'ROUND WALL ROTATING', text: `원형벽의 출입구를 ${target.label} 각도로 돌리고 있습니다. 회전이 끝날 때까지 잠시 기다리세요.`, compact: `${target.label} 각도로 회전 중` };
      }
      const standing = standingCarouselPlatform();
      const relayCount = carouselRelayCount();
      const currentPose = carouselPhaseInfo().id;
      if (game.carouselCoreLatched && carouselRelaysReady()) {
        return { step: 'THREE LOCKS READY', text: '왼쪽 위 기억과 두 외부 잠금 장치가 모두 복구됐습니다. P/Y로 구멍을 동쪽 출구길과 맞추세요.', compact: '세 장치 완료 · 동쪽 출구 정렬' };
      }
      if (game.echoes.some((echo) => !echo.holding)) {
        return { step: 'MEMORY REPLAYING', text: '기억의 나는 왼쪽 위 코어로 계속 이동합니다. 현재의 나는 기다리지 않고 어디서든 P/Y로 다음 방을 열 수 있습니다.', compact: '잔상 재생 중 · P/Y 회전 가능' };
      }
      if (game.recording) {
        return { step: 'MEMORY RECORDING', text: '북서쪽 틈을 지나 맵 왼쪽 위 기억 코어까지 이동한 뒤 K를 다시 눌러 되감으세요.', compact: '왼쪽 위 코어에서 K · 되감기' };
      }
      if (standing?.carouselMemoryStart) {
        if (!game.carouselCoreLatched && currentPose === 'memory') {
          return { step: 'CENTRAL K START', text: '중앙 발판에서 K로 기록을 시작하고, 북서쪽 구멍을 지나 왼쪽 위 기억 코어까지 이동하세요.', compact: '중앙 발판 K 시작 → 왼쪽 위 기억' };
        }
        if (!game.carouselCoreLatched) {
          return { step: 'CENTRAL K START', text: '여기가 항상 같은 K 기록 시작점입니다. 먼저 P/Y로 구멍을 북서쪽 기억길과 맞추세요.', compact: 'K 시작 위치 · 북서쪽 구멍 필요' };
        }
        return { step: 'MEMORY COMPLETE', text: `이 중앙 발판의 기억은 고정됐습니다. 외부 잠금 ${relayCount} / ${CAROUSEL_REQUIRED_RELAYS}.`, compact: `기억 ✓ · 잠금 ${relayCount} / ${CAROUSEL_REQUIRED_RELAYS}` };
      }
      if ((currentPose === 'star' || currentPose === 'ribbon') && !game.carouselRelays.has(currentPose)) {
        const relay = (game.carouselSwitches || []).find((item) => item.id === currentPose);
        return { step: 'EXTERNAL LOCK', text: `${relay?.label || '외부 잠금 장치'}가 이 방 끝에 있습니다. 직접 밟아 켠 뒤 같은 구멍으로 원 안에 돌아오세요.`, compact: `${relay?.label || '잠금 장치'} 밟기 · ${relayCount} / ${CAROUSEL_REQUIRED_RELAYS}` };
      }
      return { step: 'ROUND WALL MAZE', text: `고정된 발판을 따라 현재 방을 탐색하세요. 기억 ${game.carouselCoreLatched ? '완료' : '미완료'} · 외부 잠금 ${relayCount} / ${CAROUSEL_REQUIRED_RELAYS}.`, compact: `기억 ${game.carouselCoreLatched ? '✓' : '○'} · 잠금 ${relayCount} / ${CAROUSEL_REQUIRED_RELAYS}` };
    }
    if (game.recording) {
      return { step: 'RECORDING', text: '목표 위치까지 움직인 뒤 K를 다시 눌러 기억을 되감으세요.', compact: 'K로 기록을 되감아 기억의 나를 남겨라' };
    }
    if (stage.layout === 'signpost-maze') {
      const maze = game.signpostMaze;
      const sign = activeSignpost(maze);
      if (goal > active) {
        return { step: 'MEMORY START', text: '먼저 왼쪽 “진짜 출발 신호”까지 K로 기록하고 되감으세요. 기억의 나가 그곳을 지켜야 표지판의 거짓말을 공명으로 지울 수 있습니다.', compact: `출발 기억 ${active} / ${goal}` };
      }
      if (sign) {
        const progress = Math.round((maze.charge || 0) / SIGNPOST_RESONANCE_SECONDS * 100);
        return {
          step: `WIND ARROW ${maze.activeIndex + 1} / ${maze.signposts.length}`,
          text: `${sign.label} 곁에서 L을 잠시 유지해 “${sign.action}” 하세요. 화살표가 진짜 방향으로 돌아가면 ${sign.next}이 바람 속에서 형태를 얻습니다.`,
          compact: `${sign.action} · ${progress}%`,
        };
      }
      return { step: 'TRUE EXIT OPEN', text: '세 표지판이 모두 진짜 방향을 가리킵니다. 마지막 바람길을 따라 오른쪽 꿈의 문으로 가세요.', compact: '세 표지판 고정 · 출구 열림' };
    }
    if (stage.layout === 'wall' && !activeTechniques().resonance) {
      return { step: 'STEP 1 / 3', text: 'L 공명 파장을 유지해 세 갈래 공명 길을 드러내세요. 공명을 멈추면 길도 사라집니다.', compact: 'L로 공명 길을 유지하라' };
    }
    if (stage.layout === 'wind-cliff' && !game.windPillarReleased) {
      return { step: `BREAK THE HEADWIND · ${active} / ${goal}`, text: '출발 약속 위까지 K로 기록한 뒤 되감으세요. 기억의 나가 약속을 지키면 역풍 기둥이 무너집니다.', compact: '기억의 나로 역풍 기둥을 무너뜨려라' };
    }
    if (stage.layout === 'wind-cliff' && game.windPillarReleased) {
      return { step: 'HEADWIND BROKEN', text: '역풍 기둥이 무너져 절벽길이 열렸습니다. 높은 바람 선반을 따라가고, 마지막 틈은 Space 질주로 건너세요.', compact: '무너진 역풍 너머로 질주하라' };
    }
    if (stage.layout === 'wall') {
      if (goal > active) return { step: `MEMORY RELAY · ${active} / ${goal}`, text: '중앙 기억 교차로에서 K 기록을 시작해 낮은 길·높은 길·오른쪽 길의 웃음 중계기에 기억의 나를 하나씩 남기세요.', compact: `진짜 웃음 중계기 ${active} / ${goal}` };
      return { step: 'RELAY COMPLETE', text: '세 갈래 기억이 수집탑의 흡입을 멈췄습니다. 열린 셔터 너머의 꿈의 문으로 가세요.', compact: '멈춘 수집탑을 통과하라' };
    }
    const roleState = puzzleRoleState();
    if (goal > active) {
      const roleText = roleState.rule
        ? roleState.rule.directions
          ? ` ${roleState.rule.prompt} 발판 위에서 A/D로 얼굴을 돌린 뒤 K로 되감으세요.`
          : ` ${roleState.rule.prompt}`
        : '';
      return { step: `STEP 1 / 2 · ${active} / ${goal}`, text: `K로 길을 기록해 과거의 나를 기억 발판에 남기세요.${roleText}`, compact: `기억 역할 ${active} / ${goal} 준비` };
    }
    if (!roleState.ready) {
      const correction = roleState.rule.directions
        ? 'I로 잘못된 기억을 지우고, 발판 위에서 A/D로 얼굴을 돌린 뒤 K를 눌러 다시 기록하세요.'
        : 'I로 기존 기억을 지운 뒤, 기억 발판 위에서 K를 눌러 다시 기록하세요.';
      return {
        step: `MEMORY ROLE · ${roleState.matched} / ${roleState.total}`,
        text: `${roleState.rule.prompt} ${correction}`,
        compact: `기억의 나 ${roleState.matched} / ${roleState.total} 역할 완성`,
      };
    }
    if (goal > 0) return { step: 'STEP 2 / 2', text: '기억의 나가 길을 지키는 동안 꿈의 문으로 가세요.', compact: '열린 꿈의 문으로 가라' };
    return { step: 'EXPLORE', text: stage.hint, compact: stage.objective };
  }
  if (!boss) return { step: 'DREAM LINK', text: stage.hint, compact: stage.objective };
  if (boss.mode === 'calm') {
    if (boss.calmReflectionActive) {
      const broken = boss.calmReflectionBroken || 0;
      const required = boss.calmReflectionRequired || 3;
      return {
        step: 'FINAL FREE AIM',
        text: '가면 가까이에서 조준선을 정하고 J를 누르세요. 가면은 표시된 방향으로만 직선 비행하며, Shift 중에도 광대와 웃음 탄막은 계속 움직이고 가면만 멈춥니다.',
        compact: `자유 조준 명중 ${broken} / ${required}`,
      };
    }
    const fakeProgress = calmFakeProgress(boss);
    const state = calmMemoryState(boss);
    if (fakeProgress.active.length) return { step: 'FALSE MEMORY', text: '가짜 기억이 잔상을 훔쳐 달아납니다. WASD로 발사 방향을 잡고 J 기억 탄환을 각각 두 번 맞히세요.', compact: `가짜 기억 탄환 명중 ${fakeProgress.hitCount} / ${fakeProgress.requiredHits}` };
    if (state.trueMemoryCount < state.memoryTargetCount) {
      return { step: 'STEP 1 / 2', text: '진짜 기억 세 곳을 동시에 밝히세요. 각 기억은 현재 본체나 유지 중인 K 잔상 어느 쪽으로든 활성화할 수 있습니다. 1페이즈에는 탄막이 나오지 않습니다.', compact: `세 기억 ${state.trueMemoryCount} / ${state.memoryTargetCount}` };
    }
    return { step: 'MEMORY COMPLETE', text: '세 기억이 모두 겹쳤습니다. 비워지는 무대에서 마지막 반사전을 준비하세요.', compact: '세 기억 완성 · 반사전 진입' };
  }
  if (boss.mode === 'resonance') {
    if (boss.codaActive) {
      const remaining = Math.max(0, boss.codaDuration - boss.codaElapsed);
      return { step: 'FINAL CODA', text: '박자 단계의 발판·게이트·잔상은 모두 사라졌고 잔상 유지 조건도 끝났습니다. 20초 동안 주인공으로 음표 탄막만 피하세요.', compact: `불협화음 버티기 ${remaining.toFixed(1)}초` };
    }
    return boss.activePads < boss.memoryPads.length
      ? { step: 'STEP 1 / 2', text: '두 기억의 나를 화음 앵커에 남기세요. 각 앵커는 불협화음 세 번을 맞으면 사라지니, 깨지면 K로 다시 기록하세요.', compact: `화음 앵커 ${boss.activePads} / ${boss.memoryPads.length} · 3회 방어` }
      : { step: 'STEP 2 / 2', text: '별빛 고리가 밝아지는 박자에 맞춰 L을 짧게 한 번씩 눌러, 음을 순서대로 되찾으세요.', compact: `박자 탭 · 음 ${boss.resonanceProgress} / ${boss.resonanceGates.length}` };
  }
  if (boss.mode === 'chase') {
    const anchorsReady = boss.activePads >= boss.decoyPads.length;
    const relayTotal = Math.max(1, boss.windGates.length);
    const target = boss.decoyPads[(boss.relayTargetIndex || 0) % Math.max(1, boss.decoyPads.length)];
    if (boss.windVanePhase) {
      const direction = haneulWindVaneDirection(boss);
      const pressure = haneulVaneAttackProfile(boss);
      return {
        step: 'PHASE 2 · WIND VANE',
        text: `P/Y를 누르는 동안 바람개비가 회전합니다. 현재 풍압 ${pressure.tier + 1}단계는 정면 ${pressure.count}발과 좌우 사이드 연 ${pressure.sideCount}개가 ${pressure.delay.toFixed(2)}초 간격으로 공격합니다. 남은 탄막을 피하면서 현재 ${HANEUL_VANE_BOSS_POSITIONS[boss.vaneBossSlot]?.label || '위쪽'}의 보스를 노리세요.`,
        compact: `반사 ${boss.vaneReflectedHits} / ${boss.maxHp} · 사이드 ${pressure.sideCount} · P/Y ${direction.label}`,
      };
    }
    if (!anchorsReady) {
      return { step: 'WIND ANCHORS', text: '두 출발 깃발 위에 K 기록을 끝내 바람 기준점을 남기세요. 이 잔상은 공격을 버티는 미끼가 아니라, 되돌림 바람의 방향을 읽는 기준점입니다.', compact: `바람 기준점 ${boss.activePads} / ${boss.decoyPads.length}` };
    }
    if (boss.relayPhase === 'sprint') {
      const left = Math.max(0, (boss.relayDeadline || 0) - game.elapsed);
      return { step: `TAILWIND ${boss.relayProgress + 1} / ${relayTotal}`, text: '질주로 되돌림 바람을 갈랐습니다. 지금 뒤집힌 순풍 고리를 Space 질주로 통과하세요. 놓쳐도 이번 바람만 다시 가로채면 됩니다.', compact: `순풍 고리 ${boss.relayProgress + 1} / ${relayTotal} · ${left.toFixed(1)}초` };
    }
    return { step: `CUT THE GALE ${boss.relayProgress + 1} / ${relayTotal}`, text: `검은 연이 “${target?.label || '출발'}” 기준점을 향해 되돌림 바람을 보냅니다. 보스와 잔상 사이로 들어가 Space 질주로 바람을 가르세요.`, compact: `되돌림 가로채기 ${boss.relayProgress} / ${relayTotal}` };
  }
  if (boss.mode === 'mirror') {
    return boss.activePads < boss.memoryPads.length
      ? { step: 'STEP 1 / 2', text: 'K로 딸의 진짜 사진에 과거의 나를 남기세요. 사진이 재생되면 가짜 풍경이 사라집니다.', compact: '진짜 사진을 재생하라' }
      : { step: 'STEP 2 / 2', text: 'L로 남은 진짜 균열을 드러내고 Space 질주로 통과하세요. 분홍 가짜 균열은 피하세요.', compact: `진짜 균열 ${boss.mirrorProgress} / ${boss.mirrorGates.length}` };
  }
  if (boss.releaseReady) return { step: 'LAST MEMORY', text: '딸의 목소리가 닿았습니다. 빼앗은 기억이 모두 제자리로 돌아갑니다.', compact: '아버지가 꿈을 놓아주고 있어요' };
  if (!boss.attackUnlocked) {
    return boss.activePads < boss.memoryPads.length
      ? { step: 'STEP 1 / 3', text: '기억의 나 둘과 현재의 나로 세 개의 기억 봉인을 채우세요.', compact: `기억 봉인 ${boss.activePads} / ${boss.memoryPads.length}` }
      : { step: 'STEP 2 / 3', text: 'L을 유지해 훔친 꿈 에너지를 분리하세요.', compact: `공명 해제 ${boss.finalCharge.toFixed(1)} / ${boss.finalChargeNeeded.toFixed(1)}초` };
  }
  const finalPhase = finalBossPhase(boss);
  if (finalPhase === 2) {
    return { step: 'PHASE 2 / 4', text: '과학자가 친구들의 기억을 가짜로 복제했습니다. 움직이는 “TRUE” 기억을 추적해 J 기억 탄환으로 맞히세요.', compact: `진짜 기억 ${boss.truthProgress} / ${boss.truthTargets.length}` };
  }
  if (finalPhase === 3) {
    return { step: 'PHASE 3 / 4', text: '진짜 기억이 수호자를 깨웠습니다. 부서진 수호자에게 J 기억 탄환을 끝까지 돌려주어 남은 체력을 모두 비우세요.', compact: `수호자 해체 ${boss.maxHp - boss.hp} / ${boss.maxHp}` };
  }
  if (finalPhase === 4) return { step: 'PHASE 4 / 4', text: '수호자는 멈췄지만 아버지는 아직 놓지 못하고 있어요. 딸의 목소리 곁에서 L을 유지해 진짜 선택을 전하세요.', compact: `딸의 목소리 ${boss.voiceProgress.toFixed(1)} / ${boss.voiceDuration.toFixed(1)}초` };
  return { step: 'PHASE 1 / 4', text: 'J 기억 탄환으로 빼앗긴 행복을 돌려주세요. 네 발을 맞히면 가짜 기억이 모습을 드러냅니다.', compact: `기억 반환 ${boss.maxHp - boss.hp} / ${boss.maxHp}` };
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
  const finishLabel = beat.finishLabel || (beat.pageBreak ? '2페이지 시작' : '다음 스테이지로');
  startButton.innerHTML = `${lastLine ? finishLabel : '다음 대사'} <span>↵</span>`;
}

function prepareCurrentStagePreview() {
  const stage = currentStage();
  const previewRun = ++stagePreviewRun;
  const previewStageIndex = game.stageIndex;
  // 반투명 안내·대화창 뒤에는 직전 스테이지의 잔여 상태가 아니라,
  // 곧 시작할 스테이지의 배경·구조물·시작 위치만 보이게 준비한다.
  // 이미지가 아직 도착하지 않았을 때는 캔버스를 잠시 감춰, 이전 스테이지의
  // 미완성 화면이 안내창 뒤로 비치는 일을 막는다.
  canvas.classList.add('stage-preview-pending');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#060b1d';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  game.player = freshPlayer();
  game.imagination = 100;
  game.dreamShots = [];
  game.nightmareShots = [];
  game.echoes = [];
  game.recording = null;
  game.dreamTrails = [];
  game.memoryPads = [];
  game.platforms = [];
  game.exit = null;
  game.fragments = [];
  game.fallZones = [];
  game.watcherResolved = false;
  game.stage02Restoration = 0;
  game.stage02RestorationAnnounced = false;
  game.carouselGateOpened = false;
  game.carouselCoreLatched = false;
  game.carouselExitBridgeDeployed = false;
  game.carouselRelays = new Set();
  game.carouselSwitches = [];
  game.carouselPhase = 0;
  game.carouselTargetPhase = 0;
  game.carouselRotationTimer = 0;
  game.carouselOrbitPose = 'moon';
  game.carouselOrbitFromPose = 'moon';
  game.carouselOrbitTargetPose = 'moon';
  if (stage.type === 'boss') ensureBossStage(true);
  else {
    game.boss = null;
    setupPuzzle(stage.layout, stage.echoGoal || 0);
  }

  const previewSprites = stageSpriteSet(previewStageIndex);
  ensureSprites(previewSprites);
  Promise.all(previewSprites.map(waitForSprite)).then(() => {
    // 빠르게 다음 화면으로 넘어간 경우, 늦게 도착한 이전 이미지가 새 장면을
    // 덮어쓰지 않도록 이번 준비 요청과 스테이지가 모두 같은지 확인한다.
    if (previewRun !== stagePreviewRun || previewStageIndex !== game.stageIndex) return;
    if (stage.type === 'boss') drawBoss();
    else drawPuzzle();
    canvas.classList.remove('stage-preview-pending');
  });
}

function showStoryBeat(beat) {
  clearStageIntroTimer();
  ensureStageVisualAssets();
  prepareCurrentStagePreview();
  contextControls.classList.add('hidden');
  hideFriendReaction();
  gameHud.classList.add('hidden');
  bossHud.classList.add('hidden');
  toast.classList.remove('visible');
  game.phase = 'story';
  document.body.classList.remove('title-screen-active');
  continueStoryBgm();
  game.storyBeat = beat;
  game.storyLineIndex = 0;
  startTag.textContent = beat.tag;
  startTitle.textContent = beat.title;
  startCopy.textContent = '';
  storyDialogue.classList.remove('hidden');
  renderStoryLine();
  closeTitleModals();
  startScreen.classList.remove('title-mode', 'boss-intro');
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
  document.body.classList.remove('title-screen-active');
  clearStageIntroTimer();
  ensureStageVisualAssets();
  prepareCurrentStagePreview();
  contextControls.classList.add('hidden');
  hideFriendReaction();
  gameHud.classList.add('hidden');
  bossHud.classList.add('hidden');
  toast.classList.remove('visible');
  closeTitleModals();
  startScreen.classList.remove('story-mode', 'title-mode');
  startScreen.classList.toggle('boss-intro', stage.type === 'boss');
  storyDialogue.classList.add('hidden');
  game.phase = 'intro';
  const pagePrefix = stagePage(stage) === 2 ? '두 번째 장 · 마지막 꿈' : '꿈의 연결';
  startTag.textContent = `${pagePrefix} · 스테이지 ${String(game.stageIndex + 1).padStart(2, '0')} / ${String(totalStages()).padStart(2, '0')}`;
  startTitle.textContent = stage.name;
  if (stage.type === 'boss') {
    // 보스 안내는 한 덩어리의 긴 문단 대신, 읽는 순서가 보이는 세 줄 구조로 둔다.
    startCopy.innerHTML = `<span class="boss-intro-lead">${bossEntryLine(stage)}</span><span class="boss-intro-route-label">60초 전투 순서</span><span class="boss-intro-route">${bossBriefForStage(stage)}</span>`;
  } else {
    startCopy.textContent = formatNumberedGuide(stage.intro);
  }
  startButton.innerHTML = `${stage.type === 'boss' ? '악몽에 맞서기' : '꿈속으로 들어가기'} <span>↵</span>`;
  startScreen.classList.remove('hidden');
  stageMenu.classList.add('hidden');
  endScreen.classList.add('hidden');
  // 보스전은 읽을 시간 없이 자동 시작하지 않는다. Enter/버튼으로 준비가 끝난 뒤에만 60초가 흐른다.
  renderCampaignRoute();
  updateHud();
}

function renderStageMenu() {
  updateBgmVolumeControl();
}

function openStageMenu() {
  if (game.phase !== 'playing') return;
  game.resumePhase = 'playing';
  game.phase = 'menu';
  pauseStageBgm();
  renderStageMenu();
  stageMenu.classList.remove('hidden');
  updateHud();
}

function closeStageMenu() {
  if (game.phase !== 'menu') return;
  game.phase = game.resumePhase || 'playing';
  stageMenu.classList.add('hidden');
  if (game.phase === 'playing') resumeStageBgm();
  updateHud();
}

function fallOffStage(message = '낙사! 기억이 시작점으로 되돌아갔어.') {
  if (game.phase !== 'playing') return;
  game.player = freshPlayer();
  if (game.layout === 'carousel') {
    Object.assign(game.player, { x: 468, y: 316, grounded: true });
  }
  game.player.vx = 0;
  game.player.vy = 0;
  game.player.grounded = false;
  game.dreamTrails = [];
  game.imagination = 100;
  say(`${message} 상상력이 모두 회복됐습니다.`);
  updateHud();
}

function removeLatestEcho() {
  if (game.phase !== 'playing') return;
  if (game.layout === 'carousel') {
    const phase = carouselPhaseInfo(game.carouselRotationTimer > 0 ? game.carouselTargetPhase : game.carouselPhase);
    const relayCount = carouselRelayCount();
    if (game.carouselGateOpened && game.carouselRotationTimer <= 0) {
      memoryStatus.textContent = `꿈의 문 잠금 해제 · 현재 ${phase.label} · P/Y로 오른쪽으로 이어지는 틈을 자유롭게 선택하세요.`;
    } else if (game.carouselRotationTimer > 0) {
      memoryStatus.textContent = `자유 회전 중 · 원형벽을 ${phase.label} 방향으로 맞추고 있습니다.`;
    } else if (game.carouselCoreLatched && carouselRelaysReady()) {
      memoryStatus.textContent = `세 장치 복구 완료 · 현재 ${phase.label} · P/Y로 구멍을 동쪽 출구길과 맞추세요.`;
    } else if (game.carouselCoreLatched) {
      memoryStatus.textContent = `왼쪽 위 기억 고정 · 외부 잠금 ${relayCount} / ${CAROUSEL_REQUIRED_RELAYS} · 별빛·리본 방을 원하는 순서로 방문하세요.`;
    } else if (game.echoes?.some((echo) => !echo.holding)) {
      memoryStatus.textContent = '기억 재생 중 · 잔상은 독립 이동 · 어디서든 P/Y 회전 가능';
    } else if (game.recording) {
      memoryStatus.textContent = `좌상단 기억 기록 중 · ${game.recording.duration.toFixed(1)}초 · 왼쪽 위 코어에서 K로 되감고 I로 취소`;
    } else if (phase.id === 'memory') {
      memoryStatus.textContent = '북서쪽 구멍 정렬 · 고정된 기억길을 따라 왼쪽 위 코어로 갈 수 있습니다.';
    } else {
      memoryStatus.textContent = `${phase.label} · 기억 ${game.carouselCoreLatched ? '✓' : '○'} · 외부 잠금 ${relayCount} / ${CAROUSEL_REQUIRED_RELAYS} · 순서 자유`;
    }
  } else if (game.recording) {
    game.recording = null;
    say('기억 기록을 취소했습니다.');
    updateHud();
    return;
  }
  if (!game.echoes.length) {
    say(protectedStolenEchoes().length
      ? '가짜 기억이 훔친 잔상은 슬롯을 차지하지만 I로 지울 수 없습니다.'
      : '지울 기억의 나가 없습니다.');
    return;
  }
  game.echoes.pop();
  say(game.layout === 'carousel' && game.carouselCoreLatched
    ? '기억의 나는 지웠지만, 고정된 좌상단 기억·켜진 외부 잠금·모든 발판은 그대로 유지됩니다.'
    : '가장 최근 기억의 나를 지웠습니다.');
  updateHud();
}

function startStage() {
  window.scrollTo(0, 0);
  const stage = currentStage();
  document.body.classList.remove('title-screen-active');
  ensureStageVisualAssets();
  hideFriendReaction();
  if (stage.type === 'boss' && stage.bossConfig?.mode === 'resonance') primeGameSfx();
  clearStageIntroTimer();
  gameHud.classList.remove('hidden');
  startScreen.classList.remove('story-mode');
  game.phase = 'playing';
  game.imagination = 100;
  game.elapsed = 0;
  game.player = freshPlayer();
  // 문을 질주로 통과했더라도 다음 꿈에는 관성·질주 판정·입력 유지가 남지 않게 한다.
  game.dashTimer = 0;
  game.dashCooldown = 0;
  game.dashDirection = 1;
  keys.clear();
  pressed.clear();
  game.dreamShots = [];
  game.nightmareShots = [];
  game.echoes = [];
  game.recording = null;
  game.memoryRecordsUsed = 0;
  game.rewindExpressionTimer = 0;
  game.dreamTrails = [];
  game.dashTrailClock = 0;
  game.dashVisualTimer = 0;
  game.memoryPads = [];
  game.platforms = [];
  game.exit = null;
  game.fireCooldown = 0;
  game.nextAttack = 1.1;
  game.nightmareHitCooldown = 0;
  game.watcherResolved = false;
  game.bottomIsVoid = false;
  game.watcherHitCooldown = 0;
  // 4스테이지의 원형벽·기억 코어·두 외부 잠금은 재입장마다 완전히 새로 시작한다.
  game.carouselGateOpened = false;
  game.carouselCoreLatched = false;
  game.carouselExitBridgeDeployed = false;
  game.carouselRelays = new Set();
  game.carouselSwitches = [];
  game.carouselPhase = 0;
  game.carouselTargetPhase = 0;
  game.carouselRotationTimer = 0;
  game.carouselOrbitPose = 'moon';
  game.carouselOrbitFromPose = 'moon';
  game.carouselOrbitTargetPose = 'moon';
  game.dropThroughTimer = 0;
  game.dropThroughPlatform = null;
  // 15스테이지를 다시 선택해도 이전 도전의 붕괴 상태가 남지 않도록, 역풍 규칙을 매번 초기화한다.
  game.windPillarCollapse = 0;
  game.windPillarReleased = false;
  game.windPillarCollapseAnnounced = false;
  game.headwindHintShown = false;
  game.signpostMaze = null;
  game.stage02Restoration = 0;
  game.stage02RestorationAnnounced = false;
  game.stageRealElapsed = 0;
  game.bossGuideKey = '';
  game.bossGuideUntil = stage.type === 'boss' ? 4.8 : 0;
  game.bossGuideStarted = 0;
  game.challenge = stage.type === 'boss' ? {
    duration: BOSS_MEMORY_COLLAPSE_SECONDS,
    remaining: BOSS_MEMORY_COLLAPSE_SECONDS,
    warned: false,
  } : null;
  game.message = stage.hint;
  if (stage.type === 'puzzle') {
    game.boss = null;
    setupPuzzle(stage.layout, stage.echoGoal || 0);
  } else ensureBossStage(true);
  bossHud.classList.toggle('hidden', stage.type !== 'boss');
  contextControls.classList.remove('hidden');
  startScreen.classList.add('hidden');
  stageMenu.classList.add('hidden');
  endScreen.classList.add('hidden');
  startStageBgm(stage);
  say(stage.type === 'boss' ? '60초 기억 붕괴가 시작됩니다. 공포를 없애는 것이 아니라, 기억의 역할을 완성하세요.' : stage.hint);
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
      // 7스테이지: 숨은 검은 건반과 밝은 흰 건반을 번갈아 딛는 상승 아르페지오.
      { x: 0, y: 500, w: 148, h: 40, label: 'CHOIR FLOOR' },
      { x: 190, y: 432, w: 54, h: 16, hidden: true, label: 'BLACK KEY 01' },
      { x: 282, y: 362, w: 56, h: 18, label: 'WHITE KEY REST 01' },
      { x: 376, y: 298, w: 50, h: 16, hidden: true, label: 'BLACK KEY 02' },
      { x: 466, y: 370, w: 54, h: 18, label: 'WHITE KEY REST 02' },
      { x: 558, y: 304, w: 50, h: 16, hidden: true, label: 'BLACK KEY 03' },
      { x: 650, y: 370, w: 54, h: 18, label: 'WHITE KEY REST 03' },
      { x: 742, y: 292, w: 52, h: 16, hidden: true, label: 'BLACK KEY 04' },
      { x: 838, y: 356, w: 122, h: 18, label: 'RESONANCE HALL' },
    ];
    game.exit = { x: 884, y: 274, w: 36, h: 82, label: 'SONG GATE' };
    game.fallZones = [];
  } else if (layout === 'chorus-memory') {
    // 9스테이지: 높은 음까지 올랐다가 떨어지는 반음계를 타고 다시 솟는 크로매틱 루트.
    game.platforms = [
      { x: 0, y: 500, w: 156, h: 40, label: 'CHOIR START' },
      { x: 194, y: 426, w: 48, h: 16, hidden: true, label: 'HALF STEP 01' },
      { x: 278, y: 350, w: 46, h: 16, hidden: true, label: 'HALF STEP 02' },
      { x: 360, y: 274, w: 68, h: 18, label: 'HIGH NOTE REST' },
      { x: 464, y: 342, w: 48, h: 16, hidden: true, label: 'FALLING NOTE 01' },
      { x: 552, y: 412, w: 56, h: 18, label: 'LOW NOTE REST' },
      { x: 646, y: 334, w: 50, h: 16, hidden: true, label: 'RISING NOTE 01' },
      { x: 732, y: 258, w: 68, h: 18, label: 'HIGH NOTE REST 02' },
      { x: 826, y: 330, w: 50, h: 16, hidden: true, label: 'FINAL HALF STEP' },
      { x: 900, y: 396, w: 60, h: 18, label: 'RESONANCE HALL' },
    ];
    game.exit = { x: 914, y: 314, w: 32, h: 82, label: 'SONG GATE' };
    game.fallZones = [];
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
  } else if (layout === 'lantern-river') {
    game.platforms = [
      { x: 0, y: 500, w: 258, h: 40, label: 'LAUGH SHORE' },
      { x: 314, y: 430, w: 108, h: 16, label: 'LANTERN 01' },
      { x: 486, y: 348, w: 96, h: 16, label: 'LANTERN 02' },
      { x: 654, y: 412, w: 106, h: 16, label: 'LANTERN 03' },
      { x: 806, y: 330, w: 154, h: 16, label: 'NEXT DREAM SHORE' },
    ];
    game.exit = { x: 886, y: 248, w: 36, h: 82, label: 'STAR GATE' };
    game.fallZones = [];
  } else if (layout === 'choir-balcony') {
    game.platforms = [
      // 8스테이지: 낮은 옥타브를 찍고 내려갔다가, 반대편 최고음까지 다시 올라가는 M자 루트.
      { x: 0, y: 500, w: 156, h: 40, label: 'CLASSROOM FLOOR' },
      { x: 194, y: 430, w: 52, h: 16, hidden: true, label: 'LOW OCTAVE 01' },
      { x: 282, y: 356, w: 68, h: 18, label: 'LOW BALCONY' },
      { x: 388, y: 424, w: 50, h: 16, hidden: true, label: 'DESCENT KEY' },
      { x: 476, y: 344, w: 62, h: 18, label: 'MIDDLE OCTAVE' },
      { x: 578, y: 268, w: 52, h: 16, hidden: true, label: 'HIGH OCTAVE 01' },
      { x: 668, y: 194, w: 88, h: 18, label: 'CHOIR BALCONY' },
      { x: 792, y: 270, w: 48, h: 16, hidden: true, label: 'DESCENT KEY 02' },
      { x: 876, y: 350, w: 84, h: 18, label: 'EXIT DESCENT' },
    ];
    game.exit = { x: 892, y: 268, w: 36, h: 82, label: 'BALCONY GATE' };
    game.fallZones = [];
  } else if (layout === 'harmony-spiral') {
    game.platforms = [
      // 10스테이지: 두 화음을 맞춘 뒤, 비어 있던 나선형 악보를 따라 반대편 선율로 넘어간다.
      { x: 0, y: 500, w: 154, h: 40, label: 'SCORE START' },
      { x: 194, y: 430, w: 52, h: 16, hidden: true, label: 'SPIRAL NOTE 01' },
      { x: 284, y: 354, w: 70, h: 18, label: 'LOW HARMONY' },
      { x: 394, y: 278, w: 54, h: 16, hidden: true, label: 'SPIRAL NOTE 02' },
      { x: 484, y: 204, w: 58, h: 18, label: 'UPPER OCTAVE' },
      { x: 656, y: 270, w: 54, h: 16, hidden: true, label: 'SPIRAL NOTE 03' },
      { x: 748, y: 344, w: 72, h: 18, label: 'HIGH HARMONY' },
      { x: 856, y: 272, w: 46, h: 16, hidden: true, label: 'FINAL REFRAIN' },
      { x: 882, y: 350, w: 78, h: 18, label: 'CHORUS EXIT' },
    ];
    game.exit = { x: 904, y: 268, w: 36, h: 82, label: 'HARMONY GATE' };
    game.fallZones = [];
  } else if (layout === 'wind-tunnel') {
    game.platforms = [
      { x: 0, y: 500, w: 194, h: 40, label: 'TUNNEL MOUTH' },
      { x: 246, y: 428, w: 92, h: 16, label: 'LOW WIND SHELF' },
      { x: 404, y: 348, w: 94, h: 16, label: 'HIGH WIND SHELF' },
      { x: 568, y: 418, w: 100, h: 16, hidden: true, label: 'HIDDEN TAILWIND' },
      { x: 736, y: 336, w: 224, h: 18, label: 'TUNNEL ROOF' },
    ];
    game.exit = { x: 870, y: 254, w: 36, h: 82, label: 'WIND GATE' };
    game.fallZones = [];
  } else if (layout === 'wind-cliff') {
    game.platforms = [
      { x: 0, y: 500, w: 212, h: 40, label: 'CLIFF START' },
      { x: 430, y: 432, w: 106, h: 18, label: 'LOW WIND SHELF' },
      { x: 556, y: 360, w: 92, h: 18, label: 'HIGH WIND SHELF' },
      // 기억의 나가 약속을 지키면 충돌도 함께 사라지는, 배경과 이어진 거대한 역풍 기둥.
      { x: 670, y: 360, w: 52, h: 140, wall: true, persistentWall: true, collapseWithMemory: true, label: 'HEADWIND PILLAR' },
      { x: 802, y: 420, w: 158, h: 18, label: 'CLIFF END' },
    ];
    // 문 하단이 절벽 발판의 윗면(420)에 정확히 닿도록 배치한다.
    game.exit = { x: 876, y: 338, w: 36, h: 82, label: 'CLIFF GATE' };
    game.fallZones = [];
  } else if (layout === 'signpost-maze') {
    game.platforms = [
      // 16스테이지는 단순 계단이 아니라, 화살표가 만든 세 종류의 바람길을 순서대로 탄다.
      { x: 0, y: 500, w: 190, h: 40, label: 'WIND MAP START' },
      { x: 204, y: 440, w: 122, h: 18, label: 'UPDRAFT ARROW PIER', windRoute: 'arrow-pier' },
      // 첫 화살표가 위쪽을 가리켜야만 공중 승강기를 타고 도달할 수 있는 하늘 선반.
      { x: 386, y: 242, w: 184, h: 18, label: 'SKY COMPASS DECK', windRoute: 'sky-deck' },
      // 두 번째 화살표가 고정되면 S자 형태의 공중 바람 다리가 여러 높이를 잇는다.
      { x: 574, y: 302, w: 64, h: 14, hidden: true, signpostReveal: 'anchored', label: 'WEAVE WIND STEP 01', windRoute: 'weave-a' },
      { x: 668, y: 220, w: 58, h: 14, hidden: true, signpostReveal: 'anchored', label: 'WEAVE WIND STEP 02', windRoute: 'weave-b' },
      { x: 736, y: 318, w: 88, h: 18, hidden: true, signpostReveal: 'anchored', label: 'WEAVE WIND STEP 03', windRoute: 'weave-c' },
      // 마지막 화살표가 켜지면 높은 출구 선반까지 뻗는 질주 제트가 생긴다.
      { x: 874, y: 250, w: 86, h: 18, hidden: true, signpostReveal: 'exitAligned', label: 'JET EXIT RUNWAY', windRoute: 'launch' },
    ];
    game.exit = { x: 900, y: 168, w: 36, h: 82, label: 'TRUE GATE' };
    game.fallZones = [];
  } else if (layout === 'starlight-ferry') {
    game.platforms = [
      { x: 0, y: 500, w: 220, h: 40, label: 'WIND SHORE' },
      { x: 286, y: 430, w: 88, h: 16, label: 'FOOTPRINT 01' },
      { x: 430, y: 354, w: 86, h: 16, label: 'FOOTPRINT 02' },
      { x: 566, y: 420, w: 76, h: 16, label: 'FOOTPRINT 03' },
      { x: 756, y: 340, w: 204, h: 18, label: 'GARDEN APPROACH' },
    ];
    game.exit = { x: 874, y: 258, w: 36, h: 82, label: 'GARDEN GATE' };
    game.fallZones = [];
  } else if (layout === 'garden-roots') {
    game.platforms = [
      { x: 0, y: 500, w: 170, h: 40, label: 'PERFECT LAWN' },
      { x: 166, y: 424, w: 102, h: 16, hidden: true, label: 'ROOT STEP 01' },
      { x: 292, y: 350, w: 94, h: 18, label: 'ROOT STEP 02' },
      { x: 422, y: 402, w: 102, h: 16, hidden: true, label: 'ROOT STEP 03' },
      { x: 552, y: 318, w: 112, h: 18, label: 'ROOT STEP 04' },
      { x: 712, y: 350, w: 248, h: 18, label: 'CRACKED GARDEN' },
    ];
    game.exit = { x: 876, y: 268, w: 36, h: 82, label: 'ROOT GATE' };
    game.fallZones = [];
  } else if (layout === 'classroom-fracture') {
    game.platforms = [
      { x: 0, y: 500, w: 196, h: 40, label: 'LOWER CLASSROOM' },
      { x: 234, y: 420, w: 102, h: 18, label: 'LOW DESK ROW' },
      { x: 370, y: 342, w: 96, h: 16, hidden: true, label: 'CRACK BRIDGE' },
      { x: 498, y: 266, w: 112, h: 18, label: 'UPPER DESK ROW' },
      { x: 650, y: 338, w: 108, h: 16, hidden: true, label: 'WINDOW PATH' },
      { x: 790, y: 414, w: 170, h: 18, label: 'CLASSROOM EXIT' },
    ];
    game.exit = { x: 880, y: 332, w: 36, h: 82, label: 'MIRROR GATE' };
    game.fallZones = [];
  } else if (layout === 'bridge') {
    game.platforms = [
      { x: 0, y: 500, w: 960, h: 40, label: 'MEMORY WALKWAY' },
      // 성문 그림의 입구 기준점은 유지하고, 실제 막힘 판정만 입구 안쪽으로 12px 물린다.
      // 입구 테두리에서 캐릭터가 걸려 보이는 현상을 막는다.
      { x: 512, visualX: 500, y: 270, w: 60, h: 230, wall: true, label: 'MEMORY GATE' },
    ];
    game.exit = { x: 875, y: 418, w: 36, h: 82, label: 'MEMORY GATE' };
    game.fallZones = [];
  } else if (layout === 'wall') {
    game.platforms = [
      { x: 0, y: 500, w: 205, h: 40, label: 'MEMORY SHORE' },
      { x: 318, y: 430, w: 132, h: 18, label: 'MEMORY CROSSROADS' },
      { x: 525, y: 470, w: 112, h: 18, label: 'MOONLIGHT LAMP' },
      { x: 110, y: 235, w: 200, h: 18, label: 'STAR BALLOON ROOF' },
      { x: 740, y: 390, w: 112, h: 18, label: 'CAROUSEL LAMP' },
      { x: 858, y: 80, w: 48, h: 420, wall: true, label: 'LAUGH COLLECTOR' },
      { x: 906, y: 500, w: 54, h: 40, label: 'NEXT DREAM SHORE' },
    ];
    game.exit = { x: 918, y: 418, w: 36, h: 82, label: 'LAUGH CORE' };
    game.fallZones = [{ x: 205, y: 500, w: 701, h: 40 }];
  } else if (layout === 'carousel') {
    game.platforms = [
      // 중앙 허브. K 기록은 가운데 보랏빛 발판에서 시작한다.
      { x: 360, y: 350, w: 60, h: 18, dropThrough: true, carouselArtCollider: true, carouselSurface: 'anchor', label: 'HUB WEST' },
      { x: 420, y: 350, w: 120, h: 18, dropThrough: true, carouselMemoryStart: true, carouselArtCollider: true, carouselSurface: 'anchor', label: 'CENTRAL K HUB' },
      { x: 540, y: 350, w: 60, h: 18, dropThrough: true, carouselArtCollider: true, carouselSurface: 'anchor', label: 'HUB EAST' },

      // 북서 기억 방사로. passage만 원형벽의 기억 구멍을 관통한다.
      { x: 335, y: 290, w: 110, h: 16, carouselArtCollider: true, label: 'NORTHWEST INNER SPOKE' },
      { x: 340, y: 235, w: 85, h: 16, carouselArtCollider: true, label: 'NORTHWEST MID SPOKE' },
      { x: 285, y: 170, w: 140, h: 18, carouselArtCollider: true, label: 'NORTHWEST MEMORY PASSAGE' },
      { x: 100, y: 100, w: 220, h: 18, dropThrough: false, carouselArtCollider: true, carouselSurface: 'anchor', label: 'MEMORY OUTER SHELF' },

      // 북동 별빛 방사로.
      { x: 515, y: 290, w: 110, h: 16, carouselArtCollider: true, label: 'NORTHEAST INNER SPOKE' },
      { x: 535, y: 235, w: 85, h: 16, carouselArtCollider: true, label: 'NORTHEAST MID SPOKE' },
      { x: 535, y: 170, w: 140, h: 18, carouselArtCollider: true, label: 'NORTHEAST STAR PASSAGE' },
      { x: 640, y: 100, w: 220, h: 18, dropThrough: false, carouselArtCollider: true, carouselSurface: 'anchor', label: 'STAR OUTER SHELF' },

      // 서쪽 달빛 전실은 다섯 회전 자세의 기준점이며 별도 목표는 없다.
      { x: 215, y: 290, w: 160, h: 18, carouselArtCollider: true, label: 'WEST MOON PASSAGE' },
      { x: 80, y: 350, w: 155, h: 18, dropThrough: false, carouselArtCollider: true, carouselSurface: 'anchor', label: 'MOON OUTER PORCH' },

      // 남동 리본 방사로. 중앙 허브에서 아래로 내려간 뒤 되돌아올 수 있다.
      { x: 420, y: 415, w: 170, h: 18, carouselArtCollider: true, label: 'SOUTH RETURN STEP' },
      { x: 530, y: 435, w: 170, h: 18, carouselArtCollider: true, label: 'SOUTHEAST RIBBON PASSAGE' },
      { x: 600, y: 470, w: 260, h: 40, dropThrough: false, carouselArtCollider: true, carouselSurface: 'ground', label: 'RIBBON OUTER FLOOR' },
      { x: 860, y: 394, w: 24, h: 146, wall: true, persistentWall: true, carouselArtCollider: true, carouselSurface: 'wall', label: 'RIBBON OUTER GUARD' },

      // 원주 구역 사이의 영구 방사형 레일. 회전벽 바깥 우회를 막는다.
      { x: 0, y: 205, w: 310, h: 24, wall: true, persistentWall: true, carouselArtCollider: true, carouselSurface: 'wall', label: 'MEMORY MOON DIVIDER' },
      { x: 650, y: 205, w: 310, h: 24, wall: true, persistentWall: true, carouselArtCollider: true, carouselSurface: 'wall', label: 'STAR EXIT DIVIDER' },
      { x: 650, y: 370, w: 310, h: 24, wall: true, persistentWall: true, carouselArtCollider: true, carouselSurface: 'wall', label: 'EXIT RIBBON DIVIDER' },
      { x: 468, y: 0, w: 24, h: 100, wall: true, persistentWall: true, carouselArtCollider: true, carouselSurface: 'wall', label: 'TOP AXIS DIVIDER' },
      { x: 468, y: 470, w: 24, h: 70, wall: true, persistentWall: true, carouselArtCollider: true, carouselSurface: 'wall', label: 'BOTTOM AXIS DIVIDER' },

      // 동쪽 출구 방사로.
      { x: 530, y: 290, w: 220, h: 18, carouselArtCollider: true, label: 'EAST EXIT PASSAGE' },
      { x: 730, y: 350, w: 90, h: 18, carouselArtCollider: true, label: 'EAST EXIT LANDING' },
      { x: 800, y: 350, w: 160, h: 18, dropThrough: false, carouselArtCollider: true, carouselSurface: 'ground', label: 'EAST EXIT FLOOR' },
    ];
    Object.assign(game.player, { x: 468, y: 316, vx: 0, vy: 0, grounded: true });
    game.carouselSwitches = [
      { id: 'star', x: 752, y: 62, w: 38, h: 38, label: '별빛 잠금 장치', color: '#8ff5e8' },
      { id: 'ribbon', x: 752, y: 432, w: 38, h: 38, label: '리본 잠금 장치', color: '#ff9fcf' },
    ];
    game.exit = { x: 884, y: 268, w: 36, h: 82, label: 'NEXT DREAM GATE' };
    game.fallZones = [{ x: 0, y: 500, w: 960, h: 40 }];
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
  game.signpostMaze = layout === 'signpost-maze' ? createSignpostMazeState() : null;
  // 퍼즐 구역의 화면 맨 아래는 어디서든 꿈의 바깥입니다.
  // 발판 사이로 빠진 뒤 캔버스 하단을 걸어서 우회하지 못하도록 통일합니다.
  game.bottomIsVoid = true;
  game.fragments = [];
  const padsByLayout = {
    walk: [],
    'lantern-river': [],
    bridge: [{ x: 165, y: 462, w: 30, h: 28, label: '첫 약속' }],
    wall: [
      { x: 566, y: 432, w: 30, h: 28, label: '달빛 약속등' },
      { x: 190, y: 197, w: 30, h: 28, label: '별풍선 추억등' },
      { x: 780, y: 352, w: 30, h: 28, label: '회전목마 웃음등' },
    ],
    chorus: [{ x: 478, y: 342, w: 30, h: 28, label: '첫 번째 노래 기억' }],
    'chorus-memory': [{ x: 378, y: 246, w: 30, h: 28, label: '높은 음의 기억' }],
    duet: [
      { x: 150, y: 462, w: 30, h: 28, label: '첫 번째 빈 의자' },
      { x: 520, y: 462, w: 30, h: 28, label: '두 번째 빈 의자' },
    ],
    'choir-balcony': [
      { x: 300, y: 328, w: 30, h: 28, label: '낮은 빈 의자' },
      { x: 696, y: 166, w: 30, h: 28, label: '높은 빈 의자' },
    ],
    'harmony-spiral': [
      { x: 304, y: 326, w: 30, h: 28, label: '낮은 음의 자리' },
      { x: 770, y: 316, w: 30, h: 28, label: '높은 음의 자리' },
    ],
    relay: [{ x: 135, y: 462, w: 30, h: 28, label: '출발 신호' }],
    dash: [{ x: 138, y: 462, w: 30, h: 28, label: '질주 기억' }],
    'wind-tunnel': [{ x: 135, y: 462, w: 30, h: 28, label: '터널 출발 신호' }],
    'wind-cliff': [{ x: 158, y: 462, w: 30, h: 28, label: '절벽의 약속' }],
    'signpost-maze': [{ x: 132, y: 462, w: 30, h: 28, label: '진짜 출발 신호' }],
    'starlight-ferry': [],
    'garden-roots': [{ x: 574, y: 290, w: 30, h: 28, label: '뿌리의 기억' }],
    'classroom-fracture': [
      { x: 266, y: 392, w: 30, h: 28, label: '낮은 친구 자리' },
      { x: 532, y: 238, w: 30, h: 28, label: '높은 친구 자리' },
    ],
    carousel: [{ x: 176, y: 62, w: 38, h: 38, label: '왼쪽 위 하린의 기억 코어' }],
    watcher: [
      { x: 500, y: 462, w: 16, h: 28, label: '회전목마' },
      { x: 550, y: 462, w: 16, h: 28, label: '함께 웃기' },
    ],
  };
  game.memoryPads = padsByLayout[layout] || [];
  game.echoGoal = echoGoal;
  decoratePuzzleRolePads();
}

function bossEchoDurabilityGroup(mode, memoryPads, decoyPads) {
  if (mode === 'chase') return decoyPads.length;
  // 5스테이지의 세 기억 중 한 곳은 현재의 본체가 직접 지킬 수 있어 K 잔상은 두 개면 충분하다.
  if (mode === 'calm') return Math.max(0, memoryPads.length - 1);
  return memoryPads.length;
}

function bossEchoHitLimit(durabilityGroup, configuredLimit) {
  const configured = Number(configuredLimit);
  if (Number.isFinite(configured) && configured > 0) return Math.max(1, Math.round(configured));
  if (durabilityGroup >= 3) return 4;
  return 3;
}

function setupBoss(name, config = {}) {
  // 직전 퍼즐의 레이아웃 전용 입력 조건이 보스전에 남지 않게 한다.
  // 특히 4스테이지 뒤에는 carousel K 시작 발판 검사가 5스테이지 K 기록을 막을 수 있다.
  game.layout = 'boss';
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
  const configuredMemoryPads = (config.memoryPads || defaultMemoryPads).map((pad) => ({ ...pad }));
  const configuredDecoyPads = (config.decoyPads || []).map((pad) => ({ ...pad }));
  const echoDurabilityGroup = bossEchoDurabilityGroup(config.mode, configuredMemoryPads, configuredDecoyPads);
  game.boss = {
    name, x: config.x || 734, y: config.y || 168, w: config.w || 164, h: config.h || 205, maxHp: bossHp, hp: bossHp, flash: 0, attack: 0, attackIndex: 0,
    phase: 1, reflections: 0, memoryShield: 0, calmed: false, mode: config.mode || 'standard', resolving: false, activePads: 0, threatElapsed: 0,
    attackUnlocked: false, visual: config.visual || 'clown', attackTarget: config.attackTarget || 'player',
    // 하늘 보스전은 잔상이 공격을 "버티는" 체력 기믹이 아니다. 두 기준점은 바람의 방향을 읽기 위한 고정점이며,
    // 윤호가 질주로 되돌림 바람을 가로챌 때마다 다음 순풍 고리가 열린다.
    relayTurns: Math.max(1, Math.round(Number(config.relayTurns) || (config.windGates || []).length || 3)),
    relayProgress: 0, relayPhase: 'intercept', relayTargetIndex: 0, relayDeadline: 0, relayPulse: 0, relayMissPulse: 0, relayAnchorsReady: false,
    relayImpact: null, relayImpactPulse: 0, relayEchoProtected: Boolean(config.relayEchoProtected),
    windVanePhase: false, windVane: null, vaneReflectedHits: 0, vaneHitPulse: 0, vaneBossTargetX: 0, vaneBossTargetY: 0,
    vaneBossSequence: [], vaneBossSequenceIndex: 0, vaneBossSlot: '2', vaneBossReady: false,
    vaneHitCooldown: 0,
    // K 잔상 두 개를 유지하는 보스전은 3회, 세 개를 유지하는 보스전은 4회까지 버틴다.
    echoDurabilityGroup,
    echoHitLimit: bossEchoHitLimit(echoDurabilityGroup, config.echoHitLimit), echoAttackCadence: Math.max(0, Math.round(Number(config.echoAttackCadence) || 0)), echoDamagePulse: 0,
    calmDuration: Number(config.calmDuration) || 1.4, calmProgress: 0,
    calmReflectionActive: false, calmReflectionBroken: 0, calmReflectionRequired: 3, calmReflectionMasks: [], calmMaskImpactPulse: 0,
    distortedMemoryPads: (config.distortedMemoryPads || []).map((pad, index) => ({
      ...pad,
      homeX: pad.x,
      homeY: pad.y,
      fakeMemoryIndex: index,
      activated: false,
      defeated: false,
      hits: 0,
      vx: 0,
      vy: 0,
      stunTimer: 0,
      stolenEcho: null,
    })),
    decoyPads: configuredDecoyPads, windGates: (config.windGates || []).map((gate) => ({ ...gate })),
    resonanceGates: (config.resonanceGates || []).map((gate) => ({ ...gate })), resonanceProgress: 0, lastRhythmPulse: null,
    codaDuration: Number(config.codaDuration) || 0, codaElapsed: 0, codaActive: false,
    mirrorGates: (config.mirrorGates || []).map((gate) => ({ ...gate })), fakeMirrorGates: (config.fakeMirrorGates || []).map((gate) => ({ ...gate })), mirrorProgress: 0, falseMirrorCooldown: 0,
    truthTargets: (config.truthTargets || []).map((target) => ({
      ...target,
      homeX: target.x,
      homeY: target.y,
      motion: target.motion ? { ...target.motion } : null,
    })), truthProgress: 0, truthResolved: false, defeated: false,
    voiceGate: config.voiceGate ? { ...config.voiceGate } : null, voiceProgress: 0, voiceDuration: Number(config.voiceDuration) || 1.7,
    finalChargeNeeded: Number(config.finalChargeNeeded) || 1.4, finalCharge: 0,
    releaseReady: false, releaseProgress: 0, releaseDuration: Number(config.releaseDuration) || 2.6, memoryReplay: 0,
    moveBounds: config.moveBounds || { xMin: 45, xMax: 565, yMin: 86, yMax: 437 },
    memoryPads: configuredMemoryPads,
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

function activeCalmFakeMemories(boss = game.boss) {
  if (boss?.mode !== 'calm') return [];
  return boss.distortedMemoryPads.filter((fake) => fake.activated && !fake.defeated && fake.stolenEcho);
}

function calmFakeProgress(boss = game.boss) {
  const active = activeCalmFakeMemories(boss);
  const engaged = boss?.mode === 'calm'
    ? boss.distortedMemoryPads.filter((fake) => fake.activated || fake.defeated)
    : [];
  return {
    active,
    hitCount: engaged.reduce((total, fake) => total + (fake.defeated ? 2 : fake.hits || 0), 0),
    requiredHits: engaged.length * 2,
  };
}

function protectedStolenEchoes(boss = game.boss) {
  return activeCalmFakeMemories(boss).map((fake) => fake.stolenEcho).filter(Boolean);
}

function countedMemoryEchoes() {
  return [...game.echoes, ...protectedStolenEchoes()]
    .sort((left, right) => (left.recordOrder || 0) - (right.recordOrder || 0));
}

const CALM_FAKE_SHOT_SPEED = 640;

function calmFakeShotDirection(player = game.player) {
  let x = horizontalInput();
  let y = verticalInput();
  if (x === 0 && y === 0) x = player?.facing >= 0 ? 1 : -1;
  const length = Math.max(1, Math.hypot(x, y));
  return { x: x / length, y: y / length };
}

function triggerBossShot() {
  const boss = game.boss;
  if (game.phase !== 'playing' || currentStage()?.type !== 'boss' || game.fireCooldown > 0) return;
  if (boss?.mode === 'calm' && boss.calmReflectionActive) {
    const mask = calmReflectionLaunchCandidate(boss);
    if (!mask) {
      game.fireCooldown = .12;
      say('가면에서 너무 멀거나 너무 가깝습니다. 조준선이 표시되는 거리에서 각도를 잡고 J를 누르세요.');
      return;
    }
    if (!spend(4)) return;
    if (!launchCalmReflectionMask(boss, mask)) return;
    game.fireCooldown = .28;
    say('가면을 현재 조준 방향으로 직선 발사했습니다! 광대의 동선과 맞는지 지켜보세요.');
    return;
  }
  const calmFakeIsFleeing = boss?.mode === 'calm' && activeCalmFakeMemories(boss).length > 0;
  if (calmFakeIsFleeing) {
    if (!spend(4)) return;
    const player = game.player;
    const direction = calmFakeShotDirection(player);
    const size = 18;
    const centerX = player.x + player.w / 2;
    const centerY = player.y + player.h / 2;
    game.dreamShots.push({
      x: centerX - size / 2,
      y: centerY - size / 2,
      w: size,
      h: size,
      vx: direction.x * CALM_FAKE_SHOT_SPEED,
      vy: direction.y * CALM_FAKE_SHOT_SPEED,
      life: 0,
      target: 'calm-fake',
    });
    game.fireCooldown = .22;
    return;
  }
  const finalBossCanBeHit = boss?.mode === 'final' && boss.attackUnlocked && !boss.releaseReady && finalBossPhase(boss) !== 4;
  if (!finalBossCanBeHit) return;
  if (!spend(4)) return;
  const p = game.player;
  const direction = p.facing >= 0 ? 1 : -1;
  const origin = { x: direction > 0 ? p.x + p.w : p.x - 19, y: p.y + p.h / 2 - 3 };
  game.dreamShots.push({ x: origin.x, y: origin.y, w: 19, h: 7, vx: direction * 720, vy: 0, life: 0, target: 'boss' });
  game.fireCooldown = 0.22;
  say('기억 탄환을 되돌려 보냈습니다.');
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

function calmMemoryState(boss = game.boss) {
  const pads = boss?.mode === 'calm' ? boss.memoryPads || [] : [];
  const activeByIndex = pads.map((pad) => {
    if (!padRequirementMet(pad)) return false;
    const echoReady = game.echoes.some((echo) => echoOverlapsPad(echo, pad));
    const playerReady = Boolean(game.player && overlaps(game.player, pad));
    return echoReady || playerReady;
  });
  const trueMemoryCount = activeByIndex.filter(Boolean).length;
  return {
    activeByIndex,
    trueMemoryCount,
    memoryTargetCount: pads.length,
    activePads: trueMemoryCount,
  };
}

function activateCalmFakeMemories(boss) {
  let activatedCount = 0;
  boss.distortedMemoryPads.forEach((fake) => {
    if (fake.activated || fake.defeated) return;
    const echoIndex = game.echoes.findIndex((echo) => echoOverlapsPad(echo, fake));
    if (echoIndex < 0) return;
    const [stolenEcho] = game.echoes.splice(echoIndex, 1);
    stolenEcho.protectedStolen = true;
    stolenEcho.holding = true;
    stolenEcho.flash = .38;
    fake.activated = true;
    fake.fleeing = true;
    fake.hits = 0;
    fake.stolenEcho = stolenEcho;
    const fakeCenterX = fake.x + fake.w / 2;
    const playerCenterX = game.player.x + game.player.w / 2;
    const awayX = Math.sign(fakeCenterX - playerCenterX) || (fake.fakeMemoryIndex % 2 ? 1 : -1);
    fake.vx = awayX * 138;
    fake.vy = (fake.fakeMemoryIndex % 2 ? 1 : -1) * 78;
    activatedCount += 1;
  });
  if (activatedCount > 0) {
    say('가짜 기억이 잔상을 훔쳐 달아납니다! WASD로 발사 방향을 잡고 J 기억 탄환을 두 번 맞히세요.');
  }
}

function updateCalmFakeMemories(boss, dt, frozen) {
  if (!frozen) activateCalmFakeMemories(boss);
  const bounds = boss.moveBounds || { xMin: 45, xMax: 565, yMin: 86, yMax: 437 };
  activeCalmFakeMemories(boss).forEach((fake) => {
    fake.hitFlash = Math.max(0, (fake.hitFlash || 0) - dt);
    if (!frozen) fake.stunTimer = Math.max(0, (fake.stunTimer || 0) - dt);
    if (!frozen && fake.stunTimer <= 0) {
      const minX = Math.max(24, bounds.xMin - 8);
      const maxX = Math.min(W - fake.w - 28, bounds.xMax + 68);
      const minY = Math.max(58, bounds.yMin - 10);
      const maxY = Math.min(H - fake.h - 26, bounds.yMax);
      fake.x += fake.vx * dt;
      fake.y += fake.vy * dt;
      if (fake.x <= minX || fake.x >= maxX) {
        fake.x = Math.max(minX, Math.min(maxX, fake.x));
        fake.vx *= -1;
      }
      if (fake.y <= minY || fake.y >= maxY) {
        fake.y = Math.max(minY, Math.min(maxY, fake.y));
        fake.vy *= -1;
      }
    }
    const direction = fake.vx >= 0 ? 1 : -1;
    Object.assign(fake.stolenEcho, {
      x: fake.x - direction * 36,
      y: fake.y + 3,
      vx: fake.vx,
      vy: fake.vy,
      facing: direction,
      holding: true,
      motionState: {
        running: true,
        phase: (boss.threatElapsed || 0) * Math.PI * 2,
        frameIndex: currentRunFrameIndex(boss.threatElapsed || 0),
      },
    });
  });
}

const CALM_REFLECTION_MASK_COUNT = 3;

function setCalmReflectionRoamTarget(entity, bounds, pause = false) {
  entity.roamTargetX = bounds.xMin + Math.random() * Math.max(1, bounds.xMax - bounds.xMin);
  entity.roamTargetY = bounds.yMin + Math.random() * Math.max(1, bounds.yMax - bounds.yMin);
  entity.roamPause = pause ? .08 + Math.random() * .28 : 0;
}

function updateCalmReflectionRoamer(entity, bounds, dt) {
  entity.hitFlash = Math.max(0, (entity.hitFlash || 0) - dt);
  if ((entity.roamPause || 0) > 0) {
    entity.roamPause = Math.max(0, entity.roamPause - dt);
    entity.vx = (entity.vx || 0) * Math.max(0, 1 - dt * 8);
    entity.vy = (entity.vy || 0) * Math.max(0, 1 - dt * 8);
    return;
  }
  if (!Number.isFinite(entity.roamTargetX) || !Number.isFinite(entity.roamTargetY)) setCalmReflectionRoamTarget(entity, bounds);
  const dx = entity.roamTargetX - entity.x;
  const dy = entity.roamTargetY - entity.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 9) {
    setCalmReflectionRoamTarget(entity, bounds, true);
    return;
  }
  const speed = entity.roamSpeed || 82;
  const desiredVx = dx / distance * speed;
  const desiredVy = dy / distance * speed;
  const blend = Math.min(1, dt * 4.8);
  entity.vx = (entity.vx || 0) + (desiredVx - (entity.vx || 0)) * blend;
  entity.vy = (entity.vy || 0) + (desiredVy - (entity.vy || 0)) * blend;
  entity.x = Math.max(bounds.xMin, Math.min(bounds.xMax, entity.x + entity.vx * dt));
  entity.y = Math.max(bounds.yMin, Math.min(bounds.yMax, entity.y + entity.vy * dt));
}

function beginCalmReflectionPhase(boss) {
  if (!boss || boss.mode !== 'calm' || boss.calmReflectionActive) return;
  boss.calmReflectionActive = true;
  boss.calmMemoryComplete = boss.memoryPads.length || 3;
  boss.calmReflectionBroken = 0;
  boss.calmReflectionRequired = CALM_REFLECTION_MASK_COUNT;
  boss.calmProgress = boss.calmDuration;
  boss.activePads = boss.calmMemoryComplete;
  boss.phase = 4;
  // 2페이즈 광대는 기존 크기의 2/3으로 줄여 가면 투사체를 예측해 맞히는 표적이 된다.
  boss.w = 48;
  boss.h = 72;
  boss.x = W - boss.w - 108;
  boss.y = 214;
  boss.vx = 0;
  boss.vy = 0;
  // 작은 몸집에 맞춰 이동 속도를 더 높여, 가면 투사 각도 예측을 요구한다.
  boss.roamSpeed = 104;
  boss.moveBounds = { xMin: 24, xMax: W - game.player.w - 24, yMin: 58, yMax: H - game.player.h - 24 };
  boss.calmReflectionBounds = { xMin: 24, xMax: W - boss.w - 24, yMin: 58, yMax: H - boss.h - 24 };
  setCalmReflectionRoamTarget(boss, boss.calmReflectionBounds);
  const maskStarts = [
    { x: 178, y: 102 },
    { x: 428, y: 382 },
    { x: 676, y: 116 },
  ];
  boss.calmReflectionMasks = maskStarts.map((start, index) => {
    const mask = {
      ...start,
      w: 36,
      h: 42,
      index,
      broken: false,
      launched: false,
      vx: 0,
      vy: 0,
      roamSpeed: 88 + index * 7,
      roamPhase: Math.random() * Math.PI * 2,
    };
    mask.roamBounds = { xMin: 24, xMax: W - mask.w - 24, yMin: 58, yMax: H - mask.h - 24 };
    setCalmReflectionRoamTarget(mask, mask.roamBounds);
    return mask;
  });
  game.recording = null;
  game.echoes = [];
  game.memoryPads = [];
  game.platforms = [];
  game.fragments = [];
  game.fallZones = [];
  game.exit = null;
  game.dreamTrails = [];
  game.dreamShots = [];
  game.nightmareShots = [];
  boss.memoryPads = [];
  boss.distortedMemoryPads = [];
  // 2페이즈 전환 직후 첫 웃음 탄막이 바로 시작된다.
  game.nextAttack = 0;
  say('세 기억이 겹치자 무대의 오브젝트가 사라졌습니다. 가면 가까이에서 조준선을 정하고 광대의 이동 경로를 예상해 J로 직선 발사하세요.');
  updateHud();
}

function calmReflectionLaunchCandidate(boss = game.boss) {
  if (!boss?.calmReflectionActive || !game.player) return null;
  const playerCenter = { x: game.player.x + game.player.w / 2, y: game.player.y + game.player.h / 2 };
  return boss.calmReflectionMasks
    .filter((mask) => !mask.broken && !mask.launched)
    .map((mask) => {
      const maskCenterX = mask.x + mask.w / 2;
      const maskCenterY = mask.y + mask.h / 2;
      const distance = Math.hypot(maskCenterX - playerCenter.x, maskCenterY - playerCenter.y);
      return { mask, distance };
    })
    .filter(({ distance }) => distance >= 34 && distance <= 190)
    .sort((left, right) => left.distance - right.distance)[0]?.mask || null;
}

function launchCalmReflectionMask(boss, mask) {
  if (!boss?.calmReflectionActive || !mask || mask.broken || mask.launched) return false;
  const maskCenterX = mask.x + mask.w / 2;
  const maskCenterY = mask.y + mask.h / 2;
  const playerCenterX = game.player.x + game.player.w / 2;
  const playerCenterY = game.player.y + game.player.h / 2;
  const dx = maskCenterX - playerCenterX;
  const dy = maskCenterY - playerCenterY;
  const distance = Math.max(1, Math.hypot(dx, dy));
  mask.launched = true;
  mask.launchSpeed = 590;
  mask.launchTime = 2.05;
  mask.launchSpin = 0;
  mask.vx = dx / distance * mask.launchSpeed;
  mask.vy = dy / distance * mask.launchSpeed;
  mask.hitFlash = .32;
  return true;
}

function updateLaunchedCalmReflectionMask(boss, mask, dt) {
  mask.launchTime = Math.max(0, (mask.launchTime || 0) - dt);
  mask.launchSpin = (mask.launchSpin || 0) + dt * 20;
  mask.hitFlash = Math.max(0, (mask.hitFlash || 0) - dt);
  const travelX = mask.vx * dt;
  const travelY = mask.vy * dt;
  const travelSteps = Math.max(1, Math.ceil(Math.hypot(travelX, travelY) / 14));
  for (let step = 0; step < travelSteps; step += 1) {
    mask.x += travelX / travelSteps;
    mask.y += travelY / travelSteps;
    if (overlaps(mask, boss)) {
      hitCalmReflectionMask(boss, mask);
      return;
    }
  }
  if (mask.launchTime > 0 && mask.x > -mask.w && mask.x < W && mask.y > -mask.h && mask.y < H) return;
  mask.launched = false;
  mask.x = Math.max(mask.roamBounds.xMin, Math.min(mask.roamBounds.xMax, mask.x));
  mask.y = Math.max(mask.roamBounds.yMin, Math.min(mask.roamBounds.yMax, mask.y));
  mask.vx = 0;
  mask.vy = 0;
  setCalmReflectionRoamTarget(mask, mask.roamBounds, true);
  say('가면이 광대의 동선을 빗나갔습니다. 이동 방향을 다시 예상해 발사 각도를 조정하세요.');
}

function updateCalmReflectionMotion(boss, dt, freezeMasks = false) {
  updateCalmReflectionRoamer(boss, boss.calmReflectionBounds, dt);
  if (!freezeMasks) {
    boss.calmReflectionMasks
      .filter((mask) => !mask.broken)
      .forEach((mask) => {
        if (mask.launched) updateLaunchedCalmReflectionMask(boss, mask, dt);
        else updateCalmReflectionRoamer(mask, mask.roamBounds, dt);
      });
  }
  boss.calmMaskImpactPulse = Math.max(0, (boss.calmMaskImpactPulse || 0) - dt);
}

function hitCalmReflectionMask(boss, mask) {
  if (!boss?.calmReflectionActive || !mask || mask.broken) return;
  mask.broken = true;
  mask.launched = false;
  boss.calmReflectionBroken = boss.calmReflectionMasks.filter((candidate) => candidate.broken).length;
  boss.flash = .34;
  boss.calmMaskImpactPulse = .48;
  if (boss.calmReflectionBroken >= boss.calmReflectionRequired) {
    game.nightmareShots = [];
    game.nextAttack = 99;
    resolveBoss(boss, '되돌린 가면 세 개가 광대의 두려움을 모두 깨뜨렸습니다. 가면이 사라지고 하린이 다시 웃습니다.');
  } else {
    say(`가면이 광대를 정확히 맞혔습니다. ${boss.calmReflectionBroken} / ${boss.calmReflectionRequired}`);
  }
  updateHud();
}

function hitCalmFakeMemory(fake) {
  fake.hits = Math.min(2, (fake.hits || 0) + 1);
  fake.hitFlash = .3;
  fake.stunTimer = .62;
  if (fake.hits < 2) {
    say('기억 탄환이 가짜 기억에 맞았습니다. 한 번 더 맞히면 훔쳐 간 잔상이 사라집니다.');
    return;
  }
  fake.stolenEcho = null;
  fake.activated = false;
  fake.fleeing = false;
  fake.defeated = true;
  say('두 번째 기억 탄환이 가짜 기억을 깨뜨려, 훔쳐 달아나던 잔상도 함께 사라졌습니다.');
}

function captureMemoryFrame(player, time = 0) {
  const bossMode = currentStage()?.type === 'boss';
  const motion = playerMotionState(player, bossMode);
  return {
    time,
    x: player.x,
    y: player.y,
    w: player.w,
    h: player.h,
    facing: player.facing,
    vx: player.vx || 0,
    vy: player.vy || 0,
    grounded: Boolean(player.grounded),
    bossMode,
    motionState: { ...motion },
    techniques: { ...activeTechniques() },
  };
}

function beginMemoryRecording() {
  if (!spend(8)) return;
  const p = game.player;
  const startFrame = captureMemoryFrame(p, 0);
  game.recording = {
    start: { x: p.x, y: p.y, w: p.w, h: p.h, facing: p.facing },
    frames: [startFrame],
    duration: 0,
  };
  say('① 기록 시작: 상상력을 조금 사용합니다. ② 목표 발판까지 이동하세요. ③ K를 다시 누르면 되감기고, 기억의 나가 길을 재생합니다.');
}

function memoryRoleForCurrentDream() {
  const boss = game.boss;
  if (boss?.mode === 'calm') return { id: 'warmth', label: 'WARMTH' };
  if (boss?.mode === 'resonance') return { id: 'harmony', label: 'HARMONY' };
  // 하늘 보스전의 잔상은 공격을 대신 맞는 미끼가 아니라, 되돌림 바람의 방향을 읽는 출발 기준점이다.
  if (boss?.mode === 'chase') return { id: 'wind-anchor', label: 'WIND ANCHOR' };
  if (boss?.mode === 'mirror') return { id: 'reflection', label: 'PHOTO' };
  if (boss?.mode === 'final') return { id: 'truth', label: 'TRUTH' };
  if (game.layout === 'wall' || game.layout === 'dash') return { id: 'step', label: 'STEP' };
  if (game.layout === 'chorus' || game.layout === 'chorus-memory') return { id: 'note', label: 'NOTE' };
  return { id: 'memory', label: 'MEMORY' };
}

function finishMemoryRecording() {
  const recording = game.recording;
  if (!recording || recording.duration < .35) {
    game.recording = null;
    say('조금 더 움직인 뒤 기억을 남겨 보세요.');
    return;
  }
  const role = memoryRoleForCurrentDream();
  const echo = {
    frames: recording.frames,
    elapsed: 0,
    playbackIndex: 0,
    x: recording.start.x,
    y: recording.start.y,
    w: recording.start.w,
    h: recording.start.h,
    holding: false,
    role,
    baitUses: 0,
    baitCooldown: 0,
    nightmareHits: 0,
    recordOrder: (game.memoryRecordsUsed || 0) + 1,
  };
  const protectedEchoCount = protectedStolenEchoes().length;
  const availableNormalSlots = Math.max(0, 3 - protectedEchoCount);
  if (availableNormalSlots === 0) {
    Object.assign(game.player, { ...recording.start, vx: 0, vy: 0, grounded: false });
    game.recording = null;
    say('세 잔상 슬롯이 모두 가짜 기억에 붙잡혔습니다. WASD로 조준해 J 기억 탄환을 맞히세요.');
    updateHud();
    return;
  }
  const replacedOldestEcho = game.echoes.length >= availableNormalSlots;
  if (replacedOldestEcho) {
    game.echoes.shift();
  }
  game.echoes.push(echo);
  game.memoryRecordsUsed = (game.memoryRecordsUsed || 0) + 1;
  Object.assign(game.player, { ...recording.start, vx: 0, vy: 0, grounded: false });
  game.recording = null;
  game.rewindExpressionTimer = .55;
  say(replacedOldestEcho
    ? '되감기 완료. 가장 오래된 기억의 나가 사라지고, 새 기록이 세 번째 자리를 이어받았습니다.'
    : '되감기 완료. 기억의 나가 방금 전 길을 재생해 마지막 발판을 지킵니다. 현재의 나는 다음 기억을 만들러 가세요.');
}

function toggleMemoryRecording() {
  if (game.phase !== 'playing') return;
  if (game.boss?.mode === 'calm' && game.boss.calmReflectionActive) {
    game.recording = null;
    say('가면 반사전에서는 기억 기록이 끝났습니다. 가면 가까이에서 조준선을 정하고 J로 직선 발사하세요.');
    updateHud();
    return;
  }
  if (game.boss?.mode === 'resonance' && game.boss.codaActive) {
    game.recording = null;
    say('20초 생존 단계에서는 잔상 유지 조건과 K 기록이 비활성화됩니다. 주인공으로 불협화음만 피하세요.');
    updateHud();
    return;
  }
  if (game.layout === 'carousel' && !game.recording) {
    if (game.carouselRotationTimer > 0) {
      say('원형벽이 회전을 마칠 때까지 K 기록을 시작할 수 없습니다.');
      return;
    }
    if (game.carouselExitBridgeDeployed) {
      say('꿈의 문 잠금은 이미 풀렸습니다. P/Y로 오른쪽으로 이어지는 틈을 자유롭게 선택하세요.');
      return;
    }
    if (game.carouselCoreLatched) {
      say(carouselRelaysReady()
        ? '기억과 두 외부 잠금이 모두 고정됐습니다. P/Y로 구멍을 동쪽 출구길과 맞추세요.'
        : `기억 코어는 고정됐습니다. 북동·남동 외부 잠금을 마저 밟으세요. 현재 ${carouselRelayCount()} / ${CAROUSEL_REQUIRED_RELAYS}.`);
      return;
    }
    if (game.echoes.some((echo) => !echo.holding)) {
      say('기억의 나가 왼쪽 위 코어에 도착할 때까지 새 기록을 시작할 수 없습니다.');
      return;
    }
    if (!standingCarouselMemoryStart()) {
      say('원 중앙의 보랏빛 K 기록 시작 발판 위에서 K를 눌러 주세요.');
      return;
    }
    if (carouselPhaseInfo().id !== 'memory') {
      say('발판은 이미 존재합니다. P/Y로 원형벽의 구멍을 북서쪽 기억길과 먼저 맞추세요.');
      return;
    }
  }
  if (game.recording) finishMemoryRecording();
  else beginMemoryRecording();
  updateHud();
}

function updateMemoryLoops(dt) {
  if (game.recording) {
    game.recording.duration += dt;
    game.recording.frames.push(captureMemoryFrame(game.player, game.recording.duration));
    if (game.recording.duration >= 5.5) finishMemoryRecording();
  }
  game.echoes.forEach((echo) => {
    echo.elapsed += dt;
    echo.flash = Math.max(0, (echo.flash || 0) - dt);
    echo.baitCooldown = Math.max(0, (echo.baitCooldown || 0) - dt);
    let index = echo.playbackIndex || 0;
    while (index < echo.frames.length - 1 && echo.frames[index + 1].time <= echo.elapsed) index += 1;
    echo.playbackIndex = index;
    const frame = echo.frames[index];
    Object.assign(echo, frame);
    echo.holding = index >= echo.frames.length - 1;
  });
}

function formatNumberedGuide(text = '') {
  // 안내 어디에서든 ①·②·③ 같은 순서 표시는 한 줄에 하나만 남겨 읽기 쉽게 한다.
  return String(text).replace(/\s*([①②③④⑤⑥⑦⑧⑨⑩])\s*/g, '\n$1 ').trim();
}

function say(text) {
  toast.textContent = formatNumberedGuide(text);
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
  const calmTimeReady = game.boss?.mode !== 'calm' || game.boss.calmReflectionActive;
  return {
    time: game.phase === 'playing' && hasSkill('time') && calmTimeReady && (keys.has('ShiftLeft') || keys.has('ShiftRight')) && game.imagination > 0,
    resonance: game.phase === 'playing' && hasSkill('resonance') && keys.has('KeyL') && game.imagination > 0,
  };
}

function triggerDash() {
  if (game.phase !== 'playing' || !hasSkill('dash') || isSkillBlocked('dash') || game.dashCooldown > 0) return;
  if (game.layout === 'carousel' && game.carouselRotationTimer > 0) return;
  if (!spend(12)) return;
  const p = game.player;
  game.dashDirection = horizontalInput() || p.facing || 1;
  game.dashTimer = 0.16;
  game.dashVisualTimer = DASH_VISUAL_DURATION;
  game.dashTrailClock = 0;
  rememberDreamTrail();
  game.dashCooldown = 0.6;
  p.vy *= 0.35;
  say('질주! 숨은 길을 가로질러라.');
}

function updateDash(dt) {
  if (game.dashCooldown > 0) game.dashCooldown = Math.max(0, game.dashCooldown - dt);
  if (game.dashTimer > 0) game.dashTimer = Math.max(0, game.dashTimer - dt);
  if (game.dashVisualTimer > 0) game.dashVisualTimer = Math.max(0, game.dashVisualTimer - dt);
}

function rememberDreamTrail() {
  const p = game.player;
  if (!p) return;
  if (!game.dreamTrails) game.dreamTrails = [];
  game.dreamTrails.push({
    x: p.x, y: p.y, w: p.w, h: p.h, facing: p.facing || game.dashDirection || 1,
    frameIndex: currentRunFrameIndex(), age: 0, life: .62,
    seed: ((game.elapsed || 0) * 19.7 + game.dreamTrails.length * 2.17) % (Math.PI * 2),
  });
  if (game.dreamTrails.length > 8) game.dreamTrails.shift();
}

function updateDreamTrails(dt) {
  game.dreamTrails = (game.dreamTrails || [])
    .map((trail) => ({ ...trail, age: trail.age + dt }))
    .filter((trail) => trail.age < trail.life);
  if (game.dashTimer > 0 && game.player) {
    game.dashTrailClock = (game.dashTrailClock || 0) - dt;
    if (game.dashTrailClock <= 0) {
      rememberDreamTrail();
      game.dashTrailClock = .032;
    }
  } else game.dashTrailClock = 0;
}

function frozenTime() { return activeTechniques().time; }

function resonanceDrainPerSecond() {
  const stage = currentStage();
  if ((stage?.chapter || '').includes('유나')) return stage.type === 'boss' ? 18 : 17;
  return 14;
}

function imaginationRegen(dt, techniques) {
  const drain = (techniques.time ? 28 : 0) + (techniques.resonance ? resonanceDrainPerSecond() : 0);
  if (drain > 0) {
    game.imagination = Math.max(0, game.imagination - drain * dt);
    if (game.imagination <= 0) disconnect();
  } else game.imagination = Math.min(100, game.imagination + 11 * dt);
}

function getWallResonancePaths() {
  const t = game.elapsed || 0;
  return [
    { x: 205 + Math.sin(t * 1.7) * 6, y: 452, w: 108, h: 16, label: 'HUB PATH' },
    { x: 454, y: 442 + Math.sin(t * 1.25 + .8) * 6, w: 82, h: 16, label: 'LOW PATH' },
    { x: 250 + Math.sin(t * 1.45 + 1.6) * 4, y: 350, w: 160, h: 16, label: 'UP PATH 01' },
    { x: 160, y: 305 + Math.sin(t * 1.2 + 2.5) * 4, w: 170, h: 16, label: 'UP PATH 02' },
    { x: 635 + Math.sin(t * 1.4 + 3.1) * 5, y: 420, w: 130, h: 16, label: 'LOW LINK' },
  ];
}

function getWatcher() {
  // 감시선은 고정한다. 플레이어는 "기억을 기록 → 그 기억이 눈을 지날 때 시간 정지"의 한 가지 규칙에 집중한다.
  return { x: 354, y: 452, w: 36, h: 31 };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function carouselPhaseInfo(index = game.carouselPhase || 0) {
  const count = CAROUSEL_PHASES.length;
  return CAROUSEL_PHASES[((Number(index) || 0) % count + count) % count];
}

function carouselOrbitPoseId() {
  return carouselPhaseInfo(game.carouselPhase || 0).id;
}

function carouselOrbitCollisionPoseId() {
  if (game.carouselRotationTimer > 0) return game.carouselOrbitFromPose || carouselOrbitPoseId();
  return carouselOrbitPoseId();
}

function carouselRingRotation(poseId = carouselOrbitPoseId()) {
  return CAROUSEL_RING_ROTATIONS[poseId] ?? CAROUSEL_RING_ROTATIONS.moon;
}

function carouselAngleDistance(a, b) {
  let delta = (a - b) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return Math.abs(delta);
}

const carouselRingSegmentCache = new Map();

function buildCarouselRingSegments(poseId) {
  if (carouselRingSegmentCache.has(poseId)) return carouselRingSegmentCache.get(poseId);
  const rotation = carouselRingRotation(poseId);
  const segments = [];
  const occupied = new Set();
  for (let index = 0; index < CAROUSEL_RING_SEGMENT_COUNT; index += 1) {
    const baseAngle = index / CAROUSEL_RING_SEGMENT_COUNT * Math.PI * 2;
    const inOpening = carouselAngleDistance(baseAngle, Math.PI) <= CAROUSEL_RING_GAP_HALF_ANGLE;
    if (inOpening) continue;
    const angle = baseAngle + rotation;
    const x = Math.round(CAROUSEL_RING_CENTER.x + Math.cos(angle) * CAROUSEL_RING_RADIUS - CAROUSEL_RING_SEGMENT_SIZE / 2);
    const y = Math.round(CAROUSEL_RING_CENTER.y + Math.sin(angle) * CAROUSEL_RING_RADIUS - CAROUSEL_RING_SEGMENT_SIZE / 2);
    const key = `${x}:${y}`;
    if (occupied.has(key)) continue;
    occupied.add(key);
    segments.push(Object.freeze({
      x, y, w: CAROUSEL_RING_SEGMENT_SIZE, h: CAROUSEL_RING_SEGMENT_SIZE,
      wall: true, persistentWall: true, carouselRingSegment: true,
      carouselRingPose: poseId, carouselRingIndex: index,
      label: 'MOVING ROUND WALL',
    }));
  }
  const frozen = Object.freeze(segments);
  carouselRingSegmentCache.set(poseId, frozen);
  return frozen;
}

function getCarouselRingColliders() {
  return buildCarouselRingSegments(carouselOrbitCollisionPoseId());
}

function carouselRingTargetIsClear(poseId) {
  // 잔상은 기록된 경로를 독립 재생하므로 회전 충돌 대상에서 제외하고 현재 플레이어만 보호한다.
  const occupants = [game.player].filter(Boolean).map((item) => ({
    x: item.x - 4, y: item.y - 4, w: item.w + 8, h: item.h + 8,
  }));
  return !buildCarouselRingSegments(poseId).some((segment) => occupants.some((occupant) => overlaps(occupant, segment)));
}

function getCarouselExitShutter() {
  if (game.carouselExitBridgeDeployed) return null;
  return {
    // 별빛 방과 출구 바닥 사이의 천장부터 출구 바닥까지 닫아 조기 문 접근을 막는다.
    x: 850, y: 229, w: 24, h: 121,
    wall: true, persistentWall: true, carouselExitShutter: true,
    label: 'CAROUSEL EXIT SHUTTER',
  };
}

function carouselPlatformPoseId(platform) {
  if (platform.carouselPose) return platform.carouselPose;
  if (platform.carouselPhase != null) return carouselPhaseInfo(platform.carouselPhase).id;
  return null;
}

function carouselPlatformEnabled(platform) {
  const currentPoseId = carouselPhaseInfo().id;
  if (platform.carouselBlockedUnlessPose) return currentPoseId !== platform.carouselBlockedUnlessPose;
  const poseId = carouselPlatformPoseId(platform);
  return poseId == null || poseId === currentPoseId;
}

function standingCarouselPlatform() {
  const player = game.player;
  if (!player || !player.grounded || game.layout !== 'carousel') return null;
  const feet = player.y + player.h;
  const centerX = player.x + player.w / 2;
  return game.platforms.find((platform) => !platform.wall
    && carouselPlatformEnabled(platform)
    && (!platform.carouselMemoryStart
      || (centerX >= platform.x && centerX < platform.x + platform.w))
    && player.x + player.w > platform.x - 3
    && player.x < platform.x + platform.w + 3
    && Math.abs(feet - platform.y) <= 7) || null;
}

function standingCarouselMemoryStart() {
  const platform = standingCarouselPlatform();
  return platform?.carouselMemoryStart ? platform : null;
}

function carouselRelayCount() {
  return game.carouselRelays instanceof Set ? game.carouselRelays.size : 0;
}

function carouselRelaysReady() {
  return carouselRelayCount() >= CAROUSEL_REQUIRED_RELAYS;
}

function updateCarouselRelaySwitches() {
  if (game.layout !== 'carousel' || !game.player || game.carouselRotationTimer > 0) return;
  if (!(game.carouselRelays instanceof Set)) game.carouselRelays = new Set();
  const currentPose = carouselPhaseInfo().id;
  for (const relay of game.carouselSwitches || []) {
    if (relay.id !== currentPose || game.carouselRelays.has(relay.id) || !overlaps(game.player, relay)) continue;
    game.carouselRelays.add(relay.id);
    const remaining = Math.max(0, CAROUSEL_REQUIRED_RELAYS - carouselRelayCount());
    say(remaining > 0
      ? `${relay.label} 복구 · 외부 잠금 장치가 ${remaining}개 남았습니다.`
      : `${relay.label} 복구 · 두 외부 잠금 장치가 모두 켜졌습니다.`);
  }
}

function openCarouselExitIfReady() {
  if (game.layout !== 'carousel'
    || game.carouselExitBridgeDeployed
    || !game.carouselCoreLatched
    || !carouselRelaysReady()
    || game.carouselRotationTimer > 0
    || carouselPhaseInfo().id !== 'exit') return false;
  game.carouselExitBridgeDeployed = true;
  game.carouselGateOpened = true;
  game.carouselOrbitPose = 'exit';
  game.carouselOrbitFromPose = 'exit';
  game.carouselOrbitTargetPose = 'exit';
  say('왼쪽 위 기억과 두 외부 잠금 장치가 동쪽 틈에 연결됐습니다. 꿈의 문이 자동으로 열립니다.');
  return true;
}

function rotateCarouselPhase(direction) {
  if (game.phase !== 'playing' || game.layout !== 'carousel') return false;
  if (game.recording) {
    say('기억을 기록하는 동안에는 원형벽을 움직일 수 없습니다. K로 먼저 되감으세요.');
    return true;
  }
  if (game.carouselRotationTimer > 0) {
    say('원형벽이 아직 선택한 각도로 회전하는 중입니다.');
    return true;
  }
  const current = game.carouselPhase || 0;
  const count = CAROUSEL_PHASES.length;
  game.carouselTargetPhase = (current + (direction > 0 ? 1 : -1) + count) % count;
  game.carouselOrbitFromPose = carouselPhaseInfo(current).id;
  game.carouselOrbitTargetPose = carouselPhaseInfo(game.carouselTargetPhase).id;
  if (!carouselRingTargetIsClear(game.carouselOrbitTargetPose)) {
    game.carouselTargetPhase = current;
    game.carouselOrbitTargetPose = game.carouselOrbitFromPose;
    say('현재 위치가 회전할 원형벽과 겹칩니다. 원형벽의 회전 경로에서 조금 벗어난 뒤 다시 눌러 주세요.');
    return true;
  }
  game.carouselRotationTimer = CAROUSEL_ROTATION_SECONDS;
  game.dropThroughTimer = 0;
  game.dropThroughPlatform = null;
  const target = carouselPhaseInfo(game.carouselTargetPhase);
  say(`${direction > 0 ? '시계' : '반시계'} 방향 회전 · ${target.label} 틈으로 맞추는 중입니다.`);
  return true;
}

function updateCarouselRotation(dt) {
  if (game.layout !== 'carousel' || game.carouselRotationTimer <= 0) return;
  game.carouselRotationTimer = Math.max(0, game.carouselRotationTimer - dt);
  if (game.carouselRotationTimer > 0) return;
  game.carouselPhase = game.carouselTargetPhase;
  const phase = carouselPhaseInfo();
  game.carouselOrbitPose = phase.id;
  game.carouselOrbitFromPose = phase.id;
  game.carouselOrbitTargetPose = phase.id;
  if (!openCarouselExitIfReady()) say(`${phase.label} 정렬 완료 · 원하는 길이 연결됐는지 살펴보세요.`);
  updateHud();
}

function overlapsWindGate(player, gate) {
  const centerX = gate.x + gate.w / 2;
  const centerY = gate.y + gate.h / 2;
  const radiusX = gate.w / 2 + WIND_GATE_OUTER_PADDING;
  const radiusY = gate.h / 2 + WIND_GATE_OUTER_PADDING;
  const closestX = Math.max(player.x, Math.min(centerX, player.x + player.w));
  const closestY = Math.max(player.y, Math.min(centerY, player.y + player.h));
  const normalizedX = (closestX - centerX) / radiusX;
  const normalizedY = (closestY - centerY) / radiusY;
  return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
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
    player.grounded = true;
    return;
  }
  if (player.vy < 0 && oldY >= wall.y + wall.h - 6 && player.y <= wall.y + wall.h) {
    player.y = wall.y + wall.h;
    player.vy = 0;
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
  else if (side === 'top') { player.y = wall.y - player.h; player.vy = 0; player.grounded = true; }
  else { player.y = wall.y + wall.h; player.vy = 0; }
}

function resolveCarouselRingCollision(player, ringSegments, oldX, oldY) {
  if (!ringSegments.some((segment) => overlaps(player, segment))) return;
  const oldCenterX = oldX + player.w / 2;
  const oldCenterY = oldY + player.h / 2;
  const wasInside = Math.hypot(oldCenterX - CAROUSEL_RING_CENTER.x, oldCenterY - CAROUSEL_RING_CENTER.y)
    < CAROUSEL_RING_RADIUS;
  const centerX = player.x + player.w / 2;
  const centerY = player.y + player.h / 2;
  const deltaX = centerX - CAROUSEL_RING_CENTER.x;
  const deltaY = centerY - CAROUSEL_RING_CENTER.y;
  const distance = Math.max(.001, Math.hypot(deltaX, deltaY));
  const unitX = deltaX / distance;
  const unitY = deltaY / distance;
  const playerExtent = Math.abs(unitX) * player.w / 2 + Math.abs(unitY) * player.h / 2;
  const wallExtent = (Math.abs(unitX) + Math.abs(unitY)) * CAROUSEL_RING_SEGMENT_SIZE / 2 + 3;
  const targetDistance = wasInside
    ? CAROUSEL_RING_RADIUS - wallExtent - playerExtent
    : CAROUSEL_RING_RADIUS + wallExtent + playerExtent;
  player.x = CAROUSEL_RING_CENTER.x + unitX * targetDistance - player.w / 2;
  player.y = CAROUSEL_RING_CENTER.y + unitY * targetDistance - player.h / 2;
  const tangentX = -unitY;
  const tangentY = unitX;
  const tangentSpeed = Math.max(-90, Math.min(90, player.vx * tangentX + player.vy * tangentY)) * .45;
  player.vx = tangentX * tangentSpeed;
  player.vy = tangentY * tangentSpeed;
  // 원형벽은 발판이 아니다. 강하게 반대 방향으로 튕기지 않고 접선 방향 속도만 작게 남긴다.
  player.grounded = false;
}

function updateWindCliffPillar(dt, stage = currentStage()) {
  if (stage?.layout !== 'wind-cliff') return;
  // 약속을 지키는 기억이 한 번 재생되면 역풍은 다시 플레이어를 가두지 않는다.
  if (puzzleObjectiveReady() && !game.windPillarReleased) {
    game.windPillarReleased = true;
    if (!game.windPillarCollapseAnnounced) {
      game.windPillarCollapseAnnounced = true;
      say('출발 약속을 지킨 기억이 바람을 붙잡았습니다. 거대한 바람 기둥이 무너지며 절벽길이 열립니다.');
    }
  }
  // 균열 → 기울어짐 → 충돌 → 잔해 정착까지 읽히도록 충분한 시간을 둔다.
  if (game.windPillarReleased) game.windPillarCollapse = Math.min(1, (game.windPillarCollapse || 0) + dt / 1.25);
}

function updateHarinStage02Restoration(dt, stage = currentStage()) {
  if (stage?.layout !== 'bridge' || !puzzleObjectiveReady()) return;
  if (!game.stage02RestorationAnnounced) {
    game.stage02RestorationAnnounced = true;
    say('기억의 빛이 흩어진 벽돌을 하나씩 불러옵니다. 무너진 거리가 다시 제 모습을 찾기 시작합니다.');
  }
  // 벽돌 조각이 실제로 흩어진 자리에서 돌아와 쌓일 시간을 준다.
  const previous = game.stage02Restoration || 0;
  game.stage02Restoration = Math.min(1, previous + dt / HARIN_STAGE_02_RESTORATION_SECONDS);
  if (previous < HARIN_STAGE_02_RESTORATION_COMPLETE && game.stage02Restoration >= HARIN_STAGE_02_RESTORATION_COMPLETE) {
    say('성문 재건이 완료됐습니다. 이제 복구된 입구 사이로 지나갈 수 있습니다.');
  }
}

function harinStage02RestorationComplete(stage = currentStage()) {
  return stage?.layout !== 'bridge'
    || (game.stage02Restoration || 0) >= HARIN_STAGE_02_RESTORATION_COMPLETE;
}

function windCliffHeadwindStrength(stage = currentStage()) {
  // 탑이 서 있을 때만 공중 이동을 되밀어 내는 역풍이 존재한다. 무너지기 시작하면 즉시 잦아든다.
  if (stage?.layout !== 'wind-cliff' || game.windPillarReleased) return 0;
  return 1;
}

function updatePuzzle(dt) {
  const stage = currentStage();
  const techniques = activeTechniques();
  const frozen = techniques.time;
  game.watcherHitCooldown = Math.max(0, (game.watcherHitCooldown || 0) - dt);
  updateDash(dt);
  imaginationRegen(dt, techniques);
  if (game.phase !== 'playing') return;
  const p = game.player;
  updateHarinStage02Restoration(dt, stage);
  updateWindCliffPillar(dt, stage);
  game.elapsed += dt;
  updateCarouselRotation(dt);
  const carouselRingColliders = stage.layout === 'carousel' ? getCarouselRingColliders() : [];
  const carouselExitShutter = stage.layout === 'carousel' ? getCarouselExitShutter() : null;
  game.dropThroughTimer = Math.max(0, (game.dropThroughTimer || 0) - dt);
  if (game.dropThroughTimer <= 0) game.dropThroughPlatform = null;
  const dropRequested = pressed.has('ArrowDown') || pressed.has('KeyS');
  if (dropRequested && p.grounded) {
    const feet = p.y + p.h;
    const dropEdgeGrace = stage.layout === 'carousel' ? 3 : -3;
    const supportsPlayer = (platform) => !platform.wall
      && platform.h < 28
      && signpostPathRevealed(platform, techniques)
      && (stage.layout !== 'carousel' || carouselPlatformEnabled(platform))
      && p.x + p.w > platform.x - dropEdgeGrace
      && p.x < platform.x + platform.w + dropEdgeGrace
      && Math.abs(feet - platform.y) <= 7;
    const standingOnLockedPlatform = game.platforms.some((platform) => platform.dropThrough === false && supportsPlayer(platform));
    const dropSupport = standingOnLockedPlatform
      ? null
      : game.platforms.find((platform) => platform.dropThrough !== false && supportsPlayer(platform));
    if (dropSupport) {
      game.dropThroughTimer = PLATFORM_DROP_THROUGH_SECONDS;
      game.dropThroughPlatform = dropSupport;
      p.grounded = false;
      p.y += 4;
      p.vy = Math.max(100, p.vy);
      say('발판 아래층으로 내려갑니다.');
    }
  }
  // 회전목마 벽이 움직이는 동안에도 윤호는 계속 걸으며 점프할 수 있다.
  // P/Y는 구조물만 돌리고 플레이어 입력을 잠그지 않는다.
  const axis = horizontalInput();
  const movementControl = p.grounded ? 1 : MOVEMENT_TUNING.puzzle.airControl;
  p.vx = acceleratedVelocity(p.vx, axis, MOVEMENT_TUNING.puzzle, dt, movementControl);
  if (axis) p.facing = axis;
  const headwind = windCliffHeadwindStrength(stage);
  const jump = pressed.has('ArrowUp') || pressed.has('KeyW');
  if (jump && p.grounded) {
    p.vy = -470; p.grounded = false;
    // 점프가 시작되는 바로 그 프레임에도 바람이 등을 밀어, 역풍 규칙을 명확히 체감시킨다.
    if (headwind > 0) p.vx = Math.max(-390, p.vx - 172 * headwind);
  }
  p.vy += 1220 * dt;
  p.vy = Math.max(-720, Math.min(720, p.vy));
  if (headwind > 0 && !p.grounded) {
    // 역풍은 점프 중에만 강하게 작용한다. 달리기·질주 자체를 막지 않아, 규칙을 알아챈 뒤에도 조작감은 남긴다.
    const liftFactor = p.vy < 0 ? 1 : .62;
    p.vx = Math.max(-430, p.vx - 610 * headwind * liftFactor * dt);
    if (!game.headwindHintShown && p.vy < -80) {
      game.headwindHintShown = true;
      say('역풍이 점프를 되밀어 냅니다. 출발 약속에 기억의 나를 남겨 바람 기둥을 무너뜨리세요.');
    }
  }
  applySignpostMazeWindPhysics(p, dt, stage);
  const oldX = p.x;
  p.x = Math.max(0, Math.min(W - p.w, p.x + p.vx * dt));
  if (game.dashTimer > 0) {
    p.x = Math.max(0, Math.min(W - p.w, p.x + game.dashDirection * 520 * dt));
    p.facing = game.dashDirection;
    p.vx = game.dashDirection * 340;
    // 역풍 기둥이 살아 있을 때는 질주 추진력도 정면에서 되밀린다.
    // 따라서 기억 발판을 먼저 활성화하지 않으면 Space로 절벽을 억지 돌파할 수 없다.
    if (headwind > 0 && !p.grounded) {
      p.x = Math.max(0, p.x - 1040 * headwind * dt);
      p.vx = Math.min(p.vx, -300 * headwind);
    }
  }
  const memoryPadsReadyAtFrameStart = puzzleObjectiveReady();
  const stage02RestoredAtFrameStart = harinStage02RestorationComplete(stage);
  const memoryGateOpen = (stage.layout === 'bridge' ? stage02RestoredAtFrameStart : memoryPadsReadyAtFrameStart)
    && (stage.layout !== 'watcher' || game.watcherResolved);
  // 일반 문은 기억 완성 시 열리고, 15스테이지의 역풍 기둥은 한 번 무너지면 다시 충돌하지 않는다.
  const solidWalls = game.platforms.filter((item) => item.wall && (!memoryGateOpen || (item.persistentWall && !item.collapseWithMemory)) && !(item.collapseWithMemory && game.windPillarReleased));
  if (carouselExitShutter) solidWalls.push(carouselExitShutter);
  solidWalls.forEach((wall) => resolveWallHorizontal(p, wall, oldX));
  const oldY = p.y;
  p.y += p.vy * dt;
  p.grounded = false;
  const colliders = game.platforms.filter((item) => !item.wall && signpostPathRevealed(item, techniques));
  if (techniques.resonance && stage.layout === 'wall') colliders.push(...getWallResonancePaths());
  // 4스테이지의 잔상은 왼쪽 위 기억 코어를 고정하는 역할만 하고 발판 충돌은 만들지 않는다.
  const echoColliders = stage.layout === 'carousel'
    ? []
    : game.echoes.map((echo) => ({ x: echo.x, y: echo.y, w: echo.w, h: echo.h, memoryEcho: true }));
  colliders.push(...echoColliders);
  // 사선 원형벽에서 밀려난 뒤 고정 발판 착지를 판정해, 구멍 가장자리에서 발판 아래로 관통하지 않게 한다.
  if (stage.layout === 'carousel') resolveCarouselRingCollision(p, carouselRingColliders, oldX, oldY);
  const landingEdgeGrace = stage.layout === 'carousel' ? 3 : -2;
  for (const platform of colliders) {
    const dropSupport = game.dropThroughPlatform;
    const sameDropGroup = stage.layout === 'carousel'
      && dropSupport
      && platform.dropThrough !== false
      && Math.abs(platform.y - dropSupport.y) <= 2
      && platform.x <= dropSupport.x + dropSupport.w + 3
      && platform.x + platform.w >= dropSupport.x - 3;
    if (game.dropThroughTimer > 0 && (platform === dropSupport || sameDropGroup)) continue;
    if (p.x + p.w <= platform.x - landingEdgeGrace || p.x >= platform.x + platform.w + landingEdgeGrace) continue;
    if (p.vy >= 0 && oldY + p.h <= platform.y + 5 && p.y + p.h >= platform.y) {
      p.y = platform.y - p.h; p.vy = 0; p.grounded = true;
      break;
    }
  }
  solidWalls.forEach((wall) => resolveWallVertical(p, wall, oldY));
  if (p.y <= 0) { p.y = 0; p.vy = 0; }
  if (p.y + p.h >= H) {
    const inPit = game.bottomIsVoid || (game.fallZones || []).some((zone) => p.x + p.w * 0.5 >= zone.x && p.x + p.w * 0.5 <= zone.x + zone.w);
    if (inPit) {
      fallOffStage('낙사! 기억의 발판으로 다시 돌아왔어.');
      return;
    }
    p.y = H - p.h; p.vy = 0; p.grounded = true;
  }
  updateMemoryLoops(dt);
  updateSignpostMaze(dt, techniques);
  updateCarouselRelaySwitches();
  updateFriendReactions(stage);
  const carouselCoreReady = stage.layout === 'carousel'
    && game.carouselRotationTimer <= 0
    && activeMemoryPads(game.memoryPads) >= game.echoGoal;
  const carouselCoreJustLatched = carouselCoreReady && !game.carouselCoreLatched;
  if (carouselCoreReady) game.carouselCoreLatched = true;
  if (stage.layout === 'carousel') {
    const openedNow = openCarouselExitIfReady();
    game.carouselGateOpened = Boolean(game.carouselExitBridgeDeployed);
    if (carouselCoreJustLatched && !openedNow) {
      const remaining = Math.max(0, CAROUSEL_REQUIRED_RELAYS - carouselRelayCount());
      say(remaining
        ? `왼쪽 위 기억 코어가 고정됐습니다. 외부 잠금 장치 ${remaining}개가 남았습니다.`
        : '왼쪽 위 기억 코어가 고정됐습니다. 이제 구멍을 동쪽 출구길과 맞추세요.');
    }
  }
  const memoryPadsReady = puzzleObjectiveReady();
  const stage02Restored = harinStage02RestorationComplete(stage);
  updateYunaPuzzleMusic(techniques);
  if (stage.layout === 'watcher' && !game.watcherResolved) {
    const watcher = getWatcher();
    const echoCrossingWatcher = game.echoes.some((echo) => !echo.holding && overlaps(echo, watcher));
    if (frozen && echoCrossingWatcher) {
      game.watcherResolved = true;
      say('성공! 멈춘 시간 속에서 기억의 내가 감시선을 끊었습니다. 두 개의 발판을 채우세요.');
    } else if (!frozen && overlaps(p, watcher) && game.watcherHitCooldown <= 0) {
      game.watcherHitCooldown = .75;
      hitByNightmare('감시선에 포착됐습니다. K로 기록한 뒤, 기억의 내가 눈을 지날 때 Shift를 누르세요.', 12, true);
    }
  }
  const watcherReady = stage.layout !== 'watcher' || game.watcherResolved;
  if (overlaps(p, game.exit)) {
    if (!watcherReady) say('먼저 과거의 나를 감시선 앞으로 기록하고, 그 기억이 지나갈 때 Shift로 시간을 멈추세요.');
    else if (stage.layout === 'bridge' && memoryPadsReady && !stage02Restored) {
      const percent = Math.floor(Math.max(0, Math.min(1, game.stage02Restoration || 0)) * 100);
      say(`성문을 재건하는 중입니다. 마지막 벽돌이 돌아올 때까지 기다리세요. ${percent}%`);
    }
    else if (!memoryPadsReady && !(stage.layout === 'bridge' && stage02Restored)) {
      if (stage.layout === 'carousel') {
        if (!game.carouselCoreLatched) {
          say('북서쪽 기억 틈을 맞춘 뒤 K로 기억의 나를 맵 왼쪽 위 코어에 남기세요.');
        } else if (!carouselRelaysReady()) {
          say(`북동쪽 별빛·남동쪽 리본 잠금 장치를 직접 밟으세요. 현재 ${carouselRelayCount()} / ${CAROUSEL_REQUIRED_RELAYS}.`);
        } else {
          say('어디서든 P/Y로 구멍을 동쪽 출구길과 맞추세요.');
        }
      } else {
        const roleState = puzzleRoleState();
        const sign = activeSignpost();
        say(stage.layout === 'signpost-maze'
          ? sign
            ? `아직 ${sign.label}의 방향이 고정되지 않았습니다. 그 곁에서 L을 잠시 유지해 “${sign.action}” 하세요.`
            : '출구 방향은 고정됐지만, 먼저 진짜 출발 신호에 기억의 나를 남겨야 합니다.'
          : stage.layout === 'wall'
          ? '낮은 길·높은 길·오른쪽 길의 추억등 세 곳에 기억의 나를 하나씩 남기세요.'
          : roleState.rule && activeMemoryPads(game.memoryPads) >= game.echoGoal
            ? roleState.rule.directions
              ? `${roleState.rule.prompt} I로 잘못된 기억을 지우고, 발판 위에서 방향을 바꿔 다시 기록하세요.`
              : `${roleState.rule.prompt} I로 기존 기억을 지우고, 기억 발판 위에서 K로 다시 기록하세요.`
            : '먼저 기억의 나를 모든 기억 발판에 남겨야 합니다.');
      }
    }
    else completeStage();
  }
}

function hitByNightmare(message, cost, reset) {
  if (reset) {
    game.player = freshPlayer();
    game.dreamTrails = [];
    game.dashVisualTimer = 0;
    game.imagination = 100;
    say(`${message} 상상력이 모두 회복됐습니다.`);
    return;
  }
  game.imagination = Math.max(0, game.imagination - cost);
  say(message);
  updateHud();
  if (game.imagination <= 0) disconnect();
}

function bossShotDamage(shot, boss) {
  if (shot.kind === 'black-kite' && Number.isFinite(shot.damage)) return shot.damage;
  if (shot.kind === 'black-kite') return HANEUL_VANE_KITE_DAMAGE;
  if (shot.kind === 'harin-laugh') return 12;
  // 11스테이지 불협화음은 탄막 수는 유지하되 회복 여지를 준다.
  if (shot.kind === 'dissonant-note') return boss?.codaActive ? 21 : 17;
  if (shot.kind === 'memory') return 24;
  if (shot.kind === 'shard') return 22;
  if (shot.kind === 'wind') return 20;
  return 20;
}

function shotAngle(origin, target) {
  return Math.atan2(target.y + target.h / 2 - origin.y, target.x + target.w / 2 - origin.x);
}

function launchNightmareShot(origin, angle, options = {}) {
  const speed = options.speed || 250;
  const shot = {
    x: origin.x, y: origin.y, r: options.r || 10,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    angle,
    kind: options.kind || 'nightmare',
    decoyShot: Boolean(options.decoyShot),
    relayShot: Boolean(options.relayShot),
    relayTargetIndex: Number.isFinite(options.relayTargetIndex) ? options.relayTargetIndex : -1,
  };
  game.nightmareShots.push(shot);
  return shot;
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
  if (b.defeated) return 4;
  // 진짜 기억을 되찾은 뒤에는 수호자의 모습이 무너진 채 남은 체력을 끝까지 돌려줘야 한다.
  if (b.truthResolved) return 3;
  if (b.hp <= Math.ceil(b.maxHp / 3)) return 3;
  if (b.hp <= Math.ceil(b.maxHp * 2 / 3)) return 2;
  return 1;
}

function haneulVaneAttackProfile(b) {
  const hits = Math.max(0, Math.min(HANEUL_VANE_BOSS_HP, Number(b?.vaneReflectedHits) || 0));
  const tier = hits >= 4 ? 2 : hits >= 2 ? 1 : 0;
  return {
    tier,
    count: [7, 8, 9][tier],
    delay: [1.05, .95, .85][tier],
    curveBase: [.18, .22, .26][tier],
    frequencyBase: [1.7, 1.85, 2.0][tier],
    turnBase: [2.5, 2.68, 2.86][tier],
    maxKites: [30, 38, 46][tier],
    sideCount: hits,
  };
}

function nextBossAttackDelay(b) {
  if (b.mode === 'calm') return b.calmReflectionActive ? 1.2 : 99;
  if (b.mode === 'final') {
    const phase = finalBossPhase(b);
    return phase === 4 ? 99 : phase === 3 ? .58 : phase === 2 ? .68 : .82;
  }
  if (b.mode === 'mirror') return .94;
  if (b.mode === 'resonance') return b.codaActive ? .54 : 1.02;
  if (b.mode === 'chase') return b.windVanePhase ? b.vaneBossReady ? haneulVaneAttackProfile(b).delay : 1.15 : b.relayPhase === 'sprint' ? 1.4 : .92;
  return 1.05;
}

function spawnNightmarePattern() {
  const b = game.boss;
  const p = game.player;
  const threatTime = b.threatElapsed || 0;
  const origin = b.mode === 'resonance'
    ? { x: b.x + b.w / 2, y: b.y + 78 }
    : { x: b.x + 8, y: b.y + 92 };
  if (b.mode === 'calm' && !b.calmReflectionActive) return;
  const attackNumber = ++b.attackIndex;

  if (b.mode === 'calm') {
    const activeLaughShots = game.nightmareShots.filter((shot) => shot.kind === 'harin-laugh').length;
    // 5스테이지 2페이즈는 가면 조준 중에도 계속 회피선을 읽어야 하도록 밀도를 한 단계 더 높인다.
    const capacity = Math.max(0, 24 - activeLaughShots);
    if (!capacity) return;
    const calmOrigin = { x: b.x + b.w / 2, y: b.y + b.h * .5 };
    if (attackNumber % 4 === 0) {
      launchNightmareRing(calmOrigin, Math.min(8, capacity), { speed: 155, r: 7, kind: 'harin-laugh', offset: threatTime * .36 });
    } else if (attackNumber % 2 === 0) {
      launchNightmareFan(calmOrigin, p, Math.min(5, capacity), .82, { speed: 190, r: 8, kind: 'harin-laugh' });
    } else {
      launchNightmareFan(calmOrigin, p, 1, 0, { speed: 210, r: 8, kind: 'harin-laugh' });
    }
    return;
  }

  if (b.mode === 'chase') {
    if (b.windVanePhase) {
      const pressure = haneulVaneAttackProfile(b);
      const activeKites = game.nightmareShots.filter((shot) => shot.kind === 'black-kite' && !shot.vaneReflected).length;
      const capacity = Math.max(0, pressure.maxKites - activeKites);
      if (!capacity) return;
      const vaneOrigin = { x: b.x + b.w / 2, y: b.y + b.h * .48 };
      const moving = !b.vaneBossReady;
      const spreadTargets = moving
        ? [164, 374, 586, 796]
        : Array.from({ length: pressure.count }, (_, index) => Math.round(54 + 852 * index / Math.max(1, pressure.count - 1)));
      const waveOffset = (attackNumber % 3 - 1) * 28;
      const mainTargets = spreadTargets.slice(0, Math.min(capacity, spreadTargets.length));
      mainTargets.forEach((targetX, targetIndex) => {
        const target = { x: Math.max(36, Math.min(W - 36, targetX + waveOffset)), y: H + 42, w: 1, h: 1 };
        const baseAngle = shotAngle(vaneOrigin, target);
        const shotSpeed = moving ? 186 : 215;
        const shot = launchNightmareShot(vaneOrigin, baseAngle, { speed: shotSpeed, r: moving ? 9 : 10, kind: 'black-kite' });
        shot.windBaseAngle = baseAngle;
        shot.windSpeed = shotSpeed;
        shot.windCurveStrength = (moving ? .13 : pressure.curveBase) + Math.random() * (moving ? .12 : .18);
        shot.windCurveFrequency = (moving ? 1.45 : pressure.frequencyBase) + Math.random() * (moving ? 1.35 : 1.9);
        shot.windCurvePhase = Math.random() * Math.PI * 2 + targetIndex * .47;
        shot.windCurvePhase2 = Math.random() * Math.PI * 2;
        shot.windTurnRate = (moving ? 2.1 : pressure.turnBase) + Math.random() * 1.2;
        shot.damage = moving ? 12 : HANEUL_VANE_KITE_DAMAGE;
        shot.transitionKite = moving;
        shot.pressureTier = pressure.tier;
      });
      const sideCapacity = Math.max(0, capacity - mainTargets.length);
      const sideCount = Math.min(pressure.sideCount, sideCapacity);
      for (let sideIndex = 0; sideIndex < sideCount; sideIndex += 1) {
        const fromLeft = sideIndex % 2 === 0;
        const laneRatio = (sideIndex + 1) / (sideCount + 1);
        const sideOrigin = {
          x: fromLeft ? -24 : W + 24,
          y: 112 + laneRatio * (H - 224),
        };
        const target = {
          x: p.x + p.w / 2,
          y: Math.max(70, Math.min(H - 46, p.y + p.h / 2 + (sideIndex - (sideCount - 1) / 2) * 24)),
          w: 1,
          h: 1,
        };
        const baseAngle = shotAngle(sideOrigin, target);
        const sideSpeed = 198 + pressure.tier * 8;
        const shot = launchNightmareShot(sideOrigin, baseAngle, { speed: sideSpeed, r: 9, kind: 'black-kite' });
        shot.windBaseAngle = baseAngle;
        shot.windSpeed = sideSpeed;
        shot.windCurveStrength = pressure.curveBase * .86 + Math.random() * .15;
        shot.windCurveFrequency = pressure.frequencyBase + .35 + Math.random() * 1.45;
        shot.windCurvePhase = Math.random() * Math.PI * 2 + sideIndex * .81;
        shot.windCurvePhase2 = Math.random() * Math.PI * 2;
        shot.windTurnRate = pressure.turnBase + .3 + Math.random();
        shot.damage = HANEUL_VANE_KITE_DAMAGE;
        shot.sideAttack = true;
        shot.pressureTier = pressure.tier;
      }
      return;
    }
    // 잔상을 맞혀 수치를 쌓는 대신, 한 개의 되돌림 바람을 기준점으로 보낸다.
    // 윤호가 그 궤적을 질주로 "절단"해야만 다음 순풍 고리가 생긴다.
    if (b.relayPhase === 'sprint') return;
    const anchorEcho = getWindRelayAnchor(b);
    if (anchorEcho) {
      launchNightmareFan(origin, anchorEcho, 1, 0, {
        speed: 285,
        r: 12,
        kind: 'wind',
        relayShot: true,
        relayTargetIndex: b.relayTargetIndex || 0,
      });
      return;
    }
    // 기준점이 아직 완성되지 않은 동안만 윤호 쪽에 가벼운 돌풍을 쏴, 준비 단계도 긴장감을 유지한다.
    if (attackNumber % 2) launchNightmareFan(origin, p, 3, .46, { speed: 240, r: 8, kind: 'wind' });
    else launchNightmareRing(origin, 5, { speed: 190, r: 7, kind: 'wind', offset: threatTime * .9 });
    return;
  }

  if (b.mode === 'resonance') {
    // 박자 퍼즐 중에는 세 번째 불협화음이 화음 앵커를 겨냥한다.
    // 앵커는 세 번 버티면 사라지므로, 플레이어가 다시 기록할 시간도 남긴다.
    const anchorEcho = !b.codaActive && b.echoHitLimit > 0 && b.echoAttackCadence > 0 && attackNumber % b.echoAttackCadence === 0
      ? getResonanceAnchorEcho(b)
      : null;
    if (anchorEcho) {
      launchNightmareFan(origin, anchorEcho, 1, 0, { speed: 330, r: 10, kind: 'dissonant-note' });
      return;
    }
    if (b.codaActive) {
      // 마지막 20초는 기존의 박자 맞추기와 전혀 다른, 불규칙한 불협화음 생존 패턴이다.
      if (attackNumber % 3 === 0) launchNightmareRing(origin, 11, { speed: 236, r: 10, kind: 'dissonant-note', offset: threatTime * 1.45 });
      else if (attackNumber % 3 === 1) launchNightmareFan(origin, p, 6, .98, { speed: 315, r: 10, kind: 'dissonant-note' });
      else {
        launchNightmareRing(origin, 6, { speed: 190, r: 9, kind: 'dissonant-note', offset: threatTime * .48 });
        launchNightmareFan(origin, p, 3, .34, { speed: 340, r: 9, kind: 'dissonant-note' });
      }
    } else if (attackNumber % 4 === 0) launchNightmareRing(origin, 7, { speed: 220, r: 9, kind: 'dissonant-note', offset: threatTime * .7 });
    else if (attackNumber % 4 === 3) launchNightmareFan(origin, p, 4, .72, { speed: 280, r: 9, kind: 'dissonant-note' });
    else launchNightmareFan(origin, p, 3, .52, { speed: 265, r: 10, kind: 'dissonant-note' });
    return;
  }

  if (b.mode === 'mirror') {
    if (attackNumber % 2 === 0) launchNightmareRing(origin, 8, { speed: 230, r: 8, kind: 'shard', offset: Math.PI / 8 + threatTime * .45 });
    else launchNightmareFan(origin, p, 4, .72, { speed: 285, r: 9, kind: 'shard' });
    return;
  }

  b.phase = finalBossPhase(b);
  if (b.phase === 1) {
    if (attackNumber % 2) launchNightmareFan(origin, p, 3, .44, { speed: 270, r: 10, kind: 'memory' });
    else launchNightmareRing(origin, 6, { speed: 200, r: 8, kind: 'memory', offset: threatTime * .6 });
  } else if (b.phase === 2) {
    if (attackNumber % 2) launchNightmareFan(origin, p, 5, .76, { speed: 300, r: 10, kind: 'memory' });
    else launchNightmareRing(origin, 9, { speed: 235, r: 8, kind: 'memory', offset: threatTime * .85 });
  } else if (b.phase === 3) {
    // 진짜 기억 이후에는 거대한 수호자가 무너진 모습으로도 마지막 저항을 한다.
    if (attackNumber % 3 === 0) launchNightmareRing(origin, 11, { speed: 245, r: 9, kind: 'memory', offset: threatTime * 1.1 });
    else if (attackNumber % 3 === 1) launchNightmareFan(origin, p, 6, .92, { speed: 325, r: 10, kind: 'memory' });
    else {
      launchNightmareRing(origin, 6, { speed: 205, r: 8, kind: 'memory', offset: threatTime * .35 });
      launchNightmareFan(origin, p, 3, .3, { speed: 355, r: 9, kind: 'memory' });
    }
  } else {
    // 수호자의 체력이 모두 비면, 마지막에는 딸의 목소리를 듣는 선택으로 전환한다.
    game.nightmareShots = [];
  }
}

function updateNightmareShotMotion(shot, dt) {
  if (shot.kind !== 'black-kite' || shot.vaneReflected) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    return;
  }
  shot.windAge = (shot.windAge || 0) + dt;
  const age = shot.windAge;
  const strength = shot.windCurveStrength || .24;
  const frequency = shot.windCurveFrequency || 2.4;
  const phase = shot.windCurvePhase || 0;
  const phase2 = shot.windCurvePhase2 || 0;
  const primarySway = Math.sin(age * frequency + phase) * strength;
  const secondarySway = Math.sin(age * (frequency * .57 + .41) + phase2) * strength * .62;
  const gustDrift = Math.sin(age * .73 + phase * .5) * strength * .28;
  const desiredAngle = (shot.windBaseAngle || 0) + primarySway + secondarySway + gustDrift;
  const currentAngle = Number.isFinite(shot.angle) ? shot.angle : Math.atan2(shot.vy, shot.vx);
  const angleDelta = Math.atan2(Math.sin(desiredAngle - currentAngle), Math.cos(desiredAngle - currentAngle));
  const maxTurn = (shot.windTurnRate || 3) * dt;
  shot.angle = currentAngle + Math.max(-maxTurn, Math.min(maxTurn, angleDelta));
  const speed = (shot.windSpeed || 205) * (.94 + Math.sin(age * 2.3 + phase2) * .08);
  shot.vx = Math.cos(shot.angle) * speed;
  shot.vy = Math.sin(shot.angle) * speed;
  shot.x += shot.vx * dt;
  shot.y += shot.vy * dt;
}

function windRelayTargetPad(b) {
  const pads = b?.decoyPads || [];
  if (!pads.length) return null;
  return pads[(b.relayTargetIndex || 0) % pads.length] || null;
}

function getWindRelayAnchor(b) {
  const targetPad = windRelayTargetPad(b);
  if (!targetPad || activeMemoryPads(b.decoyPads) < b.decoyPads.length) return null;
  return game.echoes.find((echo) => echo.holding && echoOverlapsPad(echo, targetPad)) || null;
}

function getResonanceAnchorEcho(b) {
  return game.echoes
    .filter((echo) => echo.holding && b.memoryPads.some((pad) => echoOverlapsPad(echo, pad)))
    .sort((first, second) => (first.nightmareHits || 0) - (second.nightmareHits || 0))[0] || null;
}

function bossEchoPads(b) {
  return b?.mode === 'chase' ? b.decoyPads || [] : b?.memoryPads || [];
}

function damageBossEcho(echo, b) {
  if (!echo || !b || !b.echoHitLimit || b.echoMaintenanceDisabled) return false;
  const pads = bossEchoPads(b);
  const pad = pads.find((candidate) => echoOverlapsPad(echo, candidate));
  const echoLabel = pad?.label || (echo.holding ? '기억의 나' : '재생 중인 잔상');
  const hitLimit = b.echoHitLimit;
  echo.nightmareHits = Math.min(hitLimit, (echo.nightmareHits || 0) + 1);
  echo.flash = .72;
  b.echoDamagePulse = .62;
  const attackName = b.mode === 'resonance' ? '불협화음' : '공포 탄환';
  if (echo.nightmareHits >= hitLimit) {
    game.echoes = game.echoes.filter((candidate) => candidate !== echo);
    b.activePads = activeMemoryPads(pads);
    say(`${attackName}이 “${echoLabel}” 잔상을 ${hitLimit}번 흔들어 깨뜨렸습니다. 필요하면 K로 새 기억을 남기세요.`);
  } else {
    say(`${attackName}이 “${echoLabel}” 잔상을 흔듭니다. ${echo.nightmareHits} / ${hitLimit} · ${hitLimit}번 맞으면 사라집니다.`);
  }
  return true;
}

function resolveBoss(b, message) {
  if (b.resolving) return;
  b.resolving = true;
  say(message);
  setTimeout(completeStage, 1000);
}

function updateMemoryCollapse(dt) {
  const challenge = game.challenge;
  if (!challenge || game.phase !== 'playing' || game.boss?.resolving) return;
  challenge.remaining = Math.max(0, challenge.remaining - dt);
  if (!challenge.warned && challenge.remaining <= 15) {
    challenge.warned = true;
    say('기억 붕괴까지 15초. 지금 필요한 역할 하나에만 집중하세요!');
  }
  if (challenge.remaining <= 0) failMemoryCollapse();
}

function failMemoryCollapse() {
  if (game.phase !== 'playing') return;
  game.phase = 'failed';
  pauseStageBgm();
  endScreen.classList.remove('disconnect-screen', 'epilogue-screen');
  delete endScreen.dataset.disconnectTheme;
  endTag.textContent = '기억 붕괴';
  endTitle.textContent = '60초 안에 기억을 붙잡지 못했어.';
  endCopy.textContent = '공포는 세게 싸워서 이기는 것이 아니라, 각 기억의 역할을 빠르게 이어야 풀립니다. 보스의 목표 안내를 보고 필요한 기술만 사용해 다시 도전하세요.';
  restartButton.innerHTML = '다시 시작 <span>↻</span>';
  endScreen.classList.remove('hidden');
}

function bossRankFromRemaining(remaining) {
  if (remaining >= 35) return { rank: 'DAWN', stars: 3 };
  if (remaining >= 15) return { rank: 'MOON', stars: 2 };
  return { rank: 'STAR', stars: 1 };
}

function puzzleParTime(stage = currentStage()) {
  const roleBonus = puzzleRoleRule(stage?.layout)?.directions ? 8 : puzzleRoleRule(stage?.layout) ? 5 : 0;
  return 20 + (stage?.echoGoal || 0) * 9 + (stage?.skills?.length || 0) * 4 + roleBonus;
}

function puzzleRankFromRun(stage, elapsed, imagination, recordsUsed) {
  const target = puzzleParTime(stage);
  const leanPlan = recordsUsed <= (stage.echoGoal || 0) + 1;
  if (elapsed <= target && imagination >= 65 && leanPlan) return { rank: 'DAWN', stars: 3 };
  if (elapsed <= target * 1.7 && imagination >= 35) return { rank: 'MOON', stars: 2 };
  return { rank: 'STAR', stars: 1 };
}

function savePuzzleMemoryRecord() {
  const stage = currentStage();
  if (stage?.type !== 'puzzle') return null;
  const elapsed = Math.max(.1, Number((game.stageRealElapsed || 0).toFixed(1)));
  const imagination = Math.max(0, Math.ceil(game.imagination || 0));
  const recordsUsed = Math.max(0, Number(game.memoryRecordsUsed || 0));
  const next = { ...puzzleRankFromRun(stage, elapsed, imagination, recordsUsed), bestTime: elapsed, bestImagination: imagination, bestRecords: recordsUsed };
  const previous = campaign.puzzleRecords[game.stageIndex];
  const improved = !previous
    || next.stars > previous.stars
    || (next.stars === previous.stars && next.bestTime < previous.bestTime)
    || (next.stars === previous.stars && next.bestTime === previous.bestTime && next.bestRecords < previous.bestRecords);
  if (improved) campaign.puzzleRecords[game.stageIndex] = next;
  return { record: campaign.puzzleRecords[game.stageIndex], improved, target: puzzleParTime(stage) };
}

function saveBossMemoryRecord() {
  if (currentStage()?.type !== 'boss' || !game.challenge) return null;
  const remaining = Math.max(0, Number(game.challenge.remaining.toFixed(1)));
  const next = { ...bossRankFromRemaining(remaining), bestRemaining: remaining };
  const previous = campaign.bossRecords[game.stageIndex];
  const improved = !previous || next.stars > previous.stars || (next.stars === previous.stars && next.bestRemaining > previous.bestRemaining);
  if (improved) campaign.bossRecords[game.stageIndex] = next;
  return { record: campaign.bossRecords[game.stageIndex], improved };
}

function beginFinalRelease(b) {
  if (b.releaseReady) return;
  b.releaseReady = true;
  b.releaseProgress = 0;
  b.flash = .8;
  game.nightmareShots = [];
  say('딸: 아빠, 친구들의 행복을 돌려줘. 과학자의 수호가 천천히 풀립니다.');
}

function beginWindRelaySprint(b) {
  if (b.relayPhase === 'sprint' || b.relayProgress >= b.windGates.length) return;
  const gate = b.windGates[b.relayProgress];
  b.relayPhase = 'sprint';
  b.relayDeadline = game.elapsed + 3.35;
  b.relayPulse = .9;
  b.relayImpact = windRelayTargetPad(b);
  b.relayImpactPulse = .86;
  b.flash = .42;
  // 가로챈 한 발만 남기지 않고, 기존 탄막을 전부 순풍으로 바꿔 즉시 질주에 집중시킨다.
  game.nightmareShots = [];
  game.nextAttack = 1.35;
  say(`윤호가 되돌림 바람을 갈랐습니다! “${gate?.label || '순풍'}” 고리가 열렸어요. Space 질주로 통과하세요.`);
}

function resetWindRelayToIntercept(b, message) {
  if (!b || b.relayPhase === 'sprint') return;
  b.relayMissPulse = .78;
  b.relayPulse = 0;
  game.nightmareShots = [];
  game.nextAttack = .5;
  say(message || '되돌림 바람이 기준점에 닿기 전에 사라졌습니다. 같은 기준점을 향한 다음 바람을 가로채세요.');
}

function updateWindGates(b) {
  if (b.relayPhase !== 'sprint') return;
  const nextGate = b.windGates[b.relayProgress];
  if (!nextGate || game.dashTimer <= 0 || !overlapsWindGate(game.player, nextGate)) return;
  b.relayProgress += 1;
  b.relayPulse = .84;
  b.flash = .36;
  b.relayDeadline = 0;
  game.nightmareShots = [];
  if (b.relayProgress >= b.windGates.length) {
    b.relayPhase = 'done';
    beginHaneulWindVanePhase(b);
    return;
  }
  b.relayPhase = 'intercept';
  b.relayTargetIndex = b.relayProgress % Math.max(1, b.decoyPads.length);
  game.nextAttack = .58;
  const nextAnchor = windRelayTargetPad(b);
  say(`순풍 고리를 통과했습니다! 다음 되돌림 바람은 “${nextAnchor?.label || '출발'}” 기준점을 향합니다.`);
}

function updateWindRelayDeadline(b) {
  if (b.relayPhase !== 'sprint' || !b.relayDeadline || game.elapsed < b.relayDeadline) return;
  b.relayPhase = 'intercept';
  b.relayDeadline = 0;
  b.relayMissPulse = .7;
  b.relayPulse = 0;
  game.nightmareShots = [];
  game.nextAttack = .46;
  // 놓친 고리만 다시 만들면 된다. 이전에 전환한 순풍은 되돌리지 않아 체력형 패널티가 되지 않는다.
  say('순풍 고리가 사라졌습니다. 이미 바꾼 길은 남아 있어요. 같은 바람을 다시 가로채 다음 고리를 열어 보세요.');
}

function haneulWindVaneDirection(b = game.boss) {
  const vane = b?.windVane;
  const count = HANEUL_VANE_DIRECTIONS.length;
  const angle = Number.isFinite(vane?.angle) ? vane.angle : -Math.PI / 2;
  const index = ((Math.round((angle + Math.PI / 2) / (Math.PI * 2 / count)) % count) + count) % count;
  const direction = HANEUL_VANE_DIRECTIONS[index];
  return { ...direction, angle, index, x: Math.cos(angle), y: Math.sin(angle) };
}

function createHaneulVaneBossSequence() {
  const base = ['2', '2', '10', '10', '12', '12'];
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const sequence = [...base];
    for (let index = sequence.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [sequence[index], sequence[swapIndex]] = [sequence[swapIndex], sequence[index]];
    }
    if (sequence.every((slot, index) => index === 0 || slot !== sequence[index - 1])) return sequence;
  }
  return ['2', '10', '12', '2', '10', '12'];
}

function setHaneulVaneBossTarget(b, slot) {
  const position = HANEUL_VANE_BOSS_POSITIONS[slot] || HANEUL_VANE_BOSS_POSITIONS['12'];
  b.vaneBossSlot = slot;
  b.vaneBossTargetX = position.x;
  b.vaneBossTargetY = position.y;
  b.vaneBossReady = false;
}

function beginHaneulWindVanePhase(b) {
  if (!b || b.mode !== 'chase' || b.windVanePhase) return;
  b.windVanePhase = true;
  b.relayPhase = 'vane';
  b.phase = 2;
  b.relayDeadline = 0;
  b.relayPulse = 0;
  b.relayMissPulse = 0;
  b.maxHp = HANEUL_VANE_BOSS_HP;
  b.hp = HANEUL_VANE_BOSS_HP;
  b.vaneReflectedHits = 0;
  b.vaneHitPulse = 0;
  b.vaneHitCooldown = 0;
  b.w = 136;
  b.h = 170;
  b.vaneBossSequence = createHaneulVaneBossSequence();
  b.vaneBossSequenceIndex = 0;
  setHaneulVaneBossTarget(b, b.vaneBossSequence[0]);
  b.windVane = {
    x: W / 2 - 30,
    y: H - 160,
    w: 60,
    h: 60,
    angle: -Math.PI / 2,
    spinAngle: 0,
    turnPulse: 0,
    capturePulse: 0,
  };
  game.recording = null;
  game.echoes = [];
  game.nightmareShots = [];
  game.nextAttack = .8;
  say(`2페이즈! 검은 연이 ${HANEUL_VANE_BOSS_POSITIONS[b.vaneBossSlot]?.label || '위쪽'} 방향으로 이동하고 맵 아래쪽에 바람개비가 나타났습니다. 어디서든 P/Y를 누르는 동안 방향을 돌려 날아오는 검은 연을 다시 보내세요.`);
  updateHud();
}

function rotateHaneulWindVane(step) {
  const b = game.boss;
  if (game.phase !== 'playing' || b?.mode !== 'chase' || !b.windVanePhase || !b.windVane) return false;
  // 실제 회전량은 updateHaneulWindVaneMotion에서 키를 누른 시간만큼 누적한다.
  b.windVane.turnPulse = .42;
  updateHud();
  return true;
}

function updateHaneulWindVaneMotion(b, dt) {
  const targetX = Number.isFinite(b.vaneBossTargetX) ? b.vaneBossTargetX : HANEUL_VANE_BOSS_POSITIONS['12'].x;
  const targetBaseY = Number.isFinite(b.vaneBossTargetY) ? b.vaneBossTargetY : HANEUL_VANE_BOSS_POSITIONS['12'].y;
  const targetY = targetBaseY + Math.sin((b.threatElapsed || 0) * 1.55) * 7;
  const blend = Math.min(1, dt * 4.2);
  b.x += (targetX - b.x) * blend;
  b.y += (targetY - b.y) * blend;
  b.vaneBossReady = Math.hypot(b.x - targetX, b.y - targetY) < 7;
  b.vaneHitPulse = Math.max(0, (b.vaneHitPulse || 0) - dt);
  b.vaneHitCooldown = Math.max(0, (b.vaneHitCooldown || 0) - dt);
  if (b.windVane) {
    const turnInput = (keys.has('KeyP') ? 1 : 0) - (keys.has('KeyY') ? 1 : 0);
    if (turnInput) {
      b.windVane.angle += turnInput * HANEUL_VANE_TURN_SPEED * dt;
      b.windVane.angle = Math.atan2(Math.sin(b.windVane.angle), Math.cos(b.windVane.angle));
      b.windVane.turnPulse = .42;
    }
    const bladeSpin = turnInput ? turnInput * 6.4 : 2.8;
    b.windVane.spinAngle = (b.windVane.spinAngle || 0) + bladeSpin * dt;
    b.windVane.turnPulse = Math.max(0, (b.windVane.turnPulse || 0) - dt);
    b.windVane.capturePulse = Math.max(0, (b.windVane.capturePulse || 0) - dt);
  }
}

function redirectHaneulKiteWithVane(b, shot) {
  if (!b?.windVanePhase || !b.windVane || shot.kind !== 'black-kite' || shot.vaneReflected) return false;
  const vane = b.windVane;
  const direction = haneulWindVaneDirection(b);
  const centerX = vane.x + vane.w / 2;
  const centerY = vane.y + vane.h / 2;
  const offsetX = shot.x - centerX;
  const offsetY = shot.y - centerY;
  const forward = offsetX * direction.x + offsetY * direction.y;
  const sideways = Math.abs(offsetX * -direction.y + offsetY * direction.x);
  if (forward < 16 || forward > HANEUL_VANE_CAPTURE_LENGTH || sideways > HANEUL_VANE_CAPTURE_HALF_WIDTH) return false;
  const reflectedSpeed = 460;
  shot.vx = direction.x * reflectedSpeed;
  shot.vy = direction.y * reflectedSpeed;
  shot.angle = direction.angle;
  shot.r = 12;
  shot.vaneReflected = true;
  vane.capturePulse = .74;
  return true;
}

function hitHaneulWithReflectedKite(b) {
  b.hp = Math.max(0, b.hp - 1);
  b.vaneReflectedHits = Math.min(b.maxHp, (b.vaneReflectedHits || 0) + 1);
  b.vaneHitCooldown = .35;
  b.flash = .42;
  b.vaneHitPulse = .7;
  if (b.hp <= 0) {
    game.nightmareShots = [];
    game.nextAttack = 99;
    resolveBoss(b, '바람개비가 되돌려 보낸 여섯 개의 검은 연이 공포의 본체를 끊어 냈습니다. 하늘이의 바람이 다시 앞으로 붑니다.');
  } else {
    b.vaneBossSequenceIndex += 1;
    setHaneulVaneBossTarget(b, b.vaneBossSequence[b.vaneBossSequenceIndex]);
    game.nextAttack = .72;
    const nextPosition = HANEUL_VANE_BOSS_POSITIONS[b.vaneBossSlot]?.label || '위쪽';
    say(`되돌려 보낸 검은 연이 보스에 명중했습니다. ${b.vaneReflectedHits} / ${b.maxHp} · 다음 위치는 ${nextPosition} 방향입니다.`);
  }
  updateHud();
}

function resonanceBeat(b) {
  const anchors = activeMemoryPads(b.memoryPads || []);
  const cycle = 1.12;
  const elapsed = game.elapsed || 0;
  const phase = (elapsed % cycle) / cycle;
  // 두 화음 앵커가 있을수록 별빛 박자가 조금 넓어진다. L을 무작정 오래 누르는 대신, 밝아지는 순간을 읽게 한다.
  const window = Math.min(.38, .16 + anchors * .09);
  return { open: phase <= window || phase >= 1 - window, phase, window, index: Math.floor(elapsed / cycle) };
}

function resonanceHeartbeat(beat) {
  if (!beat.open) return 0;
  const progress = beat.phase >= 1 - beat.window
    ? (beat.phase - (1 - beat.window)) / (beat.window * 2)
    : (beat.phase + beat.window) / (beat.window * 2);
  const pulse = (center, width, strength = 1) => {
    const distance = Math.abs(progress - center) / width;
    return distance >= 1 ? 0 : Math.pow(1 - distance, 2) * strength;
  };
  return Math.max(pulse(.12, .1), pulse(.29, .085, .72));
}

function updateResonanceBassCue(b) {
  const beat = resonanceBeat(b);
  if (b.lastRhythmPulse === beat.index) return;
  b.lastRhythmPulse = beat.index;
  playResonanceBassHit();
}

function updateResonanceGates(b, techniques) {
  const nextGate = b.resonanceGates[b.resonanceProgress];
  if (!nextGate || !techniques.resonance || !pressed.has('KeyL') || !overlaps(game.player, nextGate)) return;
  const beat = resonanceBeat(b);
  if (!beat.open) {
    if ((b.nextBeatHint || 0) <= game.elapsed) {
      b.nextBeatHint = game.elapsed + .9;
      say('별빛 고리가 밝아질 때 L을 짧게 한 번 눌러 보세요. 화음 앵커가 박자를 넓혀 줍니다.');
    }
    return;
  }
  b.resonanceProgress += 1;
  b.flash = .24;
  playResonanceBassHit(true);
  say(b.resonanceProgress >= b.resonanceGates.length ? '마지막 음이 돌아왔습니다!' : `공명 성공! 되찾은 음 ${b.resonanceProgress} / ${b.resonanceGates.length}`);
}

function beginResonanceCoda(b) {
  if (b.codaActive) return;
  b.codaActive = true;
  b.echoMaintenanceDisabled = true;
  b.codaElapsed = 0;
  b.activePads = 0;
  b.phase = 3;
  b.flash = .6;
  game.echoes = [];
  game.recording = null;
  game.memoryPads = [];
  game.platforms = [];
  game.fragments = [];
  game.fallZones = [];
  game.exit = null;
  game.dreamShots = [];
  game.nightmareShots = [];
  game.dreamTrails = [];
  // 11스테이지 2페이즈에서는 발밑 기준을 유지한 채 주인공과 충돌 판정을 70%로 줄인다.
  const player = game.player;
  player.sizeTransition = {
    elapsed: 0, duration: .45,
    fromW: player.w, fromH: player.h, fromScale: 1,
    toW: player.w * .7, toH: player.h * .7, toScale: .7,
  };
  player.shrinkPulse = .45;
  game.nextAttack = .3;
  say('마지막 음이 돌아왔습니다. 박자 오브젝트와 잔상 조건이 사라졌습니다. 주인공으로 불협화음을 20초 동안 피하세요!');
}

function updatePlayerSizeTransition(player, dt) {
  const transition = player?.sizeTransition;
  if (!transition) return;
  transition.elapsed = Math.min(transition.duration, transition.elapsed + dt);
  const progress = transition.elapsed / transition.duration;
  // 처음에는 천천히, 끝에서는 빠르게 수축해 꿈이 접히는 감각을 준다.
  const eased = 1 - (1 - progress) ** 3;
  const centerX = player.x + player.w / 2;
  const feetY = player.y + player.h;
  player.w = transition.fromW + (transition.toW - transition.fromW) * eased;
  player.h = transition.fromH + (transition.toH - transition.fromH) * eased;
  player.x = centerX - player.w / 2;
  player.y = feetY - player.h;
  player.spriteScale = transition.fromScale + (transition.toScale - transition.fromScale) * eased;
  player.shrinkPulse = Math.max(0, transition.duration - transition.elapsed);
  if (progress >= 1) delete player.sizeTransition;
}

function updateMirrorGates(b, techniques) {
  const photoReady = activeMemoryPads(b.memoryPads || []) >= b.memoryPads.length;
  if (!photoReady) {
    const falseGate = b.fakeMirrorGates.find((gate) => techniques.resonance && game.dashTimer > 0 && overlaps(game.player, gate));
    if (falseGate && b.falseMirrorCooldown <= 0) {
      b.falseMirrorCooldown = .8;
      say('가짜 풍경이 되돌아왔습니다. 먼저 K로 딸의 진짜 사진에 기억의 나를 남기세요.');
    }
    return;
  }
  const nextGate = b.mirrorGates[b.mirrorProgress];
  if (!nextGate || !techniques.resonance || game.dashTimer <= 0 || !overlaps(game.player, nextGate)) return;
  b.mirrorProgress += 1;
  b.flash = .3;
  say(b.mirrorProgress >= b.mirrorGates.length ? '마지막 거울이 갈라졌습니다!' : `거울 균열 통과 ${b.mirrorProgress} / ${b.mirrorGates.length}`);
}

function finalTruthTarget(b) {
  return b.truthTargets[b.truthProgress] || null;
}

function updateFinalTruthTargets(b) {
  b.truthTargets.forEach((target) => {
    if (!target.motion) return;
    const angle = (b.threatElapsed || 0) * (target.motion.speed || 1) + (target.motion.phase || 0);
    target.x = target.homeX + Math.sin(angle) * (target.motion.xRange || 0);
    target.y = target.homeY + Math.cos(angle) * (target.motion.yRange || 0);
  });
}

function finalTruthReady(b) {
  return b.truthProgress >= b.truthTargets.length;
}

function updateDaughterVoice(b, techniques, dt) {
  if (!b.voiceGate) return;
  const touchingVoice = overlaps(game.player, b.voiceGate) && techniques.resonance;
  if (touchingVoice) {
    b.voiceProgress = Math.min(b.voiceDuration, b.voiceProgress + dt);
  } else {
    b.voiceProgress = Math.max(0, b.voiceProgress - dt * .28);
  }
  if (b.voiceProgress >= b.voiceDuration) beginFinalRelease(b);
}

function updateBoss(dt) {
  ensureBossStage();
  const p = game.player;
  const b = game.boss;
  if (b.mode === 'calm' && b.calmReflectionActive && b.resolving) {
    game.nightmareShots = [];
    game.dreamShots = [];
    game.recording = null;
    return;
  }
  const techniques = activeTechniques();
  const frozen = techniques.time;
  const calmStageBattle = b.mode === 'calm';
  const calmReflectionBattle = b.mode === 'calm' && b.calmReflectionActive;
  const freezeBoss = frozen && !calmStageBattle;
  const freezeNightmareShots = frozen && !calmStageBattle;
  updateDash(dt);
  imaginationRegen(dt, techniques);
  if (game.phase !== 'playing') return;
  updatePlayerSizeTransition(p, dt);
  game.elapsed += dt;
  if (!freezeBoss) b.threatElapsed = (b.threatElapsed || 0) + dt;
  if (game.fireCooldown > 0) game.fireCooldown = Math.max(0, game.fireCooldown - dt);
  game.nightmareHitCooldown = Math.max(0, (game.nightmareHitCooldown || 0) - dt);
  b.flash = Math.max(0, (b.flash || 0) - dt);
  b.memoryShield = Math.max(0, (b.memoryShield || 0) - dt);
  b.memoryReplay = Math.max(0, (b.memoryReplay || 0) - dt);
  b.falseMirrorCooldown = Math.max(0, (b.falseMirrorCooldown || 0) - dt);
  b.relayPulse = Math.max(0, (b.relayPulse || 0) - dt);
  b.relayMissPulse = Math.max(0, (b.relayMissPulse || 0) - dt);
  b.relayImpactPulse = Math.max(0, (b.relayImpactPulse || 0) - dt);
  b.echoDamagePulse = Math.max(0, (b.echoDamagePulse || 0) - dt);
  const horizontal = horizontalInput();
  const vertical = verticalInput();
  const bounds = b.moveBounds || { xMin: 45, xMax: 565, yMin: 86, yMax: 437 };
  p.vx = acceleratedVelocity(p.vx, horizontal, MOVEMENT_TUNING.boss, dt);
  p.vy = acceleratedVelocity(p.vy, vertical, MOVEMENT_TUNING.boss, dt);
  let nextX = p.x + p.vx * dt;
  if (game.dashTimer > 0) {
    nextX += game.dashDirection * 560 * dt;
    p.facing = game.dashDirection;
  }
  p.x = Math.max(bounds.xMin, Math.min(bounds.xMax, nextX));
  if (p.x !== nextX) p.vx = 0;
  const nextY = p.y + p.vy * dt;
  p.y = Math.max(bounds.yMin, Math.min(bounds.yMax, nextY));
  if (p.y !== nextY) p.vy = 0;
  if (horizontal) p.facing = horizontal;
  if (!freezeBoss) {
    if (calmReflectionBattle) updateCalmReflectionMotion(b, dt, frozen);
    else if (b.mode === 'chase' && b.windVanePhase) updateHaneulWindVaneMotion(b, dt);
    else {
      b.y = b.mode === 'calm'
        ? 166 + Math.sin(b.threatElapsed * 1.1) * 18
        : b.mode === 'resonance'
          ? 76 + Math.sin(b.threatElapsed * 1.45) * 16
          : 160 + Math.sin(b.threatElapsed * 1.45) * 56;
    }
    if (b.mode === 'final' && b.attackUnlocked && finalBossPhase(b) === 2) updateFinalTruthTargets(b);
    const listeningToDaughter = b.mode === 'final' && b.attackUnlocked && finalBossPhase(b) === 4;
    const attackPhaseActive = b.mode !== 'calm' || b.calmReflectionActive;
    if (attackPhaseActive && !b.releaseReady && !listeningToDaughter && b.memoryReplay <= 0) {
      game.nextAttack -= dt;
      if (game.nextAttack <= 0) { spawnNightmarePattern(); game.nextAttack = nextBossAttackDelay(b); }
    }
  }
  if (!freezeNightmareShots) {
    for (const shot of game.nightmareShots) updateNightmareShotMotion(shot, dt);
    game.nightmareShots = game.nightmareShots.filter((shot) => {
      redirectHaneulKiteWithVane(b, shot);
      // 불협화음의 외형은 유지하고 실제 피격 반경만 살짝 줄인다.
      const hitRadius = shot.kind === 'dissonant-note' ? shot.r * .86 : shot.r;
      const rect = { x: shot.x - hitRadius, y: shot.y - hitRadius, w: hitRadius * 2, h: hitRadius * 2 };
      if (b.mode === 'chase' && b.windVanePhase && shot.vaneReflected && overlaps(rect, b)) {
        if (b.vaneHitCooldown <= 0) hitHaneulWithReflectedKite(b);
        return false;
      }
      // 바람개비가 되돌린 검은 연은 플레이어와 잔상을 해치지 않고 보스 방향으로만 진행한다.
      if (shot.vaneReflected) return shot.x > -40 && shot.x < W + 40 && shot.y > -40 && shot.y < H + 40;
      // 하늘 보스의 핵심은 "잔상이 맞아 버티기"가 아니라, 윤호가 되돌림 바람을 직접 가르는 것이다.
      // 질주 중이라면 잔상에 닿기 전에 바람을 순풍으로 뒤집는다.
      const relayDashCut = b.mode === 'chase'
        && shot.relayShot
        && b.relayPhase === 'intercept'
        && game.dashTimer > 0
        && overlaps(rect, p);
      if (relayDashCut) {
        beginWindRelaySprint(b);
        return false;
      }
      // 유나의 최종 코다는 순수 회피 구간이다. 팀의 Stage 11 변경을 유지해 잔상은 더 이상 피격 대상이 아니다.
      const echoHit = b.mode === 'calm' || b.mode === 'resonance' && b.codaActive || b.mode === 'chase' && b.windVanePhase
        ? null
        : game.echoes.find((echo) => overlaps(rect, echo));
      if (echoHit) {
        echoHit.flash = .24;
        // 11스테이지의 이동 중 잔상은 탄막을 한 번 막아 내되, 최종 화음 발판에 닿기 전에는 내구도를 잃지 않는다.
        const resonanceEchoInTransit = b.mode === 'resonance'
          && (!echoHit.holding || !b.memoryPads.some((pad) => echoOverlapsPad(echoHit, pad)));
        if (resonanceEchoInTransit) return false;
        if (b.mode === 'chase') {
          // 기준점은 체력 게이지가 아니다. 되돌림 바람을 놓치면 다음 기회를 기다릴 뿐 잔상은 깨지지 않는다.
          if (shot.relayShot) resetWindRelayToIntercept(b, '되돌림 바람이 기준점에 닿아 흩어졌습니다. 잔상은 남아 있어요. 다음 바람을 Space 질주로 가로채세요.');
          return false;
        }
        damageBossEcho(echoHit, b);
        const truthEchoHit = b.mode === 'final' && b.attackUnlocked && b.memoryPads.some((pad) => echoOverlapsPad(echoHit, pad));
        if (truthEchoHit) {
          b.memoryShield = Math.min(1.25, b.memoryShield + .68);
          b.memoryReplay = Math.max(1.15, b.memoryReplay);
          say('과거의 내가 과학자의 연구실 기억을 재생했습니다. 공포 패턴이 잠시 멈추고 반사 방패가 생깁니다.');
        }
        return false;
      }
      if (overlaps(rect, p) && b.memoryShield > 0) {
        const reflectDirection = p.x + p.w / 2 < b.x + b.w / 2 ? 1 : -1;
        game.dreamShots.push({ x: p.x + p.w / 2, y: p.y + p.h / 2 - 3, w: 19, h: 7, vx: reflectDirection * 680, reflected: true });
        b.memoryShield = 0;
        say('진실의 기억 방패가 공포 탄환을 과학자에게 되돌렸습니다!');
        return false;
      }
      if (overlaps(rect, p) && game.dashTimer > 0) {
        say('질주로 공포 탄막을 가로질렀습니다!');
        return false;
      }
      if (overlaps(rect, p)) {
        if (game.nightmareHitCooldown <= 0) {
          game.nightmareHitCooldown = .34;
          const damage = bossShotDamage(shot, b);
          hitByNightmare(`공포가 상상력 연결을 크게 갉아먹습니다. -${damage}`, damage, false);
        }
        return false;
      }
      return shot.x > -40 && shot.x < W + 40 && shot.y > -40 && shot.y < H + 40;
    });
    if (b.mode === 'chase' && b.windVanePhase && b.resolving) game.nightmareShots = [];
  }
  if (!calmReflectionBattle) updateMemoryLoops(dt);
  if (b.mode === 'calm' && !calmReflectionBattle) updateCalmFakeMemories(b, dt, false);
  // 5스테이지의 세 진짜 기억은 본체나 유지 중인 잔상 어느 쪽으로든 활성화된다.
  if (game.dreamShots.length) {
    game.dreamShots = game.dreamShots.filter((shot) => {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life = (shot.life || 0) + dt;
      const rect = { x: shot.x, y: shot.y, w: shot.w, h: shot.h };
      if (b.mode === 'calm' && !b.calmReflectionActive && shot.target === 'calm-fake') {
        const hitFake = activeCalmFakeMemories(b).find((fake) => overlaps(rect, fake));
        if (hitFake) {
          hitCalmFakeMemory(hitFake);
          return false;
        }
      }
      const finalPhase = b.mode === 'final' ? finalBossPhase(b) : 1;
      if (b.mode === 'final' && b.attackUnlocked && finalPhase === 2 && !finalTruthReady(b)) {
        const hitMemory = b.truthTargets.find((target) => overlaps(rect, target));
        if (hitMemory) {
          const truth = finalTruthTarget(b);
          if (hitMemory === truth) {
            b.truthProgress += 1;
            b.flash = .3;
            if (finalTruthReady(b)) {
              b.truthResolved = true;
              b.phase = 3;
              game.nightmareShots = [];
              game.nextAttack = .56;
              say('세 친구의 진짜 기억이 복제를 지웠습니다. 수호자의 모습이 무너졌지만, 아직 남은 꿈 에너지를 모두 돌려줘야 합니다.');
            } else {
              say(`진짜 기억을 찾았습니다. ${b.truthProgress} / ${b.truthTargets.length} · 다음 기억을 찾아보세요.`);
            }
          } else {
            say('그건 과학자가 만든 가짜 복제입니다. 다음 빛나는 진짜 기억을 노리세요.');
          }
          return false;
        }
        if (overlaps(rect, b)) {
          say('복제된 기억이 수호자를 감쌉니다. 먼저 화면의 진짜 기억을 찾아야 합니다.');
          return false;
        }
      }
      if (b.mode === 'final' && b.attackUnlocked && finalPhase === 4 && overlaps(rect, b)) {
        say('이제는 공격할 때가 아닙니다. 딸의 목소리를 전해 주세요.');
        return false;
      }
      if (b.mode === 'calm' && overlaps(rect, b)) {
        return false;
      }
      if (overlaps(rect, b)) {
        const previousPhase = finalBossPhase(b);
        b.flash = .18;
        b.hp = Math.max(0, b.hp - 1);
        if (b.mode === 'final') {
          b.phase = finalBossPhase(b);
          if (b.phase > previousPhase && b.hp > 0) say('연구실이 뒤틀리며 친구들의 기억을 복제했습니다. 진짜 기억만 찾아야 합니다.');
          if (b.hp <= 0 && b.truthResolved && !b.defeated) {
            b.defeated = true;
            b.phase = 4;
            game.nightmareShots = [];
            say('수호자의 체력이 모두 비었습니다. 이제 공격을 멈추고 딸의 목소리를 아버지에게 전하세요.');
          }
        }
        game.nextAttack = Math.min(game.nextAttack + .16, b.mode === 'final' ? 1.12 : 1.0);
        return false;
      }
      return shot.life < 1.8 && shot.x > -40 && shot.x < W + 40 && shot.y > -40 && shot.y < H + 40;
    });
  }
  if (b.mode === 'final' && b.releaseReady) {
    // 마지막에는 더 이상 싸우지 않는다. 딸의 목소리가 닿는 동안 공격과 탄막을 모두 멈춘다.
    game.nightmareShots = [];
    b.releaseProgress = Math.min(b.releaseDuration, b.releaseProgress + dt);
    if (b.releaseProgress >= b.releaseDuration) {
      resolveBoss(b, '수면 과학자는 마침내 수호자를 멈췄습니다. 딸의 선택과 친구들의 기억이 그를 현실로 데려옵니다.');
    }
    return;
  }
  if (b.mode === 'calm') {
    if (b.calmReflectionActive) {
      b.activePads = b.calmMemoryComplete || 3;
      b.phase = 4;
      return;
    }
    const fleeingFakeCount = activeCalmFakeMemories(b).length;
    b.activePads = calmMemoryState(b).activePads;
    b.phase = b.activePads + 1;
    if (b.activePads >= b.memoryPads.length && fleeingFakeCount === 0) beginCalmReflectionPhase(b);
    return;
  }
  if (b.mode === 'chase') {
    if (b.windVanePhase) {
      b.activePads = b.decoyPads.length;
      b.phase = 2;
      return;
    }
    b.activePads = activeMemoryPads(b.decoyPads);
    b.phase = Math.min(3, b.relayProgress + 1);
    if (b.activePads >= b.decoyPads.length) {
      if (!b.relayAnchorsReady) {
        b.relayAnchorsReady = true;
        game.nightmareShots = [];
        game.nextAttack = .58;
        say('두 바람 기준점이 고정됐습니다. 검은 연에서 기준점으로 오는 되돌림 바람을 Space 질주로 가로채세요.');
      }
      updateWindRelayDeadline(b);
      updateWindGates(b);
    } else {
      b.relayAnchorsReady = false;
    }
    return;
  }
  if (b.mode === 'resonance') {
    if (b.codaActive) {
      b.activePads = 0;
      b.phase = 3;
      b.codaElapsed = Math.min(b.codaDuration, b.codaElapsed + dt);
      if (b.codaElapsed >= b.codaDuration) resolveBoss(b, '불협화음이 끝나고, 유나의 노래가 꿈 전체에 울려 퍼집니다.');
    } else {
      b.activePads = activeMemoryPads(b.memoryPads);
      b.phase = Math.min(3, b.resonanceProgress + 1);
      updateYunaBossMusic(b);
      if (b.activePads >= b.memoryPads.length) {
        updateResonanceBassCue(b);
        updateResonanceGates(b, techniques);
        if (b.resonanceProgress >= b.resonanceGates.length) beginResonanceCoda(b);
      }
    }
    return;
  }
  if (b.mode === 'mirror') {
    b.activePads = activeMemoryPads(b.memoryPads);
    b.phase = Math.min(3, b.mirrorProgress + 1);
    updateMirrorGates(b, techniques);
    if (b.mirrorProgress >= b.mirrorGates.length) resolveBoss(b, '완벽한 꿈의 수호자가 멈췄습니다. 딸은 균열 너머의 친구들을 바라봅니다.');
    return;
  }
  if (b.mode === 'final' && b.attackUnlocked && finalBossPhase(b) === 4) {
    // 마지막 단계는 체력을 더 깎는 전투가 아니라, 딸의 선택을 아버지에게 들려주는 순간이다.
    game.nightmareShots = [];
    updateDaughterVoice(b, techniques, dt);
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
    say('세 개의 봉인이 공명했습니다. 이제 J로 빼앗긴 기억을 돌려주세요.');
  }
  if (b.attackUnlocked && b.hp <= 0 && b.truthResolved && !b.defeated && !b.resolving) {
    b.defeated = true;
    b.phase = 4;
    game.nightmareShots = [];
    say('수호자의 체력이 모두 비었습니다. 딸의 목소리를 전해 마지막 연결을 풀어주세요.');
  }
}

function completeStage() {
  if (game.phase !== 'playing') return;
  const completedStageIndex = game.stageIndex;
  const storyBeat = STORY_BEATS[completedStageIndex];
  // 스토리가 이어지는 구간은 방금 지나온 꿈의 음악을 낮은 볼륨으로 남긴다.
  // 다음 스테이지를 시작할 때만 새 꿈의 BGM으로 자연스럽게 교체된다.
  if (!storyBeat) stopStageBgm();
  game.completed.push(game.stageIndex);
  const stage = currentStage();
  const memoryRecord = stage.type === 'boss' ? saveBossMemoryRecord() : savePuzzleMemoryRecord();
  if (memoryRecord?.improved) {
    const rankName = { DAWN: '새벽', MOON: '달빛', STAR: '별빛' }[memoryRecord.record.rank] || memoryRecord.record.rank;
    const recordLine = stage.type === 'boss'
      ? `${rankName} 기록 · ${memoryRecord.record.bestRemaining.toFixed(1)}초를 남기고 공포를 풀었습니다.`
      : `${rankName} 기록 · ${memoryRecord.record.bestTime.toFixed(1)}초 · 상상력 ${memoryRecord.record.bestImagination} · 기록 ${memoryRecord.record.bestRecords}회`;
    say(recordLine);
  }
  if (Array.isArray(stage?.teaches)) {
    stage.teaches.forEach((skill) => {
      campaign.skills.add(skill);
      game.learnedSkills.add(skill);
    });
  }
  campaign.cleared.add(game.stageIndex);
  campaign.unlocked = Math.max(campaign.unlocked, Math.min(STAGES.length - 1, game.stageIndex + 1));
  saveCampaignProgress();
  game.challenge = null;
  if (game.stageIndex < STAGES.length - 1) {
    game.stageIndex += 1;
    if (storyBeat) showStoryBeat(storyBeat);
    else showStageIntro();
  } else showChapterEnd();
}

function disconnectPresentation(stage = currentStage()) {
  if (stage?.bossConfig?.mode === 'final' || stage?.page === 2) return {
    key: 'scientist', accent: '#8ceeff', shade: '#102d49', monster: '붙잡힌 아버지',
    scene: '꿈을 붙잡으려는 기계가 너의 연결을 끊었다.',
  };
  const chapter = stage?.chapter || '';
  if (chapter.includes('유나')) return {
    key: 'yuna', accent: '#9effd7', shade: '#124b50', monster: '침묵의 합창',
    scene: '침묵한 화음이 너의 목소리를 삼켰다.',
  };
  if (chapter.includes('하늘')) return {
    key: 'haneul', accent: '#a6efff', shade: '#153c64', monster: '되돌아오는 역풍',
    scene: '거센 바람이 너를 꿈의 가장자리로 되돌렸다.',
  };
  if (chapter.includes('딸')) return {
    key: 'daughter', accent: '#ffb5df', shade: '#5c285a', monster: '완벽한 거울',
    scene: '완벽한 풍경이 진실을 가리며 너를 밀어냈다.',
  };
  return {
    key: 'harin', accent: '#ff83b1', shade: '#421638', monster: '비어 버린 광대',
    scene: '웃음이 사라진 유원지가 너를 꿈 밖으로 밀어냈다.',
  };
}

function drawDisconnectNightmare(presentation, progress) {
  const pulse = 1 + Math.sin(game.disconnect?.elapsed * 18 || 0) * .06;
  ctx.save();
  ctx.translate(W * .72, H * .39); ctx.scale(pulse, pulse);
  ctx.shadowBlur = 36; ctx.shadowColor = presentation.accent; ctx.fillStyle = presentation.shade;
  if (presentation.key === 'yuna') {
    [-58, 0, 58].forEach((offset, index) => {
      ctx.beginPath(); ctx.ellipse(offset, index === 1 ? -5 : 9, 34, 59, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = presentation.accent; ctx.fillRect(offset - 15, index === 1 ? -12 : 2, 11, 5); ctx.fillRect(offset + 5, index === 1 ? -12 : 2, 11, 5); ctx.fillStyle = presentation.shade;
    });
  } else if (presentation.key === 'haneul') {
    ctx.strokeStyle = presentation.accent; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 85, .1, Math.PI * 1.82); ctx.stroke();
    ctx.fillStyle = presentation.shade; ctx.beginPath(); ctx.ellipse(0, 0, 76, 52, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = presentation.accent; ctx.beginPath(); ctx.ellipse(0, 0, 28, 31, 0, 0, Math.PI * 2); ctx.fill();
  } else if (presentation.key === 'daughter') {
    ctx.rotate(Math.PI / 4); ctx.fillRect(-61, -61, 122, 122); ctx.strokeStyle = presentation.accent; ctx.lineWidth = 5; ctx.strokeRect(-61, -61, 122, 122); ctx.rotate(-Math.PI / 4);
    ctx.strokeStyle = '#fff2fa'; ctx.lineWidth = 3; [[-55, -24, -6, 8], [-7, 9, 42, -32], [-22, 52, 18, 16]].forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
  } else if (presentation.key === 'scientist') {
    ctx.fillRect(-62, -52, 124, 104); ctx.strokeStyle = presentation.accent; ctx.lineWidth = 6; ctx.strokeRect(-62, -52, 124, 104);
    ctx.fillStyle = presentation.accent; ctx.fillRect(-22, -18, 16, 11); ctx.fillRect(6, -18, 16, 11); ctx.strokeStyle = presentation.accent; ctx.beginPath(); ctx.arc(0, 21, 28, .05, Math.PI - .05); ctx.stroke();
    ctx.fillStyle = presentation.shade; ctx.fillRect(-102, 42, 204, 26);
  } else {
    ctx.beginPath(); ctx.ellipse(0, 0, 76, 96, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = presentation.accent; ctx.beginPath(); ctx.arc(-29, -16, 23, 0, Math.PI * 2); ctx.arc(29, -16, 23, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#150d25'; ctx.fillRect(-40, -20, 21, 8); ctx.fillRect(19, -20, 21, 8); ctx.strokeStyle = presentation.accent; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 33, 27, 0, Math.PI); ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.fillStyle = presentation.accent; ctx.font = '800 11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(presentation.monster, W * .72, H * .67); ctx.restore();
}

function drawDisconnectWakeUp(presentation, progress) {
  const pulse = .26 + Math.sin(game.disconnect?.elapsed * 12 || 0) * .1;
  drawCinematicMachine(238, 264, pulse, true);
  ctx.save(); ctx.strokeStyle = presentation.accent; ctx.globalAlpha = .76; ctx.lineWidth = 3;
  [[311, 243, 498, 326], [311, 278, 494, 370], [304, 300, 465, 401]].forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, y1 - 64, x2, y2); ctx.stroke(); }); ctx.restore();
  drawCinematicPixelChild(560, 400, { hair: '#59405e', clothes: '#526aab', detail: '#fff0a6', glow: '#ffe27e' }, 1.58);
  ctx.save(); ctx.fillStyle = '#8ceeff'; ctx.shadowBlur = 12; ctx.shadowColor = '#8ceeff';
  ctx.beginPath(); ctx.ellipse(587, 294 + Math.sin(game.disconnect?.elapsed * 9 || 0) * 3, 6, 11, .28, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = progress; ctx.fillStyle = '#eaf7ff'; ctx.font = '800 12px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('접속 해제 중', W / 2, 88); ctx.restore();
}

function drawFailureArt(image, opacity = 1) {
  ensureSprite(image);
  if (!image?.complete || !image.naturalWidth) return false;
  ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, opacity)); ctx.drawImage(image, 0, 0, W, H); ctx.restore();
  return true;
}

function drawDisconnectCaption(eyebrow, line, opacity = 1) {
  ctx.save(); ctx.globalAlpha = opacity; ctx.fillStyle = 'rgba(4, 8, 21, .68)'; ctx.fillRect(0, H - 116, W, 116);
  ctx.fillStyle = '#9eeeff'; ctx.font = '800 10px "Segoe UI", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(eyebrow, W / 2, H - 77);
  ctx.fillStyle = '#f4f8ff'; ctx.font = '850 20px "Segoe UI", sans-serif'; ctx.fillText(line, W / 2, H - 43); ctx.restore();
}

function drawDreamDisconnect() {
  const state = game.disconnect;
  if (!state) return;
  const progress = Math.max(0, Math.min(1, state.elapsed / state.duration));
  const nightmareProgress = Math.min(1, progress / .48);
  const crossFadeStart = .48;
  const crossFadeEnd = .65;
  const bossOpacity = progress < crossFadeEnd ? Math.min(1, progress / .1) * (progress <= crossFadeStart ? 1 : 1 - (progress - crossFadeStart) / (crossFadeEnd - crossFadeStart)) : 0;
  const wakeOpacity = progress <= crossFadeStart ? 0 : Math.min(1, (progress - crossFadeStart) / (crossFadeEnd - crossFadeStart));
  ctx.save(); ctx.fillStyle = `rgba(4, 7, 20, ${.16 + nightmareProgress * .25})`; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .12 + nightmareProgress * .35; ctx.fillStyle = state.theme.accent;
  for (let index = 0; index < 42; index += 1) {
    const x = (index * 137 + Math.floor(state.elapsed * 490) * (index % 3 + 1)) % W;
    const y = (index * 73 + Math.floor(state.elapsed * 350) * (index % 5 + 1)) % H;
    ctx.fillRect(x, y, index % 4 === 0 ? 32 : 10, index % 5 === 0 ? 4 : 2);
  }
  ctx.restore();
  if (bossOpacity > 0) {
    if (!drawFailureArt(failureArt[state.theme.key], bossOpacity)) drawDisconnectNightmare(state.theme, nightmareProgress);
    drawDisconnectCaption(state.theme.monster, '상상력이 바닥났다. 악몽이 너를 꿈 밖으로 밀어낸다.', bossOpacity);
  }
  if (wakeOpacity > 0) {
    if (!drawFailureArt(failureArt.wakeup, wakeOpacity)) {
      ctx.save(); ctx.globalAlpha = wakeOpacity; ctx.fillStyle = 'rgba(7, 18, 37, .86)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      drawDisconnectWakeUp(state.theme, wakeOpacity);
    }
    drawDisconnectCaption('접속 해제', '연결은 끊겼지만, 다시 들어갈 수 있어.', wakeOpacity);
  }
  const fade = Math.max(0, (progress - .91) / .09);
  if (fade > 0) { ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = '#060714'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

function disconnect() {
  if (game.phase !== 'playing') return;
  game.phase = 'disconnecting';
  pauseStageBgm();
  game.disconnect = { elapsed: 0, duration: 4.5, theme: disconnectPresentation() };
  ensureSprites([failureArt[game.disconnect.theme.key], failureArt.wakeup]);
  keys.clear();
  pressed.clear();
  gameHud.classList.add('hidden');
  bossHud.classList.add('hidden');
  endScreen.classList.add('hidden');
  disconnectSkipButton.classList.remove('hidden');
  canvas.classList.remove('connection-weak', 'connection-critical');
}

function skipDreamDisconnect() {
  if (game.phase !== 'disconnecting') return;
  game.disconnect.elapsed = game.disconnect.duration;
  showDisconnectResult();
}

function showDisconnectResult() {
  if (game.phase !== 'disconnecting') return;
  const presentation = game.disconnect?.theme || disconnectPresentation();
  game.phase = 'failed';
  disconnectSkipButton.classList.add('hidden');
  endScreen.classList.remove('epilogue-screen');
  endScreen.classList.add('disconnect-screen');
  endScreen.dataset.disconnectTheme = presentation.key;
  disconnectIllustrationImage.src = FAILURE_ART_PATHS[presentation.key];
  disconnectIllustrationImage.alt = `${presentation.monster} 실패 일러스트`;
  disconnectIllustration.classList.add('has-art');
  disconnectIllustrationLabel.textContent = presentation.scene;
  endTag.textContent = '연결 중단';
  // 실패의 이유는 일러스트 안에서 이미 보여 주므로, 아래에는 회복 방법만 짧게 남긴다.
  endTitle.innerHTML = '꿈과의 연결이<br>끊어졌어.';
  endCopy.innerHTML = '<span class="disconnect-copy-lead">기술을 잠시 멈추면 상상력은 회복됩니다.</span><span>필요한 순간을 골라 다시 접속하세요.</span>';
  restartButton.innerHTML = '꿈으로 다시 들어가기 <span>↻</span>';
  endScreen.classList.remove('hidden');
}

function showChapterEnd() {
  startEndingCinematic();
}

function startEndingCinematic() {
  // 장면을 넘길 때 원화가 아직 도착하지 않아 임시 캐릭터가 한 프레임 보이는 일을 막는다.
  ensureSprites(Object.values(endingCinematicSprites));
  game.phase = 'ending-cinematic';
  game.endingScene = 0;
  game.endingSceneElapsed = 0;
  game.endingAdvanceCooldown = .35;
  // 최종전의 긴장감은 천천히 사라지고, 첫 결말 일러스트와 함께 회복된 테마가 열린다.
  startStageBgm(null, { key: 'ending' });
  keys.clear();
  pressed.clear();
  gameHud.classList.add('hidden');
  bossHud.classList.add('hidden');
  startScreen.classList.add('hidden');
  stageMenu.classList.add('hidden');
  endScreen.classList.add('hidden');
}

function advanceEndingCinematic() {
  if (game.phase !== 'ending-cinematic') return;
  if ((game.endingAdvanceCooldown || 0) > 0) return;
  game.endingScene += 1;
  game.endingSceneElapsed = 0;
  game.endingAdvanceCooldown = .22;
  if (game.endingScene >= ENDING_CINEMATIC_SCENES.length) showFinalTruth();
}

function updateEndingCinematic(dt) {
  if (game.phase !== 'ending-cinematic') return;
  game.endingAdvanceCooldown = Math.max(0, (game.endingAdvanceCooldown || 0) - dt);
  game.endingSceneElapsed += dt;
  const scene = ENDING_CINEMATIC_SCENES[game.endingScene];
  if (scene && game.endingSceneElapsed >= scene.duration) advanceEndingCinematic();
}

function showFinalTruth() {
  game.phase = 'truth';
  // 마지막 시네마틱의 결말 테마는 새로 시작하지 않고 에필로그까지 한 호흡으로 이어진다.
  keepEndingBgmForEpilogue();
  endScreen.classList.remove('disconnect-screen');
  endScreen.classList.add('epilogue-screen');
  delete endScreen.dataset.disconnectTheme;
  endTag.textContent = '에필로그 · 새로운 아침';
  endTitle.textContent = '혼자가 아니야.';
  endCopy.innerHTML = '<span class="epilogue-copy-lead">딸은 끝내 눈을 뜨지 못했지만,<br>친구들의 목소리 곁에서 아주 옅게 웃고 있었습니다.</span><span>그 미소는 빼앗은 완벽한 꿈이 아니라,<br>함께 나눈 기억에서 피어난 것이었습니다.</span><span>아버지는 딸의 손을 잡고 현실의 슬픔을 함께 견디며,<br>누구의 꿈도 빼앗기지 않을 다음 이야기를 기다립니다.</span>';
  restartButton.innerHTML = '메인 화면으로 <span>⌂</span>';
  endScreen.classList.remove('hidden');
}

function bossPhaseNodes(boss = game.boss) {
  if (!boss) return [];
  if (boss.mode === 'calm') {
    if (boss.calmReflectionActive) return [
      { label: '세 기억', done: true },
      { label: '가면 반사전', done: boss.calmReflectionBroken >= boss.calmReflectionRequired },
    ];
    const state = calmMemoryState(boss);
    return [
      { label: '세 기억', done: state.trueMemoryCount >= state.memoryTargetCount },
      { label: '가면 반사전', done: boss.calmReflectionActive },
    ];
  }
  if (boss.mode === 'resonance') return [
    { label: '화음 앵커', done: boss.codaActive || boss.activePads >= boss.memoryPads.length },
    { label: '박자', done: boss.resonanceProgress >= boss.resonanceGates.length },
    { label: '불협화음', done: boss.codaElapsed >= boss.codaDuration },
  ];
  if (boss.mode === 'chase') return [
    { label: '바람 기준점', done: boss.activePads >= boss.decoyPads.length },
    { label: '순풍 릴레이', done: boss.relayProgress >= boss.windGates.length },
    { label: '바람개비 반사', done: boss.windVanePhase && boss.hp <= 0 },
  ];
  if (boss.mode === 'mirror') return [
    { label: '진짜 사진', done: boss.activePads >= boss.memoryPads.length },
    { label: '진짜 균열', done: boss.mirrorProgress >= boss.mirrorGates.length },
  ];
  return [
    { label: '봉인', done: boss.attackUnlocked },
    { label: '첫 반환', done: boss.attackUnlocked && finalBossPhase(boss) >= 2 },
    { label: '진짜 기억', done: boss.truthResolved },
    { label: '수호자 해체', done: boss.defeated },
    { label: '딸의 목소리', done: boss.releaseReady },
  ];
}

function refreshBossGuide() {
  if (currentStage()?.type !== 'boss' || !game.boss) return;
  const guide = phaseGuide();
  // 남은 시간처럼 매 프레임 바뀌는 숫자는 새 페이즈로 취급하지 않는다.
  // 단계가 바뀔 때만 짧은 안내가 다시 등장한다.
  const key = guide.step;
  if (game.bossGuideKey !== key) {
    game.bossGuideKey = key;
    game.bossGuideUntil = game.elapsed + 3.25;
    game.bossGuideStarted = game.elapsed;
  }
}

function renderContextControls() {
  const visible = game.phase === 'playing';
  contextControls.classList.toggle('hidden', !visible);
  if (!visible) return;
  contextControls.innerHTML = guideKeyHints()
    .map(({ key, label }) => `<span><b>${key}</b>${label}</span>`)
    .concat('<span><b>ESC</b>꿈의 경로</span>')
    .join('');
}

function updateHud() {
  const stage = currentStage() || STAGES[0];
  const guide = phaseGuide();
  stageIndexEl.textContent = `${stagePage() === 2 ? '두 번째 장 · ' : ''}스테이지 ${String(game.stageIndex + 1).padStart(2, '0')} / ${String(totalStages()).padStart(2, '0')}`;
  stageNameEl.textContent = stage.name;
  objectiveEl.textContent = guide.compact;
  const value = Math.ceil(game.imagination ?? 100);
  imaginationValueEl.textContent = value;
  imaginationFill.style.width = `${value}%`;
  imaginationStatus.textContent = value <= 20 ? '연결이 흐려지고 있어요. 기술을 멈추세요.' : '상상력은 사용하지 않으면 회복됩니다.';
  const showConnectionBlur = game.phase === 'playing';
  canvas.classList.toggle('connection-weak', showConnectionBlur && value <= 35 && value > 10);
  canvas.classList.toggle('connection-critical', showConnectionBlur && value <= 10);
  const challenge = game.challenge;
  challengeCard.classList.toggle('hidden', !challenge || game.phase === 'ending-cinematic');
  if (challenge) {
    challengeValueEl.textContent = `${challenge.remaining.toFixed(1)}s`;
    challengeStatusEl.textContent = challenge.remaining <= 15 ? '기억 붕괴가 가까워요. 다음 역할만 완성하세요.' : '60초 안에 공포의 규칙을 바꾸세요.';
    challengeCard.classList.toggle('urgent', challenge.remaining <= 15);
  }
  if (game.boss) {
    bossNameEl.textContent = game.boss.mode === 'final' ? '수면 과학자 · 집착의 균열' : game.boss.name;
    const active = game.boss.activePads || 0;
    if (game.boss.mode === 'calm') {
      const fakeProgress = calmFakeProgress(game.boss);
      const state = calmMemoryState(game.boss);
      if (game.boss.calmReflectionActive) {
        bossFill.style.width = `${game.boss.calmReflectionBroken / Math.max(1, game.boss.calmReflectionRequired) * 100}%`;
        bossHealthEl.textContent = `자유 조준 명중 ${game.boss.calmReflectionBroken} / ${game.boss.calmReflectionRequired}`;
      } else if (fakeProgress.active.length) {
        bossFill.style.width = `${fakeProgress.hitCount / fakeProgress.requiredHits * 100}%`;
        bossHealthEl.textContent = `가짜 기억 탄환 명중 ${fakeProgress.hitCount} / ${fakeProgress.requiredHits}회`;
      } else if (state.trueMemoryCount < state.memoryTargetCount) {
        bossFill.style.width = `${state.trueMemoryCount / Math.max(1, state.memoryTargetCount) * 100}%`;
        bossHealthEl.textContent = `진짜 기억 ${state.trueMemoryCount} / ${state.memoryTargetCount}`;
      } else {
        bossFill.style.width = '100%';
        bossHealthEl.textContent = '세 기억 완성 · 가면 반사전 전환';
      }
    } else if (game.boss.mode === 'resonance' && game.boss.codaActive) {
      const remaining = Math.max(0, game.boss.codaDuration - game.boss.codaElapsed);
      bossFill.style.width = `${game.boss.codaElapsed / Math.max(1, game.boss.codaDuration) * 100}%`;
      bossHealthEl.textContent = `불협화음 버티기 ${remaining.toFixed(1)}초`;
    } else if (game.boss.mode === 'resonance' && game.boss.activePads < game.boss.memoryPads.length) {
      bossFill.style.width = `${game.boss.activePads / Math.max(1, game.boss.memoryPads.length) * 100}%`;
      bossHealthEl.textContent = `화음 앵커 ${game.boss.activePads} / ${game.boss.memoryPads.length}`;
    } else if (game.boss.mode === 'resonance') {
      bossFill.style.width = `${game.boss.resonanceProgress / Math.max(1, game.boss.resonanceGates.length) * 100}%`;
      bossHealthEl.textContent = `되찾은 음 ${game.boss.resonanceProgress} / ${game.boss.resonanceGates.length}`;
    } else if (game.boss.mode === 'chase') {
      const total = Math.max(1, game.boss.windGates.length);
      if (game.boss.windVanePhase) {
        bossFill.style.width = `${game.boss.vaneReflectedHits / Math.max(1, game.boss.maxHp) * 100}%`;
        bossHealthEl.textContent = `검은 연 반사 ${game.boss.vaneReflectedHits} / ${game.boss.maxHp}`;
      } else {
        bossFill.style.width = `${game.boss.relayProgress / total * 100}%`;
        const left = Math.max(0, (game.boss.relayDeadline || 0) - game.elapsed);
        bossHealthEl.textContent = game.boss.activePads < game.boss.decoyPads.length
          ? `바람 기준점 ${game.boss.activePads} / ${game.boss.decoyPads.length}`
          : game.boss.relayPhase === 'sprint'
            ? `순풍 고리 ${game.boss.relayProgress + 1} / ${total} · ${left.toFixed(1)}초`
            : `되돌림 가로채기 ${game.boss.relayProgress} / ${total}`;
      }
    } else if (game.boss.mode === 'mirror') {
      const photoReady = game.boss.activePads >= game.boss.memoryPads.length;
      bossFill.style.width = `${photoReady ? game.boss.mirrorProgress / Math.max(1, game.boss.mirrorGates.length) * 100 : game.boss.activePads / Math.max(1, game.boss.memoryPads.length) * 100}%`;
      bossHealthEl.textContent = photoReady ? `진짜 균열 ${game.boss.mirrorProgress} / ${game.boss.mirrorGates.length}` : '진짜 사진을 재생하세요';
    } else if (game.boss.releaseReady) {
      bossFill.style.width = `${Math.min(100, game.boss.releaseProgress / game.boss.releaseDuration * 100)}%`;
      bossHealthEl.textContent = '마지막 기억을 놓아주는 중…';
    } else if (game.boss.attackUnlocked) {
      const finalPhase = finalBossPhase(game.boss);
      if (game.boss.mode === 'final' && finalPhase === 2) {
        bossFill.style.width = `${game.boss.truthProgress / Math.max(1, game.boss.truthTargets.length) * 100}%`;
        bossHealthEl.textContent = `진짜 기억 ${game.boss.truthProgress} / ${game.boss.truthTargets.length}`;
      } else if (game.boss.mode === 'final' && finalPhase === 4) {
        bossFill.style.width = `${game.boss.voiceProgress / game.boss.voiceDuration * 100}%`;
        bossHealthEl.textContent = `딸의 목소리 ${game.boss.voiceProgress.toFixed(1)} / ${game.boss.voiceDuration.toFixed(1)}초`;
      } else {
        bossFill.style.width = `${(game.boss.maxHp - Math.max(0, game.boss.hp)) / Math.max(1, game.boss.maxHp) * 100}%`;
        bossHealthEl.textContent = `${game.boss.truthResolved ? '수호자 해체' : '기억 반환'} ${game.boss.maxHp - Math.max(0, game.boss.hp)} / ${game.boss.maxHp}`;
      }
    } else {
      bossFill.style.width = `${game.boss.finalCharge / game.boss.finalChargeNeeded * 100}%`;
      bossHealthEl.textContent = `공명 해제 ${game.boss.finalCharge.toFixed(1)} / ${game.boss.finalChargeNeeded.toFixed(1)}초`;
    }
  }
  const techniques = activeTechniques();
  const calmMaskAim = game.boss?.mode === 'calm' && game.boss.calmReflectionActive;
  const calmBeforeMasks = game.boss?.mode === 'calm' && !game.boss.calmReflectionActive;
  ruleStates.time.textContent = calmMaskAim
    ? techniques.time ? '가면만 멈춘 상태 · 광대/탄막 이동' : 'Shift · 가면만 멈추기'
    : calmBeforeMasks
      ? '2페이즈 가면 단계에서 사용 가능'
      : techniques.time ? '사용 중 · 초당 28 소모' : 'Shift 유지 · 초당 28 소모';
  if (ruleStates.resonance) {
    const drain = resonanceDrainPerSecond();
    ruleStates.resonance.textContent = techniques.resonance ? `사용 중 · 초당 ${drain} 소모` : `L 유지 · 초당 ${drain} 소모`;
  }
  if (ruleStates.dash) ruleStates.dash.textContent = game.dashCooldown > 0 ? `회복 ${game.dashCooldown.toFixed(1)}초` : 'Space · 앞으로 질주';
  ruleCards.forEach((card) => {
    const rule = card.dataset.rule;
    const active = Boolean(techniques[rule]);
    card.classList.toggle('active', active || (rule === 'dash' && game.dashCooldown > 0));
    card.classList.toggle('locked', !hasSkill(rule));
  });
  renderContextControls();
  updateMemoryLoopUI();
}

function updateMemoryLoopUI() {
  const boss = game.boss;
  const countedEchoes = countedMemoryEchoes();
  echoCards.forEach((card, index) => {
    const echo = countedEchoes[index];
    const durability = boss?.echoHitLimit > 0 && boss.mode !== 'calm' && echo && !echo.protectedStolen && !(boss.mode === 'chase' && boss.relayEchoProtected)
      ? ` · ${boss.mode === 'resonance' ? '불협' : '공포'} ${Math.min(boss.echoHitLimit, echo.nightmareHits || 0)}/${boss.echoHitLimit}`
      : '';
    card.classList.toggle('found', Boolean(echo));
    card.querySelector('small').textContent = !echo
      ? '비어 있음'
      : echo.protectedStolen
        ? `${echo.role?.label || '기억'} · 빼앗김 · 고정`
        : echo.holding ? `${echo.role?.label || '기억'} · 자리 지킴${durability}` : '기억 재생 중';
  });
  if (game.recording) {
    memoryStatus.textContent = `기억 기록 중 · ${game.recording.duration.toFixed(1)}초 · K로 되감고, I로 취소할 수 있습니다.`;
  } else if (boss) {
    const active = boss.activePads || 0;
    if (boss.mode === 'calm') {
      const fakeProgress = calmFakeProgress(boss);
      const state = calmMemoryState(boss);
      memoryStatus.textContent = boss.calmReflectionActive
        ? `자유 조준 명중 ${boss.calmReflectionBroken} / ${boss.calmReflectionRequired} · 가면 가까이에서 조준선을 잡고 J로 직선 발사하세요. Shift는 가면만 멈추며 광대와 탄막은 계속 움직이고 K 기록은 비활성화됩니다.`
        : fakeProgress.active.length
        ? `잔상 슬롯 ${countedEchoes.length} / 3 · WASD 조준 + J 탄환 ${fakeProgress.hitCount} / ${fakeProgress.requiredHits} · 훔친 잔상은 슬롯을 차지하며 I와 선입선출 교체로 사라지지 않습니다.`
        : state.trueMemoryCount < state.memoryTargetCount
          ? `세 기억 ${state.trueMemoryCount} / ${state.memoryTargetCount} · 각 기억은 현재 본체 또는 유지 중인 K 잔상으로 활성화할 수 있습니다. 탄막은 2페이즈부터 시작됩니다.`
          : '세 기억이 완성됐습니다. 무대가 비워지며 마지막 가면 반사전으로 전환됩니다.';
    } else if (boss.mode === 'resonance') {
      memoryStatus.textContent = boss.codaActive
        ? `불협화음 버티기 ${Math.max(0, boss.codaDuration - boss.codaElapsed).toFixed(1)}초 · 박자 오브젝트와 잔상 유지 조건이 비활성화되었습니다. K 기록 없이 회피하세요.`
        : active < boss.memoryPads.length
          ? `화음 앵커 ${active} / ${boss.memoryPads.length} · 두 기억의 나를 앵커에 남기세요. 앵커 하나는 불협화음 3회에 사라집니다.`
          : `되찾은 음 ${boss.resonanceProgress} / ${boss.resonanceGates.length} · ${resonanceBeat(boss).open ? '지금은 별빛 박자입니다. L을 짧게 한 번 누르세요.' : '별빛 고리가 밝아질 때까지 다음 음 앞에서 기다리세요.'}`;
    } else if (boss.mode === 'chase') {
      const total = Math.max(1, boss.windGates.length);
      const target = windRelayTargetPad(boss);
      const left = Math.max(0, (boss.relayDeadline || 0) - game.elapsed);
      memoryStatus.textContent = boss.windVanePhase
        ? `2페이즈 · 반사 ${boss.vaneReflectedHits} / ${boss.maxHp} · 사이드 연 ${haneulVaneAttackProfile(boss).sideCount}개 · 명중 후 남은 탄막은 유지됩니다.`
        : boss.activePads < boss.decoyPads.length
          ? `바람 기준점 ${boss.activePads} / ${boss.decoyPads.length} · 두 출발 깃발에 K 기록을 끝내세요. 잔상은 체력이 아니라 바람의 방향을 읽는 기준점입니다.`
          : boss.relayPhase === 'sprint'
            ? `순풍 고리 ${boss.relayProgress + 1} / ${total} · ${left.toFixed(1)}초 안에 Space 질주로 고리를 통과하세요. 놓쳐도 이전 릴레이는 유지됩니다.`
            : `되돌림 가로채기 ${boss.relayProgress} / ${total} · 검은 연에서 “${target?.label || '출발'}” 기준점으로 향하는 바람 사이를 Space 질주로 가르세요.`;
    } else if (boss.mode === 'mirror') {
      memoryStatus.textContent = active < boss.memoryPads.length
        ? '진짜 사진을 재생해야 가짜 웃음과 가짜 친구가 사라집니다. K로 과거의 나를 사진에 남기세요.'
        : `진짜 균열 ${boss.mirrorProgress} / ${boss.mirrorGates.length} · L로 진짜 균열을 드러낸 뒤 Space 질주로 통과하세요.`;
    } else if (boss.releaseReady) {
      memoryStatus.textContent = '딸의 선택이 아버지에게 닿았습니다. 이제는 공격하지 않아도 기억이 돌아옵니다.';
    } else if (boss.attackUnlocked) {
      const finalPhase = finalBossPhase(boss);
      if (finalPhase === 2) memoryStatus.textContent = `진짜 기억 ${boss.truthProgress} / ${boss.truthTargets.length} · 움직이는 “TRUE” 빛을 추적해 J 기억 탄환으로 맞히세요. COPY는 가짜 복제입니다.`;
      else if (finalPhase === 3) memoryStatus.textContent = `수호자 해체 ${boss.maxHp - boss.hp} / ${boss.maxHp} · 진짜 기억이 기계를 깨웠습니다. 남은 꿈 에너지도 J로 모두 되돌려 주세요.`;
      else if (finalPhase === 4) memoryStatus.textContent = `딸의 목소리 ${boss.voiceProgress.toFixed(1)} / ${boss.voiceDuration.toFixed(1)}초 · 공격을 멈추고 “딸의 목소리” 원 안에서 L을 유지하세요.`;
      else memoryStatus.textContent = `기억 반환 ${boss.maxHp - boss.hp} / ${boss.maxHp} · J로 빼앗긴 꿈 에너지를 돌려주세요. 네 발을 되돌리면 진짜 기억이 모습을 드러냅니다.`;
    } else {
      memoryStatus.textContent = active < boss.memoryPads.length
        ? `봉인 위치 ${active} / ${boss.memoryPads.length} · 기억의 나 둘과 현재의 나를 세 봉인에 맞추세요.`
        : `공명 해제 ${boss.finalCharge.toFixed(1)} / ${boss.finalChargeNeeded.toFixed(1)}초 · L을 유지해 꿈 에너지를 되돌리세요.`;
    }
  } else {
    const active = activeMemoryPads(game.memoryPads || []);
    const goal = game.echoGoal || 0;
    const roleState = puzzleRoleState();
    memoryStatus.textContent = !goal
      ? 'K로 이동을 기록하면, 다음 스테이지에서 과거의 나와 협동할 수 있습니다.'
      : active < goal
        ? `기억 발판 ${active} / ${goal} · K를 눌러 과거의 나를 남기세요.${roleState.rule ? ` ${roleState.rule.prompt}` : ''}`
        : roleState.rule && !roleState.ready
          ? `${roleState.rule.title} ${roleState.matched} / ${roleState.total} · I로 잘못된 기억을 지우고, 발판 위에서 방향을 바꿔 다시 기록하세요.`
          : roleState.rule
            ? roleState.rule.readyText
            : `기억 발판 ${active} / ${goal} · 기억의 나가 길을 지키고 있습니다.`;
  }
}

function drawCoverImage(image, offsetY = 0) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = W / H;
  let cropX = 0;
  let cropY = 0;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
    cropX = (sourceWidth - cropWidth) / 2;
  } else {
    cropHeight = sourceWidth / targetRatio;
    cropY = (sourceHeight - cropHeight) / 2;
  }
  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, offsetY, W, H);
}

function drawHarinStage02Background(image) {
  // 원본 도로의 상단 픽셀을 게임 바닥선에 맞추되 배경의 종횡비는 유지한다.
  const scale = HARIN_STAGE_02_ROAD_ALIGNMENT.targetY / HARIN_STAGE_02_ROAD_ALIGNMENT.sourceY;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (W - drawWidth) / 2, 0, drawWidth, drawHeight);
}

function drawHarinPixelBackground(stageIndex, boss) {
  const image = harinBackgrounds[Math.max(0, Math.min(5, stageIndex))];
  if (!image?.complete || image.naturalWidth === 0) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#07132f';
  ctx.fillRect(0, 0, W, H);
  if (stageIndex === 1) drawHarinStage02Background(image);
  else drawCoverImage(image, HARIN_BACKGROUND_Y_OFFSETS[stageIndex] || 0);
  ctx.fillStyle = `rgba(5, 11, 31, ${boss ? .18 : stageIndex === 5 ? .07 : .11})`;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(4, 9, 27, .1)';
  ctx.fillRect(0, Math.round(H * .58), W, Math.round(H * .42));
  ctx.restore();
  return true;
}

function drawYunaPixelBackground(stageIndex, boss) {
  const yunaStageIndex = stageIndex - 6;
  const image = yunaBackgrounds[yunaStageIndex];
  if (!image?.complete || image.naturalWidth === 0) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#061a2d';
  ctx.fillRect(0, 0, W, H);
  drawCoverImage(image);
  const shade = boss ? .12 : yunaStageIndex === 5 ? .02 : .06;
  ctx.fillStyle = `rgba(3, 13, 31, ${shade})`;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(2, 10, 25, .08)';
  ctx.fillRect(0, Math.round(H * .62), W, Math.round(H * .38));
  ctx.restore();
  return true;
}

function drawHaneulPixelBackground(stageIndex, boss) {
  const haneulStageIndex = stageIndex - 12;
  const image = haneulBackgrounds[haneulStageIndex];
  if (!image?.complete || image.naturalWidth === 0) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#071a3b';
  ctx.fillRect(0, 0, W, H);
  drawCoverImage(image);
  const shade = boss ? .14 : haneulStageIndex === 5 ? .04 : .08;
  ctx.fillStyle = `rgba(3, 12, 35, ${shade})`;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(2, 9, 28, .07)';
  ctx.fillRect(0, Math.round(H * .62), W, Math.round(H * .38));
  ctx.restore();
  return true;
}

function drawDaughterPixelBackground(stageIndex, boss) {
  const daughterStageIndex = stageIndex - 18;
  const image = daughterBackgrounds[daughterStageIndex];
  if (!image?.complete || image.naturalWidth === 0) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#251b43';
  ctx.fillRect(0, 0, W, H);
  drawCoverImage(image);
  // 21스테이지는 K 기억 발판이 보랏빛 배경에 묻히지 않도록 한 단계 더 어둡게 둔다.
  const shade = boss ? .1 : daughterStageIndex === 2 ? .12 : daughterStageIndex === 1 ? .06 : .04;
  ctx.fillStyle = `rgba(21, 14, 47, ${shade})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return true;
}

function drawScientistPixelBackground(boss) {
  if (!scientistBackground?.complete || scientistBackground.naturalWidth === 0) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0a142c';
  ctx.fillRect(0, 0, W, H);
  drawCoverImage(scientistBackground);
  ctx.fillStyle = `rgba(4, 9, 26, ${boss ? .1 : .04})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return true;
}

function getHarinStage02GateSprite(gateOpen) {
  const state = gateOpen ? 'open' : 'blocked';
  const image = harinStage02GateSprites[state];
  if (!image?.complete || image.naturalWidth === 0) return null;
  return {
    image,
    state,
    anchor: HARIN_STAGE_02_GATE_DRAW[state],
  };
}

function drawHarinStage02GateLayer(gateSprite, structure, layer) {
  if (!gateSprite || !structure) return;
  const { image, anchor } = gateSprite;
  const scaleX = gateSprite.scaleX || HARIN_STAGE_02_GATE_DRAW.scale;
  const scaleY = gateSprite.scaleY || HARIN_STAGE_02_GATE_DRAW.scale;
  const entranceCenterX = (structure.visualX ?? structure.x) + structure.w / 2;
  // 이미지 전체 중심 대신 성문 입구 중심을 실제 차단 구조물 중심에 고정한다.
  const drawX = entranceCenterX - anchor.entranceCenterSourceX * scaleX;
  const drawY = structure.y + structure.h + HARIN_STAGE_02_GATE_DRAW.roadOverlap - anchor.groundSourceY * scaleY;
  const sourceRight = Math.max(0, Math.min(image.naturalWidth, anchor.sourceRight || image.naturalWidth));
  const splitSourceX = Math.max(0, Math.min(sourceRight, anchor.splitSourceX));
  const sourceX = layer === 'far' ? 0 : splitSourceX;
  const sourceWidth = layer === 'far' ? splitSourceX : sourceRight - splitSourceX;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    sourceX, 0, sourceWidth, image.naturalHeight,
    drawX + sourceX * scaleX, drawY, sourceWidth * scaleX, image.naturalHeight * scaleY,
  );
  ctx.restore();
}

function restorationPieceNoise(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

// 완성 성문 원화에서 실제 석재 경계와 건축 요소를 따라 직접 잡은 조각들이다.
// 균일한 격자를 쓰지 않아, 기초석·문기둥·차양·오른쪽 벽·상단 탑이 각각 한 덩어리로 읽힌다.
const HARIN_STAGE_02_MASONRY_PIECES = Object.freeze([
  // 기초석과 바닥의 큰 돌
  { x: 433, y: 968, w: 75, h: 104, order: 0 }, { x: 508, y: 970, w: 61, h: 102, order: 0 },
  { x: 570, y: 970, w: 78, h: 102, order: 0 }, { x: 648, y: 968, w: 79, h: 104, order: 0 },
  { x: 727, y: 956, w: 82, h: 116, order: 0 }, { x: 809, y: 956, w: 85, h: 116, order: 0 },
  { x: 894, y: 952, w: 83, h: 120, order: 0 },
  // 아치를 받치는 양쪽 기둥
  { x: 433, y: 838, w: 77, h: 130, order: 1 }, { x: 434, y: 683, w: 77, h: 155, order: 1 },
  { x: 438, y: 529, w: 75, h: 154, order: 1 }, { x: 440, y: 461, w: 75, h: 68, order: 1 },
  { x: 509, y: 838, w: 67, h: 132, order: 1 }, { x: 512, y: 680, w: 65, h: 158, order: 1 },
  { x: 513, y: 528, w: 65, h: 152, order: 1 }, { x: 513, y: 462, w: 70, h: 66, order: 1 },
  // 아치와 오른쪽 벽을 묶는 중앙 세로 기둥. 이전 목록에서 빠져 복원 중 빈틈으로 보이던 부분이다.
  { x: 578, y: 838, w: 125, h: 132, order: 1 }, { x: 578, y: 676, w: 125, h: 162, order: 2 },
  { x: 578, y: 519, w: 125, h: 157, order: 3 }, { x: 578, y: 377, w: 125, h: 142, order: 4 },
  { x: 599, y: 300, w: 104, h: 77, order: 5 },
  // 오른쪽 벽의 큰 석재: 아래에서 위로 쌓인다.
  { x: 703, y: 789, w: 132, h: 165, order: 2 }, { x: 835, y: 789, w: 142, h: 165, order: 2 },
  { x: 703, y: 613, w: 133, h: 176, order: 3 }, { x: 836, y: 613, w: 141, h: 176, order: 3 },
  { x: 701, y: 461, w: 139, h: 152, order: 4 }, { x: 840, y: 461, w: 137, h: 152, order: 4 },
  { x: 700, y: 312, w: 135, h: 149, order: 5 }, { x: 835, y: 312, w: 142, h: 149, order: 5 },
  // 차양·달 장식·상단의 탑돌은 벽이 선 뒤에 제자리로 돌아온다.
  { x: 438, y: 378, w: 162, h: 84, order: 4 }, { x: 438, y: 309, w: 258, h: 69, order: 5 },
  { x: 448, y: 170, w: 87, h: 139, order: 6 },
  // 중앙 꼭대기 바로 아래의 연결 석재. 빠져 있으면 마지막 전체 프레임에서만 빈칸이 메워진다.
  { x: 533, y: 190, w: 92, h: 110, order: 5 }, { x: 533, y: 48, w: 92, h: 142, order: 7 },
  { x: 624, y: 124, w: 77, h: 179, order: 6 }, { x: 599, y: 249, w: 102, h: 62, order: 6 },
  { x: 699, y: 165, w: 136, h: 147, order: 6 }, { x: 835, y: 185, w: 142, h: 127, order: 6 },
]);

function drawHarinStage02RestorationPieces(gateSprite, structure, layer, progress) {
  if (!gateSprite || !structure) return;
  const { image, anchor } = gateSprite;
  const scaleX = gateSprite.scaleX || HARIN_STAGE_02_GATE_DRAW.scale;
  const scaleY = gateSprite.scaleY || HARIN_STAGE_02_GATE_DRAW.scale;
  const entranceCenterX = (structure.visualX ?? structure.x) + structure.w / 2;
  const drawX = entranceCenterX - anchor.entranceCenterSourceX * scaleX;
  const drawY = structure.y + structure.h + HARIN_STAGE_02_GATE_DRAW.roadOverlap - anchor.groundSourceY * scaleY;
  const split = anchor.splitSourceX;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  HARIN_STAGE_02_MASONRY_PIECES.forEach((piece, index) => {
    const centerX = piece.x + piece.w / 2;
    const pieceLayer = centerX < split ? 'far' : 'near';
    if (pieceLayer !== layer) return;
    const randomA = restorationPieceNoise(index + 3);
    const randomB = restorationPieceNoise(index + 29);
    // 같은 층의 벽돌도 아주 조금씩 시간차를 두되, 건축 순서 자체는 유지한다.
    const arrival = .035 + piece.order * .105 + randomA * .028;
    const local = Math.max(0, Math.min(1, (progress - arrival) / .205));
    if (local <= 0) return;
    const eased = 1 - Math.pow(1 - local, 3);
    const targetX = drawX + centerX * scaleX;
    const targetY = drawY + (piece.y + piece.h / 2) * scaleY;
    // 각 석재가 무너진 오른쪽 잔해나 바닥에서 떠올라, 원래의 줄과 맞물려 들어간다.
    const originX = targetX + (randomA - .5) * 106 + (centerX > 700 ? 54 : -18);
    const originY = targetY + 62 + randomB * 92 + Math.max(0, 760 - piece.y) * .08;
    const currentX = originX + (targetX - originX) * eased;
    const currentY = originY + (targetY - originY) * eased - Math.sin(eased * Math.PI) * (13 + randomA * 17);
    const width = piece.w * scaleX;
    const height = piece.h * scaleY;
    ctx.save();
    ctx.globalAlpha = Math.min(1, local * 3.6);
    ctx.translate(currentX, currentY);
    ctx.rotate((randomB - .5) * .34 * (1 - eased));
    ctx.drawImage(image, piece.x, piece.y, piece.w, piece.h, -width / 2, -height / 2, width, height);
    ctx.restore();
  });
  ctx.restore();
}

function drawBackground(boss = false, bossLabel = '') {
  const theme = dreamTheme();
  const bitmapDrawn = (theme.id === 'harin' && drawHarinPixelBackground(game.stageIndex, boss))
    || (theme.id === 'yuna' && drawYunaPixelBackground(game.stageIndex, boss))
    || (theme.id === 'haneul' && drawHaneulPixelBackground(game.stageIndex, boss))
    || (theme.id === 'daughter' && drawDaughterPixelBackground(game.stageIndex, boss))
    || (theme.id === 'scientist' && drawScientistPixelBackground(boss));
  if (!bitmapDrawn) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, theme.top);
    g.addColorStop(.53, theme.mid);
    g.addColorStop(1, theme.bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = boss ? .18 : .28; ctx.strokeStyle = theme.line; ctx.lineWidth = 1;
    for (let x = -80; x < W + 100; x += 48) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 260, 0); ctx.stroke(); }
    for (let y = 40; y < H; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
    drawThemeAtmosphere(theme, boss);
    ctx.save(); ctx.fillStyle = 'rgba(226, 239, 255, .72)';
    for (let i = 0; i < 32; i += 1) { const x = (i * 137 + 37) % W; const y = 22 + ((i * 71) % 250); ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1); }
    ctx.restore();
  }
  // 배경 원화에 별도의 영문 스테이지 라벨을 덮지 않는다.
  // 스테이지 이름과 목표는 HUD에만 두어, 그림의 첫 인상이 먼저 읽히게 한다.
}


function drawThemeAtmosphere(theme, boss) {
  const t = game.elapsed || 0;
  ctx.save();
  if (theme.id === 'harin') {
    // 하린의 첫 여섯 스테이지는 생성된 픽셀 배경 이미지를 사용한다.
  } else if (theme.id === 'yuna') {
    // 유나의 여섯 스테이지는 생성된 악보 픽셀 배경 이미지를 사용한다.
  } else if (theme.id === 'haneul') {
    // 하늘의 여섯 스테이지는 생성된 바람길 픽셀 배경 이미지를 사용한다.
  } else if (theme.id === 'daughter') {
    ctx.globalAlpha = .2; ctx.fillStyle = '#8cffb1'; ctx.fillRect(0, 442, W, 58);
    ctx.globalAlpha = .63;
    for (let i = 0; i < 15; i += 1) {
      const x = 38 + i * 65;
      const y = 432 - (i % 3) * 18;
      ctx.fillStyle = i % 2 ? theme.accent : theme.soft;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.arc(x + 7, y + 3, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8effbb'; ctx.fillRect(x + 3, y + 7, 2, 17);
    }
    ctx.globalAlpha = .2; ctx.fillStyle = '#fff4ff';
    for (let i = 0; i < 7; i += 1) ctx.fillRect(70 + i * 126, 84 + ((i * 59) % 250), 72, 3);
  } else if (theme.id === 'scientist') {
    ctx.globalAlpha = .26; ctx.strokeStyle = theme.accent; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const x = 48 + i * 134;
      const y = 110 + (i % 2) * 178;
      ctx.strokeRect(x, y, 74, 52);
      ctx.beginPath(); ctx.arc(x + 37, y + 26, 11 + Math.sin(t * 2 + i) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 74, y + 26); ctx.lineTo(x + 112, y + 26); ctx.lineTo(x + 112, y + 82); ctx.stroke();
    }
    ctx.globalAlpha = .18; ctx.fillStyle = theme.soft;
    for (let i = 0; i < 8; i += 1) ctx.fillRect(54 + i * 107, 72 + ((i * 37) % 310), 3, 42);
  }
  if (boss) {
    ctx.globalAlpha = .12; ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.arc(W * .72, H * .5, 230 + Math.sin(t * 2) * 10, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawYunaScorePlatform(item) {
  const ground = item.h >= 28;
  const hidden = Boolean(item.hidden);
  const x = Math.round(item.x), y = Math.round(item.y), w = Math.round(item.w), h = Math.round(item.h);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (hidden) { ctx.shadowBlur = 18; ctx.shadowColor = '#8effdc'; }
  const casing = ctx.createLinearGradient(x, y, x, y + h);
  casing.addColorStop(0, hidden ? '#2a8f89' : '#263b50');
  casing.addColorStop(.28, hidden ? '#155d68' : '#142537');
  casing.addColorStop(1, '#071325');
  ctx.fillStyle = casing; ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;

  // 유나의 길은 악보가 아니라 실제 연주할 수 있는 피아노 건반이다.
  // 흰 건반은 안전한 박자, 검은 건반은 리듬을 읽기 위한 대비를 만든다.
  const inset = 2;
  const keyTop = y + 3;
  const keyHeight = Math.max(7, h - 7);
  const keyWidth = ground ? 24 : Math.max(14, Math.min(19, Math.floor((w - inset * 2) / 4)));
  const keyEnd = x + w - inset;
  const whiteKey = hidden ? '#c5fff1' : '#f6f0d8';
  const whiteKeyShadow = hidden ? '#78d9ca' : '#c9bea3';
  for (let keyX = x + inset; keyX < keyEnd; keyX += keyWidth) {
    const currentWidth = Math.min(keyWidth - 1, keyEnd - keyX);
    if (currentWidth <= 0) continue;
    const keySurface = ctx.createLinearGradient(keyX, keyTop, keyX, keyTop + keyHeight);
    keySurface.addColorStop(0, hidden ? '#effff8' : '#fffdf0');
    keySurface.addColorStop(.72, whiteKey);
    keySurface.addColorStop(1, whiteKeyShadow);
    ctx.fillStyle = keySurface; ctx.fillRect(keyX, keyTop, currentWidth, keyHeight);
    ctx.fillStyle = 'rgba(7, 22, 39, .56)'; ctx.fillRect(keyX + currentWidth, keyTop, 1, keyHeight);
  }

  // 한 옥타브의 검은 건반 배열(C#, D#, F#, G#, A#)을 반복한다.
  const blackKeyPositions = new Set([0, 1, 3, 4, 5]);
  const blackWidth = Math.max(4, Math.round(keyWidth * .5));
  const blackHeight = Math.max(5, Math.round(keyHeight * .56));
  let pianoKey = 0;
  for (let keyX = x + inset; keyX + keyWidth < keyEnd; keyX += keyWidth) {
    if (blackKeyPositions.has(pianoKey % 7)) {
      const blackX = Math.round(keyX + keyWidth - blackWidth / 2);
      const blackSurface = ctx.createLinearGradient(blackX, keyTop, blackX, keyTop + blackHeight);
      blackSurface.addColorStop(0, hidden ? '#143e57' : '#162235');
      blackSurface.addColorStop(1, hidden ? '#061c33' : '#050d1a');
      ctx.fillStyle = blackSurface; ctx.fillRect(blackX, keyTop, blackWidth, blackHeight);
      ctx.fillStyle = hidden ? 'rgba(157, 255, 234, .45)' : 'rgba(255, 236, 177, .3)';
      ctx.fillRect(blackX + 1, keyTop + 1, Math.max(1, blackWidth - 2), 1);
    }
    pianoKey += 1;
  }

  ctx.fillStyle = hidden ? '#a8ffe8' : '#e2c884'; ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = 'rgba(3, 14, 30, .78)'; ctx.fillRect(x + 2, y + h - 3, Math.max(0, w - 4), 2);
  ctx.strokeStyle = hidden ? 'rgba(158, 255, 229, .92)' : 'rgba(247, 225, 170, .74)';
  ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  ctx.restore();
}

function drawHarinLaughCollector(item) {
  const { x, y, w, h } = item;
  const image = objectSprites.harinLaughCollector;
  const relayReady = activeMemoryPads(game.memoryPads || []) >= game.echoGoal;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = relayReady ? .24 : 1;
  ctx.shadowBlur = relayReady ? 10 : 30;
  ctx.shadowColor = relayReady ? '#9effea' : '#ffb85c';
  if (image?.complete && image.naturalWidth > 0) {
    // 충돌 폭은 좁게 두되, 화면상 수집탑은 한눈에 알아볼 수 있게 그린다.
    const visualH = h + 24;
    const visualW = visualH * image.naturalWidth / image.naturalHeight;
    ctx.drawImage(image, x + w / 2 - visualW / 2, y - 12, visualW, visualH);
  } else {
    ctx.fillStyle = '#202956'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#6b70bf'; ctx.fillRect(x + 8, y, 4, h);
  }
  ctx.shadowBlur = 0;
  drawInteractionBeacon({
    x: x + w / 2,
    y: Math.max(18, y - 14),
    color: relayReady ? '#baffeb' : '#fff0b1',
    symbol: relayReady ? '✓' : '✦',
    detail: relayReady ? '웃음이 돌아왔어요' : '세 기억의 빛을 모으세요',
    active: relayReady,
    near: playerNearObject(item, 112),
  });
  ctx.restore();
}

function drawHarinStage02Restoration(structure, layer) {
  const progress = Math.max(0, Math.min(1, game.stage02Restoration || 0));
  const blocked = getHarinStage02GateSprite(false);
  const restored = getHarinStage02GateSprite(true);
  if (!blocked || !restored || progress <= .001) {
    if (blocked) drawHarinStage02GateLayer(blocked, structure, layer);
    return;
  }
  if (progress >= HARIN_STAGE_02_RESTORATION_COMPLETE) {
    drawHarinStage02GateLayer(restored, structure, layer);
    return;
  }
  const magicFrame = (image, anchor) => (image?.complete && image.naturalWidth > 0
    ? { image, anchor, scaleX: anchor.scaleX, scaleY: anchor.scaleY }
    : null);
  const awakeningFrame = magicFrame(harinStage02MagicFrames.awakening, HARIN_STAGE_02_MAGIC_FRAME_DRAW.awakening);
  const restoringFrame = magicFrame(harinStage02MagicFrames.restoring, HARIN_STAGE_02_MAGIC_FRAME_DRAW.restoring);
  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  // 일러스트 프레임은 건물 자체를 바꾸지 않고, 블록들을 부르는 기억 마법의 잔상으로 보인다.
  const awakeningAlpha = .64 * Math.min(clamp01(progress / .13), clamp01((.60 - progress) / .18));
  const restoringAlpha = .72 * Math.min(clamp01((progress - .27) / .16), clamp01((.94 - progress) / .20));
  // 완성 이미지를 조각 단위로 잘라 흩어진 잔해에서 끌어온다. 겹치는 정지 화면이 아니라,
  // 아래 기초석 → 벽돌 → 창과 등불 순으로 실제 성문이 조립되는 복원 장면이다.
  ctx.save(); ctx.globalAlpha = 1 - Math.min(1, progress / .38) * .93; drawHarinStage02GateLayer(blocked, structure, layer); ctx.restore();
  if (awakeningFrame && awakeningAlpha > .001) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = awakeningAlpha; drawHarinStage02GateLayer(awakeningFrame, structure, layer); ctx.restore();
  }
  if (restoringFrame && restoringAlpha > .001) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = restoringAlpha; drawHarinStage02GateLayer(restoringFrame, structure, layer); ctx.restore();
  }
  drawHarinStage02RestorationPieces(restored, structure, layer, progress);

  // 발사체처럼 보이는 구슬 대신, 기억의 빛결이 바닥을 따라 성문으로 스며든다.
  // near 레이어에서만 한 번 그려 플레이어 위로 겹친 이펙트도 피한다.
  if (layer !== 'near') return;
  const memoryPad = game.memoryPads?.[0];
  const startX = memoryPad ? memoryPad.x + memoryPad.w / 2 : 180;
  const startY = memoryPad ? memoryPad.y + memoryPad.h * .34 : 460;
  const endX = (structure.visualX ?? structure.x) + structure.w / 2;
  const endY = structure.y + structure.h + 2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const weave = Math.max(0, Math.min(1, progress / .78));
  const strands = [
    { color: '#a9f7ff', offset: -8, width: 1.6 },
    { color: '#fff1a4', offset: 7, width: 1.05 },
  ];
  strands.forEach((strand, index) => {
    ctx.globalAlpha = (.14 + weave * .26) * (index === 0 ? 1 : .82);
    ctx.strokeStyle = strand.color;
    ctx.lineWidth = strand.width;
    ctx.setLineDash([4, 14]);
    ctx.lineDashOffset = -(game.elapsed * 34 + index * 11);
    ctx.beginPath();
    ctx.moveTo(startX, startY + strand.offset);
    ctx.bezierCurveTo(
      startX + (endX - startX) * .30, startY + strand.offset - 11,
      startX + (endX - startX) * .72, endY + strand.offset + 10,
      endX, endY,
    );
    ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.globalAlpha = .12 + weave * .16;
  ctx.strokeStyle = '#c8fbff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(endX, endY - 6, 20 + weave * 10, 5 + weave * 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHarinCarouselWall(item) {
  const { x, y, w, h } = item;
  const image = objectSprites.harinCarouselWall;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = 30; ctx.shadowColor = '#ffca6d';
  if (image?.complete && image.naturalWidth > 0) {
    const visualH = h + 30;
    const visualW = visualH * image.naturalWidth / image.naturalHeight;
    ctx.drawImage(image, x + w / 2 - visualW / 2, y - 15, visualW, visualH);
  } else {
    const fallback = ctx.createLinearGradient(x, y, x + w, y);
    fallback.addColorStop(0, '#171a48'); fallback.addColorStop(.5, '#4b3f7c'); fallback.addColorStop(1, '#171a48');
    ctx.fillStyle = fallback; ctx.fillRect(x, y, w, h);
  }
  ctx.shadowBlur = 0;
  // 원화에 이미 난간과 조명이 들어 있으므로, 별도의 사각 테두리나 설명문을 덧씌우지 않는다.
  ctx.restore();
}

function drawHaneulHeadwindPillar(item) {
  const { x, y, w, h } = item;
  const image = objectSprites.haneulHeadwindPillar;
  const rubble = objectSprites.haneulHeadwindRubble;
  const collapse = item.collapseWithMemory ? Math.max(0, Math.min(1, game.windPillarCollapse || 0)) : 0;
  const fracture = Math.max(0, Math.min(1, collapse / .16));
  const fall = Math.max(0, Math.min(1, (collapse - .16) / .84));
  const fallEase = fall * fall * (3 - 2 * fall);
  const visualH = Math.max(360, h + 220);
  const visualW = image?.naturalWidth && image?.naturalHeight ? visualH * image.naturalWidth / image.naturalHeight : w * 4.4;
  const centerX = x + w / 2;
  const floorY = y + h;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // 사각 단면이 보이지 않도록, 원본 석탑을 불규칙한 균열선으로 잘라 각각 다른 중력·회전으로 떨어뜨린다.
  const drawShard = (top, bottom, offsetX, offsetY, rotation, alpha = 1, seed = 0) => {
    if (!image?.complete || !image.naturalWidth) return;
    const sourceY = Math.round(image.naturalHeight * top);
    const sourceH = Math.max(1, Math.round(image.naturalHeight * (bottom - top)));
    const destinationH = visualH * (bottom - top);
    const halfW = visualW / 2;
    const halfH = destinationH / 2;
    const notch = 11 + (seed % 3) * 7;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(centerX + offsetX, floorY - visualH + visualH * top + destinationH / 2 + offsetY);
    ctx.rotate(rotation);
    // 위·아래가 한 줄로 잘린 단면이 아니라, 금이 번진 조각처럼 톱니 형태로 클리핑한다.
    ctx.beginPath();
    ctx.moveTo(-halfW, -halfH + notch);
    ctx.lineTo(-halfW * .56, -halfH);
    ctx.lineTo(-halfW * .14, -halfH + notch * .42);
    ctx.lineTo(halfW * .28, -halfH);
    ctx.lineTo(halfW, -halfH + notch * .8);
    ctx.lineTo(halfW, halfH - notch * .55);
    ctx.lineTo(halfW * .42, halfH);
    ctx.lineTo(halfW * .06, halfH - notch * .6);
    ctx.lineTo(-halfW * .33, halfH);
    ctx.lineTo(-halfW, halfH - notch);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, 0, sourceY, image.naturalWidth, sourceH, -visualW / 2, -destinationH / 2, visualW, destinationH);
    ctx.restore();
  };
  if (!image?.complete || !image.naturalWidth) {
    ctx.fillStyle = '#16365d'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#76efff'; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.restore();
    return;
  }
  const shake = fracture > 0 && fall < .08 ? Math.sin(game.elapsed * 84) * fracture * 7 : 0;
  ctx.shadowBlur = 28 * (1 - fallEase * .65); ctx.shadowColor = '#68e9ff';
  if (fall < .03) {
    // 처음에는 탑 전체가 흔들리고 균열만 퍼진다. 크기는 절대 줄이지 않는다.
    drawShard(0, 1, shake, 0, 0, 1, 0);
    if (fracture > 0) {
      ctx.save();
      ctx.globalAlpha = fracture * .9;
      ctx.strokeStyle = '#c7fbff'; ctx.shadowBlur = 14; ctx.shadowColor = '#56eaff'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 16, floorY - visualH * .22); ctx.lineTo(centerX + 8, floorY - visualH * .38); ctx.lineTo(centerX - 11, floorY - visualH * .54); ctx.lineTo(centerX + 13, floorY - visualH * .71); ctx.stroke();
      ctx.restore();
    }
  } else if (fall < .92) {
    // 네 균열 조각이 시간차로 무너지며 서로 다른 방향으로 기울어진다. 겹치는 범위가 절단선을 숨긴다.
    drawShard(0, .26, -fallEase * 156, fallEase * fallEase * 304, -fallEase * 1.34, 1 - Math.max(0, fall - .60) * 2.5, 1);
    drawShard(.18, .50, fallEase * 112, fallEase * fallEase * 212, fallEase * .91, 1 - Math.max(0, fall - .67) * 3.05, 2);
    drawShard(.42, .75, -fallEase * 82, fallEase * fallEase * 144, -fallEase * .68, 1 - Math.max(0, fall - .76) * 4.0, 3);
    drawShard(.66, 1, fallEase * 26, fallEase * 58, fallEase * .19, 1 - Math.max(0, fall - .84) * 5.7, 4);
  }
  if (fall > .12) {
    // 바닥 충돌 시 생기는 돌가루·마력 먼지. 잔해가 도착하기 전 빈 공간을 자연스럽게 메운다.
    const dustLife = Math.max(0, 1 - Math.max(0, fall - .76) / .24);
    for (let index = 0; index < 12; index += 1) {
      const spread = ((index * 47) % 254) - 127;
      const rise = (1 - fall) * 16 + (index % 3) * 5;
      ctx.save();
      ctx.globalAlpha = Math.min(.34, (fall - .12) * 1.2) * dustLife;
      ctx.fillStyle = index % 3 ? '#88dff6' : '#dffcff';
      ctx.beginPath();
      ctx.ellipse(centerX + spread * fallEase, floorY - 7 - rise, 12 + index % 4 * 5, 3 + index % 3 * 2, (index % 2 ? -.15 : .15), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  // 떨어지는 석편도 원본 기둥의 조각을 잘라 사용해 장난감 같은 사각 파티클이 되지 않게 한다.
  if (fall > .02 && fall < .98) {
    const fragments = [
      [.08, .12, -116, 128, -1.4], [.34, .39, 126, 94, .96], [.53, .58, -86, 176, -1.06],
      [.72, .77, 105, 144, 1.2], [.18, .23, 58, 230, .72], [.82, .87, -142, 96, -.78],
    ];
    fragments.forEach(([top, bottom, driftX, dropY, spin], index) => {
      const local = Math.max(0, Math.min(1, (fall - index * .055) / .58));
      if (local <= 0) return;
      const sourceY = image.naturalHeight * top;
      const sourceH = Math.max(1, image.naturalHeight * (bottom - top));
      const pieceH = visualH * (bottom - top) * .72;
      ctx.save();
      ctx.globalAlpha = (1 - local * .24) * .98;
      ctx.translate(centerX + driftX * local, floorY - visualH + visualH * top + dropY * local * local);
      ctx.rotate(spin * local);
      ctx.drawImage(image, 0, sourceY, image.naturalWidth, sourceH, -visualW * .31, -pieceH / 2, visualW * .62, pieceH);
      ctx.restore();
    });
  }
  // 마지막에는 전용 잔해 일러스트가 바닥에 남아, 탑이 단순히 사라진 느낌을 없앤다.
  if (fall > .38 && rubble?.complete && rubble.naturalWidth > 0) {
    const rubbleAlpha = Math.min(1, (fall - .38) / .34);
    const rubbleH = 168;
    const rubbleW = rubbleH * rubble.naturalWidth / rubble.naturalHeight;
    ctx.save();
    ctx.globalAlpha = rubbleAlpha;
    ctx.shadowBlur = 22; ctx.shadowColor = '#5deeff';
    ctx.drawImage(rubble, centerX - rubbleW / 2, floorY - rubbleH + 10, rubbleW, rubbleH);
    ctx.restore();
  }
  ctx.restore();
}

function drawHaneulWindPlatform(item) {
  const image = platformSprites.haneulWindLedge;
  const x = Math.round(item.x);
  const y = Math.round(item.y);
  const w = Math.round(item.w);
  const h = Math.round(item.h);
  const visualHeight = Math.max(28, Math.min(68, h + 25));
  const sourceX = 214;
  const sourceY = 104;
  const sourceW = 1744;
  const sourceH = 526;
  const tileWidth = Math.max(72, Math.min(176, w));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = item.hidden ? 22 : 14;
  ctx.shadowColor = '#55dfff';
  ctx.fillStyle = '#142e5a';
  ctx.fillRect(x, y, w, Math.max(h, 14));
  if (image?.complete && image.naturalWidth > 0) {
    for (let offset = 0; offset < w; offset += tileWidth) {
      const width = Math.min(tileWidth, w - offset);
      ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x + offset, y - 5, width, visualHeight);
    }
  } else {
    ctx.fillStyle = '#245071';
    ctx.fillRect(x, y, w, Math.max(h, 16));
  }
  ctx.shadowBlur = 10;
  ctx.fillStyle = item.hidden ? '#a4fff0' : '#9eeeff';
  ctx.fillRect(x + 2, y, Math.max(0, w - 4), 2);
  ctx.fillStyle = 'rgba(228, 250, 255, .32)';
  for (let marker = x + 16; marker < x + w - 8; marker += 34) ctx.fillRect(marker, y + 6, 12, 1);
  ctx.restore();
  drawHaneulWindRouteMotif(item);
}

function drawHaneulWindRouteMotif(item) {
  // 16스테이지의 발판은 일반적인 계단이 아니라, 화살표가 만든 바람의 "흐름"을 읽게 한다.
  // 테두리나 텍스트 대신 작은 방향성 픽셀과 움직이는 빛으로 다음 동선을 자연스럽게 안내한다.
  if (!item.windRoute) return;
  const active = signpostPathRevealed(item);
  const t = game.elapsed || 0;
  const x = item.x;
  const y = item.y;
  const w = item.w;
  const centerY = y + Math.max(5, Math.min(10, item.h * .48));
  const soft = active ? '#71eaff' : '#3c6f96';
  const bright = active ? '#e8fff8' : '#7194af';
  const pulse = active ? .58 + Math.sin(t * 4.5) * .18 : .22;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = pulse;
  ctx.shadowBlur = active ? 10 : 0;
  ctx.shadowColor = soft;
  ctx.strokeStyle = soft;
  ctx.fillStyle = bright;
  ctx.lineWidth = 1.35;
  const chevron = (cx, cy, rotation = 0, size = 5) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(-size, -size * .7);
    ctx.lineTo(size * .35, 0);
    ctx.lineTo(-size, size * .7);
    ctx.stroke();
    ctx.restore();
  };
  if (item.windRoute === 'arrow-pier') {
    // 첫 화살표의 발밑에는 위쪽 승강기를 암시하는 세 갈래 기류가 흐른다.
    for (let lane = 0; lane < 3; lane += 1) {
      const cx = x + 36 + lane * 25;
      const lift = (t * .75 + lane * .22) % 1;
      chevron(cx, centerY + 2 - lift * 6, -Math.PI / 2, 4);
    }
  } else if (item.windRoute === 'sky-deck') {
    // 두 번째 화살표가 있는 넓은 선반은 작은 나침반 별로 "여기서 방향을 꺾는다"는 점을 읽힌다.
    for (let cx = x + 26; cx < x + w - 12; cx += 38) {
      const beat = .72 + Math.sin(t * 3.4 + cx) * .14;
      ctx.globalAlpha = pulse * beat;
      ctx.beginPath();
      ctx.moveTo(cx, centerY - 5); ctx.lineTo(cx + 5, centerY);
      ctx.lineTo(cx, centerY + 5); ctx.lineTo(cx - 5, centerY); ctx.closePath();
      ctx.fill();
    }
  } else if (item.windRoute === 'weave-a' || item.windRoute === 'weave-b' || item.windRoute === 'weave-c') {
    // S자 다리의 각 조각에 서로 다른 기울기의 깃털 화살을 놓아, 곡선의 흐름이 발판에서도 이어진다.
    const rotations = { 'weave-a': .55, 'weave-b': -.62, 'weave-c': .32 };
    const rotation = rotations[item.windRoute] || 0;
    const glide = ((t * 18) % 20);
    for (let cx = x + 12 + glide; cx < x + w - 4; cx += 22) chevron(cx, centerY, rotation, 4.8);
  } else if (item.windRoute === 'launch') {
    // 마지막 런웨이는 오른쪽으로 연속 가속되는 제트 문양으로, 점프+질주 타이밍을 직관적으로 만든다.
    const glide = (t * 26) % 18;
    for (let cx = x + 10 + glide; cx < x + w - 4; cx += 18) chevron(cx, centerY, 0, 5.2);
  }
  ctx.restore();
}

function carouselSpriteReady(image) {
  return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
}

function drawCarouselDeckSprite(x, y, w, h) {
  const image = carouselStructureSprites.deck;
  if (!carouselSpriteReady(image)) {
    ctx.fillStyle = '#211b39';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#9b7440';
    ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    return;
  }
  const sourceX = Math.round(image.naturalWidth * .008);
  const sourceY = Math.round(image.naturalHeight * .03);
  const sourceW = Math.round(image.naturalWidth * .984);
  const sourceH = Math.round(image.naturalHeight * .92);
  const sourceCap = Math.max(1, Math.round(sourceW * .07));
  const bodySourceX = sourceX + sourceCap;
  const bodySourceW = Math.max(1, Math.round(sourceW * .19));
  const capWidth = Math.max(5, Math.min(14, Math.floor(w / 3)));
  const bodyStart = x + capWidth;
  const bodyEnd = x + w - capWidth;
  ctx.drawImage(image, sourceX, sourceY, sourceCap, sourceH, x, y, capWidth, h);
  for (let tileX = bodyStart; tileX < bodyEnd; tileX += 36) {
    const tileWidth = Math.min(36, bodyEnd - tileX);
    const cropWidth = Math.max(1, Math.round(bodySourceW * tileWidth / 36));
    ctx.drawImage(image, bodySourceX, sourceY, cropWidth, sourceH, tileX, y, tileWidth, h);
  }
  ctx.drawImage(
    image,
    sourceX + sourceW - sourceCap,
    sourceY,
    sourceCap,
    sourceH,
    x + w - capWidth,
    y,
    capWidth,
    h,
  );
}

function drawCarouselPillarSprite(x, y, w, h) {
  const image = carouselStructureSprites.pillar;
  if (!carouselSpriteReady(image)) {
    ctx.fillStyle = '#211b39';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#9b7440';
    ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    return;
  }
  const sourceX = Math.round(image.naturalWidth * .137);
  const sourceY = Math.round(image.naturalHeight * .012);
  const sourceW = Math.round(image.naturalWidth * .722);
  const sourceH = Math.round(image.naturalHeight * .988);
  const sourceCap = Math.max(1, Math.round(sourceH * .12));
  const capHeight = Math.max(6, Math.min(14, Math.floor(h / 3)));
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceCap, x, y, w, capHeight);
  ctx.drawImage(
    image,
    sourceX,
    sourceY + sourceCap,
    sourceW,
    sourceH - sourceCap * 2,
    x,
    y + capHeight,
    w,
    Math.max(1, h - capHeight * 2),
  );
  ctx.drawImage(
    image,
    sourceX,
    sourceY + sourceH - sourceCap,
    sourceW,
    sourceCap,
    x,
    y + h - capHeight,
    w,
    capHeight,
  );
}

function drawCarouselHorseMedallion(centerX, centerY, size = 24, alpha = 1) {
  const image = carouselStructureSprites.horseMedallion;
  if (!carouselSpriteReady(image)) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(image, Math.round(centerX - size / 2), Math.round(centerY - size / 2), size, size);
  ctx.restore();
}

function drawHarinTopdownCarouselPlatform(item) {
  const x = Math.round(item.x);
  const y = Math.round(item.y);
  const w = Math.round(item.w);
  const visualHeight = item.carouselSurface === 'ground' ? 40 : item.carouselSurface === 'anchor' ? 34 : 28;
  const top = y - 9;
  const accent = carouselStructureColor(item);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = item.carouselSurface === 'anchor' ? 6 : 3;
  ctx.shadowColor = accent;
  drawCarouselDeckSprite(x - 2, top - 1, w + 4, visualHeight + 2);
  ctx.shadowBlur = 0;
  if (item.carouselMemoryStart) {
    drawCarouselHorseMedallion(x + w / 2, top + visualHeight / 2, 26, .9);
  }
  ctx.restore();
}

function drawHarinCarouselPlatform(item) {
  if (game.layout === 'carousel') {
    drawHarinTopdownCarouselPlatform(item);
    return;
  }
  const image = platformSprites.harinCarouselPlatform;
  const x = Math.round(item.x);
  const y = Math.round(item.y);
  const w = Math.round(item.w);
  const h = Math.round(item.h);
  const floating = h < 28;
  const visualHeight = floating ? 48 : 88;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = item.hidden ? 22 : 13;
  ctx.shadowColor = item.hidden ? '#9effea' : '#ffcc6b';
  if (image?.complete && image.naturalWidth > 0) {
    // 원본의 투명 여백을 제외한 무대 부분만 사용해, 길이에 따라 자연스럽게 늘어난다.
    const sourceY = Math.round(image.naturalHeight * .19);
    const sourceH = Math.round(image.naturalHeight * .61);
    ctx.drawImage(image, 0, sourceY, image.naturalWidth, sourceH, x, y - 8, w, visualHeight);
  } else {
    const fallback = ctx.createLinearGradient(x, y, x, y + h);
    fallback.addColorStop(0, '#69578c'); fallback.addColorStop(1, '#211c48');
    ctx.fillStyle = fallback; ctx.fillRect(x, y, w, Math.max(h, 16));
  }
  ctx.shadowBlur = 0;
  // 원화에 이미 금빛 난간과 빛띠가 들어 있다. 별도의 직선 노란선을 겹치지 않는다.
  if (item.carouselRide) {
    // 회전목마 장식이 붙은 발판에는 구조물 이동과 무관한 전구 흐름만 겹친다.
    const pulse = .55 + Math.sin(game.elapsed * 5) * .3;
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = pulse;
    ctx.fillStyle = '#fff1aa';
    for (let lamp = x + 13; lamp < x + w - 8; lamp += 24) ctx.fillRect(lamp, y - 4, 4, 4);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  if (item.hidden) {
    ctx.strokeStyle = 'rgba(158, 255, 234, .84)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y - 1.5, w - 1, Math.max(12, h + 2));
  }
  ctx.restore();
}

function drawDaughterDreamPlatform(item) {
  const classroom = game.layout === 'classroom-fracture';
  const image = classroom ? platformSprites.daughterFracturedClassroom : platformSprites.daughterGarden;
  const x = Math.round(item.x);
  const y = Math.round(item.y);
  const w = Math.round(item.w);
  const h = Math.round(item.h);
  const visualHeight = h >= 28 ? Math.min(90, h + 45) : 56;
  const glow = classroom ? '#ff87ca' : '#8eefff';
  const edge = classroom ? '#ffb0dc' : '#b9ffe1';
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = item.hidden ? 24 : 16;
  ctx.shadowColor = glow;
  if (image?.complete && image.naturalWidth > 0) {
    // 양 끝 장식이 작은 발판마다 찌그러지지 않도록 중앙의 반복 가능한 ledge 부분만 이어 붙인다.
    const sourceX = Math.round(image.naturalWidth * .14);
    const sourceW = Math.round(image.naturalWidth * .72);
    const tileWidth = Math.max(74, Math.min(186, w));
    for (let offset = 0; offset < w; offset += tileWidth) {
      const width = Math.min(tileWidth, w - offset);
      ctx.drawImage(image, sourceX, 0, sourceW, image.naturalHeight, x + offset, y - 9, width, visualHeight);
    }
  } else {
    const fallback = ctx.createLinearGradient(x, y, x, y + Math.max(h, 18));
    fallback.addColorStop(0, classroom ? '#4b356a' : '#8b6c95');
    fallback.addColorStop(1, classroom ? '#171d4a' : '#292448');
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, w, Math.max(h, 18));
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = edge;
  ctx.globalAlpha = item.hidden ? .72 : .92;
  ctx.fillRect(x + 3, y, Math.max(0, w - 6), 2);
  if (classroom) {
    ctx.fillStyle = 'rgba(255, 172, 220, .45)';
    for (let marker = x + 16; marker < x + w - 6; marker += 33) ctx.fillRect(marker, y + 5, 14, 1);
  }
  ctx.restore();
}

function drawThemedDreamBarrier(item, persistent = false) {
  const theme = dreamTheme();
  const x = Math.round(item.x);
  const y = Math.round(item.y);
  const w = Math.max(1, Math.round(item.w));
  const h = Math.max(1, Math.round(item.h));
  const glow = theme.id === 'harin' ? '#ffd56f'
    : theme.id === 'yuna' ? '#9effd7'
      : theme.id === 'haneul' ? '#a6efff'
        : theme.id === 'daughter' ? '#ffb5df' : '#8ceeff';
  const base = theme.id === 'harin' ? '#2a1d52'
    : theme.id === 'yuna' ? '#153b4a'
      : theme.id === 'haneul' ? '#183a5c'
        : theme.id === 'daughter' ? '#49335e' : '#173353';
  const dark = theme.id === 'harin' ? '#151338'
    : theme.id === 'yuna' ? '#0a1d30'
      : theme.id === 'haneul' ? '#0c2441'
        : theme.id === 'daughter' ? '#251c43' : '#0c1c37';
  const pulse = .72 + Math.sin((game.elapsed || 0) * 2.4 + x * .018) * .08;
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, base);
  gradient.addColorStop(1, dark);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = persistent ? 18 : 9;
  ctx.shadowColor = glow;
  ctx.globalAlpha = persistent ? .94 : .78;
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = .44 + (persistent ? .18 : 0);
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y, 2, h);
  ctx.globalAlpha = .25;
  ctx.fillStyle = '#020713';
  ctx.fillRect(x + Math.max(3, w - 4), y + 2, 2, Math.max(1, h - 4));

  // 장식은 각 장의 소재를 빌리되, 텍스트나 카드형 테두리 대신 벽 자체의 질감으로만 읽히게 한다.
  if (theme.id === 'harin') {
    for (let row = y + 12; row < y + h - 5; row += 22) {
      const offset = ((row - y) / 22) % 2 ? 9 : 0;
      ctx.globalAlpha = .23;
      ctx.fillStyle = row % 44 ? '#bd7197' : '#e1b35f';
      for (let px = x + 8 + offset; px < x + w - 7; px += 19) {
        ctx.fillRect(px, row, 7, 4);
        ctx.fillRect(px + 2, row - 2, 3, 8);
      }
    }
  } else if (theme.id === 'yuna') {
    ctx.globalAlpha = .30;
    ctx.strokeStyle = '#bfffea';
    ctx.lineWidth = 1;
    for (let row = y + 13; row < y + h - 7; row += 16) {
      ctx.beginPath(); ctx.moveTo(x + 6, row); ctx.lineTo(x + w - 6, row); ctx.stroke();
    }
    ctx.fillStyle = '#e4fff6';
    for (let row = y + 18; row < y + h - 8; row += 32) ctx.fillRect(x + w * .46, row - 4, 3, 10);
  } else if (theme.id === 'haneul') {
    for (let row = y + 8; row < y + h - 6; row += 19) {
      ctx.globalAlpha = .23;
      ctx.fillStyle = row % 38 ? '#426e9a' : '#6b91b7';
      ctx.fillRect(x + 6 + (row % 38 ? 7 : 0), row, Math.max(7, w - 18), 7);
    }
    ctx.globalAlpha = .26 * pulse;
    ctx.strokeStyle = '#bbf7ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * .58, y + h - 8);
    ctx.bezierCurveTo(x + w * .22, y + h * .64, x + w * .82, y + h * .34, x + w * .48, y + 8);
    ctx.stroke();
  } else if (theme.id === 'daughter') {
    ctx.globalAlpha = .30;
    ctx.strokeStyle = '#ffc6e9';
    ctx.lineWidth = 1;
    for (let branch = 0; branch < 3; branch += 1) {
      const branchX = x + 9 + branch * Math.max(10, (w - 18) / 2);
      ctx.beginPath(); ctx.moveTo(branchX, y + h - 6); ctx.quadraticCurveTo(branchX + (branch % 2 ? 8 : -6), y + h * .48, branchX, y + 8); ctx.stroke();
      ctx.fillStyle = '#ffb5df'; ctx.fillRect(branchX - 2, y + h * (.34 + branch * .12), 4, 3);
    }
  } else {
    ctx.globalAlpha = .34;
    ctx.strokeStyle = '#9eefff';
    ctx.lineWidth = 1;
    for (let row = y + 12; row < y + h - 6; row += 25) {
      ctx.strokeRect(x + 7, row, Math.max(6, w - 14), 10);
      ctx.fillStyle = '#d1b4ff'; ctx.fillRect(x + w / 2 - 2, row + 3, 4, 4);
    }
  }
  ctx.restore();
}

function drawPlatform(item) {
  if (item.wall) {
    if (item.label === 'LAUGH COLLECTOR') {
      drawHarinLaughCollector(item);
      return;
    }
    if (item.persistentWall) {
      if (dreamTheme().id === 'haneul') {
        drawHaneulHeadwindPillar(item);
        return;
      }
      if (game.layout === 'carousel') {
        drawHarinCarouselWall(item);
        return;
      }
      drawThemedDreamBarrier(item, true);
      return;
    }
    drawThemedDreamBarrier(item);
    return;
  } else {
    const theme = dreamTheme();
    if (theme.id === 'harin') {
      drawHarinCarouselPlatform(item);
      return;
    }
    if (theme.id === 'yuna') {
      drawYunaScorePlatform(item);
      return;
    }
    if (theme.id === 'haneul') {
      drawHaneulWindPlatform(item);
      return;
    }
    if (theme.id === 'daughter' && (game.layout === 'garden-roots' || game.layout === 'classroom-fracture')) {
      drawDaughterDreamPlatform(item);
      return;
    }
    const platformGradient = ctx.createLinearGradient(item.x, item.y, item.x, item.y + item.h);
    platformGradient.addColorStop(0, theme.platform);
    platformGradient.addColorStop(1, '#101a38');
    ctx.save();
    if (item.hidden) { ctx.shadowBlur = 15; ctx.shadowColor = theme.accent; }
    ctx.fillStyle = platformGradient; ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.fillStyle = theme.edge; ctx.fillRect(item.x, item.y, item.w, 4);
    ctx.fillStyle = 'rgba(234,248,255,.16)'; for (let x = item.x + 12; x < item.x + item.w; x += 20) ctx.fillRect(x, item.y + 13, 8, 3);
    ctx.restore();
  }
}

function drawResonancePath(path) {
  const active = activeTechniques().resonance;
  const image = game.layout === 'wall' ? platformSprites.harinEchoBridge : null;
  ctx.save();
  ctx.translate(path.x + path.w / 2, path.y + path.h / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = active ? 24 : 7;
  ctx.shadowColor = active ? '#61faff' : '#6275b7';
  if (image?.complete && image.naturalWidth > 0) {
    ctx.globalAlpha = active ? 1 : .14;
    const visualHeight = Math.max(36, path.h * 2.7);
    ctx.drawImage(image, -path.w / 2 - 11, -visualHeight * .46, path.w + 22, visualHeight);
  } else {
    const glow = ctx.createLinearGradient(-path.w / 2, 0, path.w / 2, 0);
    glow.addColorStop(0, '#4db4d8'); glow.addColorStop(.5, '#cbffff'); glow.addColorStop(1, '#4db4d8');
    ctx.globalAlpha = active ? .9 : .12;
    ctx.fillStyle = glow;
    ctx.fillRect(-path.w / 2, -path.h / 2, path.w, path.h);
  }
  ctx.restore();
}

function drawLaughRelayNetwork() {
  const collector = game.platforms.find((platform) => platform.label === 'LAUGH COLLECTOR');
  const pads = game.memoryPads || [];
  if (!collector || pads.length !== 3) return;
  const activeStates = pads.map((pad) => activeMemoryPads([pad]) > 0);
  const colors = ['#ffe37d', '#9effea', '#ffb5d7'];
  const bulbSprite = ensureSprite(objectSprites.harinRelayBulb);
  const quadraticPoint = (start, control, end, t) => {
    const inverse = 1 - t;
    return {
      x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
      y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
    };
  };
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  pads.forEach((pad, index) => {
    const active = activeStates[index];
    const color = colors[index];
    const start = { x: pad.x + pad.w / 2, y: pad.y + pad.h * .34 };
    const towerY = collector.y + 102 + index * 102;
    const end = { x: collector.x + 8, y: towerY };
    // 수평 점선 대신, 유원지 시계탑을 향해 자연스럽게 늘어진 전구선이다.
    const sag = index === 1 ? 58 : 34;
    const control = { x: start.x + (end.x - start.x) * .52, y: Math.max(start.y, end.y) + sag };
    const wrapControl = { x: collector.x + collector.w + 18, y: end.y + 17 };
    const wrapEnd = { x: collector.x + collector.w / 2, y: end.y + 31 };
    const cable = active ? '#6b5275' : '#25233f';
    ctx.save();
    ctx.strokeStyle = cable;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.quadraticCurveTo(control.x, control.y, end.x, end.y); ctx.stroke();
    // 선이 시계탑 앞을 반 바퀴 감싸, 세 갈래 기억이 탑의 웃음 수집 장치에 꽂히는 모양을 만든다.
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.quadraticCurveTo(wrapControl.x, wrapControl.y, wrapEnd.x, wrapEnd.y);
    ctx.stroke();
    ctx.restore();

    const drawBulb = (point, bulb) => {
      const twinkle = .78 + Math.sin((game.elapsed || 0) * 5 + bulb * .82 + index * 1.9) * .22;
      ctx.save();
      const bulbH = active ? 20 + twinkle * 2 : 18;
      const bulbW = bulbH * (bulbSprite?.naturalWidth && bulbSprite?.naturalHeight ? bulbSprite.naturalWidth / bulbSprite.naturalHeight : .44);
      if (bulbSprite?.complete && bulbSprite.naturalWidth > 0) {
        if (active) {
          ctx.globalAlpha = .72 + twinkle * .28;
          ctx.shadowBlur = 12 + twinkle * 7;
          ctx.shadowColor = color;
        } else {
          // 꺼진 전구도 같은 일러스트를 낮은 밝기로 보이게 해, 전구선의 형태는 유지한다.
          ctx.globalAlpha = .24;
        }
        ctx.drawImage(bulbSprite, point.x - bulbW / 2, point.y - 2, bulbW, bulbH);
      } else {
        // 스프라이트 로딩 전에도 연결 규칙은 읽히도록 최소한의 대체 전구만 남긴다.
        ctx.globalAlpha = active ? .9 : .45;
        ctx.fillStyle = active ? color : '#3b3656';
        ctx.fillRect(Math.round(point.x) - 2, Math.round(point.y) - 4, 4, 2);
        ctx.beginPath(); ctx.arc(point.x, point.y, active ? 3 : 2.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };
    const bulbCount = Math.max(7, Math.min(21, Math.round(Math.hypot(end.x - start.x, end.y - start.y) / 28)));
    for (let bulb = 0; bulb <= bulbCount; bulb += 1) {
      const t = bulb / bulbCount;
      drawBulb(quadraticPoint(start, control, end, t), bulb);
    }
    for (let bulb = 1; bulb <= 3; bulb += 1) {
      drawBulb(quadraticPoint(end, wrapControl, wrapEnd, bulb / 4), bulbCount + bulb);
    }

    // 상호작용 발판은 drawMemoryPad의 전용 일러스트가 담당하고, 이 레이어는 전구선만 담당한다.
  });

  ctx.restore();
}

function drawWatcher(watcher, frozen, resolved = false) {
  const fill = resolved ? '#315e69' : frozen ? '#6e7893' : '#c73a64';
  const glow = resolved ? '#9effea' : frozen ? '#9ea9c6' : '#ff4e78';
  const centerX = watcher.x + watcher.w / 2;
  const centerY = watcher.y + watcher.h / 2;
  ctx.save(); ctx.translate(centerX, centerY); ctx.shadowBlur = resolved ? 14 : frozen ? 12 : 25; ctx.shadowColor = glow; ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe7ee'; ctx.fillRect(-8, -2, 16, 4); ctx.fillStyle = resolved ? '#9effea' : '#fffbfd'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  drawInteractionBeacon({
    x: centerX,
    y: watcher.y - 12,
    color: glow,
    symbol: resolved ? '✓' : frozen ? '✦' : '!',
    detail: resolved ? '감시선이 풀렸어요' : frozen ? '시간이 멈췄어요' : '기억의 나와 시간을 맞추세요',
    active: resolved || frozen,
    danger: !resolved && !frozen,
    near: playerNearObject(watcher, 92),
  });
}

function drawExit() {
  const { x, y, w, h } = game.exit;
  const theme = dreamTheme();
  const sprite = gateSprites[theme.id];
  const exitColors = {
    harin: '#ffe27e', yuna: '#9effd7', haneul: '#9eeeff', daughter: '#ffb5df', scientist: '#8ceeff',
  };
  const glow = exitColors[theme.id] || '#55f6ff';
  const signLocked = game.layout === 'signpost-maze' && !signpostMazeComplete();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = signLocked ? .34 : 1;
  ctx.shadowBlur = signLocked ? 7 : 24; ctx.shadowColor = glow;
  if (sprite?.complete && sprite.naturalWidth > 0) {
    const visualHeight = Math.max(118, h * 1.5);
    const visualWidth = Math.max(70, Math.round(visualHeight * (sprite.naturalWidth / sprite.naturalHeight)));
    ctx.drawImage(sprite, x + w / 2 - visualWidth / 2, y + h - visualHeight, visualWidth, visualHeight);
  } else {
    ctx.fillStyle = '#153d57'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#4af3fb'; ctx.fillRect(x + 4, y + 5, w - 8, h - 9);
    ctx.fillStyle = '#0d2045'; ctx.fillRect(x + 8, y + 10, w - 16, h - 19);
    ctx.fillStyle = '#ffe88c'; ctx.beginPath(); ctx.arc(x + w / 2, y + h * .45, 7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  drawInteractionBeacon({
    x: x + w / 2,
    y: Math.max(18, y - 16),
    color: signLocked ? '#88a3bc' : glow,
    symbol: signLocked ? '◌' : '↗',
    detail: signLocked ? '바람길을 먼저 고정하세요' : 'Enter · 다음 꿈으로',
    active: !signLocked,
    near: playerNearObject(game.exit, 96),
  });
}

function drawCarouselStageDimming() {
  ctx.save();
  const shade = ctx.createRadialGradient(
    CAROUSEL_RING_CENTER.x, CAROUSEL_RING_CENTER.y, 85,
    CAROUSEL_RING_CENTER.x, CAROUSEL_RING_CENTER.y, 430,
  );
  shade.addColorStop(0, 'rgba(2, 5, 18, .14)');
  shade.addColorStop(.56, 'rgba(2, 5, 18, .19)');
  shade.addColorStop(1, 'rgba(2, 5, 18, .38)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// 새 4스테이지는 실제 충돌 세그먼트와 같은 원형벽을 그린다.
function carouselRingVisualRotation(progress = 1) {
  const from = carouselRingRotation(game.carouselOrbitFromPose || carouselOrbitPoseId());
  const to = carouselRingRotation(game.carouselOrbitTargetPose || carouselOrbitPoseId());
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const eased = Math.max(0, Math.min(1, progress));
  const smooth = eased * eased * (3 - 2 * eased);
  return from + delta * smooth;
}

function carouselRingColor() {
  if (game.carouselExitBridgeDeployed) return '#fff0a8';
  if (game.carouselRotationTimer > 0) return carouselPhaseInfo(game.carouselTargetPhase).color;
  return carouselPhaseInfo(game.carouselPhase || 0).color;
}

function drawCarouselTopdownTile(x, y, w, h, alpha = 1) {
  const image = platformSprites.harinCarouselRingTile;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha *= alpha;
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x, y, w, h);
  } else {
    ctx.fillStyle = '#171633';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#bd8a43';
    ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  }
  ctx.restore();
}

function drawCarouselRingAtRotation(rotation, color, alpha = 1, ghost = false) {
  const gapCenter = rotation + Math.PI;
  const arcStart = gapCenter + CAROUSEL_RING_GAP_HALF_ANGLE;
  const arcEnd = gapCenter + Math.PI * 2 - CAROUSEL_RING_GAP_HALF_ANGLE;
  const image = carouselStructureSprites.ring;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (carouselSpriteReady(image)) {
    const visualSize = 404;
    ctx.translate(CAROUSEL_RING_CENTER.x, CAROUSEL_RING_CENTER.y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha * (ghost ? .22 : .76);
    ctx.shadowBlur = ghost ? 0 : 3;
    ctx.shadowColor = color;
    ctx.drawImage(image, -visualSize / 2, -visualSize / 2, visualSize, visualSize);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha * (ghost ? .16 : .46);
    ctx.strokeStyle = color;
    ctx.lineWidth = ghost ? 1 : 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(CAROUSEL_RING_CENTER.x, CAROUSEL_RING_CENTER.y, CAROUSEL_RING_RADIUS, arcStart, arcEnd);
    ctx.stroke();
  } else {
    ctx.globalAlpha = alpha * (ghost ? .24 : 1);
    ctx.strokeStyle = ghost ? '#302943' : '#29203d';
    ctx.lineWidth = ghost ? 20 : 26;
    ctx.beginPath();
    ctx.arc(CAROUSEL_RING_CENTER.x, CAROUSEL_RING_CENTER.y, CAROUSEL_RING_RADIUS, arcStart, arcEnd);
    ctx.stroke();
    ctx.globalAlpha = alpha * .62;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawCarouselRingOpenings(rotation, color, alpha = 1) {
  const gapCenter = rotation + Math.PI;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const markerX = Math.round(CAROUSEL_RING_CENTER.x + Math.cos(gapCenter) * CAROUSEL_RING_RADIUS);
  const markerY = Math.round(CAROUSEL_RING_CENTER.y + Math.sin(gapCenter) * CAROUSEL_RING_RADIUS);
  ctx.translate(markerX, markerY);
  ctx.rotate(gapCenter + Math.PI / 4);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * .64;
  ctx.fillRect(-3, -3, 6, 6);
  ctx.restore();
}

function drawCarouselMazeConnectors() {
  const routes = [
    { pose: 'moon', color: '#ffe37d', points: [[480, 341], [310, 290], [158, 350]] },
    { pose: 'memory', color: '#c6a5ff', points: [[480, 341], [390, 290], [382, 235], [357, 170], [210, 100]] },
    { pose: 'star', color: '#8ff5e8', points: [[480, 341], [570, 290], [578, 235], [603, 170], [750, 100]] },
    { pose: 'exit', color: '#fff0a8', points: [[480, 341], [640, 290], [775, 350], [884, 350]] },
    { pose: 'ribbon', color: '#ff9fcf', points: [[480, 341], [480, 415], [565, 435], [750, 470]] },
  ];
  const currentPose = carouselPhaseInfo(game.carouselRotationTimer > 0 ? game.carouselTargetPhase : game.carouselPhase).id;
  const route = routes.find((item) => item.pose === currentPose);
  if (!route) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalAlpha = .28;
  ctx.strokeStyle = 'rgba(5, 9, 28, .9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  route.points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
  ctx.globalAlpha = .26;
  ctx.strokeStyle = route.color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawCarouselOrbitSystem() {
  const rotating = game.carouselRotationTimer > 0;
  const progress = rotating ? 1 - game.carouselRotationTimer / CAROUSEL_ROTATION_SECONDS : 1;
  const color = carouselRingColor();
  const idleRotation = carouselRingRotation(carouselOrbitPoseId());
  const visualRotation = rotating ? carouselRingVisualRotation(progress) : idleRotation;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (rotating) {
    const targetRotation = carouselRingRotation(game.carouselOrbitTargetPose);
    drawCarouselRingAtRotation(targetRotation, color, .12, true);
    [.22, .12].forEach((offset, index) => {
      drawCarouselRingAtRotation(carouselRingVisualRotation(Math.max(0, progress - offset)), color, .08 + index * .06, true);
    });
  }
  drawCarouselRingAtRotation(visualRotation, color, .95, false);
  drawCarouselRingOpenings(visualRotation, color, .92);

  const shutter = getCarouselExitShutter();
  if (shutter) {
    drawCarouselTopdownWall(shutter, '#8e7aa9', true, false);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 4;
  ctx.shadowColor = color;
  ctx.fillStyle = '#c5ad72';
  ctx.fillRect(CAROUSEL_RING_CENTER.x - 6, CAROUSEL_RING_CENTER.y - 6, 12, 12);
  ctx.fillStyle = '#11172f';
  ctx.fillRect(CAROUSEL_RING_CENTER.x - 2, CAROUSEL_RING_CENTER.y - 2, 4, 4);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function carouselStructureColor(platform) {
  const poseId = platform.carouselBlockedUnlessPose || carouselPlatformPoseId(platform);
  if (poseId) return CAROUSEL_PHASES.find((phase) => phase.id === poseId)?.color || '#c6b78d';
  if (platform.carouselMemoryStart) return '#c6a5ff';
  if (platform.carouselSurface === 'tower') return '#9fe9dc';
  if (platform.carouselSurface === 'anchor') return '#f4dba0';
  if (platform.carouselSurface === 'wall') return '#8e7aa9';
  return '#c6b78d';
}

function drawCarouselAnchorBadge(platform) {
  if (!platform.carouselMemoryStart) return;
  const active = standingCarouselPlatform() === platform;
  const memoryAligned = carouselPhaseInfo().id === 'memory';
  const echoReplaying = (game.echoes || []).some((echo) => !echo.holding);
  const text = game.recording
    ? 'K · 기록 종료/되감기'
    : echoReplaying
      ? '잔상 재생 중'
    : game.carouselCoreLatched
    ? '✓ K 기억 고정'
    : game.carouselRotationTimer > 0
      ? 'K 시작 위치 · 회전 중'
    : memoryAligned
      ? active ? 'K · 기록 시작' : 'K 기록 시작 위치'
      : 'K 시작 위치 · 북서쪽 정렬';
  if (!text) return;
  const cx = Math.round(platform.x + platform.w / 2);
  ctx.save();
  ctx.font = '800 9px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowBlur = 9;
  ctx.shadowColor = '#02040e';
  ctx.fillStyle = '#fff2bd';
  ctx.fillText(text, cx, platform.y - 11);
  ctx.restore();
}

function drawCarouselTopdownWall(platform, color, active, targetPreview) {
  const x = Math.round(platform.x);
  const y = Math.round(platform.y);
  const w = Math.round(platform.w);
  const h = Math.round(platform.h);
  const vertical = h > w;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = active ? .92 : targetPreview ? .52 : .28;
  ctx.shadowBlur = active ? 5 : 0;
  ctx.shadowColor = color;
  if (vertical) {
    drawCarouselPillarSprite(x - 3, y - 3, w + 6, h + 6);
  } else {
    drawCarouselDeckSprite(x - 4, y - 4, w + 8, h + 8);
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = active ? .28 : targetPreview ? .22 : .1;
  ctx.fillStyle = active || targetPreview ? color : '#756982';
  if (vertical) ctx.fillRect(x + Math.round(w / 2), y + 5, 1, Math.max(1, h - 10));
  else ctx.fillRect(x + 5, y + Math.round(h / 2), Math.max(1, w - 10), 1);
  ctx.restore();
}

function drawCarouselStructureGuide(platform) {
  const active = carouselPlatformEnabled(platform);
  const platformPoseId = carouselPlatformPoseId(platform);
  const targetPreview = game.carouselRotationTimer > 0
    && platformPoseId === carouselPhaseInfo(game.carouselTargetPhase).id;
  const color = carouselStructureColor(platform);
  const x = Math.round(platform.x);
  const y = Math.round(platform.y);
  const w = Math.round(platform.w);
  if (platform.carouselSurface === 'wall') {
    drawCarouselTopdownWall(platform, color, active, targetPreview);
    return;
  }
  ctx.save();
  const activeAlpha = platform.carouselSurface === 'ground' ? .9 : platform.carouselSurface === 'anchor' ? .96 : .82;
  ctx.globalAlpha = active ? activeAlpha : targetPreview ? .4 : .16;
  drawHarinCarouselPlatform(platform);
  ctx.restore();
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (!active) {
    ctx.globalAlpha = targetPreview ? .46 : .24;
    ctx.fillStyle = targetPreview ? color : '#665b79';
    ctx.fillRect(x + 4, y - 2, Math.max(1, w - 8), 1);
    ctx.fillRect(Math.round(x + w / 2) - 2, y - 4, 4, 3);
    ctx.restore();
    return;
  }

  const pulse = .82 + Math.sin((game.elapsed || 0) * 5 + x * .03) * .13;
  ctx.globalAlpha = (platform.carouselSurface === 'ground' ? .24 : .34) * pulse;
  ctx.shadowBlur = platformPoseId ? 5 : 2;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillRect(x + 5, y - 3, Math.max(1, w - 10), 1);
  ctx.fillRect(Math.round(x + w / 2) - 2, y - 5, 4, 3);
  ctx.restore();
  drawCarouselAnchorBadge(platform);
}

function drawCarouselStructureJoints() {
  const image = carouselStructureSprites.joint;
  if (!carouselSpriteReady(image)) return;
  const joints = [
    { x: 800, y: 350, size: 20 },
    { x: 872, y: 394, size: 24 },
    { x: 872, y: 470, size: 24 },
  ];
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = .86;
  joints.forEach((joint) => {
    ctx.drawImage(
      image,
      Math.round(joint.x - joint.size / 2),
      Math.round(joint.y - joint.size / 2),
      joint.size,
      joint.size,
    );
  });
  ctx.restore();
}

function drawCarouselRelaySwitch(relay) {
  const active = game.carouselRelays instanceof Set && game.carouselRelays.has(relay.id);
  const pulse = .72 + Math.sin((game.elapsed || 0) * 5 + relay.x * .03) * .18;
  const color = active ? '#9effd7' : relay.color;
  const image = carouselLockSprites[relay.id];
  const spriteReady = image?.complete && image.naturalWidth > 0;
  const visualSize = 48;
  const centerX = relay.x + relay.w / 2;
  const centerY = relay.y + relay.h / 2;
  const drawX = Math.round(centerX - visualSize / 2);
  const drawY = Math.round(centerY - visualSize / 2);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = active ? 1 : .82;
  ctx.shadowBlur = active ? 16 : 8;
  ctx.shadowColor = color;
  if (spriteReady) {
    ctx.drawImage(image, drawX, drawY, visualSize, visualSize);
  } else {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    const coreSize = active ? 16 : Math.round(12 + pulse * 3);
    ctx.fillRect(Math.round(-coreSize / 2), Math.round(-coreSize / 2), coreSize, coreSize);
    ctx.fillStyle = '#10162f';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
  // 팀의 자물쇠 일러스트를 살리되, 카드형 외곽선 대신 작은 빛 조각으로 상호작용을 표시한다.
  ctx.globalCompositeOperation = 'screen';
  for (let mote = 0; mote < 5; mote += 1) {
    const angle = (game.elapsed || 0) * 1.8 + mote * Math.PI * 2 / 5;
    const radius = 14 + (mote % 2) * 4 + pulse * 3;
    ctx.globalAlpha = active ? .76 : .48;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(centerX + Math.cos(angle) * radius - 1), Math.round(centerY + Math.sin(angle) * radius - 1), mote % 2 ? 2 : 3, mote % 2 ? 2 : 3);
  }
  ctx.restore();
  drawInteractionBeacon({
    x: centerX,
    y: relay.y - 12,
    color,
    symbol: active ? '✓' : '✦',
    detail: active ? '잠금이 풀렸어요' : '직접 밟아 깨우기',
    active,
    near: playerNearObject(relay, 74),
  });
}

function drawCarouselMazeExit() {
  const ready = Boolean(game.carouselGateOpened);
  ctx.save();
  ctx.globalAlpha = ready ? 1 : .26;
  drawExit();
  if (!ready) {
    const { x, y, w = 36, h = 82 } = game.exit;
    ctx.globalAlpha = .9;
    ctx.fillStyle = '#17142d';
    ctx.fillRect(x + 5, y + 24, w - 10, h - 24);
    ctx.strokeStyle = '#756a8c';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5.5, y + 24.5, w - 11, h - 25);
    ctx.fillStyle = '#9a87a8';
    ctx.fillRect(x + w / 2 - 3, y + 44, 6, 10);
  }
  ctx.restore();
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

function drawInteractionBeacon({ x, y, color, symbol = 'K', detail = '', active = false, danger = false, near = false, scale = 1 }) {
  const time = game.elapsed || 0;
  const pulse = .54 + Math.sin(time * 4.8 + x * .037 + y * .021) * .2;
  const ink = danger ? '#ff91aa' : color;
  const glyphVisible = near || active || danger;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'screen';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 공통 상호작용 문법: 멀리서는 세 개의 기억 조각, 가까이에서는 키 문양,
  // 완료 뒤에는 느리게 흘러나오는 별빛. 카드·명찰 형태는 사용하지 않는다.
  for (let mote = 0; mote < 3; mote += 1) {
    const angle = time * (1.35 + mote * .09) + mote * Math.PI * 2 / 3;
    const radius = (6 + mote * 2 + pulse * 2) * scale;
    const moteX = x + Math.cos(angle) * radius;
    const moteY = y - 2 + Math.sin(angle * 1.35) * radius * .5;
    ctx.globalAlpha = active ? .78 : near ? .72 : .34;
    ctx.fillStyle = ink;
    const size = mote === 0 ? 3 : 2;
    ctx.fillRect(Math.round(moteX - size / 2), Math.round(moteY - size / 2), size, size);
  }
  if (active) {
    ctx.globalAlpha = .18 + pulse * .15;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 13 * scale + pulse * 3, 5 * scale + pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (glyphVisible) {
    ctx.globalAlpha = near ? 1 : active ? .82 : .7;
    ctx.shadowBlur = 10 + pulse * 6;
    ctx.shadowColor = danger ? '#ff4f78' : color;
    ctx.fillStyle = danger ? '#ffd1da' : '#eefeff';
    ctx.font = `850 ${Math.round((near ? 13 : 10) * scale)}px "Segoe UI Symbol", "Segoe UI", sans-serif`;
    ctx.fillText(symbol, x, y);
  }
  if (near && detail) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = .96;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#02040e';
    ctx.fillStyle = danger ? '#ffd9e1' : '#f4f8ff';
    ctx.font = `760 ${Math.round(7.5 * scale)}px "Segoe UI", "Apple SD Gothic Neo", sans-serif`;
    ctx.fillText(detail, x, y + 13 * scale);
    ctx.globalAlpha = .48;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 13 * scale, y + 19 * scale);
    ctx.quadraticCurveTo(x, y + 22 * scale, x + 13 * scale, y + 19 * scale);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMemoryPad(pad, active, index, role = 'normal') {
  const colors = ['#ffe37d', '#9effea', '#ffb5d7'];
  const roleStyles = {
    normal: { cue: '기억 기록', prompt: 'K로 기억을 남기세요' },
    echo: { cue: '기억의 나', prompt: 'K로 기억의 나를 남기세요', color: '#9effea' },
    present: { cue: '현재의 나', prompt: '이 자리에 직접 서세요', color: '#ffe37d' },
    either: { cue: '현재 또는 기억', prompt: '직접 서거나 K 기억을 남기세요', color: '#ffe9a2' },
    truth: { cue: '진실의 기억', prompt: 'K로 진짜 기억을 재생하세요', color: '#ffd56d' },
    distortion: { cue: '가짜 기억 추격', prompt: 'WASD 조준 후 J 탄환', color: '#ff537b' },
  };
  const style = roleStyles[role] || roleStyles.normal;
  const color = colors[index % colors.length];
  const radius = Math.max(pad.w, pad.h) / 2;
  const themedSprite = game.layout === 'wall' ? memoryPadSprites.harinRelay : memoryPadSprites[dreamTheme().id];
  const sprite = ensureSprite(role === 'distortion' ? memoryPadSprites.distortion : themedSprite);
  const hasSprite = sprite?.complete && sprite.naturalWidth > 0;
  const displayColor = style.color || color;
  const visualWidth = Math.max(role === 'distortion' ? 64 : 50, radius * (role === 'distortion' ? 3.02 : 2.48));
  const visualHeight = Math.max(role === 'distortion' ? 68 : 56, radius * (role === 'distortion' ? 3.14 : 2.68));
  const padCenterX = pad.x + pad.w / 2;
  const padCenterY = pad.y + pad.h / 2;
  const playerCenterX = game.player.x + game.player.w / 2;
  const playerCenterY = game.player.y + game.player.h / 2;
  const interactionRange = role === 'distortion' ? 190 : 116;
  const playerNear = Math.hypot(playerCenterX - padCenterX, playerCenterY - padCenterY) < interactionRange;
  const echo = pad.roleDirection || pad.roleTechnique ? echoHoldingPad(pad) : null;
  const directionReady = pad.roleDirection
    ? Boolean(echo && echo.holding && echo.facing === pad.roleDirection)
    : Boolean(echo && echo.holding && echo.frames?.some((frame) => frame.techniques?.[pad.roleTechnique]));
  const windRelayPad = role === 'echo' && game.boss?.mode === 'chase';
  const symbol = role === 'distortion'
    ? '✕'
    : active
      ? '✓'
      : pad.roleTechnique
        ? '≈'
        : pad.roleDirection
          ? pad.roleDirection > 0 ? '→' : '←'
          : 'K';
  const cue = active
    ? role === 'distortion'
      ? `도주 기억 ${pad.hits || 0}/2`
      : windRelayPad ? '기준점이 고정됐어요' : '기억이 이어졌어요'
    : directionReady
      ? '기억의 역할이 맞춰졌어요'
      : windRelayPad ? 'K · 바람 기준점 남기기' : role === 'distortion' ? 'J · 훔친 잔상 되찾기' : 'K · 기억 남기기';
  const beaconColor = game.boss?.mode === 'calm' && !active && symbol === 'K' ? '#9effea' : displayColor;

  // 프레임이나 사각 명찰 대신 오브젝트 자체에서 튀어나오는 빛·먼지로 상호작용 지점을 표시한다.
  ctx.save();
  ctx.translate(padCenterX, padCenterY);
  if (pad.backdropDimming) {
    // 21스테이지의 보랏빛 거울 바닥에서는 기억 발판 아래만 아주 약하게 눌러,
    // 원화의 분위기를 해치지 않으면서 K 기록 지점을 먼저 읽히게 한다.
    ctx.globalAlpha = pad.backdropDimming;
    ctx.fillStyle = '#070b24';
    ctx.beginPath();
    ctx.ellipse(0, 6, visualWidth * .62, visualHeight * .38, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'screen';
  const time = game.elapsed || 0;
  for (let mote = 0; mote < (active ? 8 : 5); mote += 1) {
    const angle = time * (1.25 + (mote % 3) * .16) + mote * 2.39;
    const distance = radius + 8 + (mote % 3) * 5;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle * 1.24) * distance * .42 - 3;
    ctx.globalAlpha = active ? .68 : .34;
    ctx.fillStyle = displayColor;
    ctx.fillRect(Math.round(x), Math.round(y), mote % 3 === 0 ? 3 : 2, mote % 3 === 0 ? 3 : 2);
  }
  // 빛 입자만 screen 합성으로 띄우고, 원화는 원래 색감으로 남긴다.
  ctx.globalCompositeOperation = 'source-over';
  if (hasSprite) {
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = active ? 1 : .9;
    ctx.drawImage(sprite, -visualWidth / 2, -visualHeight / 2 - 3, visualWidth, visualHeight);
  } else {
    ctx.globalAlpha = .88;
    ctx.fillStyle = '#13254b';
    ctx.fillRect(-radius, -radius * .62, radius * 2, radius * 1.24);
    ctx.fillStyle = displayColor;
    ctx.fillRect(-radius + 3, -radius * .62 + 3, radius * 2 - 6, 3);
  }
  if (active) {
    const wave = 15 + Math.sin(time * 6 + index) * 3;
    ctx.globalAlpha = .32;
    ctx.fillStyle = displayColor;
    ctx.beginPath(); ctx.ellipse(0, 7, wave * 1.35, wave * .38, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  drawInteractionBeacon({
    x: padCenterX,
    y: Math.max(15, padCenterY - visualHeight / 2 - 12),
    color: beaconColor,
    symbol,
    detail: cue,
    active,
    danger: role === 'distortion',
    near: playerNear,
  });
}

function drawEcho(echo, index) {
  const recordedMotion = echo.holding && !echo.protectedStolen ? {} : echo.motionState || {};
  drawDreamMist(echo, index * 2.13 + .7, echo.holding ? .9 : .68, echo.holding ? .62 : .42);
  const pulse = .5 + Math.sin((game.elapsed || 0) * 4.6 + index) * .5;
  const flashBoost = echo.flash > 0 ? .16 : 0;
  drawCharacterMotion(echo, Boolean(echo.bossMode), recordedMotion, {
    alpha: Math.min(.72, (echo.holding ? .46 : .34) + pulse * .06 + flashBoost),
    composite: 'screen',
    filter: `blur(${echo.holding ? .12 : .42}px) saturate(.82) brightness(${echo.flash > 0 ? 1.38 : 1.08})`,
    bob: (recordedMotion.bob || 0) - 1 - pulse,
    scaleX: (recordedMotion.scaleX || 1) * (1.02 + pulse * .025),
    scaleY: (recordedMotion.scaleY || 1) * (.98 - pulse * .018),
  }, { effectAlpha: .38, fallback: false });
  const boss = game.boss;
  if (boss?.echoHitLimit > 0 && boss.mode !== 'calm' && !echo.protectedStolen && !(boss.mode === 'chase' && boss.relayEchoProtected)) {
    const hitLimit = boss.echoHitLimit;
    const hits = Math.min(hitLimit, echo.nightmareHits || 0);
    const centerX = echo.x + echo.w / 2;
    const markerY = echo.y - 12 + (boss.echoDamagePulse > 0 ? Math.sin(game.elapsed * 42) * 2 : 0);
    ctx.save();
    ctx.shadowBlur = 8; ctx.shadowColor = '#d58bff';
    for (let mark = 0; mark < hitLimit; mark += 1) {
      const x = centerX + (mark - (hitLimit - 1) / 2) * 10;
      ctx.fillStyle = mark < hits ? '#eeb3ff' : 'rgba(75, 60, 112, .9)';
      ctx.fillRect(x - 3, markerY - 3, 6, 6);
      ctx.fillStyle = mark < hits ? '#fff1ff' : '#9a8db4';
      ctx.fillRect(x - 1, markerY - 5, 2, 10);
    }
    ctx.fillStyle = '#f6e7ff'; ctx.font = '800 7px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${boss.mode === 'resonance' ? '불협화음' : '공포 피격'} ${hits}/${hitLimit}`, centerX, markerY - 10);
    ctx.restore();
  }
}

function drawCalmFleeingFakeMemory(fake, index) {
  if (!fake.stolenEcho) return;
  const fakeCenterX = fake.x + fake.w / 2;
  const fakeCenterY = fake.y + fake.h / 2;
  const echoCenterX = fake.stolenEcho.x + fake.stolenEcho.w / 2;
  const echoCenterY = fake.stolenEcho.y + fake.stolenEcho.h / 2;
  ctx.save();
  ctx.globalAlpha = .42 + Math.sin((game.elapsed || 0) * 9 + index) * .12;
  ctx.strokeStyle = '#ff7b9f';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(fakeCenterX, fakeCenterY);
  ctx.lineTo(echoCenterX, echoCenterY);
  ctx.stroke();
  ctx.restore();
  drawEcho(fake.stolenEcho, 20 + index);
  drawMemoryPad(fake, true, index, 'distortion');
  ctx.save();
  ctx.font = '800 8px "Segoe UI", "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign = 'center';
  for (let hit = 0; hit < 2; hit += 1) {
    ctx.fillStyle = hit < (fake.hits || 0) ? '#fff1a4' : 'rgba(88, 31, 71, .9)';
    ctx.strokeStyle = fake.hitFlash > 0 ? '#ffffff' : '#ff7b9f';
    ctx.lineWidth = 1;
    ctx.fillRect(fakeCenterX - 10 + hit * 13, fake.y - 35, 8, 8);
    ctx.strokeRect(fakeCenterX - 10 + hit * 13 + .5, fake.y - 34.5, 7, 7);
  }
  ctx.fillStyle = '#fff1a4';
  ctx.fillText(`WASD + J 탄환 · ${fake.hits || 0}/2`, fakeCenterX, fake.y - 40);
  ctx.restore();
}

function currentRunFrameIndex(elapsed = game.elapsed || 0) {
  let cycleTime = (elapsed * 1000) % PLAYER_RUN_CYCLE_MS;
  for (let index = 0; index < PLAYER_RUN_FRAME_DURATIONS.length; index += 1) {
    if (cycleTime < PLAYER_RUN_FRAME_DURATIONS[index]) return index;
    cycleTime -= PLAYER_RUN_FRAME_DURATIONS[index];
  }
  return PLAYER_RUN_FRAME_DURATIONS.length - 1;
}

function currentJumpFrameIndex(player) {
  if ((player.vy || 0) < 0) {
    const ascent = Math.max(0, Math.min(1, ((player.vy || 0) + 470) / 470));
    return Math.min(6, Math.floor(ascent * 7));
  }
  const descent = Math.max(0, Math.min(1, (player.vy || 0) / 520));
  return 7 + Math.min(4, Math.floor(descent * 5));
}

function playerMotionState(player, bossMode = false) {
  const dashRatio = Math.max(0, Math.min(1, (game.dashVisualTimer || 0) / DASH_VISUAL_DURATION));
  if (dashRatio > 0) {
    const intensity = Math.min(1, dashRatio * 1.7);
    return {
      dashing: true, intensity, bob: -1,
      offsetX: (player.facing || 1) * (2 + intensity),
      rotation: .12 * intensity,
      scaleX: 1 + .27 * intensity,
      scaleY: 1 - .14 * intensity,
      frameIndex: currentRunFrameIndex(),
    };
  }

  const speed = bossMode
    ? Math.hypot(player.vx || 0, player.vy || 0)
    : Math.abs(player.vx || 0);
  const running = speed > 34 && (bossMode || player.grounded);
  if (running) {
    const phase = (game.elapsed || 0) * Math.PI * 2;
    return {
      running: true, phase, frameIndex: currentRunFrameIndex(),
      rotation: .018,
    };
  }

  if (!bossMode && !player.grounded) return { jumping: true, frameIndex: currentJumpFrameIndex(player) };
  return {};
}

function drawRunningSpritePieces(image, drawX, drawY, drawWidth, drawHeight, swing) {
  const sourceWidth = image.naturalWidth || PLAYER_SPRITE_SIZE.width;
  const sourceHeight = image.naturalHeight || PLAYER_SPRITE_SIZE.height;
  const lowerStart = Math.round(sourceHeight * .58);
  const upperEnd = Math.min(sourceHeight, lowerStart + 1);
  const half = Math.floor(sourceWidth / 2);
  const scaleX = drawWidth / sourceWidth;
  const scaleY = drawHeight / sourceHeight;
  const shift = swing * Math.max(1, scaleX);
  const leftDrop = swing > 0 ? 0 : Math.max(1, scaleY);
  const rightDrop = swing < 0 ? 0 : Math.max(1, scaleY);

  ctx.drawImage(image, 0, 0, sourceWidth, upperEnd, drawX, drawY, drawWidth, upperEnd * scaleY);
  ctx.drawImage(
    image, 0, lowerStart, half, sourceHeight - lowerStart,
    drawX + shift, drawY + lowerStart * scaleY + leftDrop,
    half * scaleX, (sourceHeight - lowerStart) * scaleY,
  );
  ctx.drawImage(
    image, half, lowerStart, sourceWidth - half, sourceHeight - lowerStart,
    drawX + half * scaleX - shift, drawY + lowerStart * scaleY + rightDrop,
    (sourceWidth - half) * scaleX, (sourceHeight - lowerStart) * scaleY,
  );
}

function drawSpriteAt(image, player, bossMode = false, motion = {}) {
  const visualScale = Number.isFinite(player.spriteScale) ? player.spriteScale : 1;
  const visualHeight = (bossMode ? 54 : 48) * visualScale;
  const visualWidth = Math.round(visualHeight * (PLAYER_SPRITE_SIZE.width / PLAYER_SPRITE_SIZE.height));
  const centerX = Math.round(player.x + player.w / 2) + (motion.offsetX || 0);
  const footY = Math.round(player.y + player.h) + (motion.bob || 0) + (motion.offsetY || 0);
  const drawX = -Math.floor(visualWidth / 2);
  const drawY = -visualHeight * (PLAYER_SPRITE_SIZE.feetY / PLAYER_SPRITE_SIZE.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = motion.alpha ?? 1;
  ctx.globalCompositeOperation = motion.composite || 'source-over';
  ctx.filter = motion.filter || 'none';
  ctx.translate(centerX, footY);
  ctx.scale((player.facing >= 0 ? 1 : -1) * PLAYER_SPRITE_SOURCE_FACING, 1);
  ctx.rotate(motion.rotation || 0);
  ctx.scale(motion.scaleX || 1, motion.scaleY || 1);
  if (motion.runSwing) drawRunningSpritePieces(image, drawX, drawY, visualWidth, visualHeight, motion.runSwing);
  else ctx.drawImage(image, drawX, drawY, visualWidth, visualHeight);
  ctx.restore();
}

function drawDreamMist(actor, seed = 0, intensity = 1, fade = 1) {
  const colors = ['158,255,234', '199,163,255', '255,227,125'];
  const centerX = actor.x + actor.w / 2;
  const centerY = actor.y + actor.h * .54;
  const time = (game.elapsed || 0) * 1.4 + seed;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let index = 0; index < 3; index += 1) {
    const phase = time + index * 2.07;
    const x = centerX + Math.cos(phase) * (7 + index * 4) - (actor.facing || 1) * index * 3;
    const y = centerY + Math.sin(phase * .73) * 5 - index * 5;
    const radius = (12 + index * 5) * intensity;
    const alpha = (.1 - index * .018) * fade;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${colors[index]}, ${alpha})`);
    gradient.addColorStop(.48, `rgba(${colors[index]}, ${alpha * .48})`);
    gradient.addColorStop(1, `rgba(${colors[index]}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.45, radius * .72, phase * .08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDreamTrails(bossMode = false) {
  for (const trail of game.dreamTrails || []) {
    const progress = Math.max(0, Math.min(1, trail.age / trail.life));
    const fade = (1 - progress) ** 2;
    const forgetPulse = .72 + Math.sin(trail.seed + progress * 25) * .2;
    const ghost = {
      ...trail,
      x: trail.x - trail.facing * progress * 13,
      y: trail.y - progress * 7 + Math.sin(trail.seed + progress * 8) * 2,
    };
    drawDreamMist(ghost, trail.seed + trail.age * 2, 1 + progress * .5, fade);
    const image = playerSprites.run[trail.frameIndex] || playerSprites.idle;
    if (!image?.complete || image.naturalWidth === 0) continue;
    drawSpriteAt(image, ghost, bossMode, {
      alpha: Math.max(0, fade * .3 * forgetPulse),
      composite: 'screen',
      filter: `blur(${.45 + progress * 3.1}px) saturate(${.72 - progress * .32})`,
      rotation: .08 + progress * .06,
      scaleX: 1.08 + progress * .2,
      scaleY: .94 - progress * .12,
    });
  }
}

function drawDashStreaks(player, motion) {
  if (!motion.dashing) return;
  const effectAlpha = motion.effectAlpha ?? 1;
  const intensity = motion.intensity || 0;
  const direction = player.facing || 1;
  const centerX = player.x + player.w / 2;
  const baseY = player.y + player.h * .55;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let index = 0; index < 4; index += 1) {
    const length = 12 + index * 7 + intensity * 10;
    const endX = centerX - direction * (8 + index * 5);
    const startX = endX - direction * length;
    ctx.globalAlpha = (.32 - index * .055) * intensity * effectAlpha;
    ctx.fillStyle = index % 2 ? '#c7a3ff' : index === 2 ? '#ffe37d' : '#9effea';
    ctx.fillRect(Math.min(startX, endX), Math.round(baseY - 10 + index * 7), Math.max(2, Math.abs(endX - startX)), 1);
  }
  ctx.restore();
}

function drawRunFootDust(player, motion) {
  if (!motion.running) return;
  const effectAlpha = motion.effectAlpha ?? 1;
  const direction = player.facing || 1;
  const phase = Math.sin(motion.phase || 0);
  const heelX = Math.round(player.x + player.w / 2 - direction * (7 + Math.abs(phase) * 2));
  const groundY = Math.round(player.y + player.h - 1);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = (.3 + Math.abs(phase) * .22) * effectAlpha;
  ctx.fillStyle = phase >= 0 ? '#ffe37d' : '#9effea';
  ctx.fillRect(heelX, groundY, 2, 1);
  ctx.fillRect(heelX - direction * 3, groundY - 2, 1, 1);
  ctx.restore();
}

function drawFallbackChild(player, bossMode = false) {
  const { x, y, w, h } = player;
  ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = '#ffe57d'; ctx.fillStyle = '#f5b94e'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#59405e'; ctx.fillRect(x + 3, y + 4, w - 6, 11); ctx.fillStyle = '#ffd4b4'; ctx.fillRect(x + 5, y + 8, w - 10, 8); ctx.fillStyle = '#2c3c66'; ctx.fillRect(x + (player.facing > 0 ? w - 12 : 6), y + 9, 3, 3); ctx.fillStyle = '#e66c75'; ctx.fillRect(x + 4, y + h - 13, w - 8, 8); ctx.fillStyle = '#fff0a6'; ctx.beginPath(); ctx.arc(x + w / 2, y - 4, bossMode ? 5 : 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function playerSpriteForMotion(motion = {}) {
  const image = motion.jumping
    ? playerSprites.jump[motion.frameIndex] || playerSprites.idle
    : motion.running || motion.dashing
      ? playerSprites.run[motion.frameIndex] || playerSprites.idle
      : playerSprites.idle;
  return image;
}

function drawCharacterMotion(player, bossMode, motion = {}, visualOverrides = {}, options = {}) {
  const image = playerSpriteForMotion(motion);
  if (!image?.complete || image.naturalWidth === 0) {
    if (options.fallback !== false) drawFallbackChild(player, bossMode);
    return false;
  }
  const effectMotion = { ...motion, effectAlpha: options.effectAlpha ?? 1 };
  drawDashStreaks(player, effectMotion);
  drawSpriteAt(image, player, bossMode, { ...motion, ...visualOverrides });
  drawRunFootDust(player, effectMotion);
  return true;
}

function drawChild(player, bossMode = false) {
  const pulse = player.shrinkPulse || 0;
  if (pulse > 0) {
    const ratio = 1 - pulse / .45;
    const centerX = player.x + player.w / 2;
    const centerY = player.y + player.h / 2;
    const radius = 28 - ratio * 15;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.max(0, .42 * (1 - ratio));
    ctx.strokeStyle = '#d9fff7';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#91f3e4';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  drawCharacterMotion(player, bossMode, playerMotionState(player, bossMode));
}

function drawPhaseGuide() {
  if (game.phase !== 'playing' || currentStage()?.type !== 'boss' || !game.boss) return;
  const guide = phaseGuide();
  const bossBriefVisible = (game.elapsed || 0) < (game.bossGuideUntil || 0);
  if (!bossBriefVisible) return;
  const phaseNodes = bossPhaseNodes();
  const label = guide.compact;
  ctx.save();
  ctx.font = '800 11px "Segoe UI", "Apple SD Gothic Neo", sans-serif';
  const width = Math.min(500, Math.max(236, ctx.measureText(label).width + 54));
  const x = W / 2 - width / 2;
  const y = 96;
  const height = 42;
  const elapsed = game.elapsed || 0;
  const guideStarted = Number.isFinite(game.bossGuideStarted) ? game.bossGuideStarted : elapsed;
  const guideUntil = Number.isFinite(game.bossGuideUntil) ? game.bossGuideUntil : elapsed;
  const fadeIn = Math.min(1, Math.max(0, (elapsed - guideStarted) / .16));
  const fadeOut = Math.min(1, Math.max(0, (guideUntil - elapsed) / .24));
  ctx.globalAlpha = Math.min(fadeIn, fadeOut) * .98;
  ctx.fillStyle = 'rgba(7, 18, 44, .78)';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = dreamTheme().accent;
  ctx.globalAlpha *= .82;
  ctx.fillRect(x + 18, y + 6, width - 36, 1);
  ctx.globalAlpha = .94;
  ctx.fillStyle = '#f4fbff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, W / 2, y + 17);
  const gap = Math.min(84, (width - 52) / Math.max(1, phaseNodes.length));
  const startX = W / 2 - gap * (phaseNodes.length - 1) / 2;
  phaseNodes.forEach((node, index) => {
    const nodeX = startX + gap * index;
    const previousDone = index === 0 || phaseNodes[index - 1].done;
    const current = !node.done && previousDone;
    ctx.globalAlpha = node.done ? .96 : current ? .94 : .3;
    ctx.fillStyle = node.done ? '#9effd7' : current ? '#ffe37d' : '#6a7b9a';
    ctx.beginPath(); ctx.arc(nodeX, y + 31, current ? 4 : 3, 0, Math.PI * 2); ctx.fill();
    if (index < phaseNodes.length - 1) {
      ctx.strokeStyle = phaseNodes[index].done ? '#9effd7aa' : '#61749677'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(nodeX + 6, y + 31); ctx.lineTo(nodeX + gap - 6, y + 31); ctx.stroke();
    }
  });
  ctx.restore();
}

function drawMemoryPath(frames, color, alpha, options = {}) {
  if (!frames?.length) return;
  const firstVisibleIndex = Math.max(0, Math.min(frames.length - 1, options.startIndex || 0));
  const lastVisibleIndex = Math.max(firstVisibleIndex, Math.min(frames.length - 1, options.endIndex ?? frames.length - 1));
  const visibleFrames = frames.slice(firstVisibleIndex, lastVisibleIndex + 1);
  const stride = Math.max(1, Math.floor(visibleFrames.length / 48));
  const points = visibleFrames
    .filter((_, index) => index % stride === 0)
    .map((frame) => ({ x: frame.x + frame.w / 2, y: frame.y + frame.h / 2 }));
  const lastFrame = visibleFrames[visibleFrames.length - 1];
  const lastPoint = { x: lastFrame.x + lastFrame.w / 2, y: lastFrame.y + lastFrame.h / 2 };
  if (!points.length || points.at(-1).x !== lastPoint.x || points.at(-1).y !== lastPoint.y) points.push(lastPoint);
  const drawRibbonStroke = (width, stroke, opacity, shadow = 0) => {
    if (points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha * opacity;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = shadow;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const midpoint = { x: (points[index].x + points[index + 1].x) / 2, y: (points[index].y + points[index + 1].y) / 2 };
      ctx.quadraticCurveTo(points[index].x, points[index].y, midpoint.x, midpoint.y);
    }
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.stroke();
    ctx.restore();
  };
  // 여러 개의 굵은 리본 원화를 반복해 붙이지 않고, 한 줄로 이어지는 기억의 흐름을 만든다.
  drawRibbonStroke(15, options.underlay || color, .28, 16);
  drawRibbonStroke(9, color, .44, 12);
  drawRibbonStroke(4, '#dffcff', .72, 4);
  drawRibbonStroke(1.4, '#fff5cc', .92);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const glitterStep = Math.max(5, Math.floor(points.length / 8));
  for (let index = 0; index < points.length; index += glitterStep) {
    const point = points[index];
    const size = index % (glitterStep * 2) === 0 ? 4 : 3;
    ctx.globalAlpha = alpha * (.55 + Math.sin(game.elapsed * 7 + index) * .18);
    ctx.shadowBlur = 8; ctx.shadowColor = color;
    ctx.fillStyle = index % (glitterStep * 2) === 0 ? '#fff6cf' : color;
    ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
  }
  // 원화 리본은 움직이는 기억의 나 바로 뒤에 한 번만 붙여, 여러 마리처럼 보이지 않게 한다.
  const trail = ensureSprite(memoryEffectSprites.resonanceTrail);
  const previous = points[Math.max(0, points.length - 2)] || lastPoint;
  const dx = lastPoint.x - previous.x;
  const dy = lastPoint.y - previous.y;
  const length = Math.hypot(dx, dy) || 1;
  if (trail?.complete && trail.naturalWidth > 0 && points.length > 1) {
    const tailWidth = 40;
    const tailHeight = tailWidth * .34;
    ctx.save();
    ctx.translate(lastPoint.x - dx / length * 16, lastPoint.y - dy / length * 16);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.globalAlpha = alpha * .58;
    ctx.shadowBlur = 12; ctx.shadowColor = color;
    ctx.drawImage(trail, -tailWidth / 2, -tailHeight / 2, tailWidth, tailHeight);
    ctx.restore();
  }
  if (options.markerLabel) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff4bf';
    ctx.font = '800 9px "Segoe UI", "Apple SD Gothic Neo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.markerLabel, lastPoint.x, lastPoint.y - 28);
  }
  ctx.restore();
}

function drawMemoryLoopFeedback() {
  game.echoes.forEach((echo, index) => {
    if (echo.holding) return;
    // 되감기 뒤에는 새 파란 경로를 덧그리지 않는다. 기록할 때 남긴 노란 길을
    // 잔상이 앞에서부터 밟아 지우며 목표까지 재생한다.
    drawMemoryPath(echo.frames, '#ffe37d', .78, {
      startIndex: echo.playbackIndex || 0,
      underlay: '#80501e',
    });
  });
  if (!game.recording) return;
  drawMemoryPath(game.recording.frames, '#ffe37d', .85, { markerLabel: 'K · 기억 되감기', underlay: '#80501e' });
}

function drawChoirBalconySingerCues() {
  if (game.layout !== 'choir-balcony' || (game.memoryPads || []).length < 2) return;
  const singers = [objectSprites.yunaStage08BoyGhostSinger, objectSprites.yunaStage08GirlGhostSinger];
  const duetReady = puzzleRoleState().ready;
  const time = game.elapsed || 0;
  const visualWidth = 60;
  const visualHeight = 82;

  game.memoryPads.slice(0, 2).forEach((pad, index) => {
    const image = ensureSprite(singers[index]);
    if (!image?.complete || image.naturalWidth === 0) return;
    const centerX = pad.x + pad.w / 2;
    const bob = Math.round(Math.sin(time * 2.7 + index * .8) * 1.5);
    // 빈 의자의 주인이 K 발판 바로 위에 머물도록 바닥선을 발판과 맞춘다.
    const top = pad.y - visualHeight + 2 + bob;
    ctx.save();
    // 원본 픽셀 윤곽은 그대로 두고, 투명도만으로 유령의 존재감을 조절한다.
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = duetReady ? .56 : .40;
    ctx.drawImage(image, Math.round(centerX - visualWidth / 2), Math.round(top), visualWidth, visualHeight);
    ctx.restore();
  });
}

function drawMemoryPadGhostMist(centerX, footY, direction, color, strength, seed) {
  const time = game.elapsed || 0;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  // 발판에서 위로 피어오르는 한 덩어리의 연기. 몸 주위를 도는 원이나 여러 개의 분리된 꼬리는 만들지 않는다.
  for (let strand = 0; strand < 3; strand += 1) {
    const phase = time * (1.5 + strand * .16) + seed * .71 + strand * 1.8;
    const rise = 40 + strand * 9;
    const sway = Math.sin(phase) * (8 + strand * 3);
    ctx.globalAlpha = strength * (.15 - strand * .023);
    ctx.strokeStyle = color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    ctx.lineWidth = strand === 1 ? 3 : 1.6;
    ctx.beginPath();
    ctx.moveTo(centerX - direction * (5 + strand * 2), footY - 7);
    ctx.bezierCurveTo(
      centerX + sway, footY - rise * .32,
      centerX - direction * 7 - sway * .55, footY - rise * .74,
      centerX + sway * .28, footY - rise,
    );
    ctx.stroke();
  }
  for (let mote = 0; mote < 7; mote += 1) {
    const rise = 9 + ((time * 18 + mote * 13 + seed * 7) % 52);
    const drift = Math.sin(time * 3.2 + mote * 1.8 + seed) * (4 + mote % 3);
    ctx.globalAlpha = strength * (.28 - rise / 300);
    ctx.fillStyle = mote % 3 === 0 ? '#fff3c2' : color;
    ctx.fillRect(Math.round(centerX + drift - direction * (mote % 2) * 3), Math.round(footY - rise), mote % 2 ? 2 : 3, 2);
  }
  ctx.restore();
}

function drawMemoryPadDirectionGhosts() {
  const layout = game.layout;
  if (!['harmony-spiral', 'classroom-fracture'].includes(layout) || !game.memoryPads?.length) return;
  const yunaEcho = layout === 'harmony-spiral';
  const singers = [objectSprites.yunaStage08BoyGhostSinger, objectSprites.yunaStage08GirlGhostSinger];
  const defaultSingerDirections = [1, -1];
  const time = game.elapsed || 0;

  game.memoryPads.forEach((pad, index) => {
    if (!pad.roleDirection) return;
    const direction = pad.roleDirection;
    const active = activeMemoryPads([pad]) > 0;
    const strength = active ? .28 : .9;
    const centerX = pad.x + pad.w / 2;
    const footY = yunaEcho ? pad.y + 3 : pad.y + pad.h - 1;
    const color = yunaEcho ? (index === 0 ? '#9effea' : '#c7a3ff') : '#ffc1df';
    const bob = Math.sin(time * 2.6 + index * 1.9) * 1.5;

    drawMemoryPadGhostMist(centerX, footY + bob, direction, color, strength, index + (yunaEcho ? 3 : 11));
    if (yunaEcho) {
      const image = ensureSprite(singers[index % singers.length]);
      if (!image?.complete || image.naturalWidth === 0) return;
      const visualWidth = 60;
      const visualHeight = 82;
      const flip = direction === defaultSingerDirections[index % defaultSingerDirections.length] ? 1 : -1;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      // 10스테이지도 원본 스프라이트의 픽셀 윤곽을 유지하고 투명도만 낮춘다.
      ctx.globalAlpha = active ? .16 : .43;
      ctx.translate(Math.round(centerX), Math.round(footY + bob));
      ctx.scale(flip, 1);
      ctx.drawImage(image, -visualWidth / 2, -visualHeight, visualWidth, visualHeight);
      ctx.restore();
      return;
    }

    const image = ensureSprite(playerSprites.idle);
    if (!image?.complete || image.naturalWidth === 0) return;
    const ghost = { x: centerX - 12.5, y: footY - 34 + bob, w: 25, h: 34, facing: direction };
    drawSpriteAt(image, ghost, false, {
      alpha: active ? .13 : .36,
      composite: 'screen',
      filter: 'blur(.42px) saturate(.54) brightness(1.18)',
      bob: -1,
      scaleX: .86,
      scaleY: .86,
    });
  });
}

function releaseCurvePoint(start, control, end, t) {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}

function drawFinalMemoryBranch(start, control, end, color, index, progress) {
  // 세 기억은 같은 박자로 출발해 정확히 같은 순간에 기억 매듭에 닿는다.
  const reveal = Math.max(0, Math.min(1, progress / .54));
  if (reveal <= 0) return;
  const points = [];
  const pointCount = Math.max(2, Math.ceil(38 * reveal));
  for (let step = 0; step <= pointCount; step += 1) {
    points.push(releaseCurvePoint(start, control, end, Math.min(reveal, step / pointCount * reveal)));
  }
  const stroke = (width, strokeStyle, opacity, blur = 0) => {
    ctx.save();
    ctx.globalAlpha = opacity * (.38 + progress * .62);
    ctx.lineWidth = width;
    ctx.strokeStyle = strokeStyle;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
      const point = points[pointIndex];
      const next = points[pointIndex + 1];
      ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
    }
    ctx.lineTo(points.at(-1).x, points.at(-1).y);
    ctx.stroke();
    ctx.restore();
  };
  // 세 기억은 굵은 촉수처럼 따로 뻗지 않고, 가느다란 빛실로 같은 매듭에 모인다.
  stroke(6.5, '#19395f', .14, 16);
  stroke(3.25, color, .58, 12);
  stroke(1.35, '#edfffb', .75, 6);
  stroke(.6, '#fff0bd', .94, 2);
  for (let sparkleIndex = 0; sparkleIndex < 4; sparkleIndex += 1) {
    const t = Math.min(reveal, (progress * 1.08 + sparkleIndex * .23 + index * .19) % 1);
    const point = releaseCurvePoint(start, control, end, t);
    ctx.save();
    ctx.globalAlpha = .58 + Math.sin((game.elapsed || 0) * 7 + sparkleIndex) * .16;
    ctx.shadowBlur = 10; ctx.shadowColor = color;
    ctx.fillStyle = sparkleIndex === 1 ? '#fff7cb' : color;
    const size = sparkleIndex % 2 ? 3 : 2;
    ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    ctx.restore();
  }
}

function drawFinalMemoryKnot(point, progress) {
  const pulse = .82 + Math.sin((game.elapsed || 0) * 8) * .12;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .34 + progress * .66;
  ctx.shadowBlur = 22; ctx.shadowColor = '#a8f7ff';
  ctx.fillStyle = '#d9f8ff'; ctx.beginPath(); ctx.arc(0, 0, 7 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffe6a2'; ctx.lineWidth = 1.5;
  for (let ring = 0; ring < 2; ring += 1) {
    ctx.globalAlpha = (.38 - ring * .12) * progress;
    ctx.beginPath(); ctx.arc(0, 0, (14 + ring * 7) * pulse, ring * .9, Math.PI * 2 + ring * .9); ctx.stroke();
  }
  ctx.globalAlpha = .92 * progress;
  ctx.fillStyle = '#fff8d1';
  ctx.fillRect(-2, -8, 4, 16); ctx.fillRect(-8, -2, 16, 4);
  ctx.restore();
}

function drawFinalMemoryBraid(start, end, progress, braid) {
  const reveal = Math.max(0, Math.min(1, progress));
  if (reveal <= 0) return;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const angle = Math.atan2(dy, dx);
  const spriteWidth = Math.max(188, length);
  const spriteHeight = braid?.naturalWidth && braid?.naturalHeight
    ? spriteWidth * braid.naturalHeight / braid.naturalWidth
    : 88;
  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(angle);
  ctx.globalAlpha = .18 + reveal * .82;
  ctx.shadowBlur = 20; ctx.shadowColor = '#a8f7ff';
  ctx.beginPath();
  ctx.rect(-4, -spriteHeight / 2 - 8, spriteWidth * reveal + 8, spriteHeight + 16);
  ctx.clip();
  if (braid?.complete && braid.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(braid, 0, -spriteHeight / 2, spriteWidth, spriteHeight);
  } else {
    ctx.strokeStyle = '#9ef7ff'; ctx.lineWidth = 15; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(spriteWidth, 0); ctx.stroke();
  }
  ctx.restore();
}

function drawFinalReleaseScene(b) {
  if (b.mode !== 'final' || !b.releaseReady) return;
  const progress = b.releaseProgress / b.releaseDuration;
  const colors = ['#ffb5d7', '#9effd7', '#a6efff'];
  const braid = ensureSprite(memoryEffectSprites.finalMemoryBraid);
  const destination = { x: b.x + b.w * .36, y: b.y + b.h * .55 };
  // 세 친구의 기억은 가까운 세 끝점이 아니라 하나의 '기억 매듭'에서 합쳐진다.
  const braidStart = { x: destination.x - 188, y: destination.y + 2 };
  const knotProgress = Math.max(0, Math.min(1, (progress - .54) / .14));
  const braidProgress = Math.max(0, Math.min(1, (progress - .66) / .28));
  ctx.save();
  b.memoryPads.forEach((pad, index) => {
    const start = { x: pad.x + pad.w / 2, y: pad.y + pad.h / 2 };
    const end = braidStart;
    const control = {
      x: start.x + (end.x - start.x) * .46,
      y: start.y + (end.y - start.y) * .5 + (index - 1) * 46,
    };
    drawFinalMemoryBranch(start, control, end, colors[index], index, progress);
  });
  // 세 빛실이 모두 닿은 뒤에만 매듭이 맺히고, 그 다음 리본이 한 줄로 흘러간다.
  drawFinalMemoryKnot(braidStart, knotProgress);
  // 매듭 이후에는 원화의 한 줄짜리 빛 리본만 남아, 기억이 한 방향으로 되돌아간다는 인상을 준다.
  drawFinalMemoryBraid(braidStart, destination, braidProgress, braid);
  ctx.globalAlpha = .10 + progress * .12; ctx.fillStyle = '#efffff'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(12, 23, 47, .88)'; ctx.fillRect(168, 438, 624, 48);
  ctx.strokeStyle = '#ffe27e'; ctx.lineWidth = 1; ctx.strokeRect(168.5, 438.5, 623, 47);
  ctx.fillStyle = '#fff4c4'; ctx.font = '800 12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
  const line = progress < .52 ? '딸  “아빠, 친구들의 행복을 돌려줘.”' : '수면 과학자  “그래… 이제는 놓아줄게.”';
  ctx.fillText(line, W / 2, 468);
  ctx.restore();
}

function cinematicEase(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function drawCinematicPixelChild(x, groundY, colors, scale = 1, asleep = false) {
  ctx.save();
  ctx.translate(x, groundY); ctx.scale(scale, scale);
  ctx.shadowBlur = 16; ctx.shadowColor = colors.glow || colors.clothes;
  ctx.fillStyle = 'rgba(0, 0, 0, .24)'; ctx.fillRect(-15, 0, 30, 4);
  ctx.shadowBlur = 0;
  ctx.fillStyle = colors.hair; ctx.fillRect(-11, -38, 22, 15);
  ctx.fillStyle = '#ffd4b4'; ctx.fillRect(-8, -31, 16, 13);
  ctx.fillStyle = colors.hair; ctx.fillRect(-11, -39, 22, 6); ctx.fillRect(-11, -33, 4, 12);
  ctx.fillStyle = asleep ? '#78586b' : '#26385c';
  ctx.fillRect(-5, -27, 3, 2); ctx.fillRect(2, -27, 3, 2);
  if (!asleep) { ctx.fillStyle = '#fff1a6'; ctx.fillRect(3, -25, 2, 2); }
  ctx.fillStyle = colors.clothes; ctx.fillRect(-10, -18, 20, 16);
  ctx.fillStyle = colors.detail || '#fff0a6'; ctx.fillRect(-4, -14, 8, 3);
  ctx.fillStyle = '#415179'; ctx.fillRect(-8, -2, 6, 8); ctx.fillRect(2, -2, 6, 8);
  ctx.fillStyle = '#ffe6c5'; ctx.fillRect(-14, -16, 4, 10); ctx.fillRect(10, -16, 4, 10);
  ctx.restore();
}

function drawCinematicScientist(x, groundY, scale = 1, softened = false) {
  ctx.save();
  ctx.translate(x, groundY); ctx.scale(scale, scale);
  ctx.shadowBlur = softened ? 20 : 12; ctx.shadowColor = softened ? '#ffe27e' : '#a88cff';
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-22, 0, 44, 5);
  ctx.fillStyle = '#d7d9ed'; ctx.fillRect(-14, -23, 28, 24);
  ctx.fillStyle = softened ? '#f7e7bd' : '#aab8d6'; ctx.fillRect(-11, -44, 22, 19);
  ctx.fillStyle = '#4a4d72'; ctx.fillRect(-14, -47, 28, 8); ctx.fillRect(-14, -43, 5, 13);
  ctx.fillStyle = '#203354'; ctx.fillRect(-7, -37, 4, 3); ctx.fillRect(3, -37, 4, 3);
  ctx.fillStyle = '#6e5172'; ctx.fillRect(-3, -29, 6, 2);
  ctx.fillStyle = '#2b4269'; ctx.fillRect(-12, 1, 8, 12); ctx.fillRect(4, 1, 8, 12);
  ctx.fillStyle = '#9bf5ff'; ctx.fillRect(-3, -18, 6, 12);
  ctx.restore();
}

function drawCinematicMachine(x, y, pulse, dim = false) {
  ctx.save();
  const glow = dim ? '#716c93' : '#7be9ff';
  ctx.shadowBlur = 28; ctx.shadowColor = glow;
  ctx.fillStyle = dim ? '#27304a' : '#173f5a'; ctx.fillRect(x - 76, y - 106, 152, 214);
  ctx.strokeStyle = glow; ctx.lineWidth = 3; ctx.strokeRect(x - 76, y - 106, 152, 214);
  ctx.fillStyle = 'rgba(146, 247, 255, .18)'; ctx.fillRect(x - 48, y - 76, 96, 132);
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y - 8, 21 + pulse * 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111c37'; ctx.beginPath(); ctx.arc(x, y - 8, 11, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#b9eeff'; ctx.font = '800 9px "Segoe UI", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('꿈의 연결 장치', x, y + 86);
  ctx.restore();
}

function drawCinematicStars(color, amount = 36, drift = 0) {
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < amount; i += 1) {
    const x = (i * 83 + 41 + drift * (i % 3 + 1)) % W;
    const y = 36 + ((i * 59) % 330);
    const size = i % 5 === 0 ? 3 : 1;
    ctx.globalAlpha = .24 + (i % 4) * .12; ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawCinematicDialogue(scene, elapsed) {
  const typedLine = Array.from(scene.line).slice(0, Math.min(scene.line.length, Math.floor(elapsed * 34))).join('');
  ctx.save();
  ctx.fillStyle = 'rgba(5, 10, 25, .84)'; ctx.fillRect(54, 408, W - 108, 105);
  ctx.strokeStyle = '#d9e9ff66'; ctx.lineWidth = 1; ctx.strokeRect(54.5, 408.5, W - 109, 104);
  ctx.fillStyle = '#ffe27e'; ctx.font = '800 10px "Segoe UI", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'left'; ctx.fillText(scene.speaker, 78, 434);
  ctx.fillStyle = '#f2f6ff'; ctx.font = '700 15px "Segoe UI", sans-serif'; ctx.fillText(typedLine, 78, 460);
  ctx.fillStyle = '#aebbd4'; ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.fillText(scene.caption, 78, 485);
  const ready = elapsed > .7;
  if (ready) {
    ctx.globalAlpha = .5 + Math.sin(elapsed * 4) * .3;
    ctx.fillStyle = '#9effea'; ctx.font = '700 9px "Segoe UI", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'right'; ctx.fillText('Enter · 클릭 · 다음', W - 78, 496);
  }
  ctx.restore();
}

function drawEndingCinematic() {
  const scene = ENDING_CINEMATIC_SCENES[game.endingScene] || ENDING_CINEMATIC_SCENES[0];
  const elapsed = game.endingSceneElapsed || 0;
  const progress = cinematicEase(elapsed / scene.duration);
  const cinematicImage = ensureSprite(endingCinematicSprites[scene.kind]);
  const hasSceneArt = cinematicImage?.complete && cinematicImage.naturalWidth > 0;
  if (!hasSceneArt) {
    // 원화가 준비되는 찰나에는 캐릭터 대용 도형을 그리지 않고, 장면색만 잠깐 유지한다.
    const backdrop = ctx.createLinearGradient(0, 0, 0, H);
    backdrop.addColorStop(0, '#182950');
    backdrop.addColorStop(1, '#070d24');
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, W, H);
    drawCinematicStars('#d9eaff', 24, elapsed * 6);
  }
  if (hasSceneArt) {
    // 16:9 원화는 미세하게만 줌인해 정지 그림도 영화 컷처럼 느껴지게 한다.
    const imageScale = Math.max(W / cinematicImage.naturalWidth, H / cinematicImage.naturalHeight) * (1.01 + progress * .024);
    const imageW = cinematicImage.naturalWidth * imageScale;
    const imageH = cinematicImage.naturalHeight * imageScale;
    const panX = Math.sin(progress * Math.PI) * 7;
    const imageX = (W - imageW) / 2 - panX;
    const imageY = (H - imageH) / 2;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = Math.min(1, elapsed * 1.45);
    ctx.drawImage(cinematicImage, imageX, imageY, imageW, imageH);
    const vignette = ctx.createLinearGradient(0, 0, 0, H);
    vignette.addColorStop(0, 'rgba(4, 9, 26, .30)');
    vignette.addColorStop(.42, 'rgba(4, 9, 26, .04)');
    vignette.addColorStop(.72, 'rgba(4, 9, 26, .16)');
    vignette.addColorStop(1, 'rgba(3, 8, 22, .72)');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    drawCinematicStars(scene.kind === 'morning' ? '#fff1bf' : '#d9eaff', 24, elapsed * 6);
  }
  ctx.save(); ctx.globalAlpha = Math.min(1, elapsed * 1.2); ctx.fillStyle = '#d9edff'; ctx.font = '800 10px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText(scene.tag, W / 2, 48);
  ctx.fillStyle = '#fff7dc'; ctx.font = '850 32px "Segoe UI", sans-serif'; ctx.fillText(scene.title, W / 2, 86); ctx.restore();
  drawCinematicDialogue(scene, elapsed);
  const fade = Math.max(0, Math.min(1, (elapsed - scene.duration + .5) / .5));
  if (fade > 0) { ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = '#060817'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

function drawPuzzle() {
  drawBackground(false);
  if (game.layout === 'carousel') drawCarouselStageDimming();
  drawLayoutLandmarks();
  if (game.layout === 'carousel') drawCarouselMazeConnectors();
  const techniques = activeTechniques();
  const memoryPadsReady = puzzleObjectiveReady();
  const gateOpen = memoryPadsReady && (game.layout !== 'watcher' || game.watcherResolved);
  const stage02GateStructure = game.layout === 'bridge'
    ? game.platforms.find((platform) => platform.wall && platform.label === 'MEMORY GATE')
    : null;
  if (stage02GateStructure) drawHarinStage02Restoration(stage02GateStructure, 'far');
  (game.fallZones || []).forEach(drawFallZone);
  game.platforms.forEach((platform) => {
    const hidden = !signpostPathRevealed(platform, techniques);
    if (platform === stage02GateStructure) {
      return;
    } else if (game.layout === 'carousel' && platform.carouselArtCollider) {
      drawCarouselStructureGuide(platform);
      return;
    } else if (platform.collapseWithMemory && game.windPillarReleased) {
      // 15스테이지는 투명 벽을 남기지 않고, 실제로 무너지는 마지막 프레임만 보여 준다.
      drawHaneulHeadwindPillar(platform);
    } else if (platform.wall && gateOpen && game.layout === 'carousel' && !platform.persistentWall) {
      return;
    } else if (platform.wall && gateOpen && !platform.persistentWall) {
      ctx.save(); ctx.globalAlpha = .16; drawPlatform(platform); ctx.restore();
    } else if (hidden) {
      ctx.save(); ctx.globalAlpha = .14; drawPlatform(platform); ctx.restore();
    } else drawPlatform(platform);
  });
  if (game.layout === 'carousel') {
    drawCarouselStructureJoints();
    drawCarouselOrbitSystem();
    (game.carouselSwitches || []).forEach(drawCarouselRelaySwitch);
  }
  if (game.layout === 'wall') {
    drawLaughRelayNetwork();
    getWallResonancePaths().forEach(drawResonancePath);
  }
  if (game.layout === 'watcher') drawWatcher(getWatcher(), frozenTime(), game.watcherResolved);
  game.memoryPads.forEach((pad, index) => {
    // 공명이 꺼져 있을 때는 9스테이지의 기억 발판도 함께 감춘다.
    if (!pad.hidden || techniques.resonance) {
      const padActive = activeMemoryPads([pad]) > 0 || (game.layout === 'carousel' && game.carouselCoreLatched);
      drawMemoryPad(pad, padActive, index);
    }
  });
  drawMemoryLoopFeedback();
  game.echoes.forEach(drawEcho);
  if (game.exit) {
    if (game.layout === 'carousel') drawCarouselMazeExit();
    else drawExit();
  }
  drawDreamTrails(false);
  if (game.player) drawChild(game.player);
  // 고정된 연기 잔상은 해당 기억 발판에 남길 K 기억의 방향을 미리 보여 준다.
  drawMemoryPadDirectionGhosts();
  // 8스테이지의 유령 합창단은 K 발판 위의 플레이어·기억보다 앞에 그려,
  // 그 자리에 남겨야 할 목소리임을 분명히 보여 준다.
  drawChoirBalconySingerCues();
  if (stage02GateStructure) drawHarinStage02Restoration(stage02GateStructure, 'near');
  drawYunaLoopStationMeter();
  drawPhaseGuide();
}

function shortestAngleDelta(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function drawHaneulSignpost(sign) {
  const { x, groundY, scale = 1 } = sign;
  const compassImage = objectSprites.haneulWindCompassArrow;
  const signpostImage = objectSprites.haneulTrueSignpost;
  const maze = game.signpostMaze;
  const done = Boolean(maze?.[sign.unlock]);
  const active = activeSignpost(maze) === sign;
  const nearby = playerNearSignpost(sign);
  const progress = active ? Math.max(0, Math.min(1, (maze?.charge || 0) / SIGNPOST_RESONANCE_SECONDS)) : 0;
  const turn = done ? 1 : progress;
  const angle = (sign.startAngle || 0) + shortestAngleDelta(sign.startAngle || 0, sign.targetAngle || 0) * turn;
  const postHeight = 156 * scale;
  const postWidth = signpostImage?.naturalWidth && signpostImage?.naturalHeight
    ? postHeight * signpostImage.naturalWidth / signpostImage.naturalHeight
    : 104 * scale;
  const compassSize = 48 * scale;
  const centerY = groundY - postHeight * .54;
  const color = done ? '#a8ffe2' : active ? '#e5fcff' : '#7fa9d2';
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // 배경의 장식 표지판과 달리, 실제 표지판은 금빛 기둥과 푸른 나침반으로 한눈에 구분한다.
  ctx.globalAlpha = done ? 1 : active ? .98 : .53;
  ctx.shadowBlur = done ? 24 : active ? 18 : 5;
  ctx.shadowColor = color;
  if (signpostImage?.complete && signpostImage.naturalWidth > 0) {
    ctx.drawImage(signpostImage, x - postWidth / 2, groundY - postHeight + 9 * scale, postWidth, postHeight);
  } else {
    ctx.fillStyle = '#274766';
    ctx.fillRect(x - 9 * scale, groundY - postHeight + 16 * scale, 18 * scale, postHeight - 16 * scale);
    ctx.fillStyle = '#d5a85d';
    ctx.fillRect(x - 12 * scale, groundY - postHeight + 13 * scale, 24 * scale, 8 * scale);
    ctx.fillRect(x - 17 * scale, centerY - 6 * scale, 34 * scale, 12 * scale);
  }

  ctx.save();
  ctx.translate(x, centerY);
  ctx.rotate(angle);
  ctx.globalAlpha = done ? .98 : active ? .96 : .54;
  ctx.shadowBlur = done ? 22 : active ? 18 : 6;
  ctx.shadowColor = color;
  if (compassImage?.complete && compassImage.naturalWidth > 0) {
    ctx.drawImage(compassImage, -compassSize / 2, -compassSize / 2, compassSize, compassSize);
  } else {
    ctx.strokeStyle = '#bcdcff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, compassSize * .31, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#2c4f7d'; ctx.beginPath(); ctx.arc(0, 0, compassSize * .22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bdf8ff';
    ctx.beginPath(); ctx.moveTo(compassSize * .46, 0); ctx.lineTo(compassSize * .1, -compassSize * .18); ctx.lineTo(compassSize * .1, compassSize * .18); ctx.closePath(); ctx.fill();
  }
  if (done || active) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = done ? .48 : .24 + progress * .42;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, compassSize * (.42 + Math.sin((game.elapsed || 0) * 5) * .025), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
  drawInteractionBeacon({
    x,
    y: Math.max(18, groundY - postHeight - 7),
    color,
    symbol: done ? sign.directionGlyph : active ? 'L' : '↻',
    detail: done ? '바람길이 고정됐어요' : active ? 'L · 바람을 돌리기' : '바람의 방향을 찾으세요',
    active: done || active,
    near: nearby,
  });
  if (nearby) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let dot = 0; dot < 7; dot += 1) {
      const lit = dot / 6 <= progress;
      ctx.globalAlpha = lit ? .96 : .24;
      ctx.shadowBlur = lit ? 8 : 0;
      ctx.shadowColor = color;
      ctx.fillStyle = lit ? color : '#34546d';
      ctx.fillRect(x - 30 + dot * 10, groundY - 10, lit ? 5 : 3, lit ? 3 : 2);
    }
    ctx.restore();
  }
}

function drawSignpostWindRoutes() {
  const maze = game.signpostMaze;
  if (!maze) return;
  const t = game.elapsed || 0;
  const strokeRibbon = (drawPath, color, width, alpha, glow = 0) => {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = glow;
    ctx.shadowColor = color;
    ctx.beginPath();
    drawPath();
    ctx.stroke();
    ctx.restore();
  };
  const drawWindRouteSeed = (x, y, angle, intensity = 1) => {
    const pulse = .72 + Math.sin(t * 4.2 + x * .013) * .18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .78 * intensity;
    ctx.shadowBlur = 13;
    ctx.shadowColor = '#7eefff';
    for (let strand = 0; strand < 3; strand += 1) {
      const offset = (strand - 1) * 6;
      ctx.strokeStyle = strand === 1 ? '#fff0aa' : '#a7f3ff';
      ctx.lineWidth = strand === 1 ? 1.7 : 1.15;
      ctx.beginPath();
      ctx.moveTo(-17, offset);
      ctx.quadraticCurveTo(-2, offset * .45 - 8, 15 + pulse * 2, offset * .15);
      ctx.stroke();
    }
    ctx.fillStyle = '#efffff';
    ctx.beginPath();
    ctx.moveTo(18 + pulse * 2, 0);
    ctx.lineTo(8, -5);
    ctx.lineTo(11, 0);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  if (maze.unmasked) {
    // 첫 화살표는 세로 소용돌이 승강기를 만든다. 실제 상승 물리와 같은 위치를 공유한다.
    // 정적인 선 대신 전용 픽셀 원화를 중심에 두고, 아주 얇은 흐름선만 움직여 살아 있는 기류로 보이게 한다.
    const updraftArt = memoryEffectSprites.haneulUpdraftLift;
    const artReady = Boolean(updraftArt?.complete && updraftArt.naturalWidth > 0);
    if (artReady) {
      const breathe = 1 + Math.sin(t * 2.25) * .018;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = .82 + Math.sin(t * 3.1) * .09;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#7eefff';
      ctx.translate(326, 353 + Math.sin(t * 2.4) * 2);
      ctx.scale(breathe, breathe);
      ctx.drawImage(updraftArt, -58, -126, 116, 252);
      ctx.restore();
    }
    drawWindRouteSeed(326, 454, -Math.PI / 2, 1);
    for (let ribbon = 0; ribbon < (artReady ? 2 : 4); ribbon += 1) {
      const phase = t * 2.6 + ribbon * Math.PI / 2;
      const sway = Math.sin(phase) * 22;
      strokeRibbon(() => {
        ctx.moveTo(326 + sway * .32, 454);
        ctx.bezierCurveTo(282 - sway, 398, 382 + sway, 328, 326 - sway * .26, 252);
      }, ribbon % 2 ? '#a6efff' : '#9effd7', artReady ? (ribbon % 2 ? 1.4 : 2.2) : (ribbon % 2 ? 3 : 5), artReady ? .18 + ribbon * .05 : .26 + ribbon * .045, artReady ? 8 : 13);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let mote = 0; mote < 14; mote += 1) {
      const climb = (t * (.36 + (mote % 3) * .05) + mote * .117) % 1;
      const x = 326 + Math.sin(climb * Math.PI * 5 + mote) * (17 + (mote % 2) * 8);
      const y = 458 - climb * 210;
      ctx.globalAlpha = .28 + (1 - climb) * .42;
      ctx.fillStyle = mote % 3 ? '#bff8ff' : '#fff3b0';
      ctx.fillRect(x - 1, y - 1, mote % 3 ? 3 : 4, mote % 3 ? 2 : 3);
    }
    ctx.restore();
  }
  if (maze.anchored) {
    // 두 번째 화살표의 흐름은 발판과 똑같은 S자 곡선을 따라가, 다음 점프가 어디를 향하는지 보여 준다.
    const weavePath = () => {
      ctx.moveTo(556, 238);
      ctx.bezierCurveTo(590, 256, 598, 314, 608, 302);
      ctx.bezierCurveTo(638, 267, 650, 219, 697, 228);
      ctx.bezierCurveTo(730, 236, 722, 315, 780, 318);
    };
    strokeRibbon(weavePath, '#315f9e', 16, .16, 22);
    strokeRibbon(weavePath, '#86f0ff', 7, .36, 17);
    strokeRibbon(weavePath, '#e8fffb', 2, .64, 8);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let mote = 0; mote < 11; mote += 1) {
      const travel = (t * .34 + mote * .091) % 1;
      const x = 562 + travel * 214;
      const y = 269 + Math.sin(travel * Math.PI * 3.1) * (45 + Math.sin(travel * Math.PI) * 18);
      ctx.globalAlpha = .42 + Math.sin(t * 6 + mote) * .14;
      ctx.fillStyle = mote % 3 ? '#a6efff' : '#fff1ac';
      ctx.fillRect(x - 2, y - 1, mote % 3 ? 4 : 5, 3);
    }
    ctx.restore();
    drawWindRouteSeed(556, 238, .18, 1);
    drawWindRouteSeed(780, 318, .05, .84);
  }
  if (maze.exitAligned) {
    // 마지막 화살표는 짧지만 강한 제트 고리를 만들어 질주와 결합한다.
    const pulse = .72 + (maze.jetPulse || 0) * .55;
    const jetPath = () => {
      ctx.moveTo(798, 307);
      ctx.bezierCurveTo(834, 302, 838, 258, 880, 253);
      ctx.bezierCurveTo(903, 250, 920, 244, 942, 238);
    };
    strokeRibbon(jetPath, '#24568e', 19 * pulse, .17, 22);
    strokeRibbon(jetPath, '#82efff', 8 * pulse, .48, 18);
    strokeRibbon(jetPath, '#fff0ae', 2.2, .74, 9);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(854, 266);
    ctx.rotate(-.33);
    ctx.globalAlpha = .7 + (maze.jetPulse || 0) * .25;
    ctx.fillStyle = '#fff5bd';
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-7, -8); ctx.lineTo(-1, 0); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    drawWindRouteSeed(798, 307, -.18, 1);
    drawWindRouteSeed(940, 238, -.12, .82);
  }
}

function drawWindCliffHeadwind() {
  const strength = windCliffHeadwindStrength();
  if (strength <= 0) return;
  const t = game.elapsed || 0;
  const pillar = game.platforms.find((platform) => platform.label === 'HEADWIND PILLAR');
  const sourceX = pillar ? pillar.x + pillar.w / 2 : 700;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  // 기둥에서 출발한 넓은 난류 리본이 플레이어 쪽으로 휘어 나가는 형태. 단순 가로 선보다 압력감을 준다.
  for (let index = 0; index < 9; index += 1) {
    const travel = (t * (.42 + (index % 3) * .055) + index * .163) % 1;
    const laneY = 88 + index * 45 + Math.sin(t * 1.7 + index * 1.9) * 18;
    const headX = sourceX - travel * (sourceX + 125);
    const tailX = Math.min(sourceX + 32, headX + 146 + (index % 3) * 31);
    const curl = (index % 2 ? -1 : 1) * (24 + (index % 4) * 7);
    const ribbon = ctx.createLinearGradient(headX, laneY, tailX, laneY);
    ribbon.addColorStop(0, 'rgba(49, 199, 255, 0)');
    ribbon.addColorStop(.56, index % 3 === 0 ? 'rgba(147, 243, 255, .42)' : 'rgba(54, 194, 255, .34)');
    ribbon.addColorStop(1, 'rgba(218, 253, 255, .04)');
    ctx.globalAlpha = (.56 + (index % 2) * .17) * strength;
    ctx.strokeStyle = ribbon;
    ctx.lineWidth = 4 + (index % 3) * 2;
    ctx.beginPath();
    ctx.moveTo(tailX, laneY - curl * .14);
    ctx.bezierCurveTo(tailX - 44, laneY - curl, headX + 54, laneY + curl, headX, laneY + Math.sin(t * 4.8 + index) * 7);
    ctx.stroke();
    ctx.globalAlpha = (.34 + (index % 3) * .08) * strength;
    ctx.strokeStyle = '#d9fbff'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tailX - 10, laneY - curl * .12);
    ctx.bezierCurveTo(tailX - 52, laneY - curl * .72, headX + 48, laneY + curl * .72, headX + 7, laneY);
    ctx.stroke();
  }
  // 작은 빛·먼지 입자는 바람에 따라 왼쪽으로 가속해, 공중 물리와 시각 효과가 같은 방향임을 보여 준다.
  for (let index = 0; index < 28; index += 1) {
    const travel = (t * (.68 + (index % 5) * .06) + index * .071) % 1;
    const particleX = sourceX + 52 - travel * (sourceX + 94);
    const particleY = 92 + (index * 61) % 374 + Math.sin(t * 6 + index) * 12;
    const particleSize = index % 4 === 0 ? 3 : 1.5;
    ctx.globalAlpha = (.18 + (index % 3) * .08) * strength;
    ctx.fillStyle = index % 4 === 0 ? '#e8fdff' : '#60dcff';
    ctx.fillRect(particleX, particleY, particleSize * 3.4, particleSize);
  }
  ctx.globalAlpha = .11 * strength;
  ctx.fillStyle = '#76eaff'; ctx.fillRect(0, 462, sourceX + 30, 3);
  ctx.restore();
}

function drawLayoutLandmarks() {
  const layout = game.layout;
  ctx.save();
  if (layout === 'carousel') {
    // 원형벽과 실제 이동면은 배경 위에 충돌 판정과 동일한 픽셀 실루엣으로 표시한다.
  } else if (layout === 'lantern-river') {
    // 실제 픽셀 배경의 수로와 반사를 그대로 사용해 도형 장식이 겹치지 않게 한다.
  } else if (layout === 'choir-balcony') {
    // 교실과 합창 발코니는 실제 픽셀 배경에 포함되어 있다.
  } else if (layout === 'harmony-spiral') {
    // 두 선율의 나선은 실제 픽셀 배경에 포함되어 있다.
  } else if (layout === 'wind-tunnel') {
    // 위아래로 갈라지는 바람 터널은 실제 픽셀 배경에 포함되어 있다.
  } else if (layout === 'wind-cliff') {
    // 여러 높이의 절벽은 배경에, 공중을 되미는 역풍은 상호작용 효과로 별도 표시한다.
    drawWindCliffHeadwind();
  } else if (layout === 'signpost-maze') {
    // 화살표가 고정될수록 실제 상승기류·S자 공중 다리·질주 제트가 배경 위에 이어진다.
    // 먼저 그려 발판과 윤호가 바람의 흐름 위를 통과하는 깊이감을 만든다.
    drawSignpostWindRoutes();
    (game.signpostMaze?.signposts || []).forEach(drawHaneulSignpost);
  } else if (layout === 'starlight-ferry') {
    // 발자국 빛과 완벽한 정원으로 이어지는 전환은 실제 픽셀 배경에 포함되어 있다.
  } else if (layout === 'garden-roots') {
    ctx.strokeStyle = 'rgba(184, 255, 207, .22)'; ctx.lineWidth = 5;
    [138, 330, 514, 702].forEach((x, index) => { ctx.beginPath(); ctx.moveTo(x, 76); ctx.bezierCurveTo(x - 48, 210, x + 86, 344, x + (index % 2 ? -30 : 44), 504); ctx.stroke(); });
    ctx.fillStyle = 'rgba(255, 181, 223, .13)'; ctx.fillRect(0, 464, W, 76);
  } else if (layout === 'classroom-fracture') {
    ctx.strokeStyle = 'rgba(255, 181, 223, .26)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(196, 500); ctx.lineTo(308, 418); ctx.lineTo(420, 352); ctx.lineTo(530, 282); ctx.lineTo(652, 364); ctx.lineTo(790, 420); ctx.stroke();
    ctx.fillStyle = 'rgba(233, 248, 255, .12)'; [78, 184, 708, 820].forEach((x) => ctx.fillRect(x, 120, 42, 84));
  }
  ctx.restore();
}

function drawWindGate(gate, index, active, cleared, unlocked) {
  const locked = !unlocked && !cleared;
  const nearby = playerNearObject(gate, 92);
  const riftSprite = objectSprites.haneulDashRiftGate;
  const riftReady = riftSprite?.complete && riftSprite.naturalWidth > 0;
  const color = locked ? '#687487' : cleared ? '#8bc6c1' : active ? '#d7fbff' : '#7391ad';
  ctx.save();
  ctx.translate(gate.x + gate.w / 2, gate.y + gate.h / 2);
  ctx.globalAlpha = locked ? .12 : cleared ? .22 : active ? 1 : .32;
  ctx.strokeStyle = color;
  ctx.shadowBlur = active ? 24 : 0;
  ctx.shadowColor = '#a9f6ff';
  ctx.lineWidth = active ? 4 : 2;
  if (riftReady) {
    ctx.imageSmoothingEnabled = false;
    const visualHeight = Math.max(152, gate.h * 1.84);
    const visualWidth = visualHeight * riftSprite.naturalWidth / riftSprite.naturalHeight;
    ctx.drawImage(riftSprite, -visualWidth / 2, -visualHeight / 2, visualWidth, visualHeight);
  } else {
    // 원화가 아직 준비되지 않았을 때만 최소한의 균열 실루엣을 남긴다.
    ctx.fillStyle = '#122a4d';
    ctx.beginPath(); ctx.ellipse(0, 0, gate.w / 2, gate.h / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, gate.w / 2, gate.h / 2, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // 테두리 고리 대신 바람 조각이 문 주위를 순환한다. 문 자체의 일러스트가 먼저 읽히게 한다.
  ctx.globalCompositeOperation = 'screen';
  const time = game.elapsed || 0;
  const moteCount = locked ? 2 : cleared ? 3 : active ? 9 : 5;
  for (let mote = 0; mote < moteCount; mote += 1) {
    const angle = time * (1.85 + mote * .04) + mote * Math.PI * 2 / moteCount;
    const rx = gate.w / 2 + 7 + (mote % 2) * 5;
    const ry = gate.h / 2 + 7 + (mote % 3) * 3;
    const moteX = Math.cos(angle) * rx;
    const moteY = Math.sin(angle) * ry;
    ctx.globalAlpha = locked ? .16 : cleared ? .32 : active ? .86 : .46;
    ctx.fillStyle = color;
    const size = mote % 3 === 0 ? 3 : 2;
    ctx.fillRect(Math.round(moteX - size / 2), Math.round(moteY - size / 2), size, size);
  }
  ctx.restore();
  drawInteractionBeacon({
    x: gate.x + gate.w / 2,
    y: Math.max(17, gate.y - 17),
    color,
    symbol: locked ? '×' : cleared ? '✓' : '⇢',
    detail: locked ? '바람길을 먼저 고정하세요' : cleared ? '순풍이 남았어요' : 'Space · 순풍 타기',
    active: active || cleared,
    near: nearby,
  });
}

function drawFinalVoiceAltar(gate, active, progress = 0) {
  const image = ensureSprite(objectSprites.scientistDaughterVoiceAltar);
  const centerX = gate.x + gate.w / 2;
  const baseY = gate.y + gate.h + 12;
  const pulse = .5 + Math.sin((game.elapsed || 0) * 5.4) * .5;
  const visualHeight = 146 + (active ? 8 + pulse * 7 : 0);
  const visualWidth = image?.naturalWidth && image?.naturalHeight
    ? visualHeight * image.naturalWidth / image.naturalHeight
    : 158;
  ctx.save();
  ctx.translate(centerX, baseY - visualHeight * .52);
  ctx.globalAlpha = active ? 1 : .72;
  ctx.shadowBlur = active ? 36 + pulse * 18 : 15;
  ctx.shadowColor = active ? '#bffeff' : '#76bce8';
  ctx.fillStyle = 'rgba(93, 221, 255, .16)';
  ctx.beginPath(); ctx.ellipse(0, visualHeight * .12, visualWidth * .41 + pulse * 7, 19 + pulse * 5, 0, 0, Math.PI * 2); ctx.fill();
  if (image?.complete && image.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, -visualWidth / 2, -visualHeight / 2, visualWidth, visualHeight);
  } else {
    ctx.fillStyle = '#102a55'; ctx.beginPath(); ctx.ellipse(0, 18, 54, 19, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#aef8ff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#69eaff'; ctx.beginPath(); ctx.arc(0, -8, 12, 0, Math.PI * 2); ctx.fill();
  }
  if (active) {
    ctx.globalAlpha = .46 + pulse * .38;
    ctx.strokeStyle = '#fff1b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, visualHeight * .13, visualWidth * .47 + pulse * 11, 27 + pulse * 8, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const nearby = playerNearObject(gate, 102);
  drawInteractionBeacon({
    x: centerX,
    y: gate.y - 18,
    color: active ? '#fff0b6' : '#a6efff',
    symbol: active ? '✓' : 'L',
    detail: active ? `목소리 ${percent}%` : 'L · 딸의 목소리',
    active,
    near: nearby,
    scale: 1.05,
  });
  if (active || progress > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let dot = 0; dot < 8; dot += 1) {
      const lit = dot / 7 <= progress;
      ctx.globalAlpha = lit ? .96 : .2;
      ctx.fillStyle = lit ? '#ffe5a2' : '#8ad7ef';
      ctx.shadowBlur = lit ? 9 : 0;
      ctx.shadowColor = '#ffe5a2';
      ctx.fillRect(centerX - 35 + dot * 10, gate.y + 2, lit ? 5 : 3, lit ? 3 : 2);
    }
    ctx.restore();
  }
}

function drawDreamGate(gate, active, cleared, kind = 'resonance', revealed = true, heartbeat = 0) {
  const fakeMirror = kind === 'false-mirror';
  const mirror = kind === 'mirror' || fakeMirror;
  const yunaResonancePad = kind === 'resonance' && game.boss?.mode === 'resonance';
  const nearby = playerNearObject(gate, 94);
  const resonanceImage = platformSprites.yunaResonancePad;
  const color = fakeMirror ? '#ff789f' : mirror ? '#ffb5df' : '#9effea';
  ctx.save();
  ctx.translate(gate.x + gate.w / 2, gate.y + gate.h / 2);
  if (heartbeat > 0) ctx.scale(1 + heartbeat * .16, 1 + heartbeat * .16);
  ctx.globalAlpha = cleared ? .2 : revealed ? active ? 1 : .5 : .08;
  ctx.shadowBlur = active ? 26 + heartbeat * 24 : 8; ctx.shadowColor = color;
  ctx.strokeStyle = color; ctx.lineWidth = active ? 4 : 2;
  if (yunaResonancePad && resonanceImage?.complete && resonanceImage.naturalWidth > 0) {
    // 유나 보스전의 음은 일반 원형 게이트가 아니라 실제로 올라서는 공명 악기 발판이다.
    const spriteW = gate.w * 1.62;
    const spriteH = gate.h * 1.78;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(resonanceImage, -spriteW / 2, -spriteH * .62, spriteW, spriteH);
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.ellipse(0, 4, gate.w / 2 + 8, gate.h / 2 + 8, 0, 0, Math.PI * 2); ctx.stroke();
    if (heartbeat > 0) {
      ctx.setLineDash([]);
      ctx.globalAlpha = .46 + heartbeat * .5;
      ctx.lineWidth = 2 + heartbeat * 3;
      ctx.beginPath(); ctx.ellipse(0, 2, gate.w / 2 + 17 + heartbeat * 8, gate.h / 2 + 17 + heartbeat * 8, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#dffff5'; ctx.fillRect(-2, -6, 4, 12);
    }
  } else if (mirror && !fakeMirror && objectSprites.daughterTrueCrack?.complete && objectSprites.daughterTrueCrack.naturalWidth > 0) {
    // 21스테이지의 진짜 균열은 배경의 장식과 확실히 구별되는 '통과 가능한 문'으로 보인다.
    const crack = objectSprites.daughterTrueCrack;
    const spriteW = Math.max(76, gate.w * 2.35);
    const spriteH = Math.max(104, gate.h * 2.1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(crack, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
    ctx.setLineDash([3, 4]); ctx.lineWidth = active ? 3 : 2;
    ctx.beginPath(); ctx.ellipse(0, 3, gate.w / 2 + 10, gate.h / 2 + 14, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (mirror) {
    ctx.rotate(Math.PI / 4); ctx.strokeRect(-gate.w / 2, -gate.h / 2, gate.w, gate.h);
    ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(4, -3); ctx.lineTo(-8, 7); ctx.lineTo(17, 22); ctx.stroke();
    if (fakeMirror) { ctx.beginPath(); ctx.moveTo(-18, 18); ctx.lineTo(18, -18); ctx.stroke(); }
  } else {
    ctx.beginPath(); ctx.arc(0, 0, gate.w / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, gate.w / 2 + 9, 0, Math.PI * 2); ctx.stroke();
    if (heartbeat > 0) {
      ctx.setLineDash([]);
      ctx.globalAlpha = .42 + heartbeat * .58;
      ctx.lineWidth = 2 + heartbeat * 3;
      ctx.beginPath(); ctx.arc(0, 0, gate.w / 2 + 15 + heartbeat * 8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = color; ctx.font = '800 14px "Segoe UI Symbol", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('♥', 0, 5);
    }
  }
  ctx.restore();
  if (revealed || cleared) {
    const symbol = cleared ? '✓' : fakeMirror ? '✕' : mirror ? '⇢' : 'L';
    const detail = cleared
      ? yunaResonancePad ? '음이 돌아왔어요' : mirror ? '기억이 돌아왔어요' : '공명이 이어졌어요'
      : yunaResonancePad ? 'L · 박자에 공명'
        : fakeMirror ? '가짜 균열'
          : mirror ? 'Space · 진짜 균열 통과'
            : 'L · 공명하기';
    drawInteractionBeacon({
      x: gate.x + gate.w / 2,
      y: Math.max(17, gate.y - 17),
      color,
      symbol,
      detail,
      active: active || cleared,
      danger: fakeMirror,
      near: nearby,
    });
  }
}

function drawYunaLoopStationMeter() {
  if (!yunaLoopStation.active || yunaLoopStation.stageIndex !== game.stageIndex) return;
  const x = 18;
  const y = 60;
  const total = yunaLoopStation.maxLevel;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.shadowBlur = 9; ctx.shadowColor = '#79e9ce';
  ctx.fillStyle = '#d9fff2'; ctx.font = '800 8px "Segoe UI", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`겹친 선율 ${yunaLoopStation.level} / ${total}`, x, y - 6);
  for (let index = 0; index < total; index += 1) {
    const active = index < yunaLoopStation.level;
    const noteX = x + index * 28;
    ctx.globalAlpha = active ? .96 : .22;
    ctx.fillStyle = active ? '#9effd7' : '#7ca69d';
    ctx.shadowBlur = active ? 11 : 0; ctx.shadowColor = '#9effd7';
    ctx.beginPath(); ctx.arc(noteX + 5, y + 6, active ? 4 : 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(noteX + 8, y - 10, active ? 2 : 1, 16);
    ctx.beginPath(); ctx.moveTo(noteX + 10, y - 10); ctx.lineTo(noteX + 18, y - 7); ctx.lineTo(noteX + 10, y - 4); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawFinalMemoryTarget(target, active, resolved) {
  const color = target.color || '#ffe37d';
  const portrait = finalTruthPortraits[target.art];
  ctx.save();
  ctx.translate(target.x + target.w / 2, target.y + target.h / 2);
  ctx.globalAlpha = resolved ? .18 : active ? 1 : .42;
  ctx.shadowBlur = active ? 26 : 8; ctx.shadowColor = color;
  ctx.fillStyle = '#111d3a'; ctx.beginPath(); ctx.arc(0, 0, target.w / 2 - 3, 0, Math.PI * 2); ctx.fill();
  if (portrait?.complete && portrait.naturalWidth > 0) {
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, target.w / 2 - 3, 0, Math.PI * 2); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(portrait, -target.w * .44, -target.h * .48, target.w * .88, target.h * .88);
    ctx.restore();
  }
  ctx.strokeStyle = color; ctx.lineWidth = active ? 4 : 2;
  ctx.beginPath(); ctx.arc(0, 0, target.w / 2, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash(active ? [] : [3, 4]);
  ctx.beginPath(); ctx.arc(0, 0, target.w / 2 + 7, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = active ? color : '#dba5ba'; ctx.font = '800 12px "Segoe UI Symbol", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(active ? '✦' : '×', 0, 18);
  ctx.restore();
  ctx.fillStyle = resolved ? '#7896a6' : active ? '#fff4c4' : '#e1a4b8'; ctx.font = '800 8px "Segoe UI", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(active ? `진짜 기억 · ${target.label}` : resolved ? '기억이 돌아왔어요' : '가짜 흔적', target.x + target.w / 2, target.y - 11);
}

function drawYunaSilentChoirSprite(b) {
  const image = bossSprites.yunaChoir;
  if (!image?.complete || !image.naturalWidth) return false;
  const restoredRatio = b.resonanceProgress / Math.max(1, b.resonanceGates.length);
  const pulse = .5 + Math.sin(game.elapsed * 5.8) * .5;
  const coreX = b.x + b.w / 2;
  const coreY = b.y + 78;
  const spriteScale = (b.phase === 1 ? .92 : b.phase === 2 ? 1 : 1.08) + pulse * .025;
  const spriteW = 220 * spriteScale;
  const spriteH = 294 * spriteScale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = 26 + pulse * 12; ctx.shadowColor = b.flash > 0 ? '#effff8' : '#54e7cd';
  ctx.globalAlpha = b.flash > 0 ? .92 : 1;
  ctx.drawImage(image, coreX - spriteW / 2, b.y + 4, spriteW, spriteH);
  // 배경은 유지하고, 탄막을 내보내는 입 부분만 공명에 반응한다.
  // 몸을 감싸는 원형 오라는 쓰지 않고, 빛나는 호흡과 음표 조각으로만 상태를 전달한다.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .22 + pulse * .16 + restoredRatio * .16;
  ctx.fillStyle = '#d8fff0'; ctx.shadowBlur = 22; ctx.shadowColor = '#8effdc';
  ctx.beginPath(); ctx.ellipse(coreX, coreY, 11 + pulse * 2, 19 + pulse * 3, 0, 0, Math.PI * 2); ctx.fill();
  for (let index = 0; index < b.resonanceProgress; index += 1) {
    const angle = index * 1.16 + game.elapsed * .7;
    const radius = 56 + (index % 2) * 19;
    const noteX = coreX + Math.cos(angle) * radius;
    const noteY = coreY + Math.sin(angle) * radius * .5;
    ctx.fillStyle = '#e8fff6'; ctx.fillRect(Math.round(noteX), Math.round(noteY), 4, 4);
    ctx.fillRect(Math.round(noteX + 3), Math.round(noteY - 7), 2, 8);
  }
  ctx.restore();
  return true;
}

function drawHarinLaughThiefSprite(b) {
  const image = b.calmReflectionActive ? bossSprites.harinClownMini : bossSprites.harinClown;
  if (!image?.complete || !image.naturalWidth) return false;
  if (b.calmReflectionActive) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    ctx.shadowBlur = b.flash > 0 ? 18 : 10;
    ctx.shadowColor = b.flash > 0 ? '#fff4bd' : '#ff5d9b';
    ctx.drawImage(image, Math.round(b.x), Math.round(b.y), b.w, b.h);
    if (b.calmMaskImpactPulse > 0) {
      ctx.globalAlpha = b.calmMaskImpactPulse / .48;
      ctx.strokeStyle = '#fff0a8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(Math.round(b.x + b.w / 2), Math.round(b.y + b.h / 2), 42 + (1 - b.calmMaskImpactPulse / .48) * 24, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }
  const calmRatio = b.calmProgress / Math.max(.01, b.calmDuration);
  const pulse = .5 + Math.sin(game.elapsed * 4.5) * .5;
  const coreX = b.x + b.w / 2;
  const spriteW = 226 + pulse * 8;
  const spriteH = 339 + pulse * 12;
  const chestY = b.y + 112;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = 30 + pulse * 14;
  ctx.shadowColor = calmRatio > .7 ? '#ffe9a2' : b.flash > 0 ? '#fff3fa' : '#ff5d9b';
  ctx.globalAlpha = .98 - calmRatio * .13;
  ctx.drawImage(image, coreX - spriteW / 2, b.y - 34, spriteW, spriteH);
  // 광대의 비어 있던 가슴에 별빛이 차오르면 공격 없이도 안심시키는 보스전임을 전달한다.
  // 원형 오라 대신 작은 별 조각만 남겨 일러스트 실루엣을 가리지 않는다.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .4 + pulse * .15 + calmRatio * .2;
  ctx.fillStyle = '#ffe990';
  for (let star = 0; star < 5; star += 1) {
    const angle = game.elapsed * .9 + star * 1.26;
    const x = coreX + Math.cos(angle) * (10 + (star % 3) * 7);
    const y = chestY + Math.sin(angle) * (9 + (star % 2) * 7);
    ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4);
  }
  ctx.restore();
  return true;
}

function drawCalmReflectionMask(mask) {
  if (!mask || mask.broken) return;
  const image = ensureSprite(bossSprites.harinLaughterMask);
  const palettes = [
    { face: '#f8e3df', edge: '#ff6aa2', mark: '#6b205d' },
    { face: '#eadcff', edge: '#9a7cff', mark: '#3a276e' },
    { face: '#fff0bd', edge: '#ffbe55', mark: '#7a315d' },
  ];
  const palette = palettes[mask.index % palettes.length];
  const bob = mask.launched || frozenTime() ? 0 : Math.sin(game.elapsed * 4.2 + mask.roamPhase) * 2;
  const centerX = Math.round(mask.x + mask.w / 2);
  const centerY = Math.round(mask.y + mask.h / 2 + bob);
  if (mask.launched) {
    const speed = Math.max(1, Math.hypot(mask.vx || 0, mask.vy || 0));
    const tailX = centerX - (mask.vx || 0) / speed * 38;
    const tailY = centerY - (mask.vy || 0) / speed * 38;
    ctx.save();
    ctx.globalAlpha = frozenTime() ? .28 : .62;
    ctx.strokeStyle = '#ffe37e';
    ctx.lineWidth = 5;
    ctx.shadowBlur = 14;
    ctx.shadowColor = palette.edge;
    ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(centerX, centerY); ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(centerX, centerY);
  if (mask.launched) ctx.rotate(mask.launchSpin || 0);
  ctx.globalAlpha = frozenTime() ? .66 : 1;
  ctx.shadowBlur = 13;
  ctx.shadowColor = mask.hitFlash > 0 ? '#fff6c8' : palette.edge;
  if (image?.complete && image.naturalWidth > 0) {
    // 48×56 원본의 좌우 투명 여백 덕분에 실제 얼굴 폭은 기존 36px 판정과 맞는다.
    // 장식만 판정 위로 살짝 솟도록 두고 근접 타격·충돌 기준은 그대로 유지한다.
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, -24, -28, 48, 56);
  } else {
    // 이미지 로딩이 늦거나 실패해도 가면 판정과 플레이 흐름이 보이도록 기존 도형을 유지한다.
    ctx.scale(.84, .84);
    ctx.fillStyle = palette.edge;
    ctx.beginPath();
    ctx.moveTo(-20, -17); ctx.lineTo(-14, -23); ctx.lineTo(14, -23); ctx.lineTo(20, -17);
    ctx.lineTo(18, 12); ctx.lineTo(10, 22); ctx.lineTo(0, 25); ctx.lineTo(-10, 22); ctx.lineTo(-18, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = palette.face;
    ctx.beginPath();
    ctx.moveTo(-15, -15); ctx.lineTo(-10, -19); ctx.lineTo(10, -19); ctx.lineTo(15, -15);
    ctx.lineTo(13, 9); ctx.lineTo(7, 17); ctx.lineTo(0, 20); ctx.lineTo(-7, 17); ctx.lineTo(-13, 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = palette.mark;
    ctx.fillRect(-11, -7, 7, 4);
    ctx.fillRect(4, -7, 7, 4);
    ctx.fillRect(-3, 1, 6, 4);
    ctx.fillRect(-9, 10, 4, 3);
    ctx.fillRect(-5, 13, 10, 3);
    ctx.fillRect(5, 10, 4, 3);
    ctx.fillStyle = '#fff7dc';
    ctx.fillRect(-13, -15, 4, 3);
  }
  ctx.restore();
}

function drawCalmReflectionAim(boss) {
  const mask = calmReflectionLaunchCandidate(boss);
  if (!mask) return;
  const player = game.player;
  const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
  const maskCenter = { x: mask.x + mask.w / 2, y: mask.y + mask.h / 2 };
  const dx = maskCenter.x - playerCenter.x;
  const dy = maskCenter.y - playerCenter.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const unitX = dx / distance;
  const unitY = dy / distance;
  const rayEnd = { x: playerCenter.x + unitX * 1400, y: playerCenter.y + unitY * 1400 };
  const pulse = .55 + Math.sin(game.elapsed * 9) * .18;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = '#ffe37e';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#ffcf55';
  ctx.setLineDash([9, 6]);
  ctx.beginPath();
  ctx.moveTo(playerCenter.x, playerCenter.y);
  ctx.lineTo(maskCenter.x, maskCenter.y);
  ctx.lineTo(rayEnd.x, rayEnd.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(maskCenter.x, maskCenter.y, 26 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff4bd';
  ctx.font = '800 9px "Segoe UI", "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('J · 가면을 노려요', maskCenter.x, maskCenter.y - 31);
  ctx.restore();
}

function drawHaneulBlackKiteSprite(b) {
  const image = bossSprites.haneulKite;
  if (!image?.complete || !image.naturalWidth) return false;
  const pulse = .5 + Math.sin(game.elapsed * 4.2) * .5;
  const coreX = b.x + b.w / 2;
  const phaseScale = b.windVanePhase ? .82 : 1;
  const spriteW = (244 + pulse * 8) * phaseScale;
  const spriteH = (366 + pulse * 12) * phaseScale;
  const eyeY = b.y + (b.windVanePhase ? 74 : 92);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = 26 + pulse * 16;
  ctx.shadowColor = b.flash > 0 ? '#e5ffff' : '#65ddff';
  ctx.globalAlpha = b.flash > 0 ? .9 : 1;
  ctx.drawImage(image, coreX - spriteW / 2, b.y - 42, spriteW, spriteH);
  // 탄막이 나오는 중심을 눈과 맞춰 플레이어가 위협의 방향을 읽을 수 있게 한다.
  // 큰 원형 경고선 대신 세로로 번지는 눈빛만 남긴다.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .28 + pulse * .2;
  ctx.fillStyle = '#d7fbff';
  ctx.beginPath(); ctx.ellipse(coreX, eyeY, 6 + pulse * 2, 12 + pulse * 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return true;
}

function drawDaughterPerfectGuardianSprite(b) {
  const image = bossSprites.daughterGuardian;
  if (!image?.complete || !image.naturalWidth) return false;
  const pulse = .5 + Math.sin(game.elapsed * 4.8) * .5;
  const coreX = b.x + b.w / 2;
  const spriteW = 218 + pulse * 8;
  const spriteH = 327 + pulse * 12;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = 24 + pulse * 14;
  ctx.shadowColor = b.flash > 0 ? '#fff5ff' : '#ffacd9';
  ctx.globalAlpha = b.flash > 0 ? .92 : 1;
  ctx.drawImage(image, coreX - spriteW / 2, b.y - 34, spriteW, spriteH);
  ctx.restore();
  return true;
}

function drawScientistDreamGuardianSprite(b) {
  const awakened = Boolean(b.truthResolved);
  const image = awakened ? bossSprites.scientistGuardianAwakened : bossSprites.scientistGuardian;
  if (!image?.complete || !image.naturalWidth) return false;
  const releaseRatio = b.releaseReady ? b.releaseProgress / Math.max(.01, b.releaseDuration) : 0;
  const pulse = .5 + Math.sin(game.elapsed * 3.7) * .5;
  const coreX = b.x + b.w / 2;
  const baseWidth = awakened ? 282 : 352;
  const spriteW = (baseWidth + pulse * 12) * (1 - releaseRatio * .18);
  const spriteH = spriteW * image.naturalHeight / image.naturalWidth;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = 30 + pulse * 16;
  ctx.shadowColor = b.releaseReady ? '#ffe8ad' : awakened ? '#ffc980' : '#73ddff';
  ctx.globalAlpha = b.releaseReady ? Math.max(.25, .92 - releaseRatio * .58) : 1;
  ctx.drawImage(image, coreX - spriteW / 2, b.y - (awakened ? 42 : 22), spriteW, spriteH);
  ctx.restore();
  return true;
}

function drawYunhoImaginationShot(shot) {
  const image = projectileSprites.yunhoImaginationBolt;
  const direction = Math.atan2(shot.vy || 0, shot.vx || 1);
  const pulse = .94 + Math.sin((game.elapsed || 0) * 17 + (shot.life || 0) * 9) * .06;
  const width = shot.reflected ? 48 : 42;
  const height = image?.naturalWidth && image?.naturalHeight
    ? width * image.naturalHeight / image.naturalWidth
    : 25;
  const centerX = shot.x + shot.w / 2;
  const centerY = shot.y + shot.h / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  // 원화의 꼬리는 항상 뒤를 향한다. 반대 방향으로 쏠 때는 화면을 뒤집는 대신 탄환 전체를 회전한다.
  ctx.rotate(direction);
  ctx.scale(pulse, pulse);
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = frozenTime() ? .58 : 1;
  ctx.shadowBlur = shot.reflected ? 24 : 18;
  ctx.shadowColor = shot.reflected ? '#ffcf8a' : '#a8f7ff';
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    // 원화가 늦게 로드되어도 단순한 막대가 아니라 별빛을 끌고 가는 탄환으로 보이게 한다.
    ctx.fillStyle = '#7be9ff'; ctx.beginPath(); ctx.ellipse(-width * .16, 0, width * .32, height * .24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c7a3ff'; ctx.fillRect(-width * .38, -2, width * .45, 4);
    ctx.fillStyle = '#fff3bb';
    ctx.beginPath(); ctx.moveTo(width * .15, 0); ctx.lineTo(width * .32, -height * .34); ctx.lineTo(width * .48, 0); ctx.lineTo(width * .32, height * .34); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawHaneulWindShot(shot) {
  if (shot.kind === 'black-kite') {
    drawHaneulBlackKiteShot(shot);
    return;
  }
  const image = projectileSprites.haneulWindShard;
  const direction = shot.angle || Math.atan2(shot.vy, shot.vx);
  const sizeBoost = shot.relayShot ? 1.32 : shot.decoyShot ? 1.14 : 1;
  const width = Math.max(34, shot.r * 4.2 * sizeBoost);
  const height = Math.max(18, shot.r * 2.02 * sizeBoost);
  const pulse = .9 + Math.sin((game.elapsed || 0) * 13 + shot.x * .024) * .1;
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(direction);
  ctx.scale(pulse, pulse);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = frozenTime() ? .58 : 1;
  ctx.shadowBlur = shot.relayShot ? 25 : shot.decoyShot ? 21 : 14;
  ctx.shadowColor = shot.relayShot ? '#efffff' : '#67e9ff';
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    // 로딩 중에도 "돌풍"이라는 성격은 남기고, 기존의 단색 원형 탄막으로 되돌아가지 않는다.
    ctx.strokeStyle = '#bff8ff'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(-width * .08, 0, height * .42, -2.4, 1.45); ctx.stroke();
    ctx.beginPath(); ctx.arc(width * .12, 0, height * .28, -1.9, 1.65); ctx.stroke();
    ctx.fillStyle = '#173b69'; ctx.beginPath(); ctx.moveTo(-width * .36, -height * .16); ctx.lineTo(width * .16, 0); ctx.lineTo(-width * .36, height * .16); ctx.closePath(); ctx.fill();
  }
  if (shot.relayShot) {
    // 가로채야 하는 한 발은 일반 돌풍보다 밝은 "되돌림 매듭"으로 읽힌다.
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .7 + Math.sin((game.elapsed || 0) * 16) * .18;
    ctx.strokeStyle = '#fff1ab'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(-width * .07, 0, height * .66, -.9, 1.75); ctx.stroke();
    ctx.fillStyle = '#eaffff'; ctx.fillRect(width * .08, -2, 5, 4);
  }
  ctx.restore();
}

function drawHaneulBlackKiteShot(shot) {
  const direction = Number.isFinite(shot.angle) ? shot.angle : Math.atan2(shot.vy, shot.vx);
  const reflected = Boolean(shot.vaneReflected);
  const pulse = .94 + Math.sin((game.elapsed || 0) * 16 + shot.x * .03) * .06;
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(direction);
  ctx.scale(pulse, pulse);
  ctx.imageSmoothingEnabled = false;
  if (!reflected) {
    const flutter = shot.windAge || 0;
    ctx.save();
    ctx.lineCap = 'round';
    for (let ribbon = 0; ribbon < 3; ribbon += 1) {
      const sway = Math.sin(flutter * (4.1 + ribbon * .7) + (shot.windCurvePhase || 0) + ribbon * 1.8) * (4 + ribbon * 2);
      ctx.globalAlpha = .18 + ribbon * .08;
      ctx.strokeStyle = ribbon === 1 ? '#c9b7ff' : '#8cecff';
      ctx.lineWidth = 1.1 + ribbon * .35;
      ctx.beginPath();
      ctx.moveTo(-14, ribbon * 5 - 5);
      ctx.quadraticCurveTo(-31, sway, -48 - ribbon * 7, -sway * .55);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.shadowBlur = reflected ? 24 : 16;
  ctx.shadowColor = reflected ? '#fff0a6' : '#7059bd';
  ctx.fillStyle = reflected ? '#273c67' : '#171329';
  ctx.strokeStyle = reflected ? '#fff1a9' : '#8bdff4';
  ctx.lineWidth = reflected ? 2.2 : 1.7;
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(-2, -13);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-2, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = reflected ? '#fff5bd' : '#ff91c8';
  ctx.fillRect(1, -3, 6, 6);
  ctx.strokeStyle = reflected ? '#ffe88e' : '#6ed9f4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.quadraticCurveTo(-27, -7, -34, 1);
  ctx.quadraticCurveTo(-41, 8, -48, 0);
  ctx.stroke();
  ctx.fillStyle = reflected ? '#fff1a0' : '#8ce8ff';
  ctx.fillRect(-30, -4, 4, 4);
  ctx.fillRect(-43, 1, 4, 4);
  ctx.restore();
}

function drawDaughterMirrorShardShot(shot) {
  const image = projectileSprites.daughterMirrorShard;
  const direction = Number.isFinite(shot.angle) ? shot.angle : Math.atan2(shot.vy, shot.vx);
  const width = Math.max(48, shot.r * 5.7);
  const height = image?.naturalWidth ? width * image.naturalHeight / image.naturalWidth : Math.max(18, shot.r * 2.05);
  const shimmer = Math.sin((game.elapsed || 0) * 11 + shot.x * .04) * .12;
  ctx.save();
  ctx.translate(shot.x, shot.y);
  // 유리 파편은 정면으로 날아가지만 아주 조금씩 회전해, "완벽한 풍경이 깨져 날아온다"는 감각을 준다.
  ctx.rotate(direction + shimmer);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = frozenTime() ? .56 : 1;
  ctx.shadowBlur = 17; ctx.shadowColor = '#ff88c4';
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = '#dffff3'; ctx.strokeStyle = '#ff8fca'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(width * .48, 0); ctx.lineTo(-width * .2, -height * .46); ctx.lineTo(-width * .48, 0); ctx.lineTo(-width * .2, height * .46); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawScientistDreamCoreShot(shot) {
  const image = projectileSprites.scientistDreamCore;
  const direction = Number.isFinite(shot.angle) ? shot.angle : Math.atan2(shot.vy, shot.vx);
  const width = Math.max(48, shot.r * 5.45);
  const height = image?.naturalWidth ? width * image.naturalHeight / image.naturalWidth : Math.max(18, shot.r * 2.05);
  const pulse = .92 + Math.sin((game.elapsed || 0) * 12 + shot.y * .035) * .08;
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(direction);
  ctx.scale(pulse, pulse);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = frozenTime() ? .56 : 1;
  ctx.shadowBlur = 20; ctx.shadowColor = '#77eaff';
  if (image?.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = '#153b70'; ctx.strokeStyle = '#89f3ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, width * .36, height * .38, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9ed3'; ctx.beginPath(); ctx.arc(0, 0, height * .2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawHaneulWindVaneBattle(b) {
  const vane = b.windVane;
  if (!vane) return;
  const rotorImage = ensureSprite(objectSprites.haneulWindPinwheel);
  const direction = haneulWindVaneDirection(b);
  const centerX = vane.x + vane.w / 2;
  const centerY = vane.y + vane.h / 2;
  const t = game.elapsed || 0;
  const turnPulse = Math.min(1, (vane.turnPulse || 0) / .42);
  const capturePulse = Math.min(1, (vane.capturePulse || 0) / .74);
  const pulse = .5 + Math.sin(t * 6.2) * .5;

  // 판정 사각형은 노출하지 않고, 움직이는 바람 결만으로 현재 방향을 읽게 한다.
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(direction.angle);
  ctx.lineCap = 'round';
  for (let stream = 0; stream < 10; stream += 1) {
    const travel = (t * (.62 + stream % 3 * .08) + stream * .137) % 1;
    const x = 10 + travel * (HANEUL_VANE_CAPTURE_LENGTH + 18);
    const lane = (stream % 5 - 2) * 8;
    const y = lane + Math.sin(t * 4.2 + stream * 1.7 + travel * Math.PI * 2) * (3 + stream % 2 * 3);
    const length = 10 + (stream % 4) * 4;
    ctx.globalAlpha = (.18 + (1 - travel) * .46) * (capturePulse > 0 ? 1 : .82);
    ctx.strokeStyle = capturePulse > 0 && stream % 2 === 0 ? '#fff0a1' : stream % 3 === 0 ? '#e8ffff' : '#86eaff';
    ctx.lineWidth = stream % 3 === 0 ? 2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(x - length, y + Math.sin(t * 5 + stream) * 2);
    ctx.quadraticCurveTo(x - length * .45, y - 5, x, y);
    ctx.stroke();
  }
  ctx.restore();

  // 둥근 선풍기 케이스 대신 손잡이와 접힌 네 장의 날개를 가진 실제 바람개비 실루엣을 그린다.
  ctx.save();
  ctx.lineCap = 'round';
  ctx.shadowBlur = 9;
  ctx.shadowColor = '#6be6ff';
  ctx.strokeStyle = '#8ec7d9';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(centerX + 1, centerY + 9);
  ctx.lineTo(centerX + 2, centerY + 43);
  ctx.stroke();
  ctx.strokeStyle = '#e8ffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 10);
  ctx.lineTo(centerX + 1, centerY + 42);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.shadowBlur = 15 + turnPulse * 12;
  ctx.shadowColor = turnPulse > 0 ? '#fff0a0' : '#71e8ff';
  ctx.save();
  ctx.rotate(vane.spinAngle || 0);
  if (rotorImage?.complete && rotorImage.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(rotorImage, -32, -32, 64, 64);
  } else {
    // 이미지 로딩이 늦거나 실패해도 회전 방향과 포획 타이밍을 읽을 수 있도록 기존 날개를 유지한다.
    const bladeColors = ['#dffcff', '#86eaff', '#c9b7ff', '#fff0a1'];
    for (let blade = 0; blade < 4; blade += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = bladeColors[blade];
      ctx.strokeStyle = '#dffcff';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(1, 1);
      ctx.quadraticCurveTo(8, -25, 27, -24);
      ctx.quadraticCurveTo(22, -7, 5, -3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.fillStyle = capturePulse > 0 ? '#fff7c7' : '#fff2a2';
  ctx.strokeStyle = '#8feeff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 4.5 + capturePulse * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#061227';
  ctx.fillStyle = '#e8ffff';
  ctx.font = '900 9px ui-monospace, monospace';
  ctx.fillText(`P ↻  ·  Y ↺  ·  ${direction.label}`, centerX, vane.y - 14);
  ctx.fillStyle = '#fff0a7';
  const bossPosition = HANEUL_VANE_BOSS_POSITIONS[b.vaneBossSlot]?.label || '위쪽';
  const pressure = haneulVaneAttackProfile(b);
  ctx.fillText(`REFLECT ${b.vaneReflectedHits} / ${b.maxHp} · SIDE ${pressure.sideCount} · BOSS ${bossPosition}`, W / 2, 35);
  ctx.fillStyle = '#bdefff';
  ctx.font = '800 8px ui-monospace, monospace';
  ctx.fillText('LURE THE BLACK KITE INTO THE WIND', W / 2, 51);
  ctx.restore();
}

function drawWindRelayGuidance(b) {
  if (b.mode !== 'chase') return;
  if (b.windVanePhase) {
    drawHaneulWindVaneBattle(b);
    return;
  }
  const t = game.elapsed || 0;
  const total = Math.max(1, b.windGates.length);
  const anchorsReady = b.activePads >= b.decoyPads.length;
  const targetPad = windRelayTargetPad(b);
  const targetEcho = getWindRelayAnchor(b);
  const targetX = (targetEcho?.x ?? targetPad?.x ?? 0) + (targetEcho?.w ?? targetPad?.w ?? 0) / 2;
  const targetY = (targetEcho?.y ?? targetPad?.y ?? 0) + (targetEcho?.h ?? targetPad?.h ?? 0) / 2;
  const bossX = b.x + 22;
  const bossY = b.y + 92;

  // 작은 세 개의 별 매듭만 남겨 현재 릴레이 위치를 보여 준다. 체력바처럼 보이지 않게 한다.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.textAlign = 'center';
  ctx.shadowBlur = 10; ctx.shadowColor = '#79eaff';
  for (let index = 0; index < total; index += 1) {
    const x = W / 2 + (index - (total - 1) / 2) * 24;
    const done = index < b.relayProgress;
    const current = index === b.relayProgress && anchorsReady;
    const pulse = current ? .5 + Math.sin(t * 7 + index) * .5 : 0;
    ctx.globalAlpha = done ? .96 : current ? .54 + pulse * .36 : .22;
    ctx.fillStyle = done ? '#fff1a7' : '#a5f6ff';
    ctx.beginPath(); ctx.moveTo(x, 47 - (current ? pulse * 2 : 0)); ctx.lineTo(x + 4, 53); ctx.lineTo(x, 59 + (current ? pulse * 2 : 0)); ctx.lineTo(x - 4, 53); ctx.closePath(); ctx.fill();
    if (index < total - 1) {
      ctx.globalAlpha = done ? .58 : .18;
      ctx.strokeStyle = '#9cefff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 7, 53); ctx.lineTo(x + 17, 53); ctx.stroke();
    }
  }
  ctx.globalAlpha = .88; ctx.fillStyle = '#d9faff'; ctx.font = '800 8px "Segoe UI", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(`순풍의 매듭 ${b.relayProgress} / ${total}`, W / 2, 35);
  ctx.restore();

  if (!anchorsReady || !targetPad) return;
  const pulse = .5 + Math.sin(t * 5.4) * .5;
  if (b.relayPhase === 'intercept') {
    // 보스→기준점 궤적은 가는 세 갈래 리본으로 예고한다. 플레이어는 이 선을 Space 질주로 끊어야 한다.
    const bendY = (bossY + targetY) / 2 - 74;
    const drawGalePath = (color, width, alpha) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
      ctx.shadowBlur = width > 2 ? 15 : 6; ctx.shadowColor = color;
      ctx.beginPath(); ctx.moveTo(bossX, bossY); ctx.bezierCurveTo(bossX - 92, bendY, targetX + 82, bendY + 28, targetX, targetY); ctx.stroke();
      ctx.restore();
    };
    drawGalePath('#214c80', 13, .22);
    drawGalePath('#70ddff', 4, .42);
    drawGalePath('#e8fffb', 1.2, .72);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let mote = 0; mote < 10; mote += 1) {
      const travel = (t * .38 + mote * .11) % 1;
      const x = bossX + (targetX - bossX) * travel + Math.sin(travel * Math.PI) * Math.sin(t * 3 + mote) * 20;
      const y = bossY + (targetY - bossY) * travel - Math.sin(travel * Math.PI) * 54;
      ctx.globalAlpha = .32 + travel * .38;
      ctx.fillStyle = mote % 3 ? '#bdf7ff' : '#fff0ab';
      ctx.fillRect(x - 1, y - 1, mote % 3 ? 3 : 4, 2);
    }
    ctx.globalAlpha = .42 + pulse * .34; ctx.strokeStyle = '#d9ffff'; ctx.shadowBlur = 17; ctx.shadowColor = '#63e9ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(targetX, targetY, 27 + pulse * 5, 19 + pulse * 4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = .95; ctx.fillStyle = '#eaffff'; ctx.font = '800 8px "Segoe UI", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Space · 역풍 가르기', (bossX + targetX) / 2, Math.max(80, bendY - 12));
    ctx.restore();
  } else if (b.relayPhase === 'sprint') {
    // 가로챈 뒤에는 윤호와 다음 고리를 하나의 부드러운 순풍 리본으로 연결한다.
    const gate = b.windGates[b.relayProgress];
    if (gate) {
      const playerX = game.player.x + game.player.w / 2;
      const playerY = game.player.y + game.player.h / 2;
      const gateX = gate.x + gate.w / 2;
      const gateY = gate.y + gate.h / 2;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.lineCap = 'round';
      for (const [color, width, alpha] of [['#265b91', 17, .18], ['#7cefff', 6, .5], ['#fff0ad', 1.8, .82]]) {
        ctx.globalAlpha = alpha + (b.relayPulse || 0) * .12;
        ctx.strokeStyle = color; ctx.shadowBlur = width > 3 ? 18 : 7; ctx.shadowColor = color; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(playerX, playerY); ctx.bezierCurveTo(playerX + 54, playerY - 60, gateX - 76, gateY + 52, gateX, gateY); ctx.stroke();
      }
      const left = Math.max(0, (b.relayDeadline || 0) - t);
      ctx.globalAlpha = .96; ctx.fillStyle = '#fff6c4'; ctx.font = '800 8px "Segoe UI", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`Space · 순풍 타기 · ${left.toFixed(1)}초`, gateX, Math.max(58, gate.y - 14));
      ctx.restore();
    }
  }

  if (b.relayImpact && b.relayImpactPulse > 0) {
    const x = b.relayImpact.x + b.relayImpact.w / 2;
    const y = b.relayImpact.y + b.relayImpact.h / 2;
    const ratio = b.relayImpactPulse / .86;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(1, ratio * 1.25);
    ctx.strokeStyle = '#fff3af'; ctx.shadowBlur = 20; ctx.shadowColor = '#65ecff'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(x, y, 16 + (1 - ratio) * 38, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#edffff'; ctx.font = '800 9px "Segoe UI", "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('역풍 → 순풍', x, y - 32 - (1 - ratio) * 8);
    ctx.restore();
  }

  // 실패는 잔상이 깨지는 연출이 아니라, 기준점 바로 앞에서 바람의 매듭이 풀려 버리는 모습으로 남긴다.
  // 다음 바람을 기다리면 되므로 진행도나 잔상에는 패널티를 주지 않는다.
  if (b.relayMissPulse > 0 && targetPad) {
    const ratio = b.relayMissPulse / .78;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(.72, ratio * .84);
    ctx.strokeStyle = '#85dfff'; ctx.shadowBlur = 14; ctx.shadowColor = '#5bcfff'; ctx.lineWidth = 1.4;
    for (let strand = 0; strand < 5; strand += 1) {
      const angle = strand * Math.PI * 2 / 5 + t * 2.8;
      const distance = 18 + (1 - ratio) * 42 + strand * 3;
      ctx.beginPath();
      ctx.moveTo(targetX + Math.cos(angle) * 7, targetY + Math.sin(angle) * 5);
      ctx.quadraticCurveTo(
        targetX + Math.cos(angle + .36) * distance * .56,
        targetY + Math.sin(angle + .36) * distance * .56,
        targetX + Math.cos(angle) * distance,
        targetY + Math.sin(angle) * distance,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawDissonantNoteShot(shot) {
  const size = Math.max(.75, shot.r / 10);
  const drift = Math.sin(game.elapsed * 12 + shot.x * .03) * .16;
  const color = frozenTime() ? '#9e9ab5' : '#cfa2ff';
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate((shot.angle || Math.atan2(shot.vy, shot.vx)) * .16 + drift);
  ctx.scale(size, size);
  ctx.shadowBlur = 16; ctx.shadowColor = '#b8ffe7';
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(-3, 5, 7, 4.6, -.34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#83f7d2';
  ctx.beginPath(); ctx.ellipse(4, 2, 4.5, 3.2, .38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e9d2ff'; ctx.fillRect(2, -17, 3, 20);
  ctx.strokeStyle = '#a8ffe2'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(5, -17); ctx.lineTo(13, -12); ctx.lineTo(7, -8); ctx.lineTo(15, -3); ctx.stroke();
  ctx.strokeStyle = 'rgba(17, 20, 59, .9)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(8, 8); ctx.moveTo(-6, 9); ctx.lineTo(10, -4); ctx.stroke();
  ctx.restore();
}

function drawBoss() {
  ensureBossStage();
  const b = game.boss;
  const bossBackdrop = b.visual === 'wind' ? "HANEUL'S FEAR · THE ENDLESS HEADWIND"
    : b.visual === 'choir' ? "YUNA'S FEAR · THE SILENT CHOIR"
      : b.visual === 'mirror' ? "DAUGHTER'S DREAM · PERFECT MIRROR"
        : b.mode === 'final' ? 'THE SCIENTIST · DREAM LAB' : "HARIN'S FEAR · THE EMPTY STAGE";
  drawBackground(true, bossBackdrop);
  const windFear = b.visual === 'wind';
  const choirFear = b.visual === 'choir';
  const mirrorFear = b.visual === 'mirror';
  const calmReflectionBossBottom = b.mode === 'calm' && b.calmReflectionActive ? b.y + b.h : null;
  if (calmReflectionBossBottom !== null) drawCalmReflectionAim(b);
  if (calmReflectionBossBottom !== null) {
    b.calmReflectionMasks
      .filter((mask) => !mask.broken && mask.y + mask.h < calmReflectionBossBottom)
      .forEach(drawCalmReflectionMask);
  }
  const harinIllustration = b.mode === 'calm' && drawHarinLaughThiefSprite(b);
  const choirIllustration = choirFear && drawYunaSilentChoirSprite(b);
  const windIllustration = windFear && drawHaneulBlackKiteSprite(b);
  const mirrorIllustration = mirrorFear && drawDaughterPerfectGuardianSprite(b);
  const scientistIllustration = b.mode === 'final' && drawScientistDreamGuardianSprite(b);
  const bossIllustration = harinIllustration || choirIllustration || windIllustration || mirrorIllustration || scientistIllustration;
  if (calmReflectionBossBottom !== null) {
    b.calmReflectionMasks
      .filter((mask) => !mask.broken && mask.y + mask.h >= calmReflectionBossBottom)
      .forEach(drawCalmReflectionMask);
  }
  const releaseRatio = b.releaseReady ? b.releaseProgress / b.releaseDuration : 0;
  const scale = b.mode === 'final'
    ? (b.releaseReady ? 1.14 - releaseRatio * .38 : b.attackUnlocked ? 1.14 + (b.phase - 1) * .13 : 1.14)
    : b.phase === 1 ? 1.18 : b.phase === 2 ? .9 : .62;
  const bossShadow = b.mode === 'final' ? b.releaseReady ? '#ffe27e' : '#7be9ff' : windFear ? '#9cdbff' : choirFear ? '#9effd7' : mirrorFear ? '#ffb5df' : '#ff4d7c';
  const bossBody = b.mode === 'final' ? b.releaseReady ? '#4e637c' : '#19475e' : windFear ? '#173857' : choirFear ? '#174c4c' : mirrorFear ? '#5f346b' : '#6e1745';
  const bossFace = b.mode === 'final' ? b.releaseReady ? '#fff0b5' : '#8adcf2' : windFear ? '#b4ecff' : choirFear ? '#bfffe8' : mirrorFear ? '#ffd5eb' : '#f6b2ca';
  if (!bossIllustration) {
    ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(scale, scale); ctx.shadowBlur = 34; ctx.shadowColor = bossShadow; ctx.fillStyle = b.flash > 0 ? '#ffe4ef' : bossBody;
    if (windFear) { ctx.rotate(.78); ctx.fillRect(-62, -62, 124, 124); ctx.strokeStyle = '#d0f7ff'; ctx.lineWidth = 4; ctx.strokeRect(-62, -62, 124, 124); ctx.rotate(-.78); }
    else if (mirrorFear) { ctx.rotate(Math.PI / 4); ctx.fillRect(-66, -66, 132, 132); ctx.strokeStyle = '#ffe3f4'; ctx.lineWidth = 4; ctx.strokeRect(-66, -66, 132, 132); ctx.rotate(-Math.PI / 4); }
    else { ctx.beginPath(); ctx.ellipse(0, 0, 72, 92, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = bossFace; ctx.beginPath(); ctx.arc(-27, -12, 24, 0, Math.PI * 2); ctx.arc(27, -12, 24, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = b.mode === 'final' ? '#0f2432' : windFear ? '#102030' : '#1f1027'; ctx.fillRect(-41, -18, 22, 8); ctx.fillRect(19, -18, 22, 8); ctx.strokeStyle = windFear ? '#d0f7ff' : choirFear ? '#bfffe8' : mirrorFear ? '#ffe3f4' : b.mode === 'final' ? '#8cf0ff' : '#ffc4d9'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 29, 23, 0, Math.PI); ctx.stroke(); ctx.fillStyle = '#f8df77'; ctx.beginPath(); ctx.arc(0, -80, 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  const bossLabel = b.releaseReady ? '수면 과학자 · 아버지' : b.mode === 'final' && b.truthResolved ? '수면 과학자 · 부서진 수호자' : b.name;
  if (!(b.mode === 'calm' && b.calmReflectionActive)) {
    ctx.fillStyle = b.mode === 'final' ? b.releaseReady ? '#fff1b1' : b.truthResolved ? '#ffd891' : '#aeefff' : windFear || choirFear ? '#aeefff' : mirrorFear ? '#ffe0f2' : '#ffc4d5'; ctx.font = '800 12px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(bossLabel, b.x + b.w / 2, b.y - 17);
  }
  const bossPads = b.mode === 'resonance' && b.codaActive
    ? []
    : b.mode === 'calm' && b.calmReflectionActive
      ? []
      : b.mode === 'chase' ? b.windVanePhase ? [] : b.decoyPads : b.mode === 'resonance' || b.mode === 'calm' || b.mode === 'mirror' || b.mode === 'final' ? b.memoryPads : [];
  const calmState = b.mode === 'calm' ? calmMemoryState(b) : null;
  bossPads.forEach((pad, index) => {
    const role = b.mode === 'calm' ? 'either' : b.mode === 'chase' || b.mode === 'mirror' || index < 2 ? 'echo' : 'present';
    const active = calmState ? Boolean(calmState.activeByIndex[index]) : activeMemoryPads([pad], b.mode === 'final') > 0;
    drawMemoryPad(pad, active, index, b.mode === 'final' && index < 2 ? 'truth' : role);
  });
  if (b.mode === 'calm' && !b.calmReflectionActive) b.distortedMemoryPads.forEach((pad, index) => {
    if (pad.defeated) return;
    if (pad.activated) drawCalmFleeingFakeMemory(pad, index);
    else drawMemoryPad(pad, false, index, 'echo');
  });
  if (b.mode === 'chase') {
    if (!b.windVanePhase) {
      const currentGate = b.relayPhase === 'sprint' ? b.relayProgress : -1;
      b.windGates.forEach((gate, index) => drawWindGate(
        gate,
        index,
        index === currentGate,
        index < b.relayProgress,
        index <= currentGate || index < b.relayProgress,
      ));
    }
    drawWindRelayGuidance(b);
  }
  if (b.mode === 'resonance') {
    if (!b.codaActive) {
      const beat = resonanceBeat(b);
      const beatOpen = beat.open;
      const resonanceHeld = activeTechniques().resonance;
      const heartbeat = resonanceHeartbeat(beat);
      b.resonanceGates.forEach((gate, index) => {
        const current = index === b.resonanceProgress;
        const revealed = beatOpen && (current || resonanceHeld);
        drawDreamGate(gate, current, index < b.resonanceProgress, 'resonance', revealed, current ? heartbeat : 0);
      });
    }
  }
  if (b.mode === 'mirror') {
    const photoReady = activeMemoryPads(b.memoryPads) >= b.memoryPads.length;
    b.fakeMirrorGates.forEach((gate) => drawDreamGate(gate, false, false, 'false-mirror', activeTechniques().resonance && !photoReady));
    b.mirrorGates.forEach((gate, index) => drawDreamGate(gate, index === b.mirrorProgress, index < b.mirrorProgress, 'mirror', activeTechniques().resonance && photoReady));
  }
  if (b.mode === 'final' && b.attackUnlocked) {
    const finalPhase = finalBossPhase(b);
    if (finalPhase === 2) {
      b.truthTargets.forEach((target, index) => drawFinalMemoryTarget(target, index === b.truthProgress, index < b.truthProgress));
    } else if (finalPhase === 4 && b.voiceGate) {
      drawFinalVoiceAltar(b.voiceGate, activeTechniques().resonance && overlaps(game.player, b.voiceGate), b.voiceProgress / Math.max(.01, b.voiceDuration));
    }
  }
  if (b.mode === 'calm' && b.calmReflectionActive) {
    // 자유 조준은 가면 위의 한 줄 안내와 HUD 숫자만 남겨, 전투 장면을 가리지 않는다.
  }
  drawMemoryLoopFeedback();
  drawFinalReleaseScene(b);
  game.echoes.forEach(drawEcho);
  drawDreamTrails(true);
  for (const shot of game.dreamShots) drawYunhoImaginationShot(shot);
  for (const shot of game.nightmareShots) {
    const shotColor = shot.kind === 'harin-laugh' ? '#ff91bd'
      : shot.kind === 'wind' ? '#a6efff'
      : shot.kind === 'note' || shot.kind === 'dissonant-note' ? '#c7a3ff'
        : shot.kind === 'shard' ? '#ffb5df'
          : shot.kind === 'memory' ? '#7be9ff' : '#ff5a83';
    if (shot.kind === 'dissonant-note') {
      drawDissonantNoteShot(shot);
      continue;
    }
    if (shot.kind === 'wind' || shot.kind === 'black-kite') {
      drawHaneulWindShot(shot);
      continue;
    }
    if (shot.kind === 'shard') {
      drawDaughterMirrorShardShot(shot);
      continue;
    }
    if (shot.kind === 'memory') {
      drawScientistDreamCoreShot(shot);
      continue;
    }
    const shotFrozen = frozenTime() && b.mode !== 'calm';
    ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = shotColor; ctx.fillStyle = shotFrozen ? '#9e9ab5' : shotColor;
    ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  if (b.memoryShield > 0) {
    const p = game.player;
    ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.strokeStyle = '#9effea'; ctx.lineWidth = 3; ctx.shadowBlur = 18; ctx.shadowColor = '#9effea'; ctx.beginPath(); ctx.arc(0, 0, 38 + Math.sin(game.elapsed * 8) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  drawChild(game.player, true);
  drawYunaLoopStationMeter();
  drawPhaseGuide();
}

function update(dt) {
  if (game.phase === 'ending-cinematic') {
    updateEndingCinematic(dt);
    return;
  }
  if (game.phase === 'disconnecting') {
    game.disconnect.elapsed += dt;
    if (game.disconnect.elapsed >= game.disconnect.duration) showDisconnectResult();
    return;
  }
  if (game.phase !== 'playing') return;
  syncBossBgmTimeStop();
  game.rewindExpressionTimer = Math.max(0, (game.rewindExpressionTimer || 0) - dt);
  game.stageRealElapsed = (game.stageRealElapsed || 0) + dt;
  if (currentStage().type === 'boss') {
    updateBoss(dt);
    refreshBossGuide();
    updateMemoryCollapse(dt);
  } else updatePuzzle(dt);
  updateDreamTrails(dt);
  updateHud();
}

function draw() {
  if (game.phase === 'ending-cinematic') {
    drawEndingCinematic();
    return;
  }
  // 인트로/자동 전환 중에도 보스 장면을 그려 전환 상태가 멈춘 것처럼 보이지 않게 한다.
  if (currentStage()?.type === 'boss') drawBoss(); else drawPuzzle();
  if (game.phase === 'disconnecting') drawDreamDisconnect();
}

function loop(time) {
  const dt = Math.min((time - lastFrame) / 1000 || 0, .035);
  lastFrame = time; update(dt); draw(); pressed.clear(); requestAnimationFrame(loop);
}

startButton.addEventListener('click', () => {
  if (game.phase === 'title') {
    closeTitleModals();
    startGameFromTitle();
  }
  else if (game.phase === 'story') continueStoryBeat();
  else startStage();
});
storyButton?.addEventListener('click', () => {
  if (game.phase !== 'title') return;
  closeTitleSettings();
  storySummaryModal?.classList.remove('hidden');
});
settingsButton?.addEventListener('click', () => {
  const opening = titleSettings?.classList.contains('hidden');
  if (opening) closeStorySummary();
  titleSettings?.classList.toggle('hidden', !opening);
  settingsButton.setAttribute('aria-expanded', String(Boolean(opening)));
  updateBgmVolumeControl();
  updateBgmToggle(stageBgm.key);
});
settingsCloseButton?.addEventListener('click', closeTitleSettings);
storyCloseButton?.addEventListener('click', closeStorySummary);
canvas.addEventListener('click', () => {
  if (game.phase === 'ending-cinematic') advanceEndingCinematic();
});
window.addEventListener('pointerdown', primeGameAudio, { passive: true });
mainMenuButton?.addEventListener('click', showTitleScreen);
disconnectSkipButton.addEventListener('click', skipDreamDisconnect);
bgmToggleButton.addEventListener('click', () => {
  if (stageBgm.enabled && stageBgm.playBlocked) {
    stageBgm.playBlocked = false;
    resumeStageBgm();
    updateBgmToggle(stageBgm.key || stageBgmKey());
    return;
  }
  stageBgm.enabled = !stageBgm.enabled;
  if (stageBgm.enabled) resumeStageBgm();
  else pauseStageBgm();
  updateBgmToggle(stageBgm.key || stageBgmKey());
});
bgmVolumeSlider?.addEventListener('input', () => {
  setBgmMasterVolume(Number(bgmVolumeSlider.value) / 100);
});
bgmVolumeSlider?.addEventListener('change', () => {
  setBgmMasterVolume(Number(bgmVolumeSlider.value) / 100, true);
});
pauseBgmVolumeSlider?.addEventListener('input', () => {
  setBgmMasterVolume(Number(pauseBgmVolumeSlider.value) / 100);
});
pauseBgmVolumeSlider?.addEventListener('change', () => {
  setBgmMasterVolume(Number(pauseBgmVolumeSlider.value) / 100, true);
});
restartButton.addEventListener('click', () => {
  if (game.phase === 'failed') startStage();
  else if (game.phase === 'chapter-complete') showFinalTruth();
  else if (game.phase === 'truth') showTitleScreen();
});
ruleCards.forEach((card) => {
  const keyForRule = { time: 'ShiftLeft', resonance: 'KeyL' }[card.dataset.rule];
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

function handleConfirmInput() {
  if (game.phase === 'disconnecting') skipDreamDisconnect();
  else if (game.phase === 'ending-cinematic') advanceEndingCinematic();
  else if (game.phase === 'title') startGameFromTitle();
  else if (game.phase === 'story') continueStoryBeat();
  else if (game.phase === 'intro' || game.phase === 'failed') startStage();
  else if (game.phase === 'chapter-complete') showFinalTruth();
  else if (game.phase === 'truth') showTitleScreen();
  else if (game.phase === 'menu') closeStageMenu();
  else return false;
  return true;
}

window.addEventListener('keydown', (event) => {
  primeGameAudio();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Enter', 'KeyF', 'KeyI'].includes(event.code)) event.preventDefault();
  if (game.phase === 'playing' && (game.layout === 'carousel' || game.boss?.mode === 'chase' && game.boss.windVanePhase) && ['KeyP', 'KeyY'].includes(event.code)) event.preventDefault();
  if (!event.repeat && (event.code === 'Enter' || event.code === 'KeyF') && handleConfirmInput()) {
    event.preventDefault();
    return;
  }
  if (event.code === 'Escape') {
    if (game.phase === 'playing') openStageMenu();
    else if (game.phase === 'menu') closeStageMenu();
    return;
  }
  if (!keys.has(event.code)) pressed.add(event.code);
  keys.add(event.code);
  // 역할형 기억 퍼즐에서는 발판 위에서 바라보는 방향도 기록한다.
  // 짧게 방향키를 누른 직후 K를 눌러도 의도가 즉시 반영되도록 방향을 먼저 갱신한다.
  if (game.phase === 'playing' && game.player) {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') game.player.facing = -1;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') game.player.facing = 1;
  }
  const skillByKey = { ShiftLeft: 'time', ShiftRight: 'time', KeyL: 'resonance', Space: 'dash' };
  const requestedSkill = skillByKey[event.code];
  if (!event.repeat && requestedSkill && isSkillBlocked(requestedSkill)) say(currentStage().blockedHint || '이 구역의 꿈 규칙 때문에 이 상상력 기술은 사용할 수 없습니다.');
  if (event.code === 'Digit3' && !event.repeat) say(hasSkill('time') ? 'Shift·L은 누르고 있는 동안 상상력을 계속 소모합니다.' : '이 기술은 다음 스테이지에서 배웁니다.');
  if (!event.repeat && event.code === 'KeyK') toggleMemoryRecording();
  if (!event.repeat && event.code === 'KeyJ') triggerBossShot();
  if (!event.repeat && event.code === 'KeyI') removeLatestEcho();
  if (!event.repeat && event.code === 'Space') triggerDash();
  if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && event.code === 'KeyP' && !rotateHaneulWindVane(1)) rotateCarouselPhase(1);
  if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && event.code === 'KeyY' && !rotateHaneulWindVane(-1)) rotateCarouselPhase(-1);
  updateHud();
});
window.addEventListener('keyup', (event) => { keys.delete(event.code); updateHud(); });
window.addEventListener('blur', () => {
  keys.clear();
  updateHud();
});

function openStage21PreviewFromUrl() {
  // 검수 주소만 제목·프롤로그를 건너뛴다. 일반 주소의 시작 흐름은 그대로 유지한다.
  if (new URLSearchParams(window.location.search).get('stage') !== '21') return false;
  stageBgm.enabled = false;
  game = freshGameState();
  game.stageIndex = 20;
  startStage();
  return true;
}

updateBgmVolumeControl();
if (!openStage21PreviewFromUrl()) showTitleScreen();
requestAnimationFrame(loop);
