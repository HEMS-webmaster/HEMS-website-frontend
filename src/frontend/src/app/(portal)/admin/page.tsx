"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, hasFirebaseKeys } from "@/utils/firebase";
import { ShieldCheck, ShieldAlert, Users, UserPlus, Trash2 } from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

interface WhitelistEntry {
  email: string;
  roles: string[];
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["general"]);
  
  // Available roles to toggle
  const availableRoles = ["general", "submitter", "attendee", "reviewer", "board", "admin"];

  const loadWhitelist = async () => {
    setLoadingList(true);
    setErrorMsg("");
    try {
      if (!hasFirebaseKeys) {
        // Mock mode: display dummy whitelist from sessionStorage or fallback
        const stored = typeof window !== "undefined" ? sessionStorage.getItem("hems_mock_whitelist") : null;
        if (stored) {
          setWhitelist(JSON.parse(stored));
        } else {
          const initialList = [
            { email: "admin@example.com", roles: ["admin", "reviewer", "board"] },
            { email: "reviewer@example.com", roles: ["reviewer"] }
          ];
          if (typeof window !== "undefined") {
            sessionStorage.setItem("hems_mock_whitelist", JSON.stringify(initialList));
          }
          setWhitelist(initialList);
        }
      } else {
        const querySnapshot = await getDocs(collection(db, "whitelist"));
        const list: WhitelistEntry[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ email: docSnap.id, roles: docSnap.data().roles || [] });
        });
        setWhitelist(list);
      }
    } catch (err: any) {
      setErrorMsg("Failed to load whitelist: " + err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user && user.roles?.includes("admin")) {
      loadWhitelist();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Access Control check
  if (!user || !user.roles?.includes("admin")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-surface border border-red-500/10 rounded-2xl max-w-lg mx-auto">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground/60 mt-2 leading-relaxed">
          You must be an **Admin** to access this control panel.
        </p>
      </div>
    );
  }

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) return;
    try {
      const targetEmail = newEmail.toLowerCase().trim();
      if (hasFirebaseKeys) {
        await setDoc(doc(db, "whitelist", targetEmail), {
          roles: selectedRoles
        });
      } else {
        const updatedList = [...whitelist];
        const index = updatedList.findIndex(w => w.email === targetEmail);
        if (index > -1) {
          updatedList[index].roles = selectedRoles;
        } else {
          updatedList.push({ email: targetEmail, roles: selectedRoles });
        }
        if (typeof window !== "undefined") {
          sessionStorage.setItem("hems_mock_whitelist", JSON.stringify(updatedList));
        }
      }
      setNewEmail("");
      setSelectedRoles(["general"]);
      loadWhitelist();
    } catch (err: any) {
      alert("Error adding email: " + err.message);
    }
  };

  const handleToggleRole = async (email: string, role: string, currentRoles: string[]) => {
    try {
      let updatedRoles = [...currentRoles];
      if (updatedRoles.includes(role)) {
        updatedRoles = updatedRoles.filter(r => r !== role);
      } else {
        updatedRoles.push(role);
      }
      
      // Ensure at least 'general' is present
      if (updatedRoles.length === 0) updatedRoles = ["general"];

      if (hasFirebaseKeys) {
        await setDoc(doc(db, "whitelist", email), { roles: updatedRoles }, { merge: true });
      } else {
        const updatedList = whitelist.map(w => w.email === email ? { ...w, roles: updatedRoles } : w);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("hems_mock_whitelist", JSON.stringify(updatedList));
        }
      }
      loadWhitelist();
    } catch (err: any) {
      alert("Error updating roles: " + err.message);
    }
  };

  const handleDeleteEntry = async (email: string) => {
    if (!window.confirm(`Remove ${email} from the whitelist?`)) return;
    try {
      if (hasFirebaseKeys) {
        await deleteDoc(doc(db, "whitelist", email));
      } else {
        const updatedList = whitelist.filter(w => w.email !== email);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("hems_mock_whitelist", JSON.stringify(updatedList));
        }
      }
      loadWhitelist();
    } catch (err: any) {
      alert("Error deleting entry: " + err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <ShieldCheck className="text-primary" /> Whitelist Manager
          </h2>
          <p className="text-xs text-foreground/60 mt-1">
            Manage user roles. Changes here instantly sync to user profiles via Cloud Functions.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg text-center">
          {errorMsg}
        </div>
      )}

      {/* Add New Email */}
      <form onSubmit={handleAddEmail} className="space-y-4 bg-surface p-6 border border-foreground/10 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="email" 
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter email address..."
            className="flex-1 bg-background border border-foreground/15 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-primary transition-all"
            required
          />
          <button type="submit" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-primary/10">
            <UserPlus size={16} /> Add User
          </button>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-foreground/5">
          <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Initial Roles to Assign:</span>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map(role => {
              const isSelected = selectedRoles.includes(role);
              return (
                <button
                  type="button"
                  key={role}
                  onClick={() => {
                    if (isSelected) {
                      if (role === "general" && selectedRoles.length === 1) return;
                      setSelectedRoles(selectedRoles.filter(r => r !== role));
                    } else {
                      setSelectedRoles([...selectedRoles, role]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-primary/20 border-primary/40 text-primary shadow-sm shadow-primary/5' 
                      : 'bg-background border-foreground/10 text-foreground/50 hover:bg-foreground/5 hover:text-foreground/75'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      </form>

      {/* Whitelist Queue */}
      <div className="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-foreground/10 bg-surface flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Users size={16} /> Whitelist
          </h3>
          <span className="text-[10px] bg-foreground/5 text-foreground/60 px-2 py-0.5 rounded uppercase font-bold font-mono">
            {whitelist.length} entries
          </span>
        </div>

        {loadingList ? (
          <div className="p-12 text-center text-foreground/50 text-sm">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading...
          </div>
        ) : whitelist.length === 0 ? (
          <div className="p-12 text-center text-foreground/50 text-sm font-medium">
            Whitelist is empty.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-foreground/5 border-b border-foreground/10 font-bold uppercase text-[10px] tracking-wider text-foreground/50">
                  <th className="p-4 pl-6">Email</th>
                  <th className="p-4">Assigned Roles</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5 font-medium">
                {whitelist.map((entry) => (
                  <tr key={entry.email} className="hover:bg-foreground/5 transition-colors">
                    <td className="p-4 pl-6 text-foreground/90 font-mono text-sm">{entry.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {availableRoles.map(role => {
                          const hasRole = entry.roles.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => handleToggleRole(entry.email, role, entry.roles)}
                              className={`px-2 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                                hasRole 
                                  ? 'bg-primary/20 border-primary/50 text-primary' 
                                  : 'bg-surface border-foreground/10 text-foreground/40 hover:bg-foreground/5'
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => handleDeleteEntry(entry.email)}
                        className="text-red-500 hover:text-red-600 p-2 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove from Whitelist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
