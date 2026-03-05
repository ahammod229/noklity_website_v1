
import React, { useState } from 'react';
import { Mail, MessageCircle, ChevronDown, ChevronUp, HelpCircle, ArrowRight } from 'lucide-react';
import { getPublicSiteConfigSnapshot } from '../services/siteConfigService';

interface HelpSupportProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onHelpClick: () => void;
  onWishlistClick: () => void;
}

const HelpSupport: React.FC<HelpSupportProps> = ({
  onLoginClick,
  cartItemCount,
  onCartClick,
  onHelpClick,
  onWishlistClick
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const config = getPublicSiteConfigSnapshot();
  const supportEmail = config.supportEmail || 'support@example.com';
  const supportPhone = config.whatsappNumber || '';
  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Simply browse our catalog, add items to your cart, and proceed to checkout. You can create an account or checkout as a guest.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Standard shipping takes 3-5 business days. Express shipping options are available at checkout for 1-2 day delivery.'
    },
    {
      question: 'Can I return a product?',
      answer: 'Yes, we accept returns within 30 days of purchase for unused items in original packaging. Please contact support to initiate a return.'
    },
    {
      question: 'How do I contact support?',
      answer: `You can reach us via email at ${supportEmail} or chat with us on WhatsApp using the options above.`
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      
      <main className="flex-grow">
        {/* Hero / Title Section */}
        <section className="bg-gray-50 border-b border-gray-100 py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6">
                <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Help & Support
            </h1>
            <p className="text-xl text-gray-500 font-medium">
              We’re here to help you
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
            {/* Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">
                {/* Email Card */}
                <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 group">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Email Us</h3>
                    <p className="text-gray-500 mb-6">Get support via email</p>
                    <a href={`mailto:${supportEmail}`} className="inline-flex items-center text-primary font-bold hover:underline">
                        {supportEmail} <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                    <div className="mt-6 pt-6 border-t border-gray-50">
                        <button className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors">
                            Send Email
                        </button>
                    </div>
                </div>

                {/* WhatsApp Card */}
                <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-green-500/20 hover:shadow-xl transition-all duration-300 group">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Chat</h3>
                    <p className="text-gray-500 mb-6">Chat with our support team</p>
                    <span className="inline-flex items-center text-green-600 font-bold">
                        {supportPhone}
                    </span>
                    <div className="mt-6 pt-6 border-t border-gray-50">
                        <button className="w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-colors">
                            Chat on WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto mb-24">
                <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300">
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full flex items-center justify-between p-6 text-left bg-white"
                            >
                                <span className="font-bold text-gray-900 text-lg">{faq.question}</span>
                                {openFaq === index ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                            <div 
                                className={`px-6 text-gray-600 overflow-hidden transition-all duration-300 ease-in-out ${
                                    openFaq === index ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                            >
                                {faq.answer}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default HelpSupport;
