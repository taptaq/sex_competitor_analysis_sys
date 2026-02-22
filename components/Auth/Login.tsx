import React, { useState } from "react";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../authStore";

const Login: React.FC = () => {
  const { loginAsGuest } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  // Helper to construct dummy email
  const getEmail = (user: string) => `${user}@intimateintel.com`;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const email = getEmail(username);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      let errorMsg = error.message;
      if (errorMsg === "Invalid login credentials") {
        errorMsg = "用户名或密码错误";
      } else if (errorMsg.includes("Email not confirmed")) {
        errorMsg = "账号未激活 (Email not confirmed)";
      }
      setMessage({
        text: errorMsg || "Authentication failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">IntimateIntel</h2>
          <p className="text-indigo-100">竞品分析系统</p>
        </div>

        <div className="p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            管理员登录
          </h3>

          {message && (
            <div
              className={`mb-4 p-3 rounded text-sm ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名 (Username)
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入管理员用户名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码 (Password)
              </label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "登录中..." : "管理员登录"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或者</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={loginAsGuest}
                className="w-full bg-white text-indigo-600 border border-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span>👀</span> 访客进入 (只读模式)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
