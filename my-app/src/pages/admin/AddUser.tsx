import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserService } from "../../service/UserService";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const userService = new UserService();

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userService.addUser(
        formData.username,
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
      toast.success("User added successfully!");
      setTimeout(() => navigate("/list-users"), 1500);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to add user. Please check again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 p-6">

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 border border-gray-100"
      >
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          Add New User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Username", name: "username", type: "text", placeholder: "e.g. tuanne123" },
            { label: "Full Name", name: "name", type: "text", placeholder: "e.g. Nguyen Hoang Tuan" },
            { label: "Email", name: "email", type: "email", placeholder: "e.g. example@gmail.com" },
            { label: "Password", name: "password", type: "password", placeholder: "••••••••" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={(formData as any)[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          ))}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="ADMIN">Admin</option>
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-semibold rounded-lg transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            }`}
          >
            {loading ? "Adding..." : "Add User"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddUser;
