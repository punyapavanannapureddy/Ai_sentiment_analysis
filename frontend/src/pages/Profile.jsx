import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { User, Mail, Calendar, Shield, Activity } from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();
    const [recentActivity, setRecentActivity] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('chat_history')
                .select('query, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (data && !error) {
                setRecentActivity(data);
            }
            setLoadingActivity(false);
        };
        fetchActivity();
    }, [user]);

    // Format date if available
    const joinDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString()
        : 'Unknown';

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary">
                    User Profile
                </h1>
            </div>

            <div className="bg-bg-secondary rounded-xl shadow-sm border border-border-dark overflow-hidden transition-all duration-300 hover:shadow-md">
                {/* Header section with gradient background */}
                <div className="h-32 bg-accent-primary opacity-80"></div>

                <div className="px-8 pb-8 flex flex-col sm:flex-row relative">
                    {/* Avatar */}
                    <div className="-mt-16 mb-4 sm:mb-0 sm:mr-8 flex-shrink-0 relative">
                        <div className="w-32 h-32 bg-bg-secondary rounded-full p-2 border-4 border-border-dark shadow-md flex items-center justify-center">
                            <div className="w-full h-full bg-accent-secondary/10 rounded-full flex items-center justify-center text-accent-secondary text-5xl font-bold">
                                {user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-16 h-16" />}
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mt-2 flex-grow">
                        <h2 className="text-2xl font-bold text-text-primary">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</h2>
                        <p className="text-text-secondary flex items-center mt-1">
                            <Mail className="w-4 h-4 mr-2" />
                            {user?.email || 'No email provided'}
                        </p>
                        <div className="flex items-center mt-4 space-x-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-accent-primary/20 text-accent-primary uppercase tracking-wider">
                                <Shield className="w-3.5 h-3.5 mr-1" />
                                {user?.user_metadata?.plan || 'Free Plan'}
                            </span>
                            <span className="inline-flex items-center text-xs font-bold text-text-secondary uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                Joined {joinDate}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Details */}
                <div className="bg-bg-secondary p-6 rounded-xl shadow-sm border border-border-dark transition-all duration-300 hover:shadow-md">
                    <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center">
                        <User className="w-5 h-5 mr-2 text-accent-primary" />
                        Account Details
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Email Address</label>
                            <div className="w-full px-4 py-3 bg-bg-primary border border-border-dark rounded-xl text-text-primary font-medium">
                                {user?.email || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">User ID</label>
                            <div className="w-full px-4 py-3 bg-bg-primary border border-border-dark rounded-xl text-text-secondary font-mono text-sm break-all">
                                {user?.id || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-bg-secondary p-6 rounded-xl shadow-sm border border-border-dark flex flex-col transition-all duration-300 hover:shadow-md">
                    <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-accent-secondary" />
                        Recent Activity
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {loadingActivity ? (
                            <div className="flex items-center justify-center h-full py-8">
                                <Activity className="w-6 h-6 text-accent-secondary animate-pulse" />
                            </div>
                        ) : recentActivity.length > 0 ? (
                            <ul className="space-y-4">
                                {recentActivity.map((activity, idx) => (
                                    <li key={idx} className="flex items-start space-x-4 text-sm animate-in fade-in slide-in-from-bottom-2 p-3 rounded-xl hover:bg-bg-primary transition-colors border border-transparent hover:border-border-dark cursor-default group">
                                        <div className="mt-0.5 bg-accent-secondary/10 p-2 rounded-lg text-accent-secondary flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-text-primary font-medium line-clamp-2 leading-relaxed">{activity.query}</p>
                                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1 block">
                                                {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-text-secondary flex-col py-8 h-full opacity-60">
                                <Activity className="w-12 h-12 text-border-dark mb-4" />
                                <p className="text-sm font-medium">Activity history will appear here.</p>
                                <p className="text-xs mt-1">No AI queries logged yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
