import React, { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { UserRegistration } from './UserRegistration';

type Language = 'de' | 'en';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched, refetch } = useGetCallerUserProfile();
  
  const [language] = React.useState<Language>(() => {
    const saved = localStorage.getItem('galaga-language');
    return (saved as Language) || 'de';
  });

  // Check if user is authenticated
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Show loading state while checking authentication
  if (isInitializing || profileLoading || !isFetched) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/90">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  // If authenticated but no profile, show registration
  if (isAuthenticated && !userProfile) {
    return (
      <UserRegistration 
        language={language} 
        onRegistrationComplete={() => {
          refetch();
        }}
      />
    );
  }

  // User is authenticated and has profile, render children
  return <>{children}</>;
};
