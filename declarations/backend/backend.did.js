export const idlFactory = ({ IDL }) => {
  const Time = IDL.Int;
  const Achievement = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'unlocked' : IDL.Bool,
    'description' : IDL.Text,
    'progress' : IDL.Nat,
    'target' : IDL.Nat,
    'timestamp' : IDL.Opt(Time),
    'category' : IDL.Text,
    'rarity' : IDL.Text,
  });
  const PlayerAchievements = IDL.Record({
    'name' : IDL.Text,
    'achievements' : IDL.Vec(Achievement),
    'defeatedBossTypes' : IDL.Vec(IDL.Text),
  });
  const PowerUp = IDL.Record({
    'id' : IDL.Text,
    'duration' : IDL.Nat,
    'active' : IDL.Bool,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'effect' : IDL.Text,
    'timestamp' : IDL.Opt(Time),
  });
  const SpaceshipDesign = IDL.Record({
    'id' : IDL.Text,
    'effects' : IDL.Text,
    'name' : IDL.Text,
    'color' : IDL.Text,
    'unlocked' : IDL.Bool,
    'description' : IDL.Text,
    'shape' : IDL.Text,
    'unlockCondition' : IDL.Text,
  });
  const PlayerDesigns = IDL.Record({
    'name' : IDL.Text,
    'unlockedDesigns' : IDL.Vec(SpaceshipDesign),
    'selectedDesign' : IDL.Text,
  });
  const PlayerPowerUps = IDL.Record({
    'activePowerUps' : IDL.Vec(PowerUp),
    'name' : IDL.Text,
  });
  const ScoreEntry = IDL.Record({
    'difficulty' : IDL.Text,
    'level' : IDL.Int,
    'score' : IDL.Int,
    'timestamp' : Time,
  });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  return IDL.Service({
    'activatePowerUp' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'addScore' : IDL.Func(
        [IDL.Text, IDL.Int, IDL.Text, IDL.Int],
        [IDL.Bool],
        [],
      ),
    'checkAndUnlockDesigns' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'deactivatePowerUp' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'deleteScore' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'getAchievements' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(PlayerAchievements)],
        ['query'],
      ),
    'getActivePowerUps' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(IDL.Vec(PowerUp))],
        ['query'],
      ),
    'getAllAchievements' : IDL.Func(
        [],
        [IDL.Vec(PlayerAchievements)],
        ['query'],
      ),
    'getAllDesigns' : IDL.Func([], [IDL.Vec(PlayerDesigns)], ['query']),
    'getAllPowerUps' : IDL.Func([], [IDL.Vec(PlayerPowerUps)], ['query']),
    'getAllScores' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, ScoreEntry))],
        ['query'],
      ),
    'getDesigns' : IDL.Func([IDL.Text], [IDL.Opt(PlayerDesigns)], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getScoresByDifficulty' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(IDL.Tuple(IDL.Text, ScoreEntry))],
        ['query'],
      ),
    'getScoresByName' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(IDL.Tuple(IDL.Text, ScoreEntry))],
        ['query'],
      ),
    'getSelectedDesign' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    'getTopScores' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(IDL.Tuple(IDL.Text, ScoreEntry))],
        ['query'],
      ),
    'initializeAchievements' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'initializeDesigns' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'initializePowerUps' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'selectDesign' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'unlockDesign' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'updateAchievement' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [IDL.Bool],
        [],
      ),
    'updateBossMasterAchievement' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Bool],
        [],
      ),
    'updateMagnetMasterAchievement' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Bool],
        [],
      ),
    'updateScore' : IDL.Func(
        [IDL.Text, IDL.Int, IDL.Text, IDL.Int],
        [IDL.Bool],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
