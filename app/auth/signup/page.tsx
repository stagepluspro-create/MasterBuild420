"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, Lock, CheckCircle2, Crown, Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const passwordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = passwordStrength(password);
  const strengthLabel =
    strength === 0 ? "" : strength <= 2 ? "Weak" : strength <= 4 ? "Medium" : "Strong";
  const strengthColor =
    strength === 0
      ? "bg-gray-600"
      : strength <= 2
      ? "bg-red-500"
      : strength <= 4
      ? "bg-yellow-500"
      : "bg-green-500";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <Card className="glass-panel">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-violet-400" />
            </div>
            <CardTitle className="text-3xl font-bold gradient-text mb-2">Start Your Free Trial</CardTitle>
            <CardDescription className="text-base text-gray-300">
              Join thousands of production professionals worldwide
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="p-4 bg-violet-500/10 border border-violet-400/30 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Crown className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">7-Day Free Trial Included</h4>
                    <p className="text-xs text-gray-300">
                      Full access to all 35+ tools • No credit card required
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-white/5 border-white/10 focus:border-violet-400/50 focus:ring-violet-400/20"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10 pr-10 bg-white/5 border-white/10 focus:border-violet-400/50 focus:ring-violet-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Password strength:</span>
                      <span
                        className={`font-medium ${
                          strength <= 2
                            ? "text-red-400"
                            : strength <= 4
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {strengthLabel}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${(strength / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10 pr-10 bg-white/5 border-white/10 focus:border-violet-400/50 focus:ring-violet-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-1.5">
                <p className="text-xs font-medium text-gray-300">Password requirements:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-3 h-3 ${
                        password.length >= 8 ? "text-green-400" : "text-gray-600"
                      }`}
                    />
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-3 h-3 ${
                        /[A-Z]/.test(password) ? "text-green-400" : "text-gray-600"
                      }`}
                    />
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-3 h-3 ${
                        /[a-z]/.test(password) ? "text-green-400" : "text-gray-600"
                      }`}
                    />
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-3 h-3 ${
                        /[0-9]/.test(password) ? "text-green-400" : "text-gray-600"
                      }`}
                    />
                    One number
                  </li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Start Free Trial
                  </>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="text-cyan-400 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-gray-500">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-gray-400 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-gray-400 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-4">What you'll get with your free trial:</p>
          <div className="grid grid-cols-1 gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Access to all 35+ professional tools</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Cloud sync & preset management</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>PWA installable (works offline)</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>No credit card required for trial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
