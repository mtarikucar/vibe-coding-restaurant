import { NavLink } from"react-router-dom";
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
 ComputerDesktopIcon,
} from"@heroicons/react/24/outline";
import useAuthStore from"../../store/authStore";
import type { UserRole } from"../../store/authStore";

// Define navigation categories with items
const navigationCategories = [
 {
  category:"Main",
  items: [
   {
    name:"Dashboard",
    href:"/app/dashboard",
    icon: HomeIcon,
    roles: ["admin","waiter", "kitchen", "cashier"],
   },
   {
    name:"Menu",
    href:"/app/menu",
    icon: QueueListIcon,
    roles: ["admin","waiter"],
   },
   {
    name:"Orders",
    href:"/app/orders",
    icon: ClipboardDocumentListIcon,
    roles: ["admin","waiter", "cashier"],
   },
   {
    name:"Kitchen",
    href:"/app/kitchen",
    icon: FireIcon,
    roles: ["admin","kitchen"],
   },
   {
    name:"Tables",
    href:"/app/tables",
    icon: TableCellsIcon,
    roles: ["admin","waiter"],
   },
  ],
 },
 {
  category:"Finance",
  items: [
   {
    name:"Payments",
    href:"/app/payments",
    icon: CurrencyDollarIcon,
    roles: ["admin","cashier"],
   },
   {
    name:"Invoices",
    href:"/app/invoices",
    icon: DocumentTextIcon,
    roles: ["admin","cashier"],
   },
   {
    name:"Subscription",
    href:"/app/subscription",
    icon: CreditCardIcon,
    roles: ["admin","waiter", "kitchen", "cashier"],
   },
  ],
 },
 {
  category:"Management",
  items: [
   {
    name:"Reports",
    href:"/app/reports",
    icon: ChartBarIcon,
    roles: ["admin"],
   },
   {
    name:"Stock",
    href:"/app/stock",
    icon: ArchiveBoxIcon,
    roles: ["admin"],
   },
   {
    name:"Users",
    href:"/app/users",
    icon: UserGroupIcon,
    roles: ["admin"],
   },
   {
    name:"Performance",
    href:"/app/performance",
    icon: ChartPieIcon,
    roles: ["admin"],
   },
   {
    name:"Campaigns",
    href:"/app/campaigns",
    icon: TagIcon,
    roles: ["admin","marketing", "manager"],
   },
   {
    name:"Notifications",
    href:"/app/settings/notifications",
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
  ],
 },
 {
  category:"System",
  items: [
   {
    name:"System Info",
    href:"/app/settings/system",
    icon: ComputerDesktopIcon,
    roles: ["admin","waiter", "kitchen", "cashier", "manager"],
   },
  ],
 },
];

// Flatten navigation items for backward compatibility
const navigationItems = navigationCategories.flatMap(
 (category) => category.items
);

const Sidebar = () => {
 const { user, logout } = useAuthStore();

 // Filter navigation items based on user role
 const filteredNavigation = navigationItems.filter(
  (item) => user && item.roles.includes(user.role as UserRole)
 );

 const handleLogout = () => {
  logout();
  window.location.href ="/";
 };

 // Filter navigation categories based on user role
 const filteredCategories = navigationCategories
  .map((category) => ({
   ...category,
   items: category.items.filter(
    (item) => user && item.roles.includes(user.role as UserRole)
   ),
  }))
  .filter((category) => category.items.length > 0);

 return (
  <div className="hidden md:flex md:flex-shrink-0">
   <div className="flex flex-col w-72">
    <div className="flex flex-col h-0 flex-1 bg-primary-600">
     <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-6">
       <h1 className="text-neutral-100 font-bold text-xl">
        Restaurant Manager
       </h1>
      </div>
      <nav className="mt-6 flex-1 px-4 space-y-6">
       {filteredCategories.map((category) => (
        <div key={category.category} className="space-y-1">
         <h3 className="px-3 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          {category.category}
         </h3>
         <div className="space-y-1">
          {category.items.map((item) => (
           <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
             `group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
              isActive
               ?"bg-primary-300 text-primary-900 shadow-md"
               :"text-neutral-100 hover:bg-primary-500 hover:text-white"
             }`
            }
           >
            <item.icon
             className={`mr-3 flex-shrink-0 h-5 w-5 ${({
              isActive,
             }) =>
              isActive
               ?"text-primary-900"
               :"text-neutral-300 group-hover:text-neutral-100"}`}
             aria-hidden="true"
            />
            {item.name}
           </NavLink>
          ))}
         </div>
        </div>
       ))}
      </nav>
     </div>
     <div className="flex-shrink-0 flex bg-primary-700 p-4 rounded-tr-xl">
      <div className="flex-shrink-0 w-full group block">
       <div className="flex items-center">
        <div>
         <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-800 font-bold">
          {user?.fullName.charAt(0) ||"U"}
         </div>
        </div>
        <div className="ml-3">
         <p className="text-sm font-medium text-neutral-100">
          {user?.fullName ||"User"}
         </p>
         <button
          onClick={handleLogout}
          className="text-xs font-medium text-neutral-300 hover:text-neutral-100 flex items-center transition-colors"
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
