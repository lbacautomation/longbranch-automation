import { useState } from "react";
import longbranchLogo from "../../assets/longbranch-logo.png";
import "./Sidebar.css";

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  employeeRole: string;
  onCreateUser: () => void;
};

function Sidebar({
  activePage,
  onNavigate,
  onLogout,
  employeeRole,
  onCreateUser,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (page: string) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  const handleCreateUser = () => {
    onCreateUser();
    setMenuOpen(false);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand">
          <img
            src={longbranchLogo}
            alt="Longbranch Automation & Controls"
            className="brand-logo"
          />

          <p>Business Management</p>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() =>
            setMenuOpen((current) => !current)
          }
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      <div
        className={
          menuOpen
            ? "sidebar-menu sidebar-menu-open"
            : "sidebar-menu"
        }
      >
        <nav>
          <button
            type="button"
            className={
              activePage === "dashboard" ? "active" : ""
            }
            onClick={() => navigate("dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={
              activePage === "customers" ? "active" : ""
            }
            onClick={() => navigate("customers")}
          >
            Customers
          </button>

          <button
            type="button"
            className={
              activePage === "jobs" ? "active" : ""
            }
            onClick={() => navigate("jobs")}
          >
            Jobs
          </button>

          <button
            type="button"
            className={
              activePage === "estimates" ? "active" : ""
            }
            onClick={() => navigate("estimates")}
          >
            Estimates
          </button>

          <button
            type="button"
            className={
              activePage === "invoices" ? "active" : ""
            }
            onClick={() => navigate("invoices")}
          >
            Invoices
          </button>
        </nav>

        <div className="sidebar-actions">
          {employeeRole === "ADMIN" && (
            <>
              <button
                type="button"
                className={
                  activePage === "manage-users"
                    ? "create-user-button active"
                    : "create-user-button"
                }
                onClick={() => navigate("manage-users")}
              >
                Manage Users
              </button>

              <button
                type="button"
                className="create-user-button"
                onClick={handleCreateUser}
              >
                Create User
              </button>
            </>
          )}

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;