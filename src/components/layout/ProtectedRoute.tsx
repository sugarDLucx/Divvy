import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../services/db';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const location = useLocation();
    const [profileLoading, setProfileLoading] = useState(true);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);

    useEffect(() => {
        const checkProfile = async () => {
            if (user) {
                try {
                    const profile = await getUserProfile(user.uid);
                    if (profile && profile.onboardingCompleted) {
                        setOnboardingCompleted(true);
                    } else {
                        setOnboardingCompleted(false);
                    }
                } catch (e) {
                    console.error("Error fetching profile in protected route", e);
                    setOnboardingCompleted(false);
                } finally {
                    setProfileLoading(false);
                }
            } else {
                setProfileLoading(false);
            }
        };

        if (!authLoading) {
            checkProfile();
        }
    }, [user, authLoading, location.pathname]); // Re-check on nav? mostly relevant on mount and auth change.

    if (authLoading || (user && profileLoading)) {
        return (
            <div className="h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#0b0e14' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // specific check: if not onboarding completed, force to settings
    if (!onboardingCompleted && location.pathname !== '/settings') {
        return <Navigate to="/settings" replace />;
    }

    return <>{children}</>;
};
