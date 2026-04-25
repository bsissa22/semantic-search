export interface ActionDeltas {
  view: number;
  click: number;
  skip: number;
  dismiss: number;
  share: number;
  dwell: number;
  follow: number;
  block: number;
  like: number;
  fast_skip: number;
  mute_creator: number;
  save: number;
  [key: string]: number;
}

export interface DDARConfig {
  actionDeltas?: Partial<ActionDeltas>;
  decayRate?: number;
  recencyWindowSeconds?: number;
  explicitBoost?: number;
  historySize?: number;
  entropyThreshold?: number;
  diversityPenalty?: number;
  explorationRate?: number;
  feedSize?: number;
  socialGravityWeight?: number;
  socialGravityWindowSeconds?: number;
  groupGravityWeight?: number;
}

export interface ItemInput {
  id: string;
  dimensions: {
    topic?: string | string[];
    creator?: string;
    format?: string;
    language?: string;
    maturity_level?: string;
    explicit_tags?: string | string[];
    [key: string]: any;
  };
  createdAt?: number;
  metadata?: Record<string, any>;
}

export interface FeedEntry {
  item: {
    id: string;
    dimensions: Record<string, string[]>;
    createdAt: number;
    metadata: Record<string, any>;
  };
  score: number;
  scoreRaw: number;
  diversityMultiplier: number;
  explored: boolean;
}

export interface ScoreExplanation {
  itemId: string;
  userId: string;
  components: {
    dotProduct: number;
    recencyBonus: number;
    socialGravity: number;
    explicitBoost: number;
  };
  rawScore: number;
  diversityMultiplier: number;
  finalScore: number;
  keyWeights: Record<string, number>;
  itemDimensions: Record<string, string[]>;
}

export interface ServeFeedOptions {
  candidateIds?: string[];
  feedSize?: number;
  now?: number;
}

export interface HandleActionOptions {
  dwellPercent?: number;
}

export declare class ARU {
  dimensions: Record<string, string[]>;
  constructor(dimensions?: Record<string, any>);
  toKeys(): string[];
  getTopics(): string[];
  getCreator(): string | null;
  toJSON(): { dimensions: Record<string, string[]> };
  static fromJSON(obj: { dimensions: Record<string, string[]> }): ARU;
}

export declare class URV {
  weights: Record<string, number>;
  min: number;
  max: number;
  decayRate: number;
  lastDecayTime: number;
  constructor(options?: { min?: number; max?: number; decayRate?: number });
  applyDecay(): void;
  update(key: string, delta: number): void;
  set(key: string, value: number): void;
  get(key: string): number;
  dotProduct(aruKeys: string[]): number;
  toJSON(): object;
  static fromJSON(obj: object): URV;
}

export declare class TEF {
  history: string[][];
  historySize: number;
  entropyThreshold: number;
  penaltyFactor: number;
  constructor(options?: { historySize?: number; entropyThreshold?: number; penaltyFactor?: number });
  addToHistory(topics: string[]): void;
  getHistory(): string[][];
  clearHistory(): void;
  computeEntropy(historyOverride?: string[][]): number;
  computeEntropyWithItem(itemTopics: string[]): number;
  getDiversityMultiplier(itemTopics: string[]): number;
  toJSON(): object;
  static fromJSON(obj: object): TEF;
}

export declare class SGI {
  constructor(options?: { gravityWeight?: number; gravityWindowSeconds?: number; groupWeight?: number });
  addConnection(userA: string, userB: string): void;
  removeConnection(userA: string, userB: string): void;
  addToGroup(userId: string, groupId: string): void;
  recordInteraction(userId: string, itemId: string, timestamp?: number): void;
  computeGravity(userId: string, itemId: string, now?: number): number;
  pruneInteractions(maxAgeMs?: number): void;
  getFriends(userId: string): string[];
  getGroups(userId: string): string[];
}

export declare class DDAREngine {
  config: Required<DDARConfig>;
  sgi: SGI;
  constructor(config?: DDARConfig);
  getOrCreateUser(userId: string): object;
  hasUser(userId: string): boolean;
  removeUser(userId: string): void;
  addItem(item: ItemInput): object;
  addItems(items: ItemInput[]): object[];
  removeItem(itemId: string): void;
  getItem(itemId: string): object | undefined;
  getAllItems(): object[];
  addConnection(userA: string, userB: string): void;
  removeConnection(userA: string, userB: string): void;
  addToGroup(userId: string, groupId: string): void;
  handleAction(userId: string, action: string, itemId: string, options?: HandleActionOptions): void;
  serveFeed(userId: string, options?: ServeFeedOptions): FeedEntry[];
  getUserWeights(userId: string): Record<string, number>;
  getUserHistory(userId: string): string[][];
  getUserEntropy(userId: string): number;
  explainScore(userId: string, itemId: string, now?: number): ScoreExplanation | null;
  pruneInteractions(maxAgeMs?: number): void;
  getStats(): { totalUsers: number; totalItems: number; config: object };
}

export declare const DEFAULTS: {
  ACTION_DELTAS: ActionDeltas;
  URV_MIN: number;
  URV_MAX: number;
  DECAY_RATE: number;
  RECENCY_WINDOW_SECONDS: number;
  SOCIAL_GRAVITY_WEIGHT: number;
  SOCIAL_GRAVITY_WINDOW_SECONDS: number;
  GROUP_GRAVITY_WEIGHT: number;
  EXPLICIT_BOOST: number;
  HISTORY_SIZE: number;
  ENTROPY_THRESHOLD: number;
  DIVERSITY_PENALTY: number;
  EXPLORATION_RATE: number;
  FEED_SIZE: number;
  ARU_DIMENSIONS: string[];
};
