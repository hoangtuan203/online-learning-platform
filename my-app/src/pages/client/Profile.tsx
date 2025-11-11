// Profile.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  UserCog,
  Calendar,
  Camera,
  Edit3,
  Save,
  X,
  Shield,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import ProfileRegisterCourse from "./ProfileRegisterCourse"; // Import the separate component for courses tab
import { UserService } from "../../service/UserService"; // Adjust path as needed

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserRequest {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

const userService = new UserService();

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"personal" | "courses">(
    "personal"
  );
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // For actual file upload
  const [imageError, setImageError] = useState(false); // FIXED: State để handle lỗi load ảnh
  const [imageLoading, setImageLoading] = useState(true); // FIXED: Loading state cho img
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      // Ensure updatedAt is always present
      const userWithUpdatedAt = {
        ...parsedUser,
        updatedAt: parsedUser.updatedAt || new Date().toISOString(),
      };
      setUser(userWithUpdatedAt);
      setEditedUser(userWithUpdatedAt);
      // Reset image states khi load user mới
      setImageError(false);
      setImageLoading(true);
      console.log("Loaded user avatarUrl:", userWithUpdatedAt.avatarUrl); // DEBUG: Check URL
    } else {
      // Redirect to login if no user
      navigate("/login");
    }
    setLoading(false);
  }, [navigate]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError(null);
    if (!isEditing) {
      if (user) {
        const userWithUpdatedAt = {
          ...user,
          updatedAt: user.updatedAt || new Date().toISOString(),
        };
        setEditedUser(userWithUpdatedAt);
      }
      setAvatarPreview(null);
      setAvatarFile(null);
      setImageError(false); // Reset lỗi ảnh khi edit
      setImageLoading(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [name]: value };
      // Update updatedAt on change
      updated.updatedAt = new Date().toISOString();
      return updated;
    });
    setError(null); // Clear error on change
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      // Temporarily update for preview
      setEditedUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, avatarUrl: previewUrl };
        updated.updatedAt = new Date().toISOString();
        return updated;
      });
      setImageError(false); // Reset lỗi khi chọn ảnh mới
      setImageLoading(false); // Không load cho preview
      setError(null);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    console.log("Image loaded successfully"); // DEBUG: Confirm load
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error("Image load failed for URL:", avatarPreview || user?.avatarUrl); // DEBUG: Log URL fail
  };

  const parseUser = (parsed: any): User => {
    return {
      id: Number(parsed.id), // Ensure id is number
      username: parsed.username,
      name: parsed.name,
      email: parsed.email,
      password: parsed.password,
      avatarUrl: parsed.avatarUrl, // Đảm bảo avatarUrl từ Google (URL public) được parse đúng
      role: parsed.role as "STUDENT" | "INSTRUCTOR" | "ADMIN",
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  };

  const handleSave = async () => {
    if (!editedUser || !user) return;

    setSaving(true);
    setError(null);

    try {
      const updateData: UpdateUserRequest = {
        name: editedUser.name,
        username: editedUser.username,
        email: editedUser.email,
      };

      // Nếu có file mới, upload và update avatarUrl
      if (avatarFile) {
        const newAvatarUrl = await userService.uploadAvatar(
          user.id,
          avatarFile
        );
        updateData.avatarUrl = newAvatarUrl; // Cập nhật URL mới vào request
      } else if (editedUser.avatarUrl && editedUser.avatarUrl !== user.avatarUrl) {
        // Nếu chỉ thay đổi URL (từ Google hoặc khác), update trực tiếp
        updateData.avatarUrl = editedUser.avatarUrl;
      }

      const updatedUserResponse = await userService.updateUser(
        user.id,
        updateData
      );

      const parsedUpdatedUser = parseUser(updatedUserResponse);

      setUser(parsedUpdatedUser);
      setEditedUser(parsedUpdatedUser);
      setIsEditing(false);
      setAvatarPreview(null);
      setAvatarFile(null);
      setImageError(false); // Reset lỗi sau save
      setImageLoading(true); // Reset loading cho ảnh mới

      // Clean up preview URL if any
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      console.log("User updated successfully");
    } catch (err) {
      console.error("Update error:", err);
      const message = err instanceof Error ? err.message : "Lỗi cập nhật";
      setError(message);
      alert(message); // Or use toast notification
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-50 text-red-800 border border-red-200";
      case "INSTRUCTOR":
        return "bg-blue-50 text-blue-800 border border-blue-200";
      default:
        return "bg-gray-50 text-gray-800 border border-gray-200"; // STUDENT
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitial = () =>
    user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // FIXED: Helper để lấy URL resized (CORS-friendly)
  const getAvatarSrc = () => {
    const baseUrl = avatarPreview || user?.avatarUrl;
    if (!baseUrl) return null;
    // Resize to s200-c for better CORS (test OK)
    return baseUrl.replace(/=s\d+-[cp]?/, '=s200-c');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        {/* Dynamic Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-gray-700 font-medium">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-gray-900">Profile</span>
          {activeTab === "courses" && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-900">
                Courses Registed
              </span>
            </>
          )}
        </nav>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Main Layout: Sidebar + Content */}
        <div className="flex-1 flex gap-8">
          <aside className="w-64 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-full">
            <nav className="flex-1">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "personal"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Thông tin cá nhân
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("courses")}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "courses"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Khóa học đã đăng ký
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 min-h-0 overflow-y-auto">
            {activeTab === "personal" ? (
              /* Personal Info Content */
              <>
                {/* Avatar Section */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex flex-col items-center md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                      <div className="relative">
                        <div
                          className={`h-24 w-24 rounded-full bg-gray-200 overflow-hidden relative ${
                            (avatarPreview || user.avatarUrl) && !imageError && !imageLoading
                              ? "bg-gray-200"
                              : "bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-semibold text-xl"
                          }`}
                        >
                          {/* FIXED: Img với loading + error handling */}
                          {(avatarPreview || user.avatarUrl) && !imageError ? (
                            <div className="relative h-full w-full">
                              {imageLoading && (
                                <div className="absolute inset-0 animate-pulse bg-gray-300 rounded-full flex items-center justify-center">
                                  <div className="h-8 w-8 bg-white/20 rounded-full"></div> {/* Skeleton */}
                                </div>
                              )}
                              <img
                                src={getAvatarSrc()} // FIXED: Use resized URL
                                alt="Avatar"
                                className={`h-full w-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                crossOrigin="anonymous" // FIXED: Opt-in CORS cho Google
                                referrerPolicy="no-referrer" // FIXED: Ẩn origin để tránh block
                              />
                            </div>
                          ) : null}
                          {/* FIXED: Fallback div absolute overlay, toggle bằng state */}
                          <div
                            className="absolute inset-0 flex items-center justify-center text-white font-semibold text-xl bg-gradient-to-br from-gray-500 to-gray-700 rounded-full"
                            style={{
                              display: (avatarPreview || user.avatarUrl) && !imageError ? 'none' : 'flex'
                            }}
                          >
                            {getInitial()}
                          </div>
                        </div>
                        {isEditing && (
                          <label className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md cursor-pointer border-2 border-gray-300 hover:border-gray-400 transition-colors">
                            <Camera className="w-4 h-4 text-gray-600" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      <div className="text-center md:text-left">
                        <h2 className="text-2xl font-semibold text-gray-900">
                          {user.name}
                        </h2>
                        <p className="text-lg text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit/Save Buttons */}
                <div className="px-6 pb-4 flex justify-end space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        className="px-4 py-2 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {/* Info Sections */}
                <div className="divide-y divide-gray-100">
                  {/* Personal Info */}
                  <div className="p-6">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-4">
                      <User className="w-5 h-5" />
                      Thông tin cá nhân
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                          Tên hiển thị
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={editedUser?.name || ""}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            {user.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                          Tên người dùng
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="username"
                            value={editedUser?.username || ""}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            @{user.username}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                          Email
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={editedUser?.email || ""}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex items-center gap-2">
                            <Mail className="w-5 h-5 text-gray-500" />
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="p-6">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-4">
                      <Shield className="w-5 h-5" />
                      Vai trò
                    </h3>
                    <div
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role === "STUDENT"
                        ? "Học viên"
                        : user.role === "INSTRUCTOR"
                        ? "Giảng viên"
                        : "Quản trị viên"}
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="p-6">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-4">
                      <UserCog className="w-5 h-5" />
                      Thông tin tài khoản
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600">Ngày tạo</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-600">Cập nhật lần cuối</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(user.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Render the separate component for courses tab */
              <ProfileRegisterCourse user={user} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;