import { useState } from "react";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import { UserService } from "../../service/UserService";
import { FacebookConfig, OAuthConfig } from "../../config/config";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const userService = new UserService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Vui lòng nhập username và mật khẩu");
      return;
    }
    setIsLoading(true);
    try {
      const response = await userService.login({ username, password });
      console.log(response)
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      toast.success("Đăng nhập thành công!");

      if (response.user?.role === "ADMIN") {
        navigate("/dashboard");
      } else if (response.user?.role === "STUDENT") {
        navigate("/");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Lỗi đăng nhập không xác định"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginGoogle = () => {
    const { clientId, authUri } = OAuthConfig;
    const state = btoa(Math.random().toString(36).substring(7)); // Random state
    localStorage.setItem("oauth_state", state);
    localStorage.setItem("redirectAfterLogin", window.location.pathname || "/"); // Lưu URL redirect sau login
    console.log("Generated state for Google:", state); // Debug log
    const redirectUri = "http://localhost:5173/oauth2/redirect"; // Exact match
    const targetUrl = `${authUri}?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&client_id=${clientId}&scope=openid%20email%20profile&state=${state}`;
    window.location.href = targetUrl;
  };
  const handleFacebookLogin = () => {
    const { appId } = FacebookConfig;
    const state = btoa(Math.random().toString(36).substring(7)); // Thêm state cho FB
    localStorage.setItem("oauth_state", state);
    const redirectUri = "http://localhost:5173/oauth2/redirect/facebook";
    const facebookLoginUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=public_profile,email&state=${state}`;
    window.location.href = facebookLoginUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Checkbox & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              Sign in
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLoginGoogle}
            className="flex items-center justify-center w-full p-3 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
          >
            <FaGoogle className="mr-2 text-red-500" /> Continue with Google
          </button>
          <button
            onClick={handleFacebookLogin}
            className="flex items-center justify-center w-full p-3 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
          >
            <FaFacebookF className="mr-2 text-blue-600" /> Continue with
            Facebook
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
