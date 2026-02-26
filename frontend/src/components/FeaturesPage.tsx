import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

type Language = 'de' | 'en';

const translations = {
  de: {
    title: 'GALAGAI - Features',
    backToMenu: 'Zurück zum Hauptmenü',
    attribution: 'durch j_marques',
    sections: {
      difficulties: {
        title: 'Schwierigkeitsgrade',
        easy: 'Einfach: Langsame Gegner, weniger Schüsse, entspanntes Spieltempo für Anfänger',
        medium: 'Mittel: Moderate Geschwindigkeit, ausgewogene Herausforderung',
        hard: 'Schwer: Schnelle Gegner, häufige Schüsse, maximale Herausforderung'
      },
      concept: {
        title: 'Spielkonzept',
        desc: 'GALAGAI ist ein klassisches Arcade-Weltraum-Shooter-Spiel inspiriert von Galaga. Steuere dein Raumschiff, weiche feindlichen Projektilen aus und zerstöre Wellen von Gegnern. Überlebe so lange wie möglich und erreiche die höchste Punktzahl!'
      },
      enemies: {
        title: 'Gegnertypen',
        grunt: 'Grunt (Grün): Basis-Gegner mit einfachen Bewegungsmustern - 100 Punkte',
        officer: 'Officer (Gelb): Mittlere Gegner mit Formation-Flug - 160 Punkte',
        diver: 'Diver (Orange): Sturzflug-Angriffe auf den Spieler - 250 Punkte',
        zigzag: 'Zigzag (Hellgrün): Zickzack-Bewegungsmuster - 200 Punkte',
        formation: 'Formation (Blau): Gruppen-Flugformation - 300 Punkte',
        heavy: 'Heavy (Lila): Schwere Einheiten mit mehr Lebenspunkten - 400 Punkte',
        boss: 'Boss (Rot): Erscheint alle 5 Levels (5, 10, 15, 20...) mit deutlich mehr Lebenspunkten und einzigartigen Angriffsmustern - 1000+ Punkte'
      },
      bossTypes: {
        title: 'Boss-Typen & Formationen',
        type1: 'Typ 1 - Heavy Assault Boss: Schnellfeuer-Projektile, horizontale Bewegung mit orbitierenden Schutz-Einheiten',
        type2: 'Typ 2 - Shield Boss: Rotierende Schutzbarrieren, Streuschuss-Angriffe, dynamische Schildformation',
        type3: 'Typ 3 - Teleporting Boss: Sofortige Positionswechsel alle 3 Sekunden, zielsuchende Projektile',
        type4: 'Typ 4 - Swarm Commander Boss: Spawnt zusätzliche Mini-Gegner während des Kampfes, koordinierte Schwarm-Angriffe',
        type5: 'Typ 5 - Fortress Boss: Multiple Waffensysteme, rotierende Angriffsmuster, verstärkte Verteidigung',
        type6: 'Typ 6 - Plasma Destroyer Boss: Energie-Strahl-Angriffe, Schild-Regeneration, fortgeschrittene Bewegungsmuster',
        note: 'Boss-Gegner sind 1,5x größer als normale Gegner mit einzigartigen taktischen Formationen und Bewegungsmustern'
      },
      scoring: {
        title: 'Punktesystem',
        desc: 'Punkte werden für zerstörte Gegner vergeben. Die Punktzahl variiert je nach Gegnertyp und Schwierigkeitsgrad.',
        multipliers: 'Schwierigkeits-Multiplikatoren:',
        easy: 'Einfach: 1.0x',
        medium: 'Mittel: 1.5x',
        hard: 'Schwer: 2.0x',
        bossNote: 'Boss-Gegner geben deutlich mehr Punkte als normale Gegner!'
      },
      shipUpgrades: {
        title: 'Raumschiff-Upgrades',
        bossUpgrades: 'Boss-Level Upgrades: Nach jedem Boss-Sieg (Level 5, 10, 15, 20...) erhält dein Raumschiff spektakuläre visuelle Upgrades mit dramatischen Farbänderungen, Leuchteffekten und Partikelspuren.',
        scoreUpgrades: 'Score-basierte Upgrades: Alle 500.000 Punkte (500k, 1M, 1,5M...) werden spezielle visuelle Verbesserungen freigeschaltet.',
        fa18: 'F/A-18 Transformation: Bei 500.000 Punkten verwandelt sich dein Raumschiff in ein schmaleres, längeres Design inspiriert von einem F/A-18 Kampfjet mit gelblicher Färbung.',
        note: 'Alle Upgrades sind kumulativ und bleiben für die gesamte Spielsitzung aktiv!'
      },
      doubleShip: {
        title: 'Doppel-Raumschiff System',
        desc: 'Das Doppel-Raumschiff kann durch Score-basierte Upgrades (alle 500.000 Punkte) oder Boss-Siege freigeschaltet werden.',
        benefits: 'Vorteile:',
        sync: 'Zwei Raumschiffe bewegen sich synchron',
        firepower: 'Beide Schiffe feuern gleichzeitig - doppelte Feuerkraft!',
        duration: 'Aktiv für 30-45 Sekunden oder bis ein Schiff getroffen wird',
        animation: 'Spektakuläre Aktivierungs-Animation mit Energieverbindungen zwischen den Schiffen!'
      },
      bonusLife: {
        title: 'Bonus-Leben System',
        desc: 'Nach jedem zweiten Boss-Sieg (Level 10, 20, 30, 40...) erhältst du ein zusätzliches Leben!',
        animation: 'Eine spektakuläre Gewinner-Animation mit Soundeffekt zeigt die Belohnung an.',
        display: 'Die Leben-Anzeige leuchtet auf, wenn ein Bonus-Leben vergeben wird.'
      },
      powerups: {
        title: 'Power-Ups',
        doubleFire: 'Doppelfeuer (Orange): Feuere zwei Projektile gleichzeitig für 10 Sekunden',
        shield: 'Schild (Cyan): Schützt vor einem Treffer für 15 Sekunden',
        invincibility: 'Unverwundbarkeit (Gold): Vollständige Unverwundbarkeit für 8 Sekunden - keine Treffer möglich!',
        rapidFire: 'Schnellfeuer (Rot): Erhöhte Feuerrate und Projektilgeschwindigkeit für 12 Sekunden',
        spreadShot: 'Streuschuss (Lila): Feuere drei Projektile in einem Fächer-Muster für 10 Sekunden',
        magnet: 'Magnet (Grün): Zieht alle Power-Ups und Münzen automatisch zum Raumschiff für 8 Sekunden',
        slowMotion: 'Zeitlupe (Blau): Verlangsamt alle Gegner und Projektile für 10 Sekunden - du bleibst normal schnell!',
        falling: 'Power-Ups fallen von oben herab - sammle sie ein, bevor sie den Bildschirm verlassen!',
        boss: 'Boss-Siege gewähren automatisch spezielle Power-Ups als Belohnung.',
        note: 'Alle Power-Ups haben einzigartige visuelle Effekte und Audio-Feedback!'
      },
      progression: {
        title: 'Level-Progression',
        desc: 'Das Spiel wird mit jedem Level schwieriger:',
        moreEnemies: 'Mehr Gegner pro Welle',
        faster: 'Schnellere Gegnerbewegungen',
        moreShots: 'Häufigere Gegnerangriffe',
        bossLevels: 'Boss-Level: Jedes 5. Level (5, 10, 15, 20...) ist ein Boss-Level mit einem mächtigen Boss-Gegner und einzigartigen taktischen Formationen.',
        transitions: 'Sanfte Level-Übergänge mit Ankündigung des nächsten Levels und spezieller Boss-Level-Warnung!'
      },
      leaderboard: {
        title: 'Bestenliste',
        desc: 'Die globale Bestenliste zeigt die Top 50 Spieler aller Zeiten.',
        shows: 'Jeder Eintrag zeigt:',
        name: 'Spielername',
        score: 'Punktzahl',
        difficulty: 'Schwierigkeitsgrad',
        stage: 'Erreichtes Level (Stage)',
        multiple: 'Derselbe Spielername kann mehrfach in der Bestenliste erscheinen - jeder Score ist ein eigener Eintrag!'
      },
      controls: {
        title: 'Steuerung',
        desktop: 'Desktop:',
        arrows: '← → Pfeiltasten: Raumschiff bewegen',
        space: 'Leertaste: Schießen',
        mobile: 'Mobile:',
        blueButtons: 'Blaue Pfeil-Buttons: Links/Rechts bewegen',
        redButton: 'Roter Feuer-Button: Schießen',
        optimized: 'Große, touch-optimierte Buttons für komfortables Spielen auf Smartphones!'
      }
    }
  },
  en: {
    title: 'GALAGAI - Features',
    backToMenu: 'Back to Main Menu',
    attribution: 'by j_marques',
    sections: {
      difficulties: {
        title: 'Difficulty Levels',
        easy: 'Easy: Slow enemies, fewer shots, relaxed gameplay for beginners',
        medium: 'Medium: Moderate speed, balanced challenge',
        hard: 'Hard: Fast enemies, frequent shots, maximum challenge'
      },
      concept: {
        title: 'Game Concept',
        desc: 'GALAGAI is a classic arcade space shooter game inspired by Galaga. Control your spaceship, dodge enemy projectiles, and destroy waves of enemies. Survive as long as possible and achieve the highest score!'
      },
      enemies: {
        title: 'Enemy Types',
        grunt: 'Grunt (Green): Basic enemies with simple movement patterns - 100 points',
        officer: 'Officer (Yellow): Medium enemies with formation flight - 160 points',
        diver: 'Diver (Orange): Diving attacks toward the player - 250 points',
        zigzag: 'Zigzag (Light Green): Zigzag movement patterns - 200 points',
        formation: 'Formation (Blue): Group flight formation - 300 points',
        heavy: 'Heavy (Purple): Heavy units with more health points - 400 points',
        boss: 'Boss (Red): Appears every 5 levels (5, 10, 15, 20...) with significantly more health and unique attack patterns - 1000+ points'
      },
      bossTypes: {
        title: 'Boss Types & Formations',
        type1: 'Type 1 - Heavy Assault Boss: Rapid-fire projectiles, horizontal movement with orbiting protective units',
        type2: 'Type 2 - Shield Boss: Rotating protective barriers, spread-shot attacks, dynamic shield formation',
        type3: 'Type 3 - Teleporting Boss: Instant position changes every 3 seconds, homing projectiles',
        type4: 'Type 4 - Swarm Commander Boss: Spawns additional mini-enemies during battle, coordinated swarm attacks',
        type5: 'Type 5 - Fortress Boss: Multiple weapon systems, rotating attack patterns, reinforced defense',
        type6: 'Type 6 - Plasma Destroyer Boss: Energy beam attacks, shield regeneration, advanced movement patterns',
        note: 'Boss enemies are 1.5x larger than regular enemies with unique tactical formations and movement patterns'
      },
      scoring: {
        title: 'Scoring System',
        desc: 'Points are awarded for destroyed enemies. The score varies based on enemy type and difficulty level.',
        multipliers: 'Difficulty Multipliers:',
        easy: 'Easy: 1.0x',
        medium: 'Medium: 1.5x',
        hard: 'Hard: 2.0x',
        bossNote: 'Boss enemies give significantly more points than regular enemies!'
      },
      shipUpgrades: {
        title: 'Spaceship Upgrades',
        bossUpgrades: 'Boss Level Upgrades: After each boss victory (Level 5, 10, 15, 20...) your spaceship receives spectacular visual upgrades with dramatic color changes, glowing effects, and particle trails.',
        scoreUpgrades: 'Score-based Upgrades: Every 500,000 points (500k, 1M, 1.5M...) special visual enhancements are unlocked.',
        fa18: 'F/A-18 Transformation: At 500,000 points your spaceship transforms into a narrower, longer design inspired by an F/A-18 fighter jet with yellowish coloring.',
        note: 'All upgrades are cumulative and remain active for the entire play session!'
      },
      doubleShip: {
        title: 'Double Ship System',
        desc: 'The Double Ship can be unlocked through score-based upgrades (every 500,000 points) or boss victories.',
        benefits: 'Benefits:',
        sync: 'Two spaceships move in sync',
        firepower: 'Both ships fire simultaneously - double firepower!',
        duration: 'Active for 30-45 seconds or until one ship is hit',
        animation: 'Spectacular activation animation with energy connections between the ships!'
      },
      bonusLife: {
        title: 'Bonus Life System',
        desc: 'After every second boss victory (Level 10, 20, 30, 40...) you receive an extra life!',
        animation: 'A spectacular winner animation with sound effect shows the reward.',
        display: 'The lives display lights up when a bonus life is awarded.'
      },
      powerups: {
        title: 'Power-Ups',
        doubleFire: 'Double Fire (Orange): Fire two projectiles simultaneously for 10 seconds',
        shield: 'Shield (Cyan): Protects from one hit for 15 seconds',
        invincibility: 'Invincibility (Gold): Complete invulnerability for 8 seconds - no hits possible!',
        rapidFire: 'Rapid Fire (Red): Increased fire rate and projectile speed for 12 seconds',
        spreadShot: 'Spread Shot (Purple): Fire three projectiles in a fan pattern for 10 seconds',
        magnet: 'Magnet (Green): Automatically attracts all power-ups and coins to the spaceship for 8 seconds',
        slowMotion: 'Slow Motion (Blue): Slows down all enemies and projectiles for 10 seconds - you stay normal speed!',
        falling: 'Power-ups fall from above - collect them before they leave the screen!',
        boss: 'Boss victories automatically grant special power-ups as rewards.',
        note: 'All power-ups have unique visual effects and audio feedback!'
      },
      progression: {
        title: 'Level Progression',
        desc: 'The game becomes more difficult with each level:',
        moreEnemies: 'More enemies per wave',
        faster: 'Faster enemy movements',
        moreShots: 'More frequent enemy attacks',
        bossLevels: 'Boss Levels: Every 5th level (5, 10, 15, 20...) is a boss level with a powerful boss enemy and unique tactical formations.',
        transitions: 'Smooth level transitions with announcement of the next level and special boss level warning!'
      },
      leaderboard: {
        title: 'Leaderboard',
        desc: 'The global leaderboard shows the top 50 players of all time.',
        shows: 'Each entry shows:',
        name: 'Player name',
        score: 'Score',
        difficulty: 'Difficulty level',
        stage: 'Stage reached',
        multiple: 'The same player name can appear multiple times in the leaderboard - each score is a separate entry!'
      },
      controls: {
        title: 'Controls',
        desktop: 'Desktop:',
        arrows: '← → Arrow keys: Move spaceship',
        space: 'Spacebar: Shoot',
        mobile: 'Mobile:',
        blueButtons: 'Blue arrow buttons: Move left/right',
        redButton: 'Red fire button: Shoot',
        optimized: 'Large, touch-optimized buttons for comfortable smartphone gameplay!'
      }
    }
  }
};

