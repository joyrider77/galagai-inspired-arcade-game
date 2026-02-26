import React, { useState } from 'react';
import GalagaGame from './GalagaGame';
import StartPage from './StartPage';

type Language = 'de' | 'en';
type Difficulty = 'einfach' | 'mittel' | 'schwer';

const GalagaGameWrapper: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('galaga-language');
    return (saved as Language) || 'de';
  });
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem('galaga-difficulty');
    return (saved as Difficulty) || 'einfach';
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('galaga-muted');
    return saved === 'true';
  });

  const handleStartGame = () => {
    setIsPlaying(true);
  };

  const handleBackToMenu = () => {
    setIsPlaying(false);
  };

  const handleChangeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('galaga-language', newLanguage);
  };

  const handleChangeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    localStorage.setItem('galaga-difficulty', newDifficulty);
  };

  const handleToggleMute = () => {
    setIsMuted(prev => {
      const newValue = !prev;
      localStorage.setItem('galaga-muted', String(newValue));
      return newValue;
    });
  };

  if (isPlaying) {
    return <GalagaGame onBackToMenu={handleBackToMenu} initialMuted={isMuted} />;
  }

  return (
    <StartPage
      onStartGame={handleStartGame}
      language={language}
      difficulty={difficulty}
      isMuted={isMuted}
      onToggleMute={handleToggleMute}
      onChangeLanguage={handleChangeLanguage}
      onChangeDifficulty={handleChangeDifficulty}
      isGameInitializing={false}
    />
  );
};

export default GalagaGameWrapper;
