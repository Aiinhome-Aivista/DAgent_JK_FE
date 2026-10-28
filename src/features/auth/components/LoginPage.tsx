import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Chrome,
  Apple,
  LayoutGrid
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardFooter } from '@/src/ui-kit';
import { authService } from '../../../services/auth.service';
import googleIcon from '@/src/assets/icons/google.svg';
import { useAuthContext } from '../../../context/AuthContext';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  isAdminLogin?: boolean;
}

export const LoginPage = ({ onBack, onLoginSuccess, isAdminLogin = false }: LoginPageProps) => {
  const { setUserId, setUserName, setRoleId, setRoleName } = useAuthContext();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response: any = isAdminLogin
        ? await authService.adminLogin(email, password)
        : await authService.login(email, password);

      if (response.status === true && response.statuscode === 200) {
        if (response.data && response.data.user_id) {
          setUserId(response.data.user_id);
          if (response.data.name) {
            setUserName(response.data.name);
          }
          if (response.data.role_id !== undefined) {
            setRoleId(response.data.role_id);
          }
          if (response.data.role_name !== undefined) {
            setRoleName(response.data.role_name);
          }
          if (response.data.active_workspace) {
            localStorage.setItem('DAgent_active_workspace', JSON.stringify(response.data.active_workspace));
            localStorage.setItem('DAgent_session_id', response.data.active_workspace.session_id);
          }
        }
        onLoginSuccess();
      } else {
        setErrorMsg(response.msg || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      setErrorMsg(error.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    // Simulate social login
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1500);
  };

  return (
    <div className="theme-landing min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-accent/10 selection:text-accent relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-accent transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to home
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >

        <Card className="border-slate-200 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pt-10 pb-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-accent/20">
              D
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isAdminLogin ? 'Admin Login' : 'Welcome back'}</h1>
            <p className="text-slate-500 text-sm">Enter your details to access your account</p>
          </CardHeader>

          <CardContent className="px-8 space-y-6">
            {/* <div className="space-y-4">
              <Button 
                type="button"
                variant="outline" 
                className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-3 font-medium transition-all text-slate-900"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <img src={googleIcon} alt="Google" className="w-5 h-5" />
                Continue with Google
              </Button>
              
            </div> */}
            {/* 
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
              </div>
            </div> */}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</label>
                  <button type="button" className="text-xs font-bold text-accent hover:text-accent-hover">Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none transition-all text-sm text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-center mt-2">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold shadow-lg shadow-accent/20 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  isAdminLogin ? 'Sign in as Admin' : 'Sign in to DAgent'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pb-10 pt-6 text-center">
            <p className="text-sm text-slate-500 mx-auto">
              Don't have an account? <button className="font-bold text-accent hover:text-accent-hover">Create an account</button>
            </p>
          </CardFooter>
        </Card>
        {/* 
        <p className="mt-8 text-center text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          By continuing, you agree to DAgent's <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
        </p> */}
      </motion.div>
    </div>
  );
};
