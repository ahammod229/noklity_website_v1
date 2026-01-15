
import React from 'react';
import { Mail, MessageCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface HelpProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
}

const Help: React.FC<HelpProps> = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-grow">
        {/* Hero */}
        <section className="bg-gray-50 border-b border-gray-100 py-16 text-center px-4">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Help & Support</h1>
          <p className="text-xl text-gray-500 font-medium">How can we assist you today?</p>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Email Support */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-500 mb-6 font-medium">Send us a detailed message.</p>
              <a href="mailto:support@noklity.com" className="text-lg font-bold text-gray-900 hover:text-primary transition-colors flex items-center gap-2">
                support@noklity.com <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* WhatsApp Support */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Chat</h3>
              <p className="text-gray-500 mb-6 font-medium">Instant support for urgent queries.</p>
              <a href="https://wa.me/8801713812668" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-green-600 hover:text-green-700 transition-colors flex items-center gap-2">
                +880 1713-812668 <ArrowRight className="w-4 h-4" />
              </a>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;
