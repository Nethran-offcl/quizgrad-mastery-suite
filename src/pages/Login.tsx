import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, setAuthUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
  const success = await login(identifier, password);
      if (success) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const googleDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialize Google Identity Services with FedCM and render a Sign-In button
    // @ts-ignore
    const google = (window as any).google;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return; // handled via UI; don't throw here
    if (!google?.accounts?.id) return;
    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: any) => {
          try {
            if (!resp?.credential) throw new Error("No Google credential returned");
            const res = await api.auth.google(resp.credential);
            toast({ title: "Signed in with Google" });
            setAuthUser({ id: res.userId, email: res.email, username: res.username, role: res.role });
            navigate("/dashboard");
          } catch (e: any) {
            toast({ title: "Google sign-in failed", description: e?.message || String(e), variant: "destructive" });
          }
        },
        use_fedcm_for_prompt: true,
      });
      if (googleDivRef.current) {
        google.accounts.id.renderButton(googleDivRef.current, {
          theme: "filled_blue",
          size: "large",
          shape: "pill",
          text: "signin_with",
        });
      }
      // Optionally also trigger One Tap; if suppressed, the button is still available
      google.accounts.id.prompt();
    } catch {
      // ignore initialization errors here; UI will show fallback guidance
    }
  }, [login, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 left-4">
        <Logo size={40} />
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your QuizGrad account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-quiz-primary hover:bg-quiz-primary/90"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <div className="mt-3 flex justify-center">
                <div ref={googleDivRef} />
              </div>
            </form>
            
            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="text-quiz-primary hover:underline">
                  Sign up
                </Link>
              </p>
              <p className="mt-2 text-muted-foreground">
                <Link to="/forgot-password" className="text-quiz-primary hover:underline">
                  Forgot password?
                </Link>
              </p>
            </div>

            
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;