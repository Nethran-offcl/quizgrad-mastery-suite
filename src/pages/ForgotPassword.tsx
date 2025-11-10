import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api } from "@/lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.auth.requestReset(email);
      setIsSubmitted(true);
      toast({
        title: "Reset email sent",
        description: "If an account exists with this email, you will receive password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <Button
        variant="ghost"
        onClick={() => navigate("/login")}
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Login
      </Button>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-quiz-primary/10">
              <Mail className="h-6 w-6 text-quiz-primary" />
            </div>
            <CardTitle className="text-2xl">Forgot Password?</CardTitle>
            <CardDescription>
              {isSubmitted
                ? "Check your email for password reset instructions"
                : "Enter your email address and we'll send you a link to reset your password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-quiz-primary/10 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    If an account exists with the email <strong>{email}</strong>, you will receive password reset instructions shortly.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Email
                  </Button>
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full bg-quiz-primary hover:bg-quiz-primary/90"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-quiz-primary hover:bg-quiz-primary/90"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <div className="text-center text-sm">
                  <Link
                    to="/login"
                    className="text-quiz-primary hover:underline"
                  >
                    Remember your password? Sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;

