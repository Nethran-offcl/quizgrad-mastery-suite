import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { mockTopics } from "@/data/mockData";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, BookOpen, Clock, Target, Settings, RefreshCw } from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const [userResults, setUserResults] = useState<any[]>([]);
  const [topics, setTopics] = useState(mockTopics);
  const isAdmin = user.role === 'admin';
  const primaryTint = "bg-quiz-primary/10 border-quiz-primary/20";
  const secondaryTint = "bg-quiz-primary/15 border-quiz-primary/25";
  const neutralTint = "bg-quiz-primary/10 border-quiz-primary/20";

  const loadData = async () => {
    try {
      const rows = await api.results.listMine(user.id);
      setUserResults(rows);
      const trows = await api.topics.list();
      setTopics(trows.map((t: any) => ({ id: t.id, title: t.title, description: t.description ?? '', created_at: t.created_at })));
    } catch (e) {
      console.error(e);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-quiz-primary">QuizGrad</h1>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role === 'admin' ? 'Admin' : 'User'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user.username}</span>
            <Button asChild variant="outline">
              <Link to="/topics">Browse Topics</Link>
            </Button>
            {user.role === 'admin' && (
              <Button asChild className="bg-quiz-primary hover:bg-quiz-primary/90">
                <Link to="/admin">Admin Panel</Link>
              </Button>
            )}
            <Button onClick={logout} variant="ghost">
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
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
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
              
              {user.role === 'admin' && (
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