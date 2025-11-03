import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { mockTopics, mockQuestions, Topic, Question } from "@/data/mockData";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, HelpCircle } from "lucide-react";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Topic form state
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Local questions state persisted in backend
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Question form state
  const [newQuestion, setNewQuestion] = useState({
    topic_id: '',
    question_text: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option: 1 as 1 | 2 | 3 | 4
  });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }
  if (user.role !== 'admin' && user.role !== 'quiz_manager') {
    navigate('/dashboard');
    return null;
  }

  useEffect(() => {
    (async () => {
      try {
        const topicsRows = await api.topics.list();
        setTopics(topicsRows.map((t: any) => ({ id: t.id, title: t.title, description: t.description ?? '', created_at: t.created_at })));

        const rows = await api.questions.list();
        const mapped: Question[] = rows.map((r: any) => {
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
          } as Question;
        });
        setQuestions(mapped);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleCreateTopic = async () => {
    if (!newTopic.title.trim()) {
      toast({
        title: "Error",
        description: "Topic title is required",
        variant: "destructive"
      });
      return;
    }
    try {
      const { id } = await api.topics.create(newTopic.title, newTopic.description || null, user!.id);
      const topic: Topic = {
        id,
        title: newTopic.title,
        description: newTopic.description,
        created_at: new Date().toISOString()
      };
      setTopics(prev => [topic, ...prev]);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      return;
    }
    setNewTopic({ title: '', description: '' });
    
    toast({
      title: "Success",
      description: "Topic created successfully"
    });
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic || !editingTopic.title.trim()) return;
    try {
      await api.topics.update(editingTopic.id, editingTopic.title, editingTopic.description, user!.id);
      setTopics(prev => prev.map(t => t.id === editingTopic.id ? editingTopic : t));
      setEditingTopic(null);
      toast({ title: "Success", description: "Topic updated successfully" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    try {
      await api.topics.remove(topicId, user!.id);
      setTopics(prev => prev.filter(t => t.id !== topicId));
      setQuestions(prev => prev.filter(q => q.topic_id !== topicId));
      toast({ title: "Success", description: "Topic and its questions deleted successfully" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.topic_id || !newQuestion.question_text.trim() || 
        !newQuestion.option1.trim() || !newQuestion.option2.trim() || 
        !newQuestion.option3.trim() || !newQuestion.option4.trim()) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    // Persist minimal question text as one backend question
    if (!user) {
      toast({ title: "Not logged in", description: "Please log in before creating questions.", variant: "destructive" });
      return;
    }
    const title = newQuestion.question_text;
    const body = JSON.stringify({
      topic_id: parseInt(newQuestion.topic_id),
      option1: newQuestion.option1,
      option2: newQuestion.option2,
      option3: newQuestion.option3,
      option4: newQuestion.option4,
      correct_option: newQuestion.correct_option
    });
    try {
      const { id } = await api.questions.create(title, body, user!.id, parseInt(newQuestion.topic_id));
      const question: Question = {
        id,
        topic_id: parseInt(newQuestion.topic_id),
        question_text: newQuestion.question_text,
        option1: newQuestion.option1,
        option2: newQuestion.option2,
        option3: newQuestion.option3,
        option4: newQuestion.option4,
        correct_option: newQuestion.correct_option,
        created_at: new Date().toISOString()
      };
      setQuestions(prev => [question, ...prev]);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      return;
    }
    setNewQuestion({
      topic_id: '',
      question_text: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_option: 1
    });

    toast({
      title: "Success",
      description: "Question created successfully"
    });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const body = JSON.stringify({
        topic_id: editingQuestion.topic_id,
        option1: editingQuestion.option1,
        option2: editingQuestion.option2,
        option3: editingQuestion.option3,
        option4: editingQuestion.option4,
        correct_option: editingQuestion.correct_option
      });
      await api.questions.update(editingQuestion.id, editingQuestion.question_text, body, user!.id, editingQuestion.topic_id);
      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? editingQuestion : q));
      setEditingQuestion(null);
      toast({ title: "Success", description: "Question updated successfully" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await api.questions.remove(questionId, user!.id);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      toast({ title: "Success", description: "Question deleted successfully" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button asChild className="bg-quiz-primary hover:bg-quiz-primary/90">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-quiz-primary">QuizGrad Admin</h1>
            <Badge>Admin Panel</Badge>
          </div>
          <div className="flex items-center gap-4" />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="topics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topics">Manage Topics</TabsTrigger>
            <TabsTrigger value="questions">Manage Questions</TabsTrigger>
          </TabsList>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-6">
            {/* Create Topic */}
            <Card className="bg-quiz-primary/10 border-quiz-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Topic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic-title">Topic Title</Label>
                    <Input
                      id="topic-title"
                      value={newTopic.title}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter topic title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic-description">Description</Label>
                    <Input
                      id="topic-description"
                      value={newTopic.description}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter topic description"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateTopic} className="bg-quiz-primary hover:bg-quiz-primary/90">
                  Create Topic
                </Button>
              </CardContent>
            </Card>

            {/* Existing Topics */}
            <Card className="bg-quiz-primary/10 border-quiz-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Existing Topics ({topics.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topics.map((topic) => {
                    const questionCount = questions.filter(q => q.topic_id === topic.id).length;
                    
                    return (
                      <div key={topic.id} className="border rounded-lg p-4">
                        {editingTopic?.id === topic.id ? (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                  value={editingTopic.title}
                                  onChange={(e) => setEditingTopic(prev => prev ? { ...prev, title: e.target.value } : null)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                  value={editingTopic.description}
                                  onChange={(e) => setEditingTopic(prev => prev ? { ...prev, description: e.target.value } : null)}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleUpdateTopic} size="sm">Save</Button>
                              <Button onClick={() => setEditingTopic(null)} variant="outline" size="sm">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{topic.title}</h3>
                              <p className="text-sm text-muted-foreground">{topic.description}</p>
                              <Badge variant="outline" className="mt-2">
                                {questionCount} questions
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => setEditingTopic(topic)}
                                size="sm"
                                variant="outline"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteTopic(topic.id)}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {topics.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No topics created yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            {/* Create Question */}
            <Card className="bg-quiz-primary/10 border-quiz-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Topic</Label>
                  <Select value={newQuestion.topic_id} onValueChange={(value) => setNewQuestion(prev => ({ ...prev, topic_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                    placeholder="Enter your question"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Option 1</Label>
                    <Input
                      value={newQuestion.option1}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, option1: e.target.value }))}
                      placeholder="First option"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option 2</Label>
                    <Input
                      value={newQuestion.option2}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, option2: e.target.value }))}
                      placeholder="Second option"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option 3</Label>
                    <Input
                      value={newQuestion.option3}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, option3: e.target.value }))}
                      placeholder="Third option"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option 4</Label>
                    <Input
                      value={newQuestion.option4}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, option4: e.target.value }))}
                      placeholder="Fourth option"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select 
                    value={newQuestion.correct_option.toString()} 
                    onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correct_option: parseInt(value) as 1 | 2 | 3 | 4 }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Option 1</SelectItem>
                      <SelectItem value="2">Option 2</SelectItem>
                      <SelectItem value="3">Option 3</SelectItem>
                      <SelectItem value="4">Option 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCreateQuestion} className="bg-quiz-primary hover:bg-quiz-primary/90">
                  Create Question
                </Button>
              </CardContent>
            </Card>

            {/* Existing Questions */}
            <Card className="bg-quiz-primary/10 border-quiz-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Existing Questions ({questions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((question) => {
                    const topic = topics.find(t => t.id === question.topic_id);
                    
                    return (
                      <div key={question.id} className="border rounded-lg p-4">
                        {editingQuestion?.id === question.id ? (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2 md:col-span-2">
                                <Label>Question Text</Label>
                                <Textarea
                                  value={editingQuestion.question_text}
                                  onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, question_text: e.target.value } : prev)}
                                  placeholder="Enter question"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Option 1</Label>
                                <Input
                                  value={editingQuestion.option1}
                                  onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, option1: e.target.value } : prev)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Option 2</Label>
                                <Input
                                  value={editingQuestion.option2}
                                  onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, option2: e.target.value } : prev)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Option 3</Label>
                                <Input
                                  value={editingQuestion.option3}
                                  onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, option3: e.target.value } : prev)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Option 4</Label>
                                <Input
                                  value={editingQuestion.option4}
                                  onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, option4: e.target.value } : prev)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Correct Answer</Label>
                                <Select 
                                  value={editingQuestion.correct_option.toString()}
                                  onValueChange={(value) => setEditingQuestion(prev => prev ? { ...prev, correct_option: parseInt(value) as 1 | 2 | 3 | 4 } : prev)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Option 1</SelectItem>
                                    <SelectItem value="2">Option 2</SelectItem>
                                    <SelectItem value="3">Option 3</SelectItem>
                                    <SelectItem value="4">Option 4</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleUpdateQuestion} size="sm">Save</Button>
                              <Button onClick={() => setEditingQuestion(null)} variant="outline" size="sm">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <Badge variant="outline" className="mb-2">
                                  {topic?.title || 'Unknown Topic'}
                                </Badge>
                                <h3 className="font-medium">{question.question_text}</h3>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => setEditingQuestion(question)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                              {[1, 2, 3, 4].map((optionNum) => (
                                <div 
                                  key={optionNum}
                                  className={`p-2 rounded ${
                                    question.correct_option === optionNum 
                                      ? 'bg-quiz-success/10 border border-quiz-success/20' 
                                      : 'bg-muted'
                                  }`}
                                >
                                  {optionNum}. {question[`option${optionNum}` as keyof Question] as string}
                                  {question.correct_option === optionNum && (
                                    <Badge variant="default" className="ml-2 text-xs">Correct</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  
                  {questions.length === 0 && (
                    <div className="text-center py-8">
                      <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No questions created yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
