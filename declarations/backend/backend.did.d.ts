import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Achievement {
  'id' : string,
  'name' : string,
  'unlocked' : boolean,
  'description' : string,
  'progress' : bigint,
  'target' : bigint,
  'timestamp' : [] | [Time],
  'category' : string,
  'rarity' : string,
}
export interface FileReference { 'hash' : string, 'path' : string }
export interface PlayerAchievements {
  'name' : string,
  'achievements' : Array<Achievement>,
  'defeatedBossTypes' : Array<string>,
}
export interface PlayerDesigns {
  'name' : string,
  'unlockedDesigns' : Array<SpaceshipDesign>,
  'selectedDesign' : string,
}
export interface PlayerPowerUps {
  'activePowerUps' : Array<PowerUp>,
  'name' : string,
}
export interface PowerUp {
  'id' : string,
  'duration' : bigint,
  'active' : boolean,
  'name' : string,
  'description' : string,
  'effect' : string,
  'timestamp' : [] | [Time],
}
export interface ScoreEntry {
  'difficulty' : string,
  'level' : bigint,
  'score' : bigint,
  'timestamp' : Time,
}
export interface SpaceshipDesign {
  'id' : string,
  'effects' : string,
  'name' : string,
  'color' : string,
  'unlocked' : boolean,
  'description' : string,
  'shape' : string,
  'unlockCondition' : string,
}
export type Time = bigint;
export interface _SERVICE {
  'activatePowerUp' : ActorMethod<[string, string], boolean>,
  'addScore' : ActorMethod<[string, bigint, string, bigint], boolean>,
  'checkAndUnlockDesigns' : ActorMethod<[string], boolean>,
  'deactivatePowerUp' : ActorMethod<[string, string], boolean>,
  'deleteScore' : ActorMethod<[string], boolean>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'getAchievements' : ActorMethod<[string], [] | [PlayerAchievements]>,
  'getActivePowerUps' : ActorMethod<[string], [] | [Array<PowerUp>]>,
  'getAllAchievements' : ActorMethod<[], Array<PlayerAchievements>>,
  'getAllDesigns' : ActorMethod<[], Array<PlayerDesigns>>,
  'getAllPowerUps' : ActorMethod<[], Array<PlayerPowerUps>>,
  'getAllScores' : ActorMethod<[], Array<[string, ScoreEntry]>>,
  'getDesigns' : ActorMethod<[string], [] | [PlayerDesigns]>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getScoresByDifficulty' : ActorMethod<[string], Array<[string, ScoreEntry]>>,
  'getScoresByName' : ActorMethod<[string], Array<[string, ScoreEntry]>>,
  'getSelectedDesign' : ActorMethod<[string], [] | [string]>,
  'getTopScores' : ActorMethod<[bigint], Array<[string, ScoreEntry]>>,
  'initializeAchievements' : ActorMethod<[string], boolean>,
  'initializeDesigns' : ActorMethod<[string], boolean>,
  'initializePowerUps' : ActorMethod<[string], boolean>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'selectDesign' : ActorMethod<[string, string], boolean>,
  'unlockDesign' : ActorMethod<[string, string], boolean>,
  'updateAchievement' : ActorMethod<[string, string, bigint], boolean>,
  'updateBossMasterAchievement' : ActorMethod<[string, string], boolean>,
  'updateMagnetMasterAchievement' : ActorMethod<[string, bigint], boolean>,
  'updateScore' : ActorMethod<[string, bigint, string, bigint], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
