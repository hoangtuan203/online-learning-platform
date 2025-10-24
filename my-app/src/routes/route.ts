import AdminLayout from "../components/layouts/AdminLayout/AdminLayout";
import DefaultLayout from "../components/layouts/DefauLayout/DefaultLayout";
import AddContentPage from "../pages/admin/AddContentPage";
import CoursePage from "../pages/admin/CoursePage";
import Dashboard from "../pages/admin/Dashboard";
import UserPage from "../pages/admin/UserPage";
import CourseDetail from "../pages/client/DetailCourse";
import Home from "../pages/client/Home";
import Login from "../pages/client/Login";
import Register from "../pages/client/Register";

const publicRoutes = [
  { path: "/", component: Home, layout: DefaultLayout},
  { path: "/dashboard", component: Dashboard, layout: AdminLayout},
  { path: "/login", component: Login, layout: null},
  { path: "/register", component: Register, layout: null},
  { path: "/list-users", component: UserPage, layout: AdminLayout},
  { path: "/list-courses", component: CoursePage, layout: AdminLayout},
  { path: "/add-content-course/:courseId", component: AddContentPage, layout: AdminLayout},
  { path: "/course/1/detail-course", component: CourseDetail, layout: DefaultLayout},

];

export default publicRoutes;