import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, HelpCircle } from "lucide-react";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Topic form state
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

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

  if (!user || user.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const handleCreateTopic = () => {
    if (!newTopic.title.trim()) {
      toast({
        title: "Error",
        description: "Topic title is required",
        variant: "destructive"
      });
      return;
    }

    // In real implementation, this would call your MySQL backend
    const topic: Topic = {
      id: mockTopics.length + 1,
      title: newTopic.title,
      description: newTopic.description,
      created_at: new Date().toISOString()
    };
    
    mockTopics.push(topic);
    setNewTopic({ title: '', description: '' });
    
    toast({
      title: "Success",
      description: "Topic created successfully"
    });
  };

  const handleUpdateTopic = () => {
    if (!editingTopic || !editingTopic.title.trim()) return;

    const index = mockTopics.findIndex(t => t.id === editingTopic.id);
    if (index !== -1) {
      mockTopics[index] = editingTopic;
      setEditingTopic(null);
      toast({
        title: "Success",
        description: "Topic updated successfully"
      });
    }
  };

  const handleDeleteTopic = (topicId: number) => {
    const index = mockTopics.findIndex(t => t.id === topicId);
    if (index !== -1) {
      mockTopics.splice(index, 1);
      // Also remove questions for this topic
      const questionIndices = mockQuestions
        .map((q, i) => q.topic_id === topicId ? i : -1)
        .filter(i => i !== -1)
        .reverse();
      
      questionIndices.forEach(i => mockQuestions.splice(i, 1));
      
      toast({
        title: "Success",
        description: "Topic and its questions deleted successfully"
      });
    }
  };

  const handleCreateQuestion = () => {
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

    const question: Question = {
      id: mockQuestions.length + 1,
      topic_id: parseInt(newQuestion.topic_id),
      question_text: newQuestion.question_text,
      option1: newQuestion.option1,
      option2: newQuestion.option2,
      option3: newQuestion.option3,
      option4: newQuestion.option4,
      correct_option: newQuestion.correct_option,
      created_at: new Date().toISOString()
    };

    mockQuestions.push(question);
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

  const handleUpdateQuestion = () => {
    if (!editingQuestion) return;

    const index = mockQuestions.findIndex(q => q.id === editingQuestion.id);
    if (index !== -1) {
      mockQuestions[index] = editingQuestion;
      setEditingQuestion(null);
      toast({
        title: "Success",
        description: "Question updated successfully"
      });
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    const index = mockQuestions.findIndex(q => q.id === questionId);
    if (index !== -1) {
      mockQuestions.splice(index, 1);
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-quiz-primary">QuizGrad Admin</h1>
            <Badge>Admin Panel</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
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
            <Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Existing Topics ({mockTopics.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTopics.map((topic) => {
                    const questionCount = mockQuestions.filter(q => q.topic_id === topic.id).length;
                    
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
                  
                  {mockTopics.length === 0 && (
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
            <Card>
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
                      {mockTopics.map((topic) => (
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Existing Questions ({mockQuestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockQuestions.map((question) => {
                    const topic = mockTopics.find(t => t.id === question.topic_id);
                    
                    return (
                      <div key={question.id} className="border rounded-lg p-4">
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
                      </div>
                    );
                  })}
                  
                  {mockQuestions.length === 0 && (
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
