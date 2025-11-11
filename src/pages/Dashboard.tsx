import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { Link } from "react-router-dom";
import { mockTopics } from "@/data/mockData";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, BookOpen, Clock, Target, Settings, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import jsPDF from "jspdf";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  const [userResults, setUserResults] = useState<any[]>([]);
  const [topics, setTopics] = useState(mockTopics);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isAdmin = user.role === 'admin';
  const isQuizManager = user.role === 'quiz_manager';
  const primaryTint = "bg-quiz-primary/10 border-quiz-primary/20";
  const secondaryTint = "bg-quiz-primary/15 border-quiz-primary/25";
  const neutralTint = "bg-quiz-primary/10 border-quiz-primary/20";

  const loadData = async () => {
    try {
      const rows = await api.results.listMine(user.id);
      setUserResults(rows);
      const trows = await api.topics.list();
      setTopics(trows.map((t: any) => ({ id: t.id, title: t.title, description: t.description ?? '', created_at: t.created_at })));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleRefreshClick = async () => {
    try {
      setIsRefreshing(true);
      const ok = await loadData();
      if (!ok) {
        toast({ title: "Refresh failed", description: "Could not load latest data.", variant: "destructive" });
      } else {
        toast({ title: "Data updated", description: "Dashboard has been refreshed." });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Refresh data when component becomes visible (e.g., returning from quiz)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user.id]);
  const totalQuizzes = userResults.length;
  const totalScore = userResults.reduce((sum, result) => sum + result.score, 0);
  const totalQuestions = userResults.reduce((sum, result) => sum + result.total_questions, 0);
  const averageScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  // PDF generation with beautiful styling
  const handleDownloadPDF = () => {
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
    doc.text(user.email, 50, yPos + 8);
    doc.text(user.role.charAt(0).toUpperCase() + user.role.slice(1), 50, yPos + 16);
    doc.setFont(undefined, 'normal');
    yPos += 35;

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
        const topic = topics.find(t => t.id === result.topic_id)?.title || 'Unknown';
        const pct = Math.round((result.score / result.total_questions) * 100);
        const date = new Date(result.taken_at).toLocaleDateString();
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

    doc.save('quizgrad_stats.pdf');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo to="/dashboard" size={32} />
            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'quiz_manager' ? 'default' : 'secondary'}>
              {user.role === 'admin' ? 'Admin' : user.role === 'quiz_manager' ? 'Quiz Manager' : 'User'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
            <Button asChild className="bg-quiz-primary hover:bg-quiz-primary/90">
              <Link to="/topics">Browse Topics</Link>
            </Button>
            {(user.role === 'admin' || user.role === 'quiz_manager') && (
              <Button asChild className="bg-quiz-primary hover:bg-quiz-primary/90">
                <Link to="/admin">Admin Panel</Link>
              </Button>
            )}
            {/* Only super admin (userId 0) can manage users */}
            {user.role === 'admin' && user.id === 0 && (
              <Button asChild className="bg-quiz-primary hover:bg-quiz-primary/90">
                <Link to="/super-admin">Manage Users</Link>
              </Button>
            )}
            <Button onClick={logout} className="bg-quiz-primary hover:bg-quiz-primary/90">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
            <p className="text-muted-foreground">Track your progress and continue learning</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              Download My Stats PDF
            </Button>
            <Button onClick={handleRefreshClick} variant="outline" size="sm" disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className={primaryTint}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuizzes}</div>
            </CardContent>
          </Card>

          <Card className={primaryTint}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalScore}/{totalQuestions}</div>
            </CardContent>
          </Card>

          <Card className={neutralTint}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}%</div>
            </CardContent>
          </Card>

          <Card className={neutralTint}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userResults.length > 0 ? 'Recent' : 'None'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Quiz Results */}
          <Card className={neutralTint}>
            <CardHeader>
              <CardTitle>Recent Quiz Results</CardTitle>
              <CardDescription>Your latest quiz attempts and scores</CardDescription>
            </CardHeader>
            <CardContent>
              {userResults.length > 0 ? (
                <div className="space-y-4">
                  {userResults.slice(0, 5).map((result) => {
                    const topic = topics.find(t => t.id === result.topic_id);
                    const percentage = Math.round((result.score / result.total_questions) * 100);
                    return (
                      <div key={result.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{topic?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(result.taken_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{result.score}/{result.total_questions}</p>
                          <Badge variant={percentage >= 70 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}>
                            {percentage}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No quiz results yet</p>
                  <Button asChild>
                    <Link to="/topics">Take Your First Quiz</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className={neutralTint}>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump into your learning journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/topics">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Quiz Topics
                </Link>
              </Button>

              {(user.role === 'admin' || user.role === 'quiz_manager') && (
                <>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </Button>
                </>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Available Topics</h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {topics.length > 0 ? (
                    topics.slice(0, 6).map((topic) => (
                      <Link key={topic.id} to={`/quiz/${topic.id}`} className="group">
                        <div className="w-full rounded-lg border p-3 bg-gradient-to-tr from-quiz-primary/5 to-transparent hover:from-quiz-primary/10 transition-colors">
                          <p className="font-medium text-foreground group-hover:text-quiz-primary transition-colors">{topic.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No topics available yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;