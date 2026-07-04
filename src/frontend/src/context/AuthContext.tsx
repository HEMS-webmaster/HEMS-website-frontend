"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  db, 
  googleProvider,
  microsoftProvider,
  hasFirebaseKeys 
} from "../utils/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut, 
  onAuthStateChanged
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from "firebase/firestore";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRoles: (uid: string, newRoles: string[]) => Promise<void>;
  isMock: boolean;
  setMockRoles: (roles: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper for mock users storage in localStorage
  const getMockUsers = (): UserProfile[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("hems_mock_users");
    return stored ? JSON.parse(stored) : [];
  };

  const saveMockUsers = (users: UserProfile[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("hems_mock_users", JSON.stringify(users));
  };

  const getMockCurrentUser = (): UserProfile | null => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("hems_mock_current_user");
    return stored ? JSON.parse(stored) : null;
  };

  const saveMockCurrentUser = (user: UserProfile | null) => {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem("hems_mock_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hems_mock_current_user");
    }
  };

  // Basic mock whitelist function
  const getRolesForEmail = (email: string): string[] => {
    if (email.toLowerCase().includes("admin")) return ["admin", "reviewer", "board"];
    if (email.toLowerCase().includes("reviewer")) return ["reviewer"];
    if (email.toLowerCase().includes("board")) return ["board"];
    return ["general"];
  };

  const fetchInitialRoles = async (email: string): Promise<string[]> => {
    if (!hasFirebaseKeys) {
      return getRolesForEmail(email);
    }
    try {
      const whitelistDoc = await getDoc(doc(db, "whitelist", email.toLowerCase().trim()));
      if (whitelistDoc.exists()) {
        return whitelistDoc.data()?.roles || ["general"];
      }
    } catch (err) {
      console.error("Error fetching whitelist roles during initialization:", err);
    }
    return ["general"];
  };

  useEffect(() => {
    if (!hasFirebaseKeys) {
      // Mock mode initialization
      const currentUser = getMockCurrentUser();
      setUser(currentUser);
      setLoading(false);
      return;
    }

    // Real Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            // Fallback profile if Firestore document is missing
            const email = firebaseUser.email || "";
            const initialRoles = await fetchInitialRoles(email);
            const fallbackProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || email.split("@")[0] || "User",
              email: email,
              roles: initialRoles,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, fallbackProfile);
            setUser(fallbackProfile);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching user profile from Firestore:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOAuthLogin = async (provider: any) => {
    if (!hasFirebaseKeys) {
      // Mock OAuth login
      const mockEmail = `oauth_mock_${Math.floor(Math.random()*1000)}@example.com`;
      const newMockUser: UserProfile = {
        uid: "mock_oauth_" + Math.random().toString(36).substring(2, 9),
        name: "Mock OAuth User",
        email: mockEmail,
        roles: getRolesForEmail(mockEmail),
        createdAt: new Date().toISOString()
      };
      
      const mockUsers = getMockUsers();
      mockUsers.push(newMockUser);
      saveMockUsers(mockUsers);
      saveMockCurrentUser(newMockUser);
      setUser(newMockUser);
      return;
    }

    const credential = await signInWithPopup(auth, provider);
    const userDocRef = doc(db, "users", credential.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      setUser(userDoc.data() as UserProfile);
    } else {
      // New user from OAuth
      const email = credential.user.email || "";
      const initialRoles = await fetchInitialRoles(email);
      const profile: UserProfile = {
        uid: credential.user.uid,
        name: credential.user.displayName || email.split("@")[0] || "User",
        email: email,
        roles: initialRoles,
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, profile);
      setUser(profile);
    }
  };

  const loginWithGoogle = () => handleOAuthLogin(googleProvider);
  const loginWithMicrosoft = () => handleOAuthLogin(microsoftProvider);

  const login = async (email: string, password: string) => {
    if (!hasFirebaseKeys) {
      // Mock mode login
      const mockUsers = getMockUsers();
      const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!existingUser) {
        throw new Error("User not found. Please register first.");
      }
      saveMockCurrentUser(existingUser);
      setUser(existingUser);
      return;
    }

    // Real Firebase Login
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, "users", credential.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setUser(userDoc.data() as UserProfile);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    if (!hasFirebaseKeys) {
      // Mock mode registration
      const mockUsers = getMockUsers();
      const exists = mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error("Email already registered.");
      }
      
      const newMockUser: UserProfile = {
        uid: "mock_" + Math.random().toString(36).substring(2, 9),
        name,
        email,
        roles: getRolesForEmail(email),
        createdAt: new Date().toISOString()
      };
      
      mockUsers.push(newMockUser);
      saveMockUsers(mockUsers);
      saveMockCurrentUser(newMockUser);
      setUser(newMockUser);
      return;
    }

    // Real Firebase Registration
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const initialRoles = await fetchInitialRoles(email);
    const profile: UserProfile = {
      uid: credential.user.uid,
      name,
      email,
      roles: initialRoles,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", credential.user.uid), profile);
    setUser(profile);
  };

  const logout = async () => {
    if (!hasFirebaseKeys) {
      saveMockCurrentUser(null);
      setUser(null);
      return;
    }
    await firebaseSignOut(auth);
    setUser(null);
  };

  const updateUserRoles = async (uid: string, newRoles: string[]) => {
    if (!hasFirebaseKeys) {
      const mockUsers = getMockUsers();
      const updatedUsers = mockUsers.map(u => {
        if (u.uid === uid) {
          return { ...u, roles: newRoles };
        }
        return u;
      });
      saveMockUsers(updatedUsers);
      if (user && user.uid === uid) {
        const updatedSelf = { ...user, roles: newRoles };
        saveMockCurrentUser(updatedSelf);
        setUser(updatedSelf);
      }
      return;
    }

    await updateDoc(doc(db, "users", uid), { roles: newRoles });
    if (user && user.uid === uid) {
      setUser({ ...user, roles: newRoles });
    }
  };

  const setMockRoles = (roles: string[]) => {
    if (!hasFirebaseKeys && user) {
      updateUserRoles(user.uid, roles);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginWithGoogle,
      loginWithMicrosoft,
      register, 
      logout, 
      updateUserRoles, 
      isMock: !hasFirebaseKeys,
      setMockRoles
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
