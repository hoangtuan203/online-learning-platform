import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify"; // Import nếu dùng toast

const GoogleCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const state = params.get("state");

    const storedState = localStorage.getItem("oauth_state");
    console.log("URL state:", state);
    console.log("Stored state:", storedState);

    if (state && storedState && state !== storedState) {
      console.error("State mismatch - possible CSRF");
      localStorage.removeItem("oauth_state");
      toast.error("Lỗi bảo mật - thử lại đăng nhập");
      navigate("/login", { replace: true });
      return;
    }
    localStorage.removeItem("oauth_state");

    if (code) {
      console.log("Google OAuth2 code received:", code.substring(0, 50) + "...");

      axios
        .post(
          "http://localhost:8888/api/user-service/users/oauth2/callback/google",
          { code },
          { headers: { "Content-Type": "application/json" } }
        )
        .then((response) => {
          console.log("API response:", response.data);
          const { userId, token, accessToken, email, name, picture } = response.data;

          // Lưu data
          localStorage.setItem("token", token);
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("userId", userId.toString());
          localStorage.setItem("username", name);
          localStorage.setItem("email", email);
          localStorage.setItem("avatar", picture);
          localStorage.setItem("loginSuccess", "true");
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: userId,
              name,
              email,
              picture,
              role: "STUDENT",
            })
          );

          // Thêm flag tạm thời để skip auth check ngay sau login
          localStorage.setItem("justLoggedIn", "true");

          // Debug localStorage sau lưu
          console.log("localStorage after save:", {
            token: localStorage.getItem("token")?.substring(0, 20) + "...",
            user: localStorage.getItem("user"),
            justLoggedIn: localStorage.getItem("justLoggedIn"),
          });

          toast.success("Đăng nhập Google thành công!");

          // Immediate navigate (bỏ timeout)
          console.log("Redirecting to / now");
          navigate("/", { replace: true });
        })
        .catch((error) => {
          console.error("Error during Google callback:", error.response?.data || error.message);
          toast.error("Lỗi đăng nhập Google: " + (error.response?.data || error.message));
          navigate("/login", { replace: true });
        });
    } else {
      console.error("No code found");
      toast.error("Không nhận được code từ Google");
      navigate("/login", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#666",
      }}
    >
      Đang xử lý đăng nhập Google...
    </div>
  );
};

export default GoogleCallback;