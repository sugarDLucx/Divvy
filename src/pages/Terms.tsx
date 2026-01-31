import React from 'react';
import { Link } from 'react-router-dom';

export const Terms: React.FC = () => {
    return (
        <div className="min-h-screen bg-background-dark p-8 md:p-16 text-white">
            <div className="max-w-3xl mx-auto">
                <Link to="/register" className="text-neon-teal hover:underline mb-8 inline-block">&larr; Back to Registration</Link>
                <h1 className="text-4xl font-bold mb-6 text-grad-teal">Terms of Service</h1>
                <div className="space-y-4 text-slate-300">
                    <p>Welcome to Divvy. By using our services, you agree to these terms.</p>
                    <h2 className="text-2xl font-bold text-white mt-6">1. Acceptance of Terms</h2>
                    <p>By accessing and using Divvy, you accept and agree to be bound by the terms and provision of this agreement.</p>
                    <h2 className="text-2xl font-bold text-white mt-6">2. Use License</h2>
                    <p>Permission is granted to temporarily download one copy of the materials (information or software) on Divvy's website for personal, non-commercial transitory viewing only.</p>
                    <h2 className="text-2xl font-bold text-white mt-6">3. Disclaimer</h2>
                    <p>The materials on Divvy's website are provided on an 'as is' basis. Divvy makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                    <p className="mt-8 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};
