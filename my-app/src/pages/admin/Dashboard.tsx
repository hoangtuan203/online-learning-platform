import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Line,
  Pie,
  Bar, // THÊM: Bar chart cho revenue (admin only)
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement, // THÊM: Cho Bar chart
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  BookOpen, // THÊM: Icons từ lucide-react (cài nếu chưa: npm i lucide-react)
  Users,
  Star,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Zap,
  Award,
  Users2,
  Search,
} from 'lucide-react';
import type { Course } from '@/types/Course';
import type { User } from '@/types/User';

// ĐĂNG KÝ CHART.JS COMPONENTS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// MOCK DATA (thay bằng API sau - thêm mock cho bar chart)
const mockCourses: Course[] = [
  {
    id: 1,
    title: 'React Fundamentals',
    description: 'Học cơ bản React từ đầu đến nâng cao.',
    price: 199000,
    thumbnailUrl: '/react.jpg',
    category: 'Frontend',
    instructor: { id: 1, username: 'johndoe', fullName: 'John Doe' },
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 2,
    title: 'TypeScript Advanced',
    description: 'Nâng cao kỹ năng TypeScript cho developer.',
    price: 299000,
    thumbnailUrl: '/ts.jpg',
    category: 'Backend',
    instructor: { id: 2, username: 'janesmith', fullName: 'Jane Smith' },
    createdAt: '2025-02-20T14:30:00Z',
  },
  {
    id: 3,
    title: 'Tailwind Mastery',
    description: 'Làm chủ Tailwind CSS cho UI hiện đại.',
    price: 149000,
    thumbnailUrl: '/tailwind.jpg',
    category: 'UI/UX',
    instructor: { id: 3, username: 'bobjohnson', fullName: 'Bob Johnson' },
    createdAt: '2025-03-10T09:15:00Z',
  },
  {
    id: 4,
    title: 'Node.js Basics',
    description: 'Xây dựng backend với Node.',
    price: 249000,
    thumbnailUrl: '/node.jpg',
    category: 'Backend',
    instructor: { id: 2, username: 'janesmith', fullName: 'Jane Smith' },
    createdAt: '2025-04-05T11:00:00Z',
  },
];

const mockUser: User = {
  id: '1',
  username: 'nguyenvana',
  name: 'Nguyễn Văn A',
  email: 'a@example.com',
  role: 'STUDENT',
  avatarUrl: '/avatar.jpg',
  createdAt: '2025-01-01T00:00:00Z',
};

const mockProgress = (courseId: number): { progress: number; duration: string } => {
  const progresses = { 1: { progress: 75, duration: '10h' }, 2: { progress: 40, duration: '8h' }, 3: { progress: 90, duration: '6h' }, 4: { progress: 20, duration: '12h' } };
  return progresses[courseId] || { progress: 0, duration: '0h' };
};

const mockStats = {
  totalCourses: 20,
  enrollments: 150,
  avgRating: 4.5,
  revenue: 50000000,
};

const mockActivities = [
  { id: 1, action: 'Đăng ký khóa học', item: 'React Fundamentals', time: '2 giờ trước', user: 'Nguyễn Văn A' },
  { id: 2, action: 'Hoàn thành bài học', item: 'TypeScript Advanced', time: '1 ngày trước', user: 'Jane Smith' },
  { id: 3, action: 'Đánh giá 5 sao', item: 'Tailwind Mastery', time: '3 ngày trước', user: 'Bob Johnson' },
];

// CHART DATA - NÂNG CẤP: Thêm animations, better colors
const lineChartData = {
  labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5'],
  datasets: [
    {
      label: 'Tiến độ học (%)',
      data: [20, 45, 70, 85, 95],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true, // THÊM: Fill dưới đường
    },
  ],
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false, // Để fill height
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'Tiến độ học tập theo tháng', font: { size: 16 } },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
  },
  animation: { duration: 2000, easing: 'easeInOutQuart' }, // THÊM: Smooth animation
};

const pieChartData = {
  labels: ['Frontend', 'Backend', 'UI/UX'],
  datasets: [
    {
      data: [40, 35, 25],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      borderWidth: 2,
      borderColor: '#ffffff',
    },
  ],
};

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
    title: { display: true, text: 'Phân bổ khóa học theo danh mục', font: { size: 16 } },
  },
  animation: { animateRotate: true, duration: 2000 },
};

