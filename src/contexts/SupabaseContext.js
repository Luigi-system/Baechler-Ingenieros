"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSupabase = exports.SupabaseProvider = exports.SupabaseContext = void 0;
var react_1 = require("react");
var supabase_js_1 = require("@supabase/supabase-js");
// Default credentials provided by the user
var DEFAULT_SUPABASE_URL = 'https://jhhlrndxepowacrndhni.supabase.co';
var DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaGxybmR4ZXBvd2Fjcm5kaG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTQ2NTMsImV4cCI6MjA3NjgzMDY1M30.ig1GSzqhIu6T6bAMgpZJecXTF3SorSEkruCoP49CxKY';
// Create the context with an undefined initial value
exports.SupabaseContext = (0, react_1.createContext)(undefined);
// Create the provider component that will wrap the application
var SupabaseProvider = function (_a) {
    var children = _a.children;
    // Initialize the client synchronously using the useState initializer function.
    // This ensures the client is available from the first render, fixing race conditions.
    var _b = (0, react_1.useState)(function () {
        try {
            var url = localStorage.getItem('supabase_url');
            var key = localStorage.getItem('supabase_anon_key');
            // If no config is stored, use the defaults and save them.
            if (!url || !key) {
                console.log("No stored Supabase config found, using defaults.");
                url = DEFAULT_SUPABASE_URL;
                key = DEFAULT_SUPABASE_ANON_KEY;
                localStorage.setItem('supabase_url', url);
                localStorage.setItem('supabase_anon_key', key);
            }
            return (0, supabase_js_1.createClient)(url, key);
        }
        catch (error) {
            console.error("Failed to initialize Supabase client on load:", error);
            return null;
        }
    }), supabase = _b[0], setSupabase = _b[1];
    /**
     * Re-initializes the Supabase client. This is used when changing credentials
     * in the settings page.
     */
    var initializeSupabase = (0, react_1.useCallback)(function (url, key) {
        if (!url || !key) {
            setSupabase(null);
            return;
        }
        try {
            var client = (0, supabase_js_1.createClient)(url, key);
            setSupabase(client);
            console.log("Supabase client re-initialized.");
        }
        catch (error) {
            console.error("Failed to re-initialize Supabase client:", error);
            setSupabase(null);
        }
    }, []);
    // Memoize the context value to prevent unnecessary re-renders of consumers
    var value = (0, react_1.useMemo)(function () { return ({ supabase: supabase, initializeSupabase: initializeSupabase }); }, [supabase, initializeSupabase]);
    return (<exports.SupabaseContext.Provider value={value}>
      {children}
    </exports.SupabaseContext.Provider>);
};
exports.SupabaseProvider = SupabaseProvider;
// Custom hook for consuming the Supabase context easily and safely
var useSupabase = function () {
    var context = (0, react_1.useContext)(exports.SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};
exports.useSupabase = useSupabase;
