import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { WalletCards, Receipt, LayoutDashboard } from "lucide-react";
import { useState } from 'react';

const menuItems = [
  { icon: WalletCards, label: "Salary", path: "/salary" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-20 flex md:hidden items-center justify-between border-b bg-background p-4">
        <h2 className="text-lg font-semibold tracking-tight">Finance Tracker</h2>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 rounded-md"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-10 w-64 overflow-y-auto border-r bg-purple-800 transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

        <div className="flex h-16 items-center border-b px-6 md:flex">
          <h1 className="text-lg font-semibold text-white">Finance Tracker</h1>
        </div>
        <nav className="p-6 space-y-2" onClick={() => setIsOpen(false)}>
          {menuItems.map(({ icon: Icon, label, path }) => (
            <Link key={path} href={path}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-purple-600 text-white", // Added text-white
                  location === path && "bg-purple-800 text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>
      {/* Mobile sidebar overlay when open */}
      {isOpen && (
        <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setIsOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-purple-800 p-6 text-white" onClick={e => e.stopPropagation()}> {/* Added text-white */}
            <div className="flex flex-col space-y-2">
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Finance Tracker</h2>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white", //Added text-white
                      isActive ? "bg-purple-600" : "hover:bg-muted"



                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}