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
import { ThemeToggle } from "@/components/ThemeToggle";
import jsPDF from "jspdf";
import Logo from "@/components/Logo";

const SuperAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUsers = async () => {
    try {
      const rows = await api.users.listAll(user!.id);
      setUsers(rows);
      return true;
    } catch (e: any) {
      console.error("Failed to load users:", e);
      return false;
    }
  };

  useEffect(() => {
    // Guard: only super admin (id 0) can view this page
    if (!user || user.role !== 'admin' || user.id !== 0) return;
    setLoading(true);
    Promise.all([loadUsers(), loadResults(), loadStats()]).finally(() => {
      setLoading(false);
    });
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
      return true;
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load results", variant: "destructive" });
      return false;
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
      return true;
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load stats", variant: "destructive" });
      return false;
    }
  };

  const handleRefreshClick = async () => {
    try {
      setIsRefreshing(true);
      const [usersOk, resultsOk, statsOk] = await Promise.all([
        loadUsers(),
        loadResults(),
        loadStats()
      ]);
      if (usersOk && resultsOk && statsOk) {
        toast({ title: "Data updated", description: "All data has been refreshed." });
      } else {
        toast({ title: "Partial refresh", description: "Some data may not have been updated.", variant: "destructive" });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add these state hooks:
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const selectedUser = users.find(u => u.id === selectedUserId);

  // New: fetch a given user's results
  async function fetchResultsForUser(userId: number) {
    const rows = await api.admin.results.listAll(user.id);
    return (rows || []).filter((r: any) => r.user_id === userId);
  }

  async function handleDownloadUserPDF() {
    if (!selectedUserId) return;
    const userData = users.find(u => u.id === selectedUserId);
    if (!userData) return;
    let userResults: any[] = await fetchResultsForUser(selectedUserId);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Helper function to draw a colored header box
    const drawHeader = (title: string, y: number) => {
      doc.setFillColor(59, 130, 246); // Blue color
      doc.rect(0, y - 5, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(title, pageWidth / 2, y + 5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPos = y + 20;
    };

    // Helper function to draw a stats box
    const drawStatsBox = (label: string, value: string, x: number, y: number, width: number, height: number) => {
      // Border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(x, y, width, height);
      
      // Light background
      doc.setFillColor(245, 247, 250);
      doc.rect(x, y, width, height, 'F');
      
      // Label
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(label, x + width / 2, y + 8, { align: 'center' });
      
      // Value
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(value, x + width / 2, y + 15, { align: 'center' });
      doc.setFont(undefined, 'normal');
    };

    // Helper function to draw table
    const drawTable = (headers: string[], rows: string[][], startY: number) => {
      const tableWidth = pageWidth - 30;
      const colWidths = [35, tableWidth - 140, 35, 30]; // Date, Topic, Score, Percentage
      const rowHeight = 10;
      const tableStartX = 15;
      let currentY = startY;

      // Table header
      doc.setFillColor(59, 130, 246);
      doc.rect(tableStartX, currentY, tableWidth, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      
      // Draw vertical lines for header
      let xPos = tableStartX;
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      for (let i = 0; i < colWidths.length; i++) {
        xPos += colWidths[i];
        if (i < colWidths.length - 1) {
          doc.line(xPos, currentY, xPos, currentY + rowHeight);
        }
      }
      
      xPos = tableStartX + 5;
      headers.forEach((header, index) => {
        doc.text(header, xPos, currentY + 7);
        xPos += colWidths[index];
      });

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      currentY += rowHeight;

      // Table rows
      rows.forEach((row, rowIndex) => {
        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(tableStartX, currentY, tableWidth, rowHeight, 'F');
        }

        // Row border
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(tableStartX, currentY, tableStartX + tableWidth, currentY);

        // Row content
        doc.setFontSize(10);
        xPos = tableStartX + 5;
        row.forEach((cell, colIndex) => {
          doc.text(cell, xPos, currentY + 7);
          xPos += colWidths[colIndex];
        });

        currentY += rowHeight;

        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 20;
          // Redraw header on new page
          doc.setFillColor(59, 130, 246);
          doc.rect(tableStartX, currentY, tableWidth, rowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont(undefined, 'bold');
          // Draw vertical lines for header
          xPos = tableStartX;
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.5);
          for (let i = 0; i < colWidths.length; i++) {
            xPos += colWidths[i];
            if (i < colWidths.length - 1) {
              doc.line(xPos, currentY, xPos, currentY + rowHeight);
            }
          }
          xPos = tableStartX + 5;
          headers.forEach((header, index) => {
            doc.text(header, xPos, currentY + 7);
            xPos += colWidths[index];
          });
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          currentY += rowHeight;
        }
      });

      // Draw vertical lines and borders
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      xPos = tableStartX;
      // Draw vertical separators
      for (let i = 0; i < colWidths.length - 1; i++) {
        xPos += colWidths[i];
        doc.line(xPos, startY, xPos, currentY);
      }
      // Draw outer borders
      doc.line(tableStartX, startY, tableStartX, currentY); // Left
      doc.line(tableStartX + tableWidth, startY, tableStartX + tableWidth, currentY); // Right
      doc.line(tableStartX, currentY, tableStartX + tableWidth, currentY); // Bottom

      return currentY;
    };

    // Header
    drawHeader('QuizGrad - User Statistics Report', 10);

    // User info section
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('User Information', 20, yPos);
    yPos += 8;

    // User info box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(249, 250, 251);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, pageWidth - 30, 25, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Email:', 20, yPos + 8);
    doc.text('Role:', 20, yPos + 16);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(userData.email, 50, yPos + 8);
    doc.text(userData.role.charAt(0).toUpperCase() + userData.role.slice(1), 50, yPos + 16);
    doc.setFont(undefined, 'normal');
    yPos += 35;

    // Calculate stats
    const totalQuizzes = userResults.length;
    const totalScore = userResults.reduce((sum, r) => sum + r.score, 0);
    const totalQuestions = userResults.reduce((sum, r) => sum + r.total_questions, 0);
    const averageScore = userResults.length ? Math.round(userResults.reduce((sum, r) => sum + (r.score/r.total_questions)*100, 0)/userResults.length) : 0;

    // Stats boxes
    const statsBoxWidth = (pageWidth - 50) / 3;
    drawStatsBox('Total Quizzes', totalQuizzes.toString(), 15, yPos, statsBoxWidth, 20);
    drawStatsBox('Total Score', `${totalScore}/${totalQuestions}`, 20 + statsBoxWidth, yPos, statsBoxWidth, 20);
    drawStatsBox('Average Score', `${averageScore}%`, 25 + statsBoxWidth * 2, yPos, statsBoxWidth, 20);
    yPos += 35;

    // Quiz Results section
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('Quiz Results History', 20, yPos);
    yPos += 10;

    if (!userResults.length) {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('No quizzes taken yet.', 20, yPos);
    } else {
      // Prepare table data
      const headers = ['Date', 'Topic', 'Score', 'Percentage'];
      const tableRows = userResults.map(result => {
        const pct = Math.round((result.score / result.total_questions) * 100);
        const date = new Date(result.taken_at).toLocaleDateString();
        const topic = result.topic_title || 'Unknown';
        return [date, topic.length > 25 ? topic.substring(0, 22) + '...' : topic, `${result.score}/${result.total_questions}`, `${pct}%`];
      });

      yPos = drawTable(headers, tableRows, yPos);
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    doc.save(`quizgrad_stats_user${userData.id}.pdf`);
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button asChild className="bg-quiz-primary hover:bg-quiz-primary/90">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Logo to="/dashboard" size={32} />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={handleRefreshClick} variant="outline" size="sm" disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {(user.role === 'admin' && user.id === 0) && (
          <div className="mb-6 flex gap-6 items-end">
            <div>
              <label className="block mb-2 text-sm font-medium">Pick a user:</label>
              <select
                value={selectedUserId ?? ''}
                onChange={e => setSelectedUserId(Number(e.target.value))}
                className="border p-2 rounded"
              >
                <option value='' disabled>Select user</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                ))}
              </select>
            </div>
            <Button onClick={handleDownloadUserPDF} disabled={!selectedUserId} className="bg-quiz-primary hover:bg-quiz-primary/90">
              Download User's Stats PDF
            </Button>
          </div>
        )}

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


