import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar/Sidebar";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Jobs from "./pages/Jobs";
import Estimates from "./pages/Estimates";
import Invoices from "./pages/Invoices";
import Login from "./pages/Login";
import CreateUser from "./pages/CreateUser";
import ManageUsers from "./pages/ManageUsers";
import ChangePassword from "./pages/ChangePassword";
import CompleteProfile from "./pages/CompleteProfile";

import "./App.css";

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  mustCompleteProfile: boolean;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [selectedJobId, setSelectedJobId] =
    useState<number | null>(null);

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          setEmployee(null);
          return;
        }

        const data = await response.json();

        setEmployee(data.employee);
      } catch (error) {
        console.error(
          "Unable to check authentication:",
          error
        );

        setEmployee(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    void checkAuth();
  }, []);

  const handleNavigate = (page: string) => {
    setSelectedJobId(null);
    setActivePage(page);
  };

  const handleOpenJob = (jobId: number) => {
    setSelectedJobId(jobId);
    setActivePage("jobs");
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error(
        "Unable to log out:",
        error
      );
    } finally {
      setEmployee(null);
      setActivePage("dashboard");
      setSelectedJobId(null);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard employeeName={employee?.name} />
        );

      case "customers":
        return (
          <Customers
            onNavigate={handleNavigate}
            onOpenJob={handleOpenJob}
          />
        );

      case "jobs":
        return (
          <Jobs initialJobId={selectedJobId} />
        );

      case "estimates":
        return <Estimates />;

      case "invoices":
        return <Invoices />;

      case "create-user":
        if (employee?.role !== "ADMIN") {
          return (
            <Dashboard employeeName={employee?.name} />
          );
        }

        return (
          <CreateUser
            onDone={() =>
              handleNavigate("manage-users")
            }
          />
        );

      case "manage-users":
        if (employee?.role !== "ADMIN") {
          return (
            <Dashboard employeeName={employee?.name} />
          );
        }

        return <ManageUsers />;

      default:
        return (
          <Dashboard employeeName={employee?.name} />
        );
    }
  };

  if (checkingAuth) {
    return (
      <div className="auth-loading">
        Loading...
      </div>
    );
  }

  if (!employee) {
    return (
      <Login
        onLogin={(loggedInEmployee) => {
          setEmployee(loggedInEmployee);
          setActivePage("dashboard");
        }}
      />
    );
  }

  /*
   * FIRST LOGIN STEP 1
   *
   * Temporary password must be changed
   * before anything else.
   */
  if (employee.mustChangePassword) {
    return (
      <ChangePassword
        employeeName={employee.name}
        onPasswordChanged={(updatedEmployee) => {
          setEmployee(updatedEmployee);
          setActivePage("dashboard");
        }}
        onLogout={handleLogout}
      />
    );
  }

  /*
   * FIRST LOGIN STEP 2
   *
   * Require profile completion after
   * the temporary password is changed.
   */
  if (employee.mustCompleteProfile) {
    return (
      <CompleteProfile
        employeeName={employee.name}
        onProfileCompleted={(updatedEmployee) => {
          setEmployee(updatedEmployee);
          setActivePage("dashboard");
        }}
        onLogout={handleLogout}
      />
    );
  }

  /*
   * NORMAL PORTAL
   *
   * Employees reach this point only after
   * password and profile requirements
   * are satisfied.
   */
  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        employeeRole={employee.role}
        onCreateUser={() =>
          handleNavigate("create-user")
        }
      />

      <main className="main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;