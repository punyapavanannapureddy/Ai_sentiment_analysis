import React from 'react';
import { Bell, User, Search as SearchIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authService.signOut();
        navigate('/login', { replace: true });
    };

    return (
        <header className="h-16 bg-bg-secondary/80 backdrop-blur-md border-b border-border-dark fixed top-0 lg:left-64 left-0 right-0 z-20 flex items-center justify-between px-6 shadow-sm">
            <h1 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary hidden sm:block">Consumer Sentiment Dashboard</h1>
            <div className="flex items-center space-x-6">
                <div className="relative hidden lg:block">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Global search..."
                        className="pl-10 pr-4 py-2 bg-bg-secondary border border-border-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 w-64 text-text-primary placeholder-text-secondary transition-all"
                    />
                </div>

                <div className="flex items-center space-x-4">
                    <button className="relative p-2 text-text-secondary hover:text-accent-primary transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-sentiment-negative rounded-full border-2 border-bg-primary"></span>
                    </button>

                    <div className="flex items-center space-x-3 pl-6 border-l border-border-dark">
                        <div
                            className="cursor-pointer text-right hidden sm:block"
                            onClick={() => navigate('/dashboard/profile')}
                        >
                            <p className="text-sm font-medium text-text-primary hover:text-accent-primary transition-colors">{user?.name || 'User'}</p>
                            <p className="text-xs text-text-secondary">{user?.plan || 'Free Trial'}</p>
                        </div>
                        <div
                            className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center text-accent-primary font-bold border border-accent-primary/20 cursor-pointer hover:ring-2 hover:ring-accent-primary/50 transition-all"
                            onClick={() => navigate('/dashboard/profile')}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                            ) : (
                                <User className="w-5 h-5" />
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-text-secondary hover:text-sentiment-negative transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
