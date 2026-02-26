import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface ScoreEntry {
    difficulty: string;
    level: bigint;
    score: bigint;
    timestamp: Time;
}
export interface PowerUp {
    id: string;
    duration: bigint;
    active: boolean;
    name: string;
    description: string;
    effect: string;
    timestamp?: Time;
}
export interface PlayerAchievements {
    name: string;
    achievements: Array<Achievement>;
    defeatedBossTypes: Array<string>;
}
export interface PlayerDesigns {
    name: string;
    unlockedDesigns: Array<SpaceshipDesign>;
    selectedDesign: string;
}
export interface PlayerPowerUps {
    activePowerUps: Array<PowerUp>;
    name: string;
}
export interface Achievement {
    id: string;
    name: string;
    unlocked: boolean;
    description: string;
    progress: bigint;
    target: bigint;
    timestamp?: Time;
    category: string;
    rarity: string;
}
export interface SpaceshipDesign {
    id: string;
    effects: string;
    name: string;
    color: string;
    unlocked: boolean;
    description: string;
    shape: string;
    unlockCondition: string;
}
export interface FileReference {
    hash: string;
    path: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    activatePowerUp(name: string, powerUpId: string): Promise<boolean>;
    addScore(name: string, score: bigint, difficulty: string, level: bigint): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkAndUnlockDesigns(name: string): Promise<boolean>;
    deactivatePowerUp(name: string, powerUpId: string): Promise<boolean>;
    deleteScore(name: string): Promise<boolean>;
    dropFileReference(path: string): Promise<void>;
    getAchievements(name: string): Promise<PlayerAchievements | null>;
    getActivePowerUps(name: string): Promise<Array<PowerUp> | null>;
    getAllAchievements(): Promise<Array<PlayerAchievements>>;
    getAllDesigns(): Promise<Array<PlayerDesigns>>;
    getAllPowerUps(): Promise<Array<PlayerPowerUps>>;
    getAllRegisteredUsers(): Promise<Array<[Principal, UserProfile]>>;
    getAllScores(): Promise<Array<[string, ScoreEntry]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDesigns(name: string): Promise<PlayerDesigns | null>;
    getFileReference(path: string): Promise<FileReference>;
    getScoresByDifficulty(difficulty: string): Promise<Array<[string, ScoreEntry]>>;
    getScoresByName(name: string): Promise<Array<[string, ScoreEntry]>>;
    getSelectedDesign(name: string): Promise<string | null>;
    getSelectedDesignForPrincipal(): Promise<string | null>;
    getTopScores(limit: bigint): Promise<Array<[string, ScoreEntry]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    initializeAchievements(name: string): Promise<boolean>;
    initializeDesigns(name: string): Promise<boolean>;
    initializePowerUps(name: string): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isUserRegistered(): Promise<boolean>;
    listFileReferences(): Promise<Array<FileReference>>;
    logoutUser(): Promise<void>;
    registerFileReference(path: string, hash: string): Promise<void>;
    registerUser(name: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selectDesign(name: string, designId: string): Promise<boolean>;
    unlockDesign(name: string, designId: string): Promise<boolean>;
    updateAchievement(name: string, achievementId: string, progress: bigint): Promise<boolean>;
    updateBossMasterAchievement(name: string, bossType: string): Promise<boolean>;
    updateMagnetMasterAchievement(name: string, magnetCount: bigint): Promise<boolean>;
    updateMultipleAchievements(name: string, updates: Array<[string, bigint]>): Promise<boolean>;
    updateScore(name: string, newScore: bigint, newDifficulty: string, newLevel: bigint): Promise<boolean>;
}