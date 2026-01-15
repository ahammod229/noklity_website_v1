
import React from 'react';
import AccountSidebar from './AccountSidebar';

interface AccountLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (view: any) => void;
  cartItemCount: number;
  onCartClick: () => void;
  onLoginClick: () => void;
  title: string;
}

const AccountLayout: React.FC<AccountLayoutProps> = ({ 
  children, 
  activeTab, 
  onNavigate,
  onLoginClick,
  title
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow">
        {/* Desktop Title Header */}
        <div className="bg-white border-b border-gray-100 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Navigation Section */}
            <div className="lg:w-72 flex-shrink-0">
              <AccountSidebar 
                activeTab={activeTab} 
                onNavigate={onNavigate} 
                onLogout={onLoginClick} 
              />
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountLayout;