const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [language] = useState<Language>(() => {
    const saved = localStorage.getItem('galaga-language');
    return (saved as Language) || 'de';
  });

  const t = translations[language];

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden">
      <div className="min-h-screen text-white flex flex-col items-center p-4 py-8 pb-24">
        <div className="max-w-4xl w-full">
          <h1 className="text-4xl font-bold text-cyan-400 mb-8 text-center tracking-wider glow drop-shadow-lg">
            {t.title}
          </h1>

          <div className="space-y-6 bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 shadow-2xl">
            {/* Game Concept */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.concept.title}</h2>
              <div className="text-gray-200">
                <p>{t.sections.concept.desc}</p>
              </div>
            </section>

            {/* Difficulty Levels */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.difficulties.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p><strong className="text-green-400">🟢 </strong>{t.sections.difficulties.easy}</p>
                <p><strong className="text-yellow-400">🟡 </strong>{t.sections.difficulties.medium}</p>
                <p><strong className="text-red-400">🔴 </strong>{t.sections.difficulties.hard}</p>
              </div>
            </section>

            {/* Enemy Types */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.enemies.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p><strong className="text-green-400">• </strong>{t.sections.enemies.grunt}</p>
                <p><strong className="text-yellow-400">• </strong>{t.sections.enemies.officer}</p>
                <p><strong className="text-orange-400">• </strong>{t.sections.enemies.diver}</p>
                <p><strong className="text-lime-400">• </strong>{t.sections.enemies.zigzag}</p>
                <p><strong className="text-blue-400">• </strong>{t.sections.enemies.formation}</p>
                <p><strong className="text-purple-400">• </strong>{t.sections.enemies.heavy}</p>
                <p><strong className="text-red-400">• </strong>{t.sections.enemies.boss}</p>
              </div>
            </section>

            {/* Boss Types & Formations */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.bossTypes.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p><strong className="text-red-400">• </strong>{t.sections.bossTypes.type1}</p>
                <p><strong className="text-red-400">• </strong>{t.sections.bossTypes.type2}</p>
                <p><strong className="text-red-400">• </strong>{t.sections.bossTypes.type3}</p>
                <p><strong className="text-red-400">• </strong>{t.sections.bossTypes.type4}</p>
                <p><strong className="text-red-400">• </strong>{t.sections.bossTypes.type5}</p>
                <p><strong className="text-red-400">• </strong>{t.sections.bossTypes.type6}</p>
                <p className="text-cyan-400 italic">{t.sections.bossTypes.note}</p>
              </div>
            </section>

            {/* Scoring System */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.scoring.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p>{t.sections.scoring.desc}</p>
                <p><strong className="text-cyan-400">{t.sections.scoring.multipliers}</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>{t.sections.scoring.easy}</li>
                  <li>{t.sections.scoring.medium}</li>
                  <li>{t.sections.scoring.hard}</li>
                </ul>
                <p className="text-yellow-400">{t.sections.scoring.bossNote}</p>
              </div>
            </section>

            {/* Spaceship Upgrades */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.shipUpgrades.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p><strong className="text-cyan-400">• </strong>{t.sections.shipUpgrades.bossUpgrades}</p>
                <p><strong className="text-yellow-400">• </strong>{t.sections.shipUpgrades.scoreUpgrades}</p>
                <p><strong className="text-orange-400">• </strong>{t.sections.shipUpgrades.fa18}</p>
                <p className="text-purple-400 italic">{t.sections.shipUpgrades.note}</p>
              </div>
            </section>

            {/* Double Ship System */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.doubleShip.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p>{t.sections.doubleShip.desc}</p>
                <p><strong>{t.sections.doubleShip.benefits}</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>{t.sections.doubleShip.sync}</li>
                  <li>{t.sections.doubleShip.firepower}</li>
                  <li>{t.sections.doubleShip.duration}</li>
                </ul>
                <p className="text-yellow-400">{t.sections.doubleShip.animation}</p>
              </div>
            </section>

            {/* Bonus Life System */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.bonusLife.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p>{t.sections.bonusLife.desc}</p>
                <p>{t.sections.bonusLife.animation}</p>
                <p className="text-cyan-400">{t.sections.bonusLife.display}</p>
              </div>
            </section>

            {/* Power-Ups */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.powerups.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p><strong className="text-orange-400">🔥 </strong>{t.sections.powerups.doubleFire}</p>
                <p><strong className="text-cyan-400">🛡️ </strong>{t.sections.powerups.shield}</p>
                <p><strong className="text-yellow-400">⭐ </strong>{t.sections.powerups.invincibility}</p>
                <p><strong className="text-red-400">⚡ </strong>{t.sections.powerups.rapidFire}</p>
                <p><strong className="text-purple-400">🎯 </strong>{t.sections.powerups.spreadShot}</p>
                <p><strong className="text-green-400">🧲 </strong>{t.sections.powerups.magnet}</p>
                <p><strong className="text-blue-400">⏱️ </strong>{t.sections.powerups.slowMotion}</p>
                <p className="text-yellow-400 mt-3">{t.sections.powerups.falling}</p>
                <p>{t.sections.powerups.boss}</p>
                <p className="text-cyan-400 italic">{t.sections.powerups.note}</p>
              </div>
            </section>

            {/* Level Progression */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.progression.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p>{t.sections.progression.desc}</p>
                <ul className="list-disc list-inside ml-4">
                  <li>{t.sections.progression.moreEnemies}</li>
                  <li>{t.sections.progression.faster}</li>
                  <li>{t.sections.progression.moreShots}</li>
                </ul>
                <p><strong className="text-red-400">• </strong>{t.sections.progression.bossLevels}</p>
                <p className="text-cyan-400">{t.sections.progression.transitions}</p>
              </div>
            </section>

            {/* Leaderboard */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.leaderboard.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p>{t.sections.leaderboard.desc}</p>
                <p><strong>{t.sections.leaderboard.shows}</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>{t.sections.leaderboard.name}</li>
                  <li>{t.sections.leaderboard.score}</li>
                  <li>{t.sections.leaderboard.difficulty}</li>
                  <li>{t.sections.leaderboard.stage}</li>
                </ul>
                <p className="text-yellow-400">{t.sections.leaderboard.multiple}</p>
              </div>
            </section>

            {/* Controls */}
            <section>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 glow">{t.sections.controls.title}</h2>
              <div className="text-gray-200 space-y-2">
                <p><strong>{t.sections.controls.desktop}</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>{t.sections.controls.arrows}</li>
                  <li>{t.sections.controls.space}</li>
                </ul>
                <p><strong>{t.sections.controls.mobile}</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>{t.sections.controls.blueButtons}</li>
                  <li>{t.sections.controls.redButton}</li>
                </ul>
                <p className="text-cyan-400">{t.sections.controls.optimized}</p>
              </div>
            </section>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate({ to: '/' })}
              className="bg-cyan-600/90 hover:bg-cyan-500/90 backdrop-blur-sm text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors arcade-button shadow-lg"
            >
              {t.backToMenu}
            </button>
          </div>
        </div>

        <footer className="mt-8 text-center text-gray-300 text-sm pb-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <div>© 2025. Built with ❤️ using{' '}
            <a href="https://caffeine.ai" className="text-cyan-400 hover:text-cyan-300">
              caffeine.ai
            </a>
          </div>
          <div className="mt-1">{t.attribution}</div>
        </footer>
      </div>
    </div>
  );
};

export default FeaturesPage;
