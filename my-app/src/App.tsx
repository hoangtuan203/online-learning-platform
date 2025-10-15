import { BrowserRouter as Router, Route, Routes } from "react-router-dom";  // Alias BrowserRouter as Router to minimize changes
import "./App.css";
import { useEffect } from "react";
import publicRoutes from "./routes/route";
import DefaultLayout from "./components/layouts/DefauLayout/DefaultLayout";
import { ToastContainer } from "react-toastify";

function App() {
  useEffect(() => {
    document.title = "Online Learning !";
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