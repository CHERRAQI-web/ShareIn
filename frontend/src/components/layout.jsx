import {
  Search,
  UserPlus,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Edit,
  Trash2,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, Avatar, Text, Group, UnstyledButton, Tooltip } from "@mantine/core";
import {
  IconChevronDown,
  IconLogout,
  IconDashboard,
  IconClock,
  IconFileText,
  IconBook,
  IconUser,
} from "@tabler/icons-react";
import axios from "axios";
import { isAuthenticated, logout } from "../utils/auth.jsx";
import { useDispatch } from "react-redux";
import { setAuthenticated, logout as reduxLogout } from "../store/authSlice";
import { Link } from "react-router-dom";
const PRIMARY_COLOR_BG = "bg-gray-900";
const MAIN_PAGE_BG = "bg-gray-800";
const ACTIVE_BG_COLOR = "bg-cyan-600";
const ACTIVE_TEXT_COLOR = "text-white";
const INACTIVE_TEXT_COLOR = "text-gray-300";
import Logo from '../images/logo.png'
const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    username: "",
    email: "",
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Détecter la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const SidebarLink = ({ to, icon: Icon, label, badge, onClick }) => {
    const baseClasses =
      "flex p-3 items-center space-x-4 h-full relative w-full transition-all duration-300";

    return (
      <li className="list-none w-full px-3 transition-all duration-300">
        <NavLink
          to={to}
          onClick={onClick}
          className={({ isActive }) => {
            let linkClasses = "rounded-xl ";
            if (isActive) {
              linkClasses += `${ACTIVE_BG_COLOR} ${ACTIVE_TEXT_COLOR} font-bold shadow-lg shadow-cyan-600/30`;
            } else {
              linkClasses += `bg-transparent ${INACTIVE_TEXT_COLOR} hover:bg-gray-800/80 font-medium`;
            }
            return `${baseClasses} ${linkClasses}`;
          }}
          end={to === "/"}
        >
          <Icon size={20} className={`flex-shrink-0 ${INACTIVE_TEXT_COLOR}`} />
          <span className="text-sm">{label}</span>
          {badge !== undefined && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300">
              {badge}
            </span>
          )}
        </NavLink>
      </li>
    );
  };

  // Composant pour la barre d'icônes flottante
  const FloatingIconBar = () => {
    const links = [
      { to: "/", icon: IconDashboard, label: "Tableau de bord" },
      { to: "/clients", icon: IconUser, label: "Gestion des Clients" },
      { to: "/documents", icon: IconFileText, label: "Revue des Documents" },
    ];

    return (
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-2 z-40 border border-gray-700">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.to}>
              <Tooltip label={link.label} position="right" withArrow>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-center p-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-cyan-500 text-gray-900"
                        : "text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  <link.icon size={20} />
                </NavLink>
              </Tooltip>
            </li>
          ))}
          <div className="border-t border-gray-700 pt-2 mt-2">
            <Tooltip label="Déconnexion" position="right" withArrow>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full p-3 rounded-xl text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-300"
              >
                <IconLogout size={20} />
              </button>
            </Tooltip>
          </div>
        </ul>
      </div>
    );
  };



  useEffect(() => {
    if (!token) {
      console.log("Aucun token trouvé, redirection vers /login");
      navigate("/login");
    }
  }, [token, navigate]);

  if (!token) {
    return null;
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await isAuthenticated();
        console.log(data);
        if (data) {
          setUser(data);
          setStats({
            username: data.username,
            email: data.email,
          });
          dispatch(setAuthenticated(true));
        } else {
          logout();
          dispatch(setAuthenticated(false));
          navigate("/login");
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de l'authentification:",
          error
        );
        logout();
        dispatch(setAuthenticated(false));
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    window.addEventListener("userLoggedIn", fetchUser);
    return () => window.removeEventListener("userLoggedIn", fetchUser);
  }, [navigate, dispatch]);

  const handleLogout = () => {
    logout();
    dispatch(reduxLogout());
    navigate("/login");
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${MAIN_PAGE_BG}`}>
      {/* Overlay pour mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar complète (Desktop) ou Drawer (Mobile) */}
      <div
        className={`${PRIMARY_COLOR_BG} text-white space-y-4 pt-8 transition-all duration-300 shadow-xl shadow-black/50 fixed md:sticky top-0 h-screen overflow-y-auto z-50 ${
          isMobile ? (isSidebarOpen ? "left-0 w-64" : "-left-64 w-64") : (isSidebarOpen ? "w-64" : "w-0")
        } flex flex-col justify-between`}
      >
        <div className={`${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
          <ul className="space-y-2">
            <li className="flex justify-between items-center pb-8 pl-4 pr-4 border-b border-gray-800 mx-3">
              {isSidebarOpen && (
                <h3 className="text-xl font-extrabold text-cyan-500">
                  <img src={Logo}/>
                </h3>
              )}
            
            </li>
            <SidebarLink 
              to="/" 
              icon={IconDashboard} 
              label="Tableau de bord" 
              onClick={handleLinkClick}
            />
            <SidebarLink
              to="/clients"
              icon={IconUser}
              label="Gestion des Clients"
              onClick={handleLinkClick}
            />
            <SidebarLink
              to="/documents"
              icon={IconFileText}
              label="Revue des Documents"
              onClick={handleLinkClick}
            />
          </ul>
        </div>
        {isSidebarOpen && (
          <button className="flex justify-between m-10 pb-6" onClick={handleLogout}>
            <p className="">Déconnexion</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-log-out-icon lucide-log-out text-cyan-500"
            >
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            </svg>
          </button>
        )}
      </div>

      {/* Barre d'icônes flottante (Desktop quand la sidebar est fermée) */}
      {!isMobile && !isSidebarOpen && <FloatingIconBar />}

      <div className={`flex-1 flex flex-col transition-all duration-300 ${!isMobile && !isSidebarOpen ? "ml-20" : ""}`}>
        <header className="bg-gray-900 text-white p-4 shadow-lg flex items-center justify-between sticky top-0 z-10 border-b border-gray-700">
          <div className="flex items-center">
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="mr-4 p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <MenuIcon size={24} className="text-cyan-500" />
              </button>
            )}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="mr-4"
              >
                <MenuIcon size={24} className="text-cyan-500" />
              </button>
            )}
            <h1 className="text-xl font-semibold truncate">Bonjour {stats.username}</h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to='/form_client'>
             <button className="hidden sm:flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-black shadow-xl shadow-cyan-500/40 transition-transform duration-300 hover:bg-cyan-400 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-cyan-300">
              <UserPlus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Ajouter Client</span>
            </button>
            
            </Link>
           
            <button className="sm:hidden flex items-center justify-center rounded-xl bg-cyan-500 p-2 text-black shadow-xl shadow-cyan-500/40 transition-transform duration-300 hover:bg-cyan-400 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-cyan-300">
              <UserPlus className="w-5 h-5" />
            </button>
            
            <Menu position="bottom-end" withArrow>
              <Menu.Target>
                <UnstyledButton className="flex items-center space-x-2 sm:space-x-4 hover:bg-gray-700 rounded-lg transition-all duration-300 p-1">
                  <Group className="flex items-center space-x-2 sm:space-x-4">
                    <Avatar
                      radius="xl"
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500 font-bold mr-3 text-sm"
                    >
                      {stats.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="hidden sm:block flex-1">
                      <Text size="xs" style={{ color: "white" }}>
                        {stats.email}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
            </Menu>
          </div>
        </header>
        
        <main className="p-4 sm:p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;