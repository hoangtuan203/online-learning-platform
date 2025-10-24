import { BrowserRouter as Router, Route, Routes } from "react-router-dom";  // Alias BrowserRouter as Router to minimize changes
import "./App.css";
import { useEffect, useRef } from "react";
import publicRoutes from "./routes/route";  // Giả sử type: { path: string; component: React.ComponentType; layout?: React.ComponentType | null }[]
import DefaultLayout from "./components/layouts/DefauLayout/DefaultLayout";
import { ToastContainer } from "react-toastify";

function App() {
  const scriptLoadedRef = useRef(false);  // Ref để tránh load duplicate

  useEffect(() => {
    document.title = "Online Learning !";
  }, []);

  useEffect(() => {
    if (!window.cloudinary && !scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/latest/global/all.js';  // URL đúng, dùng latest
      script.type = 'text/javascript';
      script.async = true;
      script.crossOrigin = 'anonymous';  // Tùy chọn cho CORS nếu cần
      script.onload = () => {
        console.log('Cloudinary Upload Widget loaded successfully');
        // Optional: Set global cloud name nếu cần
        // window.cloudinary.setCloudName('your_cloud_name');
      };
      script.onerror = () => {
        console.error('Failed to load Cloudinary Upload Widget');
        scriptLoadedRef.current = false;  // Reset để retry nếu cần
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <ToastContainer />
        <Routes>
          {publicRoutes.map((route, index) => {
            const Page = route.component;
            const Layout =
              route.layout !== undefined ? route.layout : DefaultLayout;

            return (
              <Route
                key={index}
                path={route.path}
                element={
                  Layout === null ? (
                    <Page />
                  ) : (
                    <Layout>
                      <Page />
                    </Layout>
                  )
                }
              />
            );
          })}
        </Routes>
      </div>
    </Router>
  );
}

export default App;