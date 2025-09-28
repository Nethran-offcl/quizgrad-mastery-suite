import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SuperAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const rows = await api.users.listAll(user!.id);
      setUsers(rows);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Guard: only super admin (id 0) can view this page
    if (!user || user.role !== 'admin' || user.id !== 0) return;
    loadUsers();
    loadResults();
    loadStats();
  }, [user]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await api.users.remove(id, user!.id);
      toast({ title: "User deleted" });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to delete user", variant: "destructive" });
    }
  };

  const loadResults = async () => {
    try {
      const rows = await api.admin.results.listAll(user!.id);
      setResults(rows);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load results", variant: "destructive" });
    }
  };

  const deleteResult = async (id: number) => {
    try {
      await api.admin.results.remove(id, user!.id);
      setResults(prev => prev.filter(r => r.id !== id));
      toast({ title: "Result deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to delete result", variant: "destructive" });
    }
  };

  const loadStats = async () => {
    try {
      const s = await api.admin.stats(user!.id);
      setStats(s);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load stats", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button asChild variant="ghost">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Button onClick={loadUsers} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="max-w-5xl mx-auto">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-muted-foreground">Loading users…</div>
                ) : users.length === 0 ? (
                  <div className="text-muted-foreground">No users found.</div>
                ) : (
                  <div className="space-y-3">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{u.email}</div>
                          <Badge variant={u.role === 'admin' ? 'default' : u.role === 'quiz_manager' ? 'default' : 'secondary'}>
                            {u.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(u.id)} disabled={u.id === user!.id}>
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-muted-foreground">No results found.</div>
                ) : (
                  <div className="space-y-3">
                    {results.map((r) => (
                      <div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <div className="font-medium">{r.email} • {r.topic_title}</div>
                          <div className="text-sm text-muted-foreground">{new Date(r.taken_at).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge>{Math.round((r.score / r.total_questions) * 100)}%</Badge>
                          <Button variant="destructive" size="sm" onClick={() => deleteResult(r.id)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {!stats ? (
                  <div className="text-muted-foreground">Loading…</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card><CardContent className="pt-4"><div className="text-sm text-muted-foreground">Users</div><div className="text-2xl font-bold">{stats.usersCount}</div></CardContent></Card>
                      <Card><CardContent className="pt-4"><div className="text-sm text-muted-foreground">Results</div><div className="text-2xl font-bold">{stats.resultsCount}</div></CardContent></Card>
                      <Card><CardContent className="pt-4"><div className="text-sm text-muted-foreground">Topics</div><div className="text-2xl font-bold">{stats.topicsCount}</div></CardContent></Card>
                      <Card><CardContent className="pt-4"><div className="text-sm text-muted-foreground">Avg Score</div><div className="text-2xl font-bold">{stats.averageScorePercent}%</div></CardContent></Card>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Top Users</h4>
                      <div className="space-y-2">
                        {stats.byUser.map((u: any) => (
                          <div key={u.id} className="flex justify-between text-sm border rounded p-2">
                            <div>{u.email}</div>
                            <div className="text-muted-foreground">{u.attempts} attempts • {u.avg_pct ?? 0}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Top Topics</h4>
                      <div className="space-y-2">
                        {stats.byTopic.map((t: any) => (
                          <div key={t.id} className="flex justify-between text-sm border rounded p-2">
                            <div>{t.title}</div>
                            <div className="text-muted-foreground">{t.attempts} attempts • {t.avg_pct ?? 0}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdmin;


