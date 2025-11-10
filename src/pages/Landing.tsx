import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Users, Award, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-quiz-primary/10 to-primary/5" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              Welcome to <span className="text-quiz-primary">QuizGrad</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Test your knowledge, track your progress, and master new skills with our comprehensive quiz platform.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="bg-quiz-primary hover:bg-quiz-primary/90">
                <Link to="/login">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Choose QuizGrad?</h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to enhance your learning experience
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 mx-auto text-quiz-primary mb-4" />
              <CardTitle>Diverse Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose from a wide range of subjects and difficulty levels
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 mx-auto text-quiz-success mb-4" />
              <CardTitle>Track Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your improvement with detailed analytics and history
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Award className="h-12 w-12 mx-auto text-quiz-warning mb-4" />
              <CardTitle>Instant Results</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get immediate feedback and see your scores right away
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-quiz-danger mb-4" />
              <CardTitle>Admin Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and manage quizzes with our powerful admin tools
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-muted rounded-lg p-12">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Learning?</h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of learners who are improving their skills every day.
          </p>
          <Button asChild size="lg" className="bg-quiz-primary hover:bg-quiz-primary/90">
            <Link to="/signup">Sign Up Now</Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-quiz-primary/10 to-primary/5" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-lg mb-4">QuizGrad</h4>
              <p className="text-muted-foreground text-sm">
                Test your knowledge, track your progress, and master new skills with our comprehensive quiz platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/login" className="text-muted-foreground hover:text-quiz-primary transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-muted-foreground hover:text-quiz-primary transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Contact</h4>
              <p className="text-muted-foreground text-sm">
                For support and inquiries, please reach out through your account dashboard.
              </p>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} QuizGrad. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;