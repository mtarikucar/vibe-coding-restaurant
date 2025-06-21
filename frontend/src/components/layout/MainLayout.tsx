import { Outlet } from"react-router-dom";
import Sidebar from"./Sidebar";
import Header from"./Header";

const MainLayout = () => {
 return (
  <div className="flex h-screen bg-neutral-100">
   <Sidebar />
   <div className="flex-1 flex flex-col overflow-hidden">
    <Header />
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-100 p-6">
     <div className="container mx-auto max-w-7xl">
      <Outlet />
     </div>
    </main>
   </div>
  </div>
 );
};

export default MainLayout;
