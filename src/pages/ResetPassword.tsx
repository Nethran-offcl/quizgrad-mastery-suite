import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api } from "@/lib/api";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast({ title: 'Invalid link', variant: 'destructive' });
    if (password.length < 6) return toast({ title: 'Password too short', description: 'At least 6 characters', variant: 'destructive' });
    if (password !== confirm) return toast({ title: "Passwords don't match", variant: 'destructive' });
    setLoading(true);
    try {
      await api.auth.reset(token, password);
      toast({ title: 'Password updated. Please sign in.' });
      navigate('/login');
    } catch (e: any) {
      toast({ title: 'Reset failed', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
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
            <CardTitle className="text-2xl">Reset your password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input 
                  id="confirm"
                  type="password" 
                  value={confirm} 
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-quiz-primary hover:bg-quiz-primary/90" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;


