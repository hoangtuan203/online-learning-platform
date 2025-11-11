import AdminLayout from "../components/layouts/AdminLayout/AdminLayout";
import DefaultLayout from "../components/layouts/DefauLayout/DefaultLayout";
import AddContentPage from "../pages/admin/AddContentPage";
import CoursePage from "../pages/admin/CoursePage";
import Dashboard from "../pages/admin/Dashboard";
import UserPage from "../pages/admin/UserPage";
import GoogleCallback from "../pages/client/auth/GoogleCallback";
import CourseDetail from "../pages/client/DetailCourse";
import Home from "../pages/client/Home";
import LearningPage from "../pages/client/LearningPage";
import ListCourses from "../pages/client/ListCourses";
import Login from "../pages/client/Login";
import Profile from "../pages/client/Profile";
import Register from "../pages/client/Register";

const publicRoutes = [
  { path: "/", component: Home, layout: DefaultLayout},
  { path: "/dashboard", component: Dashboard, layout: AdminLayout},
  { path: "/login", component: Login, layout: null},
  { path: "/register", component: Register, layout: null},
  { path: "/list-users", component: UserPage, layout: AdminLayout},
  { path: "/list-courses", component: CoursePage, layout: AdminLayout},
  { path: "/add-content-course/:courseId", component: AddContentPage, layout: AdminLayout},
  { path: "/courses/detail/:id", component: CourseDetail, layout: DefaultLayout},
  { path: "/courses", component: ListCourses, layout: DefaultLayout},
  { path: "/course/learning/:id", component: LearningPage, layout: DefaultLayout},
  { path: "/profile", component: Profile, layout: DefaultLayout},
  { path: "/oauth2/redirect", component: GoogleCallback, layout: null },
  // { path: "/oauth2/redirect/facebook", component: FacebookCallback, layout: null },
];

export default publicRoutes;