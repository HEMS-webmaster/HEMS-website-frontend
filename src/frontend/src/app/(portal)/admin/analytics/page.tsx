"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  Download, 
  Clock, 
  ShieldAlert, 
  BarChart2, 
  RefreshCw, 
  FileText, 
  Calendar,
  Layers
} from "lucide-react";

interface UserActivity {
  uid: string;
  name: string;
  email: string;
  loginCount: number;
  downloadCount: number;
  lastLogin: string;
  createdAt: string;
}

interface FileDownloadStat {
  fileName: string;
  downloadCount: number;
  lastDownloaded: string;
  category: string;
  workshopName: string;
}

export default function AdminAnalytics() {
  const { user, loading: authLoading, isMock } = useAuth();
  
  const [usersList, setUsersList] = useState<UserActivity[]>([]);
  const [downloadsList, setDownloadsList] = useState<FileDownloadStat[]>([]);
  const [sinceDate, setSinceDate] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "files">("users");

  // Determine authorized status
  const isAdmin = useMemo(() => {
    return user && user.roles && user.roles.includes("admin");
  }, [user]);

  // Filter downloads by date
  const filteredDownloads = useMemo(() => {
    if (!sinceDate) return downloadsList;
    const filterTime = new Date(sinceDate).getTime();
    return downloadsList.filter(file => {
      if (!file.lastDownloaded) return false;
      return new Date(file.lastDownloaded).getTime() >= filterTime;
    });
  }, [downloadsList, sinceDate]);

  const loadAnalyticsData = async () => {
    setLoadingData(true);
    setError("");
    
    try {
      if (isMock) {
        // Load mock users
        const storedUsers = localStorage.getItem("hems_mock_users") || "[]";
        let mockUsers: UserActivity[] = JSON.parse(storedUsers);
        
        // Add current logged-in mock user if missing
        const storedCurrentUser = localStorage.getItem("hems_mock_current_user");
        if (storedCurrentUser) {
          const current = JSON.parse(storedCurrentUser);
          if (!mockUsers.some(u => u.uid === current.uid)) {
            mockUsers.push({
              uid: current.uid,
              name: current.name,
              email: current.email,
              loginCount: current.loginCount || 1,
              downloadCount: current.downloadCount || 0,
              lastLogin: current.lastLogin || new Date().toISOString(),
              createdAt: current.createdAt || new Date().toISOString()
            });
          }
        }

        // If list is completely empty, populate with template data
        if (mockUsers.length <= 1) {
          const dummyUsers: UserActivity[] = [
            { uid: "mock1", name: "Dr. James Fox", email: "j.fox@inficon.com", loginCount: 14, downloadCount: 5, lastLogin: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
            { uid: "mock2", name: "Prof. Devon Higgins", email: "d.higgins@usf.edu", loginCount: 28, downloadCount: 12, lastLogin: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
            { uid: "mock3", name: "Julia Richter", email: "jrichter@ethz.ch", loginCount: 8, downloadCount: 2, lastLogin: new Date(Date.now() - 172800000).toISOString(), createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
            { uid: "mock4", name: "Ernesto Corrales", email: "ecorrales@ucr.ac.cr", loginCount: 22, downloadCount: 7, lastLogin: new Date(Date.now() - 5 * 3600000).toISOString(), createdAt: new Date(Date.now() - 20 * 86400000).toISOString() }
          ];
          mockUsers = [...mockUsers, ...dummyUsers];
          localStorage.setItem("hems_mock_users", JSON.stringify(mockUsers));
        }
        
        // Ensure all users have stats
        mockUsers = mockUsers.map(u => ({
          ...u,
          loginCount: u.loginCount || 1,
          downloadCount: u.downloadCount || 0,
          lastLogin: u.lastLogin || u.createdAt || new Date().toISOString()
        }));

        setUsersList(mockUsers);

        // Load mock downloads
        const storedDownloads = localStorage.getItem("hems_mock_downloads") || "[]";
        let mockDownloads: FileDownloadStat[] = JSON.parse(storedDownloads);
        
        // Populate download list if empty
        if (mockDownloads.length === 0) {
          mockDownloads = [
            { fileName: "15th_Fox_ARAMMIS_Autonomous_Robots_Presentation.pdf", downloadCount: 15, lastDownloaded: new Date(Date.now() - 1800000).toISOString(), category: "Presentation", workshopName: "15th" },
            { fileName: "15th_Fox_ARAMMIS_Autonomous_Robots_Abstract.pdf", downloadCount: 8, lastDownloaded: new Date(Date.now() - 3600000).toISOString(), category: "Abstract", workshopName: "15th" },
            { fileName: "15th_Kimutai_A_cartportable_TOFMS_Presentation.pdf", downloadCount: 12, lastDownloaded: new Date(Date.now() - 4 * 3600000).toISOString(), category: "Presentation", workshopName: "15th" },
            { fileName: "15th_Program.pdf", downloadCount: 24, lastDownloaded: new Date(Date.now() - 10 * 60000).toISOString(), category: "Program", workshopName: "15th" },
            { fileName: "14th_Snyder_Miniature_Spectrometer_Abstract.pdf", downloadCount: 6, lastDownloaded: new Date(Date.now() - 86400000).toISOString(), category: "Abstract", workshopName: "14th" }
          ];
          localStorage.setItem("hems_mock_downloads", JSON.stringify(mockDownloads));
        }
        setDownloadsList(mockDownloads);
      } else {
        // Real Firebase fetch
        const { db } = await import("@/utils/firebase");
        const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
        
        // Fetch users
        const usersSnap = await getDocs(collection(db, "users"));
        const users: UserActivity[] = [];
        usersSnap.forEach((doc) => {
          const data = doc.data();
          users.push({
            uid: doc.id,
            name: data.name || "Unknown",
            email: data.email || "",
            loginCount: data.loginCount || 0,
            downloadCount: data.downloadCount || 0,
            lastLogin: data.lastLogin || "",
            createdAt: data.createdAt || ""
          });
        });
        setUsersList(users);

        // Fetch downloads ordered by download count descending
        const downloadsSnap = await getDocs(
          query(collection(db, "downloads"), orderBy("downloadCount", "desc"))
        );
        const downloads: FileDownloadStat[] = [];
        downloadsSnap.forEach((doc) => {
          const data = doc.data();
          downloads.push({
            fileName: data.fileName || doc.id,
            downloadCount: data.downloadCount || 0,
            lastDownloaded: data.lastDownloaded || "",
            category: data.category || "Other",
            workshopName: data.workshopName || "Unknown"
          });
        });
        setDownloadsList(downloads);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load website analytics.");
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAnalyticsData();
    }
  }, [isAdmin]);

  // Aggregate statistics
  const totalLogins = useMemo(() => {
    return usersList.reduce((sum, u) => sum + (u.loginCount || 0), 0);
  }, [usersList]);

  const totalDownloads = useMemo(() => {
    const list = sinceDate ? filteredDownloads : downloadsList;
    return list.reduce((sum, f) => sum + (f.downloadCount || 0), 0);
  }, [downloadsList, filteredDownloads, sinceDate]);

  const categoryBreakdown = useMemo(() => {
    const list = sinceDate ? filteredDownloads : downloadsList;
    const counts: Record<string, number> = {};
    list.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + f.downloadCount;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [downloadsList, filteredDownloads, sinceDate]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="animate-spin text-primary" size={32} />
        <p className="text-foreground/60 font-mono text-sm">Verifying administration session...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-red-950/20 border border-red-500/20 rounded-2xl shadow-xl">
        <ShieldAlert className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold uppercase text-foreground mb-2">Access Denied</h2>
        <p className="text-foreground/70 text-sm mb-6 leading-relaxed">
          The requested panel is gated to site administrators. Whitelist verification or database promotion is required.
        </p>
        <Link href="/layout-portal" className="inline-block bg-surface border border-foreground/20 text-foreground px-5 py-2.5 rounded-lg text-sm font-bold hover:border-primary/50 transition-colors">
          Return to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <header className="mb-8 border-b border-foreground/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <BarChart2 className="text-primary" size={28} /> Website Traffic &amp; Analytics
          </h1>
          <p className="text-foreground/60 text-sm mt-1 font-mono">
            {isMock ? "⚡ Offline Mock Sandbox Mode" : "🔒 Connected to Google Cloud Project"}
          </p>
        </div>
        <button
          onClick={loadAnalyticsData}
          disabled={loadingData}
          className="flex items-center justify-center gap-2 bg-surface hover:bg-foreground/5 text-foreground border border-foreground/20 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} /> Refresh Analytics
        </button>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-center text-sm mb-6">
          {error}
        </div>
      )}

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-foreground/10 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Registered Users</span>
            <h3 className="text-2xl font-black text-foreground mt-1">{usersList.length}</h3>
          </div>
        </div>

        <div className="bg-surface border border-foreground/10 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-secondary/10 text-secondary rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Total Logins</span>
            <h3 className="text-2xl font-black text-foreground mt-1">{totalLogins}</h3>
          </div>
        </div>

        <div className="bg-surface border border-foreground/10 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Download size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">Total Downloads</span>
            <h3 className="text-2xl font-black text-foreground mt-1">{totalDownloads}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Main Tables */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Navigation tabs & Date Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-foreground/10 pb-3 gap-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("users")}
                className={`pb-1 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "users" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
              >
                Attendee Login Activity
              </button>
              <button
                onClick={() => setActiveTab("files")}
                className={`pb-1 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "files" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
              >
                Document Download Leaderboard
              </button>
            </div>
            
            {activeTab === "files" && (
              <div className="flex items-center gap-2 bg-background border border-foreground/10 px-3 py-1.5 rounded-lg text-xs">
                <span className="font-bold text-foreground/60 uppercase tracking-wider">Downloads Since:</span>
                <input
                  type="date"
                  value={sinceDate}
                  onChange={(e) => setSinceDate(e.target.value)}
                  className="bg-transparent border-0 text-foreground focus:outline-none focus:ring-0 font-mono font-bold cursor-pointer"
                />
                {sinceDate && (
                  <button 
                    onClick={() => setSinceDate("")} 
                    className="text-foreground/40 hover:text-foreground font-bold px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {loadingData ? (
            <div className="bg-surface border border-foreground/10 rounded-xl p-12 text-center">
              <RefreshCw className="animate-spin text-primary mx-auto mb-4" size={24} />
              <p className="text-sm font-mono text-foreground/60">Fetching telemetry tables from database...</p>
            </div>
          ) : activeTab === "users" ? (
            
            /* User Login Activity Table */
            <div className="bg-surface border border-foreground/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs font-bold uppercase bg-background border-b border-foreground/10 text-foreground/50">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4 text-center">Logins</th>
                      <th className="px-6 py-4 text-center">Downloads</th>
                      <th className="px-6 py-4">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/10 text-foreground/90">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-foreground/50 italic">
                          No attendee sessions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((usr) => (
                        <tr key={usr.uid} className="hover:bg-foreground/5 transition-colors">
                          <td className="px-6 py-4 font-bold">{usr.name}</td>
                          <td className="px-6 py-4 font-mono text-xs">{usr.email}</td>
                          <td className="px-6 py-4 text-center font-semibold text-secondary">{usr.loginCount || 0}</td>
                          <td className="px-6 py-4 text-center font-semibold text-primary">{usr.downloadCount || 0}</td>
                          <td className="px-6 py-4 text-xs font-mono">
                            {usr.lastLogin ? new Date(usr.lastLogin).toLocaleString() : "Never"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          ) : (
            
            /* Document Download Leaderboard Table */
            <div className="bg-surface border border-foreground/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs font-bold uppercase bg-background border-b border-foreground/10 text-foreground/50">
                    <tr>
                      <th className="px-6 py-4">File Name</th>
                      <th className="px-6 py-4">Workshop</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4 text-center">Downloads</th>
                      <th className="px-6 py-4">Last Downloaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/10 text-foreground/90 font-sans">
                    {filteredDownloads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-foreground/50 italic">
                          No file downloads recorded yet.
                        </td>
                      </tr>
                    ) : (
                      filteredDownloads.map((file, idx) => (
                        <tr key={idx} className="hover:bg-foreground/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-xs truncate max-w-xs md:max-w-sm" title={file.fileName}>
                            {file.fileName}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-mono bg-foreground/5 px-2 py-0.5 rounded border border-foreground/10">
                              <Calendar size={12} className="text-secondary" /> {file.workshopName}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              file.category === "Presentation" ? "bg-primary/10 text-primary border border-primary/20" :
                              file.category === "Abstract" ? "bg-secondary/10 text-secondary border border-secondary/20" :
                              "bg-foreground/10 text-foreground/75 border border-foreground/25"
                            }`}>
                              {file.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-primary">{file.downloadCount}</td>
                          <td className="px-6 py-4 text-xs font-mono">
                            {file.lastDownloaded ? new Date(file.lastDownloaded).toLocaleString() : "Never"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          )}
        </div>

        {/* Right Side: Category Breakdown & Context */}
        <div className="lg:col-span-3 space-y-6">
          <section className="bg-surface border border-foreground/10 p-6 rounded-xl">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-4 border-b border-foreground/10 pb-2 flex items-center gap-1.5">
              <Layers size={14} className="text-primary" /> Category Distribution
            </h3>
            {downloadsList.length === 0 ? (
              <p className="text-xs text-foreground/50 italic">No breakdown available.</p>
            ) : (
              <div className="space-y-3.5">
                {categoryBreakdown.map(([cat, count]) => {
                  const percentage = totalDownloads > 0 ? Math.round((count / totalDownloads) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground/80">{cat}</span>
                        <span className="text-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${cat === "Presentation" ? "bg-primary" : cat === "Abstract" ? "bg-secondary" : "bg-foreground/40"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-surface border border-foreground/10 p-6 rounded-xl text-xs space-y-3 leading-relaxed">
            <h4 className="font-bold uppercase tracking-wider text-foreground/50 border-b border-foreground/10 pb-2">Telemetry Context</h4>
            <p>
              This analytics panel connects directly to Firestore counters. Data writes utilize Atomic Increments (`increment(1)`) to avoid race conditions.
            </p>
            <p className="font-semibold text-secondary">
              🔒 No personal identification data (PII) beyond registered emails and names is collected.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
