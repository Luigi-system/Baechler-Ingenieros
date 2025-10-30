import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define the shape of the context data
interface SupabaseContextType {
  supabase: SupabaseClient | null;
  initializeSupabase: (url: string, key: string) => void;
}

// Default credentials provided by the user
const DEFAULT_SUPABASE_URL = 'https://jhhlrndxepowacrndhni.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaGxybmR4ZXBvd2Fjcm5kaG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTQ2NTMsImV4cCI6MjA3NjgzMDY1M30.ig1GSzqhIu6T6bAMgpZJecXTF3SorSEkruCoP49CxKY';

// Create the context with an undefined initial value
export const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Create the provider component that will wrap the application
export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  // Initialize the client synchronously using the useState initializer function.
  // This ensures the client is available from the first render, fixing race conditions.
  const [supabase, setSupabase] = useState<SupabaseClient | null>(() => {
    try {
      let url = localStorage.getItem('supabase_url');
      let key = localStorage.getItem('supabase_anon_key');

      // If no config is stored, use the defaults and save them.
      if (!url || !key) {
        console.log("No stored Supabase config found, using defaults.");
        url = DEFAULT_SUPABASE_URL;
        key = DEFAULT_SUPABASE_ANON_KEY;
        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_anon_key', key);
      }
      
      return createClient(url, key);
    } catch (error) {
      console.error("Failed to initialize Supabase client on load:", error);
      return null;
    }
  });

  /**
   * Re-initializes the Supabase client. This is used when changing credentials
   * in the settings page.
   */
  const initializeSupabase = useCallback((url: string, key: string) => {
    if (!url || !key) {
      setSupabase(null);
      return;
    }
    try {
      const client = createClient(url, key);
      setSupabase(client);
      console.log("Supabase client re-initialized.");
    } catch (error) {
      console.error("Failed to re-initialize Supabase client:", error);
      setSupabase(null);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({ supabase, initializeSupabase }), [supabase, initializeSupabase]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Custom hook for consuming the Supabase context easily and safely
export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};