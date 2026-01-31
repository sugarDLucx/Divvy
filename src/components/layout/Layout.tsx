import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#0b0e14] text-slate-900 dark:text-white font-display selection:bg-neon-teal selection:text-black">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#111318]">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-neon-purple shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-lg">account_balance_wallet</span>
                        </div>
                        <h1 className="text-white font-bold tracking-tight">Divvy</h1>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto w-full h-full relative scroll-smooth">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
