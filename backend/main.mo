import Array "mo:base/Array";
import BlobStorage "blob-storage/Mixin";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Int "mo:base/Int";
import List "mo:base/List";
import Registry "blob-storage/registry";
import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";

actor GalagaiGame {
    type ScoreEntry = {
        score : Int;
        timestamp : Time.Time;
        difficulty : Text;
        level : Int;
    };

    type Achievement = {
        id : Text;
        name : Text;
        description : Text;
        unlocked : Bool;
        timestamp : ?Time.Time;
        progress : Nat;
        target : Nat;
        category : Text;
        rarity : Text;
    };

    type PlayerAchievements = {
        name : Text;
        achievements : [Achievement];
        defeatedBossTypes : [Text];
    };

    type SpaceshipDesign = {
        id : Text;
        name : Text;
        description : Text;
        unlocked : Bool;
        unlockCondition : Text;
        color : Text;
        shape : Text;
        effects : Text;
    };

    type PlayerDesigns = {
        name : Text;
        unlockedDesigns : [SpaceshipDesign];
        selectedDesign : Text;
    };

    type PowerUp = {
        id : Text;
        name : Text;
        description : Text;
        active : Bool;
        duration : Nat;
        timestamp : ?Time.Time;
        effect : Text;
    };

    type PlayerPowerUps = {
        name : Text;
        activePowerUps : [PowerUp];
    };

    // List of inappropriate words (case-insensitive, unique entries)
    let badWords = [
        "fuck",
        "shit",
        "bitch",
        "asshole",
        "bastard",
        "dick",
        "pussy",
        "cunt",
        "faggot",
        "nigger",
        "wanker",
        "bollocks",
        "bugger",
        "arse",
        "twat",
        "schlampe",
        "hure",
        "wichser",
        "arschloch",
        "fotze",
        "schwanz",
        "miststück",
        "hurensohn",
        "spasti",
        "spast",
        "spastiker",
        "spastikerin",
        "spastikerinnen",
    ];

    // Helper function to check if a name contains any bad words
    func containsBadWord(name : Text) : Bool {
        let lowerName = Text.toLowercase(name);
        for (word in badWords.vals()) {
            if (Text.contains(lowerName, #text(Text.toLowercase(word)))) {
                return true;
            };
        };
        false;
    };

    // Add a new score if the name is appropriate
    public func addScore(name : Text, score : Int, difficulty : Text, level : Int) : async Bool {
        if (containsBadWord(name)) {
            return false;
        };

        let entry : ScoreEntry = {
            score;
            timestamp = Time.now();
            difficulty;
            level;
        };

        // Add new entry to the list
        highScores := List.push((name, entry), highScores);

        // Convert to array for sorting
        let entriesArray = List.toArray(highScores);

        // Sort entries by score (descending)
        let sorted = Array.sort<(Text, ScoreEntry)>(
            entriesArray,
            func(a, b) {
                if (a.1.score > b.1.score) { #less } else if (a.1.score < b.1.score) {
                    #greater;
                } else { #equal };
            },
        );

        // Keep only top 50 entries
        let finalEntries = if (sorted.size() > 50) {
            Array.subArray(sorted, 0, 50);
        } else {
            sorted;
        };

        // Convert back to list
        highScores := List.fromArray(finalEntries);

        true;
    };

    // Get top scores sorted by score
    public query func getTopScores(limit : Nat) : async [(Text, ScoreEntry)] {
        let entriesArray = List.toArray(highScores);

        // Sort entries by score (descending)
        let sorted = Array.sort<(Text, ScoreEntry)>(
            entriesArray,
            func(a, b) {
                if (a.1.score > b.1.score) { #less } else if (a.1.score < b.1.score) {
                    #greater;
                } else { #equal };
            },
        );

        // Return top entries up to the limit
        Array.subArray(sorted, 0, if (limit > sorted.size()) sorted.size() else limit);
    };

    // Get scores by difficulty
    public query func getScoresByDifficulty(difficulty : Text) : async [(Text, ScoreEntry)] {
        var filtered = List.nil<(Text, ScoreEntry)>();

        for ((name, entry) in List.toIter(highScores)) {
            if (entry.difficulty == difficulty) {
                filtered := List.push((name, entry), filtered);
            };
        };

        List.toArray(filtered);
    };

    // Get scores by player name
    public query func getScoresByName(name : Text) : async [(Text, ScoreEntry)] {
        var filtered = List.nil<(Text, ScoreEntry)>();

        for ((n, entry) in List.toIter(highScores)) {
            if (n == name) {
                filtered := List.push((n, entry), filtered);
            };
        };

        List.toArray(filtered);
    };

    // Get all scores
    public query func getAllScores() : async [(Text, ScoreEntry)] {
        List.toArray(highScores);
    };

    // Delete a score by name
    public func deleteScore(name : Text) : async Bool {
        var found = false;
        var newList = List.nil<(Text, ScoreEntry)>();

        for ((n, entry) in List.toIter(highScores)) {
            if (n != name) {
                newList := List.push((n, entry), newList);
            } else {
                found := true;
            };
        };

        highScores := newList;
        found;
    };

    // Update a score
    public func updateScore(name : Text, newScore : Int, newDifficulty : Text, newLevel : Int) : async Bool {
        var found = false;
        var newList = List.nil<(Text, ScoreEntry)>();

        for ((n, entry) in List.toIter(highScores)) {
            if (n == name) {
                let updatedEntry : ScoreEntry = {
                    score = newScore;
                    timestamp = Time.now();
                    difficulty = newDifficulty;
                    level = newLevel;
                };
                newList := List.push((n, updatedEntry), newList);
                found := true;
            } else {
                newList := List.push((n, entry), newList);
            };
        };

        highScores := newList;
        found;
    };

    // Achievement system
    public func initializeAchievements(name : Text) : async Bool {
        let defaultAchievements : [Achievement] = [
            {
                id = "fast_hunter";
                name = "Schneller Jäger";
                description = "Besiege 15 Gegner in 8 Sekunden";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 15;
                category = "combat";
                rarity = "common";
            },
            {
                id = "first_boss";
                name = "Erster Boss-Sieg";
                description = "Besiege den ersten Boss-Gegner";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 1;
                category = "boss";
                rarity = "common";
            },
            {
                id = "millionaire";
                name = "Millionär";
                description = "Erreiche 1.000.000 Punkte";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 1000000;
                category = "score";
                rarity = "rare";
            },
            {
                id = "boss_master";
                name = "Boss-Meister";
                description = "Besiege 5 verschiedene Boss-Typen";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 5;
                category = "boss";
                rarity = "epic";
            },
            {
                id = "survivor";
                name = "Überlebenskünstler";
                description = "Beende 10 Level ohne ein Leben zu verlieren";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 10;
                category = "survival";
                rarity = "rare";
            },
            {
                id = "double_power";
                name = "Doppel-Power";
                description = "Aktiviere Doppel-Raumschiff-Modus zum ersten Mal";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 1;
                category = "powerup";
                rarity = "common";
            },
            {
                id = "collector";
                name = "Sammler";
                description = "Sammle 20 Power-Ups in einer Spielsitzung";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 20;
                category = "powerup";
                rarity = "rare";
            },
            {
                id = "precision_shooter";
                name = "Präzisionsschütze";
                description = "Erreiche 90% Trefferquote in einem Level";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 90;
                category = "combat";
                rarity = "epic";
            },
            {
                id = "endurance_champion";
                name = "Ausdauer-Champion";
                description = "Spiele 30 Minuten in einer Sitzung";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 30;
                category = "time";
                rarity = "rare";
            },
            {
                id = "perfectionist";
                name = "Perfektionist";
                description = "Beende ein Level ohne Schaden zu nehmen";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 1;
                category = "survival";
                rarity = "epic";
            },
            {
                id = "magnet_master";
                name = "Magnet-Meister";
                description = "Sammle 10 Power-Ups mit Magnet-Power-Up";
                unlocked = false;
                timestamp = null;
                progress = 0;
                target = 10;
                category = "powerup";
                rarity = "rare";
            },
        ];

        let playerAchievements : PlayerAchievements = {
            name;
            achievements = defaultAchievements;
            defeatedBossTypes = [];
        };

        achievements := List.push(playerAchievements, achievements);
        true;
    };

    public func updateAchievement(name : Text, achievementId : Text, progress : Nat) : async Bool {
        var found = false;
        var newList = List.nil<PlayerAchievements>();

        for (player in List.toIter(achievements)) {
            if (player.name == name) {
                let updatedAchievements = Array.map<Achievement, Achievement>(
                    player.achievements,
                    func(ach) {
                        if (ach.id == achievementId) {
                            {
                                ach with
                                progress = if (progress > ach.target) ach.target else progress;
                                unlocked = progress >= ach.target;
                                timestamp = if (progress >= ach.target) ?Time.now() else ach.timestamp;
                            };
                        } else {
                            ach;
                        };
                    },
                );
                newList := List.push({ player with achievements = updatedAchievements }, newList);
                found := true;
            } else {
                newList := List.push(player, newList);
            };
        };

        achievements := newList;
        found;
    };

    public func updateBossMasterAchievement(name : Text, bossType : Text) : async Bool {
        var found = false;
        var newList = List.nil<PlayerAchievements>();

        for (player in List.toIter(achievements)) {
            if (player.name == name) {
                let bossMasterAchievement = Array.find<Achievement>(
                    player.achievements,
                    func(ach) { ach.id == "boss_master" },
                );

                switch (bossMasterAchievement) {
                    case (null) {
                        newList := List.push(player, newList);
                    };
                    case (?achievement) {
                        let currentBossTypes = player.defeatedBossTypes;
                        let bossTypeExists = Array.find<Text>(
                            currentBossTypes,
                            func(bt) { bt == bossType },
                        );

                        let newBossTypes = switch (bossTypeExists) {
                            case (null) {
                                Array.append(currentBossTypes, [bossType]);
                            };
                            case (?_) {
                                currentBossTypes;
                            };
                        };

                        let newProgress = newBossTypes.size();

                        let updatedAchievements = Array.map<Achievement, Achievement>(
                            player.achievements,
                            func(ach) {
                                if (ach.id == "boss_master") {
                                    {
                                        ach with
                                        progress = newProgress;
                                        unlocked = newProgress >= ach.target;
                                        timestamp = if (newProgress >= ach.target) ?Time.now() else ach.timestamp;
                                    };
                                } else {
                                    ach;
                                };
                            },
                        );
                        newList := List.push({ player with achievements = updatedAchievements; defeatedBossTypes = newBossTypes }, newList);
                        found := true;
                    };
                };
            } else {
                newList := List.push(player, newList);
            };
        };

        achievements := newList;
        found;
    };

    public func updateMagnetMasterAchievement(name : Text, magnetCount : Nat) : async Bool {
        var found = false;
        var newList = List.nil<PlayerAchievements>();

        for (player in List.toIter(achievements)) {
            if (player.name == name) {
                let updatedAchievements = Array.map<Achievement, Achievement>(
                    player.achievements,
                    func(ach) {
                        if (ach.id == "magnet_master") {
                            {
                                ach with
                                progress = if (magnetCount > ach.target) ach.target else magnetCount;
                                unlocked = magnetCount >= ach.target;
                                timestamp = if (magnetCount >= ach.target) ?Time.now() else ach.timestamp;
                            };
                        } else {
                            ach;
                        };
                    },
                );
                newList := List.push({ player with achievements = updatedAchievements }, newList);
                found := true;
            } else {
                newList := List.push(player, newList);
            };
        };

        achievements := newList;
        found;
    };

    public query func getAchievements(name : Text) : async ?PlayerAchievements {
        for (player in List.toIter(achievements)) {
            if (player.name == name) {
                return ?player;
            };
        };
        null;
    };

    public query func getAllAchievements() : async [PlayerAchievements] {
        List.toArray(achievements);
    };

    // New function to update multiple achievements at once
    public func updateMultipleAchievements(name : Text, updates : [(Text, Nat)]) : async Bool {
        var found = false;
        var newList = List.nil<PlayerAchievements>();

        for (player in List.toIter(achievements)) {
            if (player.name == name) {
                let updatedAchievements = Array.map<Achievement, Achievement>(
                    player.achievements,
                    func(ach) {
                        let update = Array.find<(Text, Nat)>(
                            updates,
                            func(u) { u.0 == ach.id },
                        );
                        switch (update) {
                            case (?u) {
                                {
                                    ach with
                                    progress = if (u.1 > ach.target) ach.target else u.1;
                                    unlocked = u.1 >= ach.target;
                                    timestamp = if (u.1 >= ach.target) ?Time.now() else ach.timestamp;
                                };
                            };
                            case (null) { ach };
                        };
                    },
                );
                newList := List.push({ player with achievements = updatedAchievements }, newList);
                found := true;
            } else {
                newList := List.push(player, newList);
            };
        };

        achievements := newList;
        found;
    };

    // Spaceship design system with unique unlock conditions
    public func initializeDesigns(name : Text) : async Bool {
        let defaultDesigns : [SpaceshipDesign] = [
            {
                id = "classic";
                name = "Klassisch";
                description = "Standard-Raumschiff-Design";
                unlocked = true;
                unlockCondition = "Standard";
                color = "white";
                shape = "classic";
                effects = "none";
            },
            {
                id = "red";
                name = "Rot";
                description = "Rotes Raumschiff-Design";
                unlocked = false;
                unlockCondition = "250.000 Punkte";
                color = "red";
                shape = "classic";
                effects = "none";
            },
            {
                id = "blue";
                name = "Blau";
                description = "Blaues Raumschiff-Design";
                unlocked = false;
                unlockCondition = "Level 5";
                color = "blue";
                shape = "classic";
                effects = "none";
            },
            {
                id = "green";
                name = "Grün";
                description = "Grünes Raumschiff-Design";
                unlocked = false;
                unlockCondition = "Level 15";
                color = "green";
                shape = "classic";
                effects = "none";
            },
            {
                id = "yellow";
                name = "Gelb";
                description = "Gelbes Raumschiff-Design";
                unlocked = false;
                unlockCondition = "750.000 Punkte";
                color = "yellow";
                shape = "classic";
                effects = "none";
            },
            {
                id = "f18";
                name = "F/A-18";
                description = "F/A-18 inspiriertes Design";
                unlocked = false;
                unlockCondition = "500.000 Punkte erreichen";
                color = "yellow";
                shape = "f18";
                effects = "none";
            },
            {
                id = "energy_trail";
                name = "Energie-Spur";
                description = "Raumschiff mit Energie-Spur";
                unlocked = false;
                unlockCondition = "Level 10";
                color = "white";
                shape = "classic";
                effects = "energy_trail";
            },
            {
                id = "plasma";
                name = "Plasma";
                description = "Plasma-Effekt-Design";
                unlocked = false;
                unlockCondition = "Level 20";
                color = "blue";
                shape = "classic";
                effects = "plasma";
            },
        ];

        let playerDesigns : PlayerDesigns = {
            name;
            unlockedDesigns = defaultDesigns;
            selectedDesign = "classic";
        };

        designs := List.push(playerDesigns, designs);
        true;
    };

    public func unlockDesign(name : Text, designId : Text) : async Bool {
        var found = false;
        var newList = List.nil<PlayerDesigns>();

        for (player in List.toIter(designs)) {
            if (player.name == name) {
                let updatedDesigns = Array.map<SpaceshipDesign, SpaceshipDesign>(
                    player.unlockedDesigns,
                    func(design) {
                        if (design.id == designId) {
                            { design with unlocked = true };
                        } else {
                            design;
                        };
                    },
                );
                newList := List.push({ player with unlockedDesigns = updatedDesigns }, newList);
                found := true;
            } else {
                newList := List.push(player, newList);
            };
        };

        designs := newList;
        found;
    };

    public func selectDesign(name : Text, designId : Text) : async Bool {
        var found = false;
        var newList = List.nil<PlayerDesigns>();

        for (player in List.toIter(designs)) {
            if (player.name == name) {
                newList := List.push({ player with selectedDesign = designId }, newList);
                found := true;
            } else {
                newList := List.push(player, newList);
            };
        };

        designs := newList;
        found;
    };

    public query func getDesigns(name : Text) : async ?PlayerDesigns {
        for (player in List.toIter(designs)) {
            if (player.name == name) {
                return ?player;
            };
        };
        null;
    };

    public query func getAllDesigns() : async [PlayerDesigns] {
        List.toArray(designs);
    };

    // New function to check and unlock designs based on achievements and scores
    public func checkAndUnlockDesigns(name : Text) : async Bool {
        var found = false;
        var newList = List.nil<PlayerDesigns>();

        // Get player's highest score
        var highestScore : Int = 0;
        for ((n, entry) in List.toIter(highScores)) {
            if (n == name and entry.score > highestScore) {
                highestScore := entry.score;
            };
        };

        // Get player's achievements
        var playerAchievements : ?PlayerAchievements = null;
        for (player in List.toIter(achievements)) {
            if (player.name == name) {
                playerAchievements := ?player;
            };
        };

        // Get player's designs and update unlock status
        for (player in List.toIter(designs)) {
            if (player.name == name) {
                let updatedDesigns = Array.map<SpaceshipDesign, SpaceshipDesign>(
                    player.unlockedDesigns,
                    func(design) {
                        switch (design.id) {
                            case ("red") {
                                if (highestScore >= 250000) {
                                    { design with unlocked = true };
                                } else {
                                    design;
                                };
                            };
                            case ("yellow") {
                                if (highestScore >= 750000) {
                                    { design with unlocked = true };
                                } else {
                                    design;
                                };
                            };
                            case ("f18") {
                                if (highestScore >= 500000) {
                                    { design with unlocked = true };
                                } else {
                                    design;
                                };
                            };
                            case ("blue") {
                                switch (playerAchievements) {
                                    case (?ach) {
                                        let hasLevel5 = Array.find<Achievement>(
                                            ach.achievements,
                                            func(a) { a.id == "first_boss" and a.unlocked },
                                        );
                                        switch (hasLevel5) {
                                            case (?_) { { design with unlocked = true } };
                                            case (null) { design };
                                        };
                                    };
                                    case (null) { design };
                                };
                            };
                            case ("green") {
                                switch (playerAchievements) {
                                    case (?ach) {
                                        let hasLevel15 = Array.find<Achievement>(
                                            ach.achievements,
                                            func(a) { a.id == "first_boss" and a.unlocked },
                                        );
                                        switch (hasLevel15) {
                                            case (?_) { { design with unlocked = true } };
                                            case (null) { design };
                                        };
                                    };
                                    case (null) { design };
                                };
                            };
                            case ("energy_trail") {
                                switch (playerAchievements) {
                                    case (?ach) {
                                        let hasLevel10 = Array.find<Achievement>(
                                            ach.achievements,
                                            func(a) { a.id == "first_boss" and a.unlocked },
                                        );
                                        switch (hasLevel10) {
                                            case (?_) { { design with unlocked = true } };
                                            case (null) { design };
                                        };
                                    };
                                    case (null) { design };
                                };
                            };
                            case ("plasma") {
                                switch (playerAchievements) {
                                    case (?ach) {
                                        let hasLevel20 = Array.find<Achievement>(
                                            ach.achievements,
                                            func(a) { a.id == "first_boss" and a.unlocked },
                                        );
                                        switch (hasLevel20) {
                                            case (?_) { { design with unlocked = true } };
                                            case (null) { design };
                                        };
                                    };
                                    case (null) { design };
                                };
                            };
                            case (_) { design };
                        };
                    },
                );
                newList := List.push({ player with unlockedDesigns = updatedDesigns }, newList);
                found := true;
            } else {
                newList := List.push(player, newList);
            };
        };

        designs := newList;
        found;
    };

    // New function to get selected design for a player
    public query func getSelectedDesign(name : Text) : async ?Text {
        for (player in List.toIter(designs)) {
            if (player.name == name) {
                return ?player.selectedDesign;
            };
        };
        null;
    };

    // New function to get selected design for a principal
    public query ({ caller }) func getSelectedDesignForPrincipal() : async ?Text {
        switch (principalMap.get(userProfiles, caller)) {
            case (?profile) {
                for (player in List.toIter(designs)) {
                    if (player.name == profile.name) {
                        return ?player.selectedDesign;
                    };
                };
                null;
            };
            case (null) { null };
        };
    };

    // Power-up system with "Schnellfeuer" (Rapid Fire) implementation
    public func initializePowerUps(name : Text) : async Bool {
        let defaultPowerUps : [PowerUp] = [
            {
                id = "rapid_fire";
                name = "Schnellfeuer";
                description = "Erhöht die Feuerrate für 10 Sekunden";
                active = false;
                duration = 10;
                timestamp = null;
                effect = "fire_rate";
            },
            {
                id = "double_ship";
                name = "Doppel-Raumschiff";
                description = "Aktiviert Doppel-Raumschiff-Modus";
                active = false;
                duration = 0;
                timestamp = null;
                effect = "double_ship";
            },
            {
                id = "magnet";
                name = "Magnet";
                description = "Zieht Power-Ups an";
                active = false;
                duration = 8;
                timestamp = null;
                effect = "magnet";
            },
        ];

        let playerPowerUps : PlayerPowerUps = {
            name;
            activePowerUps = defaultPowerUps;
        };

        powerUps := List.push(playerPowerUps, powerUps);
        true;
    };

    public func activatePowerUp(name : Text, powerUpId : Text) : async Bool {
        var found = false;
        var newList = List.nil<PlayerPowerUps>();

        for (player in List.toIter(powerUps)) {
            if (player.name == name) {
                let updatedPowerUps = Array.map<PowerUp, PowerUp>(
                    player.activePowerUps,
                    func(pu) {
                        if (pu.id == powerUpId) {
                            {
                                pu with
                                active = true;
                                timestamp = ?Time.now();
                            };
                        } else {
                            pu;
                        };
                    },
                );
                newList := List.push({ player with activePowerUps = updatedPowerUps }, newList);
                found := true;
            } else {
                newList := List.push(player, newList);
            };
        };

        powerUps := newList;
        found;
    };

    public func deactivatePowerUp(name : Text, powerUpId : Text) : async Bool {
        var found = false;
        var newList = List.nil<PlayerPowerUps>();

        for (player in List.toIter(powerUps)) {
            if (player.name == name) {
                let updatedPowerUps = Array.map<PowerUp, PowerUp>(
                    player.activePowerUps,
                    func(pu) {
                        if (pu.id == powerUpId) {
                            {
                                pu with
                                active = false;
                                timestamp = null;
                            };
                        } else {
                            pu;
                        };
                    },
                );
                newList := List.push({ player with activePowerUps = updatedPowerUps }, newList);
                found := true;
            } else {
                newList := List.push(player, newList);
            };
        };

        powerUps := newList;
        found;
    };

    public query func getActivePowerUps(name : Text) : async ?[PowerUp] {
        for (player in List.toIter(powerUps)) {
            if (player.name == name) {
                return ?player.activePowerUps;
            };
        };
        null;
    };

    public query func getAllPowerUps() : async [PlayerPowerUps] {
        List.toArray(powerUps);
    };

    // File storage using blob-storage component
    let registry = Registry.new();

    public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
        Registry.add(registry, path, hash);
    };

    public query ({ caller }) func getFileReference(path : Text) : async Registry.FileReference {
        Registry.get(registry, path);
    };

    public query ({ caller }) func listFileReferences() : async [Registry.FileReference] {
        Registry.list(registry);
    };

    public shared ({ caller }) func dropFileReference(path : Text) : async () {
        Registry.remove(registry, path);
    };

    var highScores : List.List<(Text, ScoreEntry)> = List.nil();
    var achievements : List.List<PlayerAchievements> = List.nil();
    var designs : List.List<PlayerDesigns> = List.nil();
    var powerUps : List.List<PlayerPowerUps> = List.nil();

    // Authorization system
    let accessControlState = AccessControl.initState();

    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    public type UserProfile = {
        name : Text;
    };

    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty();

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        principalMap.get(userProfiles, caller);
    };

    public query func getUserProfile(user : Principal) : async ?UserProfile {
        principalMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        userProfiles := principalMap.put(userProfiles, caller, profile);
    };

    // New function to register a user
    public shared ({ caller }) func registerUser(name : Text) : async () {
        if (containsBadWord(name)) {
            Debug.trap("Invalid name: contains inappropriate content");
        };

        let profile : UserProfile = {
            name;
        };

        userProfiles := principalMap.put(userProfiles, caller, profile);

        // Initialize achievements, designs, and power-ups for the new user
        ignore await initializeAchievements(name);
        ignore await initializeDesigns(name);
        ignore await initializePowerUps(name);
    };

    // New function to check if a user is registered
    public query ({ caller }) func isUserRegistered() : async Bool {
        switch (principalMap.get(userProfiles, caller)) {
            case (?_) { true };
            case (null) { false };
        };
    };

    // New function to get all registered users
    public query func getAllRegisteredUsers() : async [(Principal, UserProfile)] {
        let entries = principalMap.entries(userProfiles);
        Iter.toArray(entries);
    };

    // New function to logout a user
    public shared ({ caller }) func logoutUser() : async () {
        userProfiles := principalMap.delete(userProfiles, caller);
    };

    include BlobStorage(registry);
};

