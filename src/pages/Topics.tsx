import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { mockTopics, mockQuestions, mockResults } from "@/data/mockData";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { BookOpen, Play, BarChart3, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Topics = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  const [questions, setQuestions] = useState<typeof mockQuestions>([]);
  const [topics, setTopics] = useState(mockTopics);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const topicsRows = await api.topics.list();
      setTopics(topicsRows.map((t: any) => ({ id: t.id, title: t.title, description: t.description ?? '', created_at: t.created_at })));

      const rows = await api.questions.list();
      const mapped = rows.map((r: any) => {
        let parsed: any = {};
        try { parsed = r.body ? JSON.parse(r.body) : {}; } catch {}
        return {
          id: r.id,
          topic_id: r.topic_id ?? parsed.topic_id ?? (topicsRows[0]?.id ?? 1),
          question_text: r.title,
          option1: parsed.option1 ?? "",
          option2: parsed.option2 ?? "",
          option3: parsed.option3 ?? "",
          option4: parsed.option4 ?? "",
          correct_option: parsed.correct_option ?? 1,
          created_at: r.created_at || new Date().toISOString(),
        };
      });
      setQuestions(mapped);

      // Load user's quiz results
      const results = await api.results.listMine(user.id);
      setUserResults(results);
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
        toast({ title: "Refresh failed", description: "Could not load latest topics.", variant: "destructive" });
      } else {
        toast({ title: "Data updated", description: "Topics have been refreshed." });
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

  const getTopicStats = (topicId: number) => {
    const questionsForTopic = questions.filter(q => q.topic_id === topicId);
    const topicResults = userResults.filter(r => r.topic_id === topicId);
    const totalAttempts = topicResults.length;
    const bestScore = topicResults.length > 0 
      ? Math.max(...topicResults.map(r => Math.round((r.score / r.total_questions) * 100)))
      : 0;
    
    return {
      questionCount: questionsForTopic.length,
      totalAttempts,
      bestScore
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-quiz-primary">QuizGrad</h1>
            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'quiz_manager' ? 'default' : 'secondary'}>
              {user.role === 'admin' ? 'Admin' : user.role === 'quiz_manager' ? 'Quiz Manager' : 'User'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user.username}</span>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            {(user.role === 'admin' || user.role === 'quiz_manager') && (
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
            <h2 className="text-3xl font-bold mb-2">Quiz Topics</h2>
            <p className="text-muted-foreground">Choose a topic to start your quiz</p>
          </div>
          <Button onClick={handleRefreshClick} variant="outline" size="sm" disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const stats = getTopicStats(topic.id);
            
            return (
              <Card key={topic.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <BookOpen className="h-8 w-8 text-quiz-primary" />
                    <Badge variant="outline">
                      {stats.questionCount} questions
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{topic.title}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Attempts</div>
                      <div className="font-bold">{stats.totalAttempts}</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Best Score</div>
                      <div className="font-bold">
                        {stats.bestScore > 0 ? `${stats.bestScore}%` : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button 
                      asChild 
                      className="w-full bg-quiz-primary hover:bg-quiz-primary/90"
                      disabled={stats.questionCount === 0}
                    >
                      <Link to={`/quiz/${topic.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Start Quiz
                      </Link>
                    </Button>
                    
                    {stats.totalAttempts > 0 && (
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/results/${topic.id}`}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Results
                        </Link>
                      </Button>
                    )}
                  </div>

                  {stats.questionCount === 0 && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      No questions available yet
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Topics Available</h3>
            <p className="text-muted-foreground mb-4">
              There are no quiz topics available at the moment.
            </p>
            {user.role === 'admin' && (
              <Button asChild>
                <Link to="/admin">Create Topics</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Topics;