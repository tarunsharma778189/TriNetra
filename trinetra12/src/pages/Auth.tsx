import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });
  const [phoneError, setPhoneError] = useState("");

  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) return "";
    if (digits.length !== 10) return "Phone number must be exactly 10 digits";
    if (!/^[6-9]/.test(digits)) return "Enter a valid Indian mobile number";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error("Please verify your email before logging in. Check your inbox.");
          } else {
            toast.error(error.message || "Login failed");
          }
          return;
        }

        // Check if email is confirmed
        if (data.user && !data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          toast.error("Please verify your email before logging in. Check your inbox.");
          return;
        }

        toast.success("Welcome back!");
        if (data.user?.email === "ts7621085@gmail.com") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        const phoneDigits = formData.phone.replace(/\D/g, "");
        if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
          toast.error("Enter a valid 10-digit Indian mobile number");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.full_name, phone: formData.phone },
            emailRedirectTo: window.location.origin + "/dashboard",
          },
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            full_name: formData.full_name,
            phone: formData.phone,
            reward_points: 0,
          });
        }

        setSignupDone(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Show success screen after signup
  if (signupDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold">Verify your email</h2>
            <p className="text-muted-foreground">
              We sent a confirmation link to <span className="font-semibold text-foreground">{formData.email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the link to activate your account. Then come back and log in.
            </p>
            <Button
              className="w-full gradient-hero mt-2"
              onClick={() => { setSignupDone(false); setIsLogin(true); }}
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/20 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <img src="https://i.postimg.cc/W4z7VwzW/Gemini-Generated-Image-hczaojhczaojhcza-1.png" alt="TriNetra Logo" className="h-32 w-32" />
          </div>
          <h1 className="text-3xl font-bold mb-2">TriNetra</h1>
          <p className="text-muted-foreground text-center">
            {isLogin ? "Welcome back! Sign in to continue" : "Create your safety account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormData({ ...formData, phone: val });
                      setPhoneError(validatePhone(val));
                    }}
                    className={`pl-10 ${phoneError ? "border-destructive" : ""}`}
                    maxLength={10}
                    required
                  />
                </div>
                {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" className="w-full gradient-hero" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
