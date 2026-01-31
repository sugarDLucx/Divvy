import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);

    // Close menu when clicking outside (User Menu)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out', error);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
                    onClick={onClose}
                ></div>
            )}

            <aside
                ref={sidebarRef}
                className={`fixed md:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col justify-between border-r border-white/5 bg-[#111318] dark:bg-[#0f1219] p-4 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="flex flex-col gap-8">
                    {/* Brand */}
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-neon-purple shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-white text-2xl">account_balance_wallet</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-white text-xl font-bold tracking-tight">Divvy</h1>
                                <p className="text-slate-400 text-xs font-medium">Finance Manager</p>
                            </div>
                        </div>
                        {/* Mobile Close Button */}
                        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2">
                        <NavLink
                            to="/"
                            end
                            onClick={() => onClose()} // Close on nav click (mobile)
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 border border-primary/20 text-white'
                                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`material-symbols-outlined transition-colors ${isActive ? 'text-primary' : 'group-hover:text-white'}`}>dashboard</span>
                                    <span className="text-sm font-medium">Dashboard</span>
                                </>
                            )}
                        </NavLink>

                        <NavLink
                            to="/transactions"
                            onClick={() => onClose()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 border border-primary/20 text-white'
                                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`material-symbols-outlined transition-colors ${isActive ? 'text-primary' : 'group-hover:text-neon-teal'}`}>receipt_long</span>
                                    <span className="text-sm font-medium">Transactions</span>
                                </>
                            )}
                        </NavLink>

                        <NavLink
                            to="/budget"
                            onClick={() => onClose()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 border border-primary/20 text-white'
                                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`material-symbols-outlined transition-colors ${isActive ? 'text-primary' : 'group-hover:text-neon-purple'}`}>pie_chart</span>
                                    <span className="text-sm font-medium">Budget</span>
                                </>
                            )}
                        </NavLink>

                        <NavLink
                            to="/goals"
                            onClick={() => onClose()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 border border-primary/20 text-white'
                                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`material-symbols-outlined transition-colors ${isActive ? 'text-primary' : 'group-hover:text-yellow-400'}`}>track_changes</span>
                                    <span className="text-sm font-medium">Goals</span>
                                </>
                            )}
                        </NavLink>
                    </nav>
                </div>

                {/* User Profile & Menu */}
                <div className="relative" ref={menuRef}>
                    {showUserMenu && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1c1f26] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50 animate-fade-in-up">
                            <NavLink
                                to="/settings"
                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                onClick={() => { setShowUserMenu(false); onClose(); }}
                            >
                                <span className="material-symbols-outlined text-[18px]">person</span>
                                Profile Settings
                            </NavLink>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Logout
                            </button>
                        </div>
                    )}

                    <div
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border-t border-white/5 pt-4 mt-auto"
                    >
                        <div
                            className="flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-600 rounded-full size-10 ring-2 ring-white/10 text-white font-bold"
                        >
                            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-white text-sm font-semibold truncate max-w-[120px]">{user?.displayName || 'User'}</p>
                            <p className="text-slate-400 text-xs truncate max-w-[120px]">{user?.email}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-500 ml-auto">
                            {showUserMenu ? 'expand_more' : 'more_vert'}
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
};

