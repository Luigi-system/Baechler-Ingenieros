"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGoogleAuth = exports.GoogleAuthProvider = exports.GoogleAuthContext = void 0;
var react_1 = require("react");
// The user has provided their Client ID, so we will use it directly.
var GOOGLE_CLIENT_ID = '840172213603-j80un5i07u530b5fobna6ghdqjb33obh.apps.googleusercontent.com';
exports.GoogleAuthContext = (0, react_1.createContext)(undefined);
var GoogleAuthProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(false), isSignedIn = _b[0], setIsSignedIn = _b[1];
    var _c = (0, react_1.useState)(null), currentUserEmail = _c[0], setCurrentUserEmail = _c[1];
    var _d = (0, react_1.useState)(null), accessToken = _d[0], setAccessToken = _d[1];
    var _e = (0, react_1.useState)(false), gapiLoaded = _e[0], setGapiLoaded = _e[1];
    var _f = (0, react_1.useState)(false), gisLoaded = _f[0], setGisLoaded = _f[1];
    var _g = (0, react_1.useState)(null), gsiClient = _g[0], setGsiClient = _g[1]; // Google Sign-In client
    // Since the Client ID has been provided, the integration is considered configured.
    var isConfigured = true;
    var SCOPES = 'email profile https://www.googleapis.com/auth/drive.readonly'; // Minimal scopes for user info and checking drive access
    // Load gapi script
    (0, react_1.useEffect)(function () {
        var loadGapi = function () {
            // FIX: Changed 'client:auth2' to 'client' to prevent conflicts.
            // The 'auth2' module is for the deprecated Google Sign-In library.
            // We only need the 'client' module for making API calls, while the
            // separate GIS library (gsi/client) handles authentication.
            window.gapi.load('client', function () {
                setGapiLoaded(true);
            });
        };
        if (window.gapi) {
            loadGapi();
        }
        else {
            // Fallback if script was not fully loaded by `async defer` in html
            var script = document.createElement('script');
            script.src = "https://apis.google.com/js/api.js";
            script.onload = loadGapi;
            document.head.appendChild(script);
        }
        var checkGis = function () {
            if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                setGisLoaded(true);
            }
            else {
                var script = document.createElement('script');
                script.src = "https://accounts.google.com/gsi/client";
                script.onload = function () { return setGisLoaded(true); };
                document.head.appendChild(script);
            }
        };
        checkGis();
    }, []);
    // Initialize GIS client
    (0, react_1.useEffect)(function () {
        if (gisLoaded && !gsiClient && isConfigured) {
            try {
                var client = window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: SCOPES,
                    callback: function (tokenResponse) {
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
                                'Authorization': "Bearer ".concat(tokenResponse.access_token)
                            }
                        })
                            .then(function (res) { return res.json(); })
                            .then(function (user) {
                            setIsSignedIn(true);
                            setCurrentUserEmail(user.email);
                            console.log("Signed in with Google:", user.email);
                        })
                            .catch(function (error) {
                            console.error("Error fetching user info:", error);
                            setIsSignedIn(false);
                            setCurrentUserEmail(null);
                            setAccessToken(null);
                        });
                    },
                });
                setGsiClient(client);
            }
            catch (error) {
                console.error("Failed to initialize Google Sign-In client:", error);
            }
        }
    }, [gisLoaded, gsiClient, isConfigured]);
    var handleSignIn = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!isConfigured) {
                console.warn("Google authentication is not configured. Please provide a valid Client ID.");
                return [2 /*return*/];
            }
            if (!gapiLoaded || !gisLoaded || !gsiClient) {
                console.warn("Google API or GIS client not fully loaded.");
                return [2 /*return*/];
            }
            gsiClient.requestAccessToken();
            return [2 /*return*/];
        });
    }); }, [gapiLoaded, gisLoaded, gsiClient, isConfigured]);
    var handleSignOut = (0, react_1.useCallback)(function () {
        if (accessToken) {
            // Revoke the token
            window.google.accounts.oauth2.revoke(accessToken, function () {
                console.log("Access token revoked.");
                setIsSignedIn(false);
                setCurrentUserEmail(null);
                setAccessToken(null);
            });
        }
        else {
            setIsSignedIn(false);
            setCurrentUserEmail(null);
        }
    }, [accessToken]);
    var contextValue = (0, react_1.useMemo)(function () { return ({
        isSignedIn: isSignedIn,
        currentUserEmail: currentUserEmail,
        accessToken: accessToken,
        handleSignIn: handleSignIn,
        handleSignOut: handleSignOut,
        gapiLoaded: gapiLoaded,
        gisLoaded: gisLoaded,
        isConfigured: isConfigured,
    }); }, [isSignedIn, currentUserEmail, accessToken, handleSignIn, handleSignOut, gapiLoaded, gisLoaded, isConfigured]);
    return (<exports.GoogleAuthContext.Provider value={contextValue}>
      {children}
    </exports.GoogleAuthContext.Provider>);
};
exports.GoogleAuthProvider = GoogleAuthProvider;
var useGoogleAuth = function () {
    var context = (0, react_1.useContext)(exports.GoogleAuthContext);
    if (context === undefined) {
        throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
    }
    return context;
};
exports.useGoogleAuth = useGoogleAuth;
