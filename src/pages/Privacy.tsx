import React from 'react';
import { Link } from 'react-router-dom';

export const Privacy: React.FC = () => {
    return (
        <div className="min-h-screen bg-background-dark p-8 md:p-16 text-white">
            <div className="max-w-3xl mx-auto">
                <Link to="/register" className="text-neon-teal hover:underline mb-8 inline-block">&larr; Back to Registration</Link>
                <h1 className="text-4xl font-bold mb-6 text-grad-teal">Privacy Policy</h1>
                <div className="space-y-4 text-slate-300">
                    <p>Your privacy is important to us. It is Divvy's policy to respect your privacy regarding any information we may collect from you across our website, https://divvy-six-henna.vercel.app/, and other sites we own and operate.</p>
                    <h2 className="text-2xl font-bold text-white mt-6">1. Information We Collect</h2>
                    <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
                    <h2 className="text-2xl font-bold text-white mt-6">2. Data Retention</h2>
                    <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
                    <h2 className="text-2xl font-bold text-white mt-6">3. Sharing</h2>
                    <p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p>
                    <p className="mt-8 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};
