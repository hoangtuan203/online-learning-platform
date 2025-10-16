import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { UserService } from "../../service/UserService";
import type { User } from "../../types/User";
import type { UserPage } from "../../types/User";

const UserAvatar: React.FC<{ avatarUrl?: string; }> = ({
  avatarUrl,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-12 h-12 mx-auto">
      {imageError || !avatarUrl ? (
        <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">No img</span>
        </div>
      ) : (
        <img
          src={avatarUrl}
          className="w-full h-full object-cover rounded-md"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      )}
    </div>
  );
};

const UserPage: React.FC = () => {
  const [userPage, setUserPage] = useState<UserPage | null>(null);
  const [searchName, setSearchName] = useState("");
  const [searchRole, setSearchRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "username" | "email" | "createdAt" | null
  >(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = async (
    page: number = 0,
    size: number = pageSize,
    name?: string,
    role?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const userService = new UserService();
      const response =
        name || role
          ? await userService.searchUsers(name, role, page, size)
          : await userService.getAllUsers(page, size);
      setUserPage(response);
    } catch (error) {
      console.error("Lỗi tải danh sách người dùng:", error);
      setErrorMessage(
        "Không thể tải danh sách người dùng. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearch = () => {
    setIsRefreshing(true);
    fetchUsers(0, pageSize, searchName, searchRole ?? undefined);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers(currentPage, pageSize, searchName, searchRole ?? undefined);
  };

  useEffect(() => {
    fetchUsers(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const sortUsers = (users: User[]) => {
    if (!sortBy) return users;

    return [...users].sort((a, b) => {
      let aValue: any, bValue: any;

      if (sortBy === "username") {
        aValue = a.username?.toLowerCase() || "";
        bValue = b.username?.toLowerCase() || "";
      } else if (sortBy === "email") {
        aValue = a.email?.toLowerCase() || "";
        bValue = b.email?.toLowerCase() || "";
      } else if (sortBy === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredUsers = userPage?.user
    ? userPage.user.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchName.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchName.toLowerCase()) ||
          user.name?.toLowerCase().includes(searchName.toLowerCase())
      )
    : [];

  const sortedUsers = sortUsers(filteredUsers);
  const totalElements = userPage?.totalElements || 0;
  const totalPages = userPage?.totalPages || 0;

  const toggleSort = (field: "username" | "email" | "createdAt") => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder("asc");
    } else {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  };

  const clearFilters = () => {
    setSearchName("");
    setSearchRole(null);
    setSortBy(null);
    setSortOrder("asc");
    fetchUsers(0, pageSize); // Reset to all users
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
      fetchUsers(page, pageSize, searchName, searchRole ?? undefined);
    }
  };

  const goToFirst = () => {
    setCurrentPage(0);
    fetchUsers(0, pageSize, searchName, searchRole ?? undefined);
  };
  const goToLast = () => {
    setCurrentPage(totalPages - 1);
    fetchUsers(totalPages - 1, pageSize, searchName, searchRole ?? undefined);
  };
  const goToPrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
    fetchUsers(currentPage - 1, pageSize, searchName, searchRole ?? undefined);
  };
  const goToNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
    fetchUsers(currentPage + 1, pageSize, searchName, searchRole ?? undefined);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const delta = 2;

    if (totalPages > 1) {
      pages.push(0);
    }

    for (
      let i = Math.max(0, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (totalPages > 1 && !pages.includes(totalPages - 1)) {
      pages.push(totalPages - 1);
    }

    return [...new Set(pages)].sort((a, b) => a - b);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {sortedUsers.length} / {totalElements} người dùng
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={searchRole || ""}
            onChange={(e) => setSearchRole(e.target.value || null)}
            className="px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          >
            <option value="">All Role</option>
            <option value="STUDENT">STUDENT</option>
            <option value="INSTRUCTOR">INSTRUCTOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button
            onClick={handleSearch}
            className="inline-flex items-center border px-4 py-2 bg-gray-50 text-black text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none  transition-colors"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </button>
          <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => toggleSort("username")}
              className={`flex items-center px-2 py-1 rounded-md transition-colors text-xs ${
                sortBy === "username"
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              title="Sắp xếp theo tên đăng nhập"
            >
              {sortBy === "username" ? (
                sortOrder === "asc" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )
              ) : (
                <span>👤</span>
              )}
            </button>
            <button
              onClick={() => toggleSort("createdAt")}
              className={`flex items-center px-2 py-1 rounded-md transition-colors text-xs ${
                sortBy === "createdAt"
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              title="Sắp xếp theo ngày tạo"
            >
              {sortBy === "createdAt" ? (
                sortOrder === "asc" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )
              ) : (
                <span>📅</span>
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center p-1 rounded-md transition-colors ${
                isRefreshing
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
              }`}
              title="Làm mới dữ liệu"
            >
              <RefreshCw
                className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
            {(searchName || searchRole) && (
              <button
                onClick={clearFilters}
                className="flex items-center p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Xóa bộ lọc"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <Link
            to="/add-user"
            className="inline-flex items-center px-4 py-2 bg-green-400 text-white text-sm font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-8 mr-" />
            Add
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

      {sortBy && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700">
            Đã sắp xếp theo{" "}
            {sortBy === "username"
              ? "Tên đăng nhập"
              : sortBy === "email"
              ? "Email"
              : "Ngày tạo"}{" "}
            ({sortOrder === "asc" ? "Tăng dần" : "Giảm dần"})
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  STT
                </th>
              
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fullname
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Functions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.length > 0 ? (
                sortedUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium">
                      {index + 1 + currentPage * pageSize}
                    </td>
                   

                    <td className="px-6 py-4">
                      <UserAvatar
                        avatarUrl={user.avatarUrl}
                      />
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={user.username}>
                        {user.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={user.name}>
                        {user.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md truncate" title={user.email}>
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : user.role === "INSTRUCTOR"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role || "USER"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => console.log(`View user ${user.id}`)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors ml-2"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => console.log(`Delete user ${user.id}`)}
                        className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors"
                        title="Xóa người dùng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {searchName || searchRole
                      ? "Không tìm thấy người dùng phù hợp."
                      : "Chưa có người dùng nào."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 overflow-hidden">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                Display {Math.min(currentPage * pageSize + 1, totalElements)} -{" "}
                {Math.min((currentPage + 1) * pageSize, totalElements)} in{" "}
                {totalElements} users
              </div>
              <div className="flex items-center justify-center sm:justify-end space-x-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(0);
                    fetchUsers(
                      0,
                      Number(e.target.value),
                      searchName,
                      searchRole ?? undefined
                    );
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isRefreshing}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span className="text-sm text-gray-500">Users</span>
                <button
                  onClick={goToFirst}
                  disabled={currentPage === 0 || isRefreshing}
                  className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <button
                  onClick={goToPrev}
                  disabled={currentPage === 0 || isRefreshing}
                  className="w-9 h-9 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  ‹
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    disabled={isRefreshing}
                    className={`w-9 h-9 rounded-md border transition-colors text-sm font-medium ${
                      currentPage === page
                        ? "bg-blue-300 text-white border-blue-400 shadow-sm"
                        : "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {page + 1}
                  </button>
                ))}
                <button
                  onClick={goToNext}
                  disabled={currentPage === totalPages - 1 || isRefreshing}
                  className="w-9 h-9 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  ›
                </button>
                <button
                  onClick={goToLast}
                  disabled={currentPage === totalPages - 1 || isRefreshing}
                  className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
                <span className="text-sm text-gray-700 hidden sm:inline px-3">
                  Page {currentPage + 1} / {totalPages}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
