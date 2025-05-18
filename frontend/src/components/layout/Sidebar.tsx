import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  QueueListIcon,
  FireIcon,
  TableCellsIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CreditCardIcon,
  TagIcon,
  Cog6ToothIcon,
  BellIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  DocumentDuplicateIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../../store/authStore";
import type { UserRole } from "../../store/authStore";

// Define navigation items with role-based access
const navigationItems = [
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: HomeIcon,
    roles: ["admin", "waiter", "kitchen", "cashier"],
  },
  {
    name: "Menu",
    href: "/app/menu",
    icon: QueueListIcon,
    roles: ["admin", "waiter"],
  },
  {
    name: "Orders",
    href: "/app/orders",
    icon: ClipboardDocumentListIcon,
    roles: ["admin", "waiter", "cashier"],
  },
  {
    name: "Kitchen",
    href: "/app/kitchen",
    icon: FireIcon,
    roles: ["admin", "kitchen"],
  },
  {
    name: "Tables",
    href: "/app/tables",
    icon: TableCellsIcon,
    roles: ["admin", "waiter"],
  },
  {
    name: "Payments",
    href: "/app/payments",
    icon: CurrencyDollarIcon,
    roles: ["admin", "cashier"],
  },
  {
    name: "Reports",
    href: "/app/reports",
    icon: ChartBarIcon,
    roles: ["admin"],
  },
  {
    name: "Stock",
    href: "/app/stock",
    icon: ArchiveBoxIcon,
    roles: ["admin"],
  },
  {
    name: "Users",
    href: "/app/users",
    icon: UserGroupIcon,
    roles: ["admin"],
  },
  {
    name: "Performance",
    href: "/app/performance",
    icon: ChartPieIcon,
    roles: ["admin"],
  },
  {
    name: "Campaigns",
    href: "/app/campaigns",
    icon: TagIcon,
    roles: ["admin", "marketing", "manager"],
  },
  {
    name: "Subscription",
    href: "/app/subscription",
    icon: CreditCardIcon,
    roles: ["admin", "waiter", "kitchen", "cashier"],
  },
  {
    name: "Notifications",
    href: "/app/settings/notifications",
    icon: BellIcon,
    roles: [
      "admin",
      "waiter",
      "kitchen",
      "cashier",
      "manager",
      "marketing",
      "inventory",
    ],
  },
];

const Sidebar = () => {
  const { user, logout } = useAuthStore();

  // Filter navigation items based on user role
  const filteredNavigation = navigationItems.filter(
    (item) => user && item.roles.includes(user.role as UserRole)
  );

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-white font-bold text-xl">
                Restaurant Manager
              </h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex bg-gray-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                    {user?.fullName.charAt(0) || "U"}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.fullName || "User"}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-medium text-gray-300 hover:text-gray-200 flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="h-3 w-3 mr-1" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
