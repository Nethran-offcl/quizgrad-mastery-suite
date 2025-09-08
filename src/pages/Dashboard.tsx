import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { mockResults, mockTopics } from "@/data/mockData";
import { Trophy, BookOpen, Clock, Target, Settings } from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const userResults = mockResults.filter(result => result.user_id === user.id);
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Track your progress and continue learning</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuizzes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalScore}/{totalQuestions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}%</div>
            </CardContent>
          </Card>

          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Results</CardTitle>
              <CardDescription>Your latest quiz attempts and scores</CardDescription>
            </CardHeader>
            <CardContent>
              {userResults.length > 0 ? (
                <div className="space-y-4">
                  {userResults.slice(-5).reverse().map((result) => {
                    const topic = mockTopics.find(t => t.id === result.topic_id);
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
          <Card>
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
                <h4 className="font-medium mb-2">Available Topics</h4>
                <div className="space-y-2">
                  {mockTopics.slice(0, 3).map((topic) => (
                    <Button
                      key={topic.id}
                      asChild
                      variant="ghost"
                      className="w-full justify-start h-auto p-2"
                    >
                      <Link to={`/quiz/${topic.id}`}>
                        <div className="text-left">
                          <p className="font-medium">{topic.title}</p>
                          <p className="text-xs text-muted-foreground">{topic.description}</p>
                        </div>
                      </Link>
                    </Button>
                  ))}
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