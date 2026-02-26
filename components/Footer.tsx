import React, { useEffect, useState } from 'react';
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import { getPublicSiteConfig } from '../services/siteConfigService';

const Footer: React.FC = () => {
  const [footerText, setFooterText] = useState('© 2024 NOKLITY Automotive. All rights reserved.');
  const [footerLogo, setFooterLogo] = useState('');
  const [supportEmail, setSupportEmail] = useState('support@noklity.com');
  const [siteTagline, setSiteTagline] = useState(
    'Your premium destination for high-performance automotive parts. Engineered for speed, built for durability.'
  );

  useEffect(() => {
    let mounted = true;
    getPublicSiteConfig().then((cfg) => {
      if (!mounted) return;
      setFooterText(cfg.footerText || footerText);
      setFooterLogo(cfg.footerLogo || '');
      setSupportEmail(cfg.supportEmail || supportEmail);
      setSiteTagline(cfg.siteTagline || siteTagline);
    }).catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 border-t-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center">
                {footerLogo ? (
                  <img src={footerLogo} alt="Footer Logo" className="h-10 w-auto object-contain" />
                ) : (
                  <>
                    <div className="w-8 h-8 bg-primary skew-x-[-10deg] flex items-center justify-center mr-2">
                        <span className="text-white font-bold text-lg skew-x-[10deg]">N</span>
                    </div>
                    <span className="font-bold text-2xl tracking-tighter text-white">
                    NOKLITY
                    </span>
                  </>
                )}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {siteTagline}
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Facebook className="w-5 h-5"/></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter className="w-5 h-5"/></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Instagram className="w-5 h-5"/></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Youtube className="w-5 h-5"/></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6">Shop</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Performance Parts</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Interior Accessories</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Wheels & Tires</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Lighting</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Oil & Fluids</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold mb-6">Support</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Track Order</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Warranty</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6">Contact</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                <span>123 Performance Blvd,<br />Speedway City, CA 90210</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                <span>{supportEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">{footerText}</p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