// THÊM: Bar Chart cho Revenue (Admin only)
const barChartData = {
  labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4'],
  datasets: [
    {
      label: 'Doanh thu (₫)',
      data: [10000000, 15000000, 20000000, 50000000],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderRadius: 8,
    },
  ],
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: true, text: 'Doanh thu theo tháng', font: { size: 16 } },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
  },
  animation: { duration: 2000 },
};

const Dashboard: React.FC = () => {
  const user = mockUser; // Thay bằng hook auth thực tế (ví dụ: useAuth())
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800"> {/* THÊM: Gradient background */}
      {/* Sidebar - Giả sử bạn import từ nơi khác */}
      {/* <Sidebar /> */}

      {/* Nội dung chính */}
      <div className="flex-1 p-6 space-y-8 overflow-auto"> {/* Tăng space-y cho thoáng */}
      
        {/* Stats Overview - NÂNG CẤP: Icons, gradients, hover effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md hover:shadow-xl transition-shadow duration-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-sm font-medium">Tổng khóa học</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-600">+12%</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mockStats.totalCourses}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-xl transition-shadow duration-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-sm font-medium">Đăng ký</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-600">+5%</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{mockStats.enrollments}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-xl transition-shadow duration-300 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle className="text-sm font-medium">Đánh giá TB</CardTitle>
              </div>
              <Badge variant="secondary" className="text-yellow-600">4.5</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{mockStats.avgRating}</div>
            </CardContent>
          </Card>
          {isAdmin && (
            <Card className="border-0 shadow-md hover:shadow-xl transition-shadow duration-300 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
                </div>
                <Badge variant="destructive" className="text-green-600">+20%</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">₫{mockStats.revenue.toLocaleString()}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts - NÂNG CẤP: Thêm Bar cho admin, better sizing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* 3 cột nếu admin */}
          <Card className="border-0 shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Biểu đồ tiến độ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 p-0"> {/* Tăng height */}
              <Line data={lineChartData} options={lineChartOptions} />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Phân bổ danh mục</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 p-0">
              <Pie data={pieChartData} options={pieChartOptions} />
            </CardContent>
          </Card>
          {isAdmin && (
            <Card className="border-0 shadow-lg lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Biểu đồ doanh thu</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80 p-0">
                <Bar data={barChartData} options={barChartOptions} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Courses & Activities - NÂNG CẤP: Icons, better table styling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Khóa học gần đây</span>
              </CardTitle>
              <Button variant="ghost" size="sm">Xem tất cả</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                    <TableHead className="w-1/2">Khóa học</TableHead>
                    <TableHead>Giảng viên & Giá</TableHead>
                    <TableHead>Tiến độ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCourses.slice(0, 3).map((course) => {
                    const { progress, duration } = mockProgress(course.id);
                    return (
                      <TableRow key={course.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <span>{course.title}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{course.category}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{course.instructor.fullName}</div>
                          <div className="text-sm font-medium text-primary">₫{course.price.toLocaleString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{progress}%</span>
                            <Badge variant="secondary">{duration}</Badge>
                          </div>
                          <Progress value={progress} className="mt-2 w-full" indicatorColor="bg-primary" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Hoạt động gần đây</span>
              </CardTitle>
              <Button variant="ghost" size="sm">Xem tất cả</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                    <TableHead>Hành động</TableHead>
                    <TableHead>Chi tiết</TableHead>
                    <TableHead className="text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockActivities.slice(0, 5).map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="mr-2">{activity.action}</Badge>
                      </TableCell>
                      <TableCell>{activity.item}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{activity.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview & Quick Actions - NÂNG CẤP: Icons, full-width buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Tổng quan tiến độ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center space-x-1">
                    <Users2 className="h-4 w-4" />
                    <span>Hoàn thành</span>
                  </span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">12/20</Badge>
                </div>
                <Progress value={60} className="w-full" indicatorColor="bg-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>Đang học</span>
                  </span>
                  <Badge variant="outline">3</Badge>
                </div>
                <Progress value={30} className="w-full" indicatorColor="bg-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Hành động nhanh</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start space-x-2" variant="outline">
                <Search className="h-4 w-4" />
                <span>Tìm khóa học mới</span>
              </Button>
              <Button className="w-full justify-start space-x-2" variant="outline">
                <Award className="h-4 w-4" />
                <span>Xem chứng chỉ</span>
              </Button>
              <Button className="w-full justify-start space-x-2" variant="outline">
                <Users2 className="h-4 w-4" />
                <span>Tham gia cộng đồng</span>
              </Button>
              {isAdmin && (
                <Button className="w-full justify-start space-x-2" variant="default">
                  <Users className="h-4 w-4" />
                  <span>Quản lý người dùng</span>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;