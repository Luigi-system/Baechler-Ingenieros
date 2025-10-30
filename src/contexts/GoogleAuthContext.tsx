import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import type { GoogleAuthContextType } from '../types';

// Extend the Window interface to include gapi and google (GIS)
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// The user has provided their Client ID, so we will use it directly.
const GOOGLE_CLIENT_ID = '840172213603-j80un5i07u530b5fobna6ghdqjb33obh.apps.googleusercontent.com';

export const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [gsiClient, setGsiClient] = useState<any>(null); // Google Sign-In client

  // Since the Client ID has been provided, the integration is considered configured.
  const isConfigured = true;

  const SCOPES = 'email profile https://www.googleapis.com/auth/drive.readonly'; // Minimal scopes for user info and checking drive access

  // Load gapi script
  useEffect(() => {
    const loadGapi = () => {
      // FIX: Changed 'client:auth2' to 'client' to prevent conflicts.
      // The 'auth2' module is for the deprecated Google Sign-In library.
      // We only need the 'client' module for making API calls, while the
      // separate GIS library (gsi/client) handles authentication.
      window.gapi.load('client', () => {
        setGapiLoaded(true);
      });
    };

    if (window.gapi) {
      loadGapi();
    } else {
      // Fallback if script was not fully loaded by `async defer` in html
      const script = document.createElement('script');
      script.src = "https://apis.google.com/js/api.js";
      script.onload = loadGapi;
      document.head.appendChild(script);
    }

    const checkGis = () => {
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            setGisLoaded(true);
        } else {
            const script = document.createElement('script');
            script.src = "https://accounts.google.com/gsi/client";
            script.onload = () => setGisLoaded(true);
            document.head.appendChild(script);
        }
    };
    checkGis();

  }, []);

  // Initialize GIS client
  useEffect(() => {
    if (gisLoaded && !gsiClient && isConfigured) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.error("GIS token client error:", tokenResponse.error, tokenResponse.error_description);
              setIsSignedIn(false);
              setCurrentUserEmail(null);
              setAccessToken(null);
              return;
            }
            setAccessToken(tokenResponse.access_token);
            // Fetch user info with the access token
            fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                'Authorization': `Bearer ${tokenResponse.access_token}`
              }
            })
            .then(res => res.json())
            .then(user => {
              setIsSignedIn(true);
              setCurrentUserEmail(user.email);
              console.log("Signed in with Google:", user.email);
            })
            .catch(error => {
              console.error("Error fetching user info:", error);
              setIsSignedIn(false);
              setCurrentUserEmail(null);
              setAccessToken(null);
            });
          },
        });
        setGsiClient(client);
      } catch (error) {
        console.error("Failed to initialize Google Sign-In client:", error);
      }
    }
  }, [gisLoaded, gsiClient, isConfigured]);

  const handleSignIn = useCallback(async () => {
    if (!isConfigured) {
      console.warn("Google authentication is not configured. Please provide a valid Client ID.");
      return;
    }
    if (!gapiLoaded || !gisLoaded || !gsiClient) {
      console.warn("Google API or GIS client not fully loaded.");
      return;
    }
    gsiClient.requestAccessToken();
  }, [gapiLoaded, gisLoaded, gsiClient, isConfigured]);

  const handleSignOut = useCallback(() => {
    if (accessToken) {
      // Revoke the token
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log("Access token revoked.");
        setIsSignedIn(false);
        setCurrentUserEmail(null);
        setAccessToken(null);
      });
    } else {
      setIsSignedIn(false);
      setCurrentUserEmail(null);
    }
  }, [accessToken]);

  const contextValue = useMemo(() => ({
    isSignedIn,
    currentUserEmail,
    accessToken,
    handleSignIn,
    handleSignOut,
    gapiLoaded,
    gisLoaded,
    isConfigured,
  }), [isSignedIn, currentUserEmail, accessToken, handleSignIn, handleSignOut, gapiLoaded, gisLoaded, isConfigured]);

  return (
    <GoogleAuthContext.Provider value={contextValue}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};