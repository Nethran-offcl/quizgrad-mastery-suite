import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockTopics, mockQuestions, mockResults, Question } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";

const Quiz = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const topic = mockTopics.find(t => t.id === parseInt(topicId || '0'));
  const questions = mockQuestions.filter(q => q.topic_id === parseInt(topicId || '0'));

  useEffect(() => {
    if (!user || !topic || questions.length === 0) {
      navigate('/topics');
      return;
    }
  }, [user, topic, questions, navigate]);

  if (!user || !topic || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (optionNumber: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionNumber
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeQuiz = () => {
    let correctAnswers = 0;
    
    questions.forEach(question => {
      const userAnswer = selectedAnswers[question.id];
      if (userAnswer === question.correct_option) {
        correctAnswers++;
      }
    });

    setScore(correctAnswers);
    setIsCompleted(true);
    setShowResults(true);

    // In real implementation, save to MySQL database
    const newResult = {
      id: mockResults.length + 1,
      user_id: user.id,
      topic_id: topic.id,
      score: correctAnswers,
      total_questions: questions.length,
      taken_at: new Date().toISOString()
    };
    mockResults.push(newResult);

    toast({
      title: "Quiz Completed!",
      description: `You scored ${correctAnswers} out of ${questions.length}`,
    });
  };

  const getScoreColor = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return "text-quiz-success";
    if (percentage >= 60) return "text-quiz-warning";
    return "text-quiz-danger";
  };

  const getScoreBadgeVariant = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Button asChild variant="ghost">
              <Link to="/topics">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Topics
              </Link>
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-4">Quiz Results</CardTitle>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{topic.title}</h3>
                <div className={`text-4xl font-bold ${getScoreColor()}`}>
                  {score}/{questions.length}
                </div>
                <Badge variant={getScoreBadgeVariant()} className="text-lg px-4 py-2">
                  {Math.round((score / questions.length) * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold mb-3">Review Answers:</h4>
                {questions.map((question, index) => {
                  const userAnswer = selectedAnswers[question.id];
                  const isCorrect = userAnswer === question.correct_option;
                  
                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-quiz-success mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-quiz-danger mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-2">
                            {index + 1}. {question.question_text}
                          </p>
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                              Your answer: {question[`option${userAnswer}` as keyof Question] as string}
                            </p>
                            {!isCorrect && (
                              <p className="text-quiz-success">
                                Correct answer: {question[`option${question.correct_option}` as keyof Question] as string}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-6">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/topics">Browse Topics</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button asChild variant="ghost">
            <Link to="/topics">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Topics
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">{topic.title}</h2>
              <Badge variant="outline">
                {currentQuestionIndex + 1}/{questions.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((optionNumber) => {
                  const optionText = currentQuestion[`option${optionNumber}` as keyof Question] as string;
                  const isSelected = selectedAnswers[currentQuestion.id] === optionNumber;
                  
                  return (
                    <button
                      key={optionNumber}
                      onClick={() => handleAnswerSelect(optionNumber)}
                      className={`w-full p-4 text-left border rounded-lg transition-colors ${
                        isSelected
                          ? 'border-quiz-primary bg-quiz-primary/10'
                          : 'border-border hover:border-quiz-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-quiz-primary bg-quiz-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span>{optionText}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestion.id]}
              className="bg-quiz-primary hover:bg-quiz-primary/90"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;