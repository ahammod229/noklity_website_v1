import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="pt-4 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden h-[480px] sm:h-[520px] w-full shadow-2xl shadow-gray-200 group transform transition-all hover:shadow-gray-300">
        
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2940&auto=format&fit=crop"
            alt="Premium Automotive Parts"
            className="w-full h-full object-cover object-center transform transition-transform duration-[20s] group-hover:scale-105"
          />
          {/* Enhanced overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/40 to-transparent" />
        </div>

        {/* Content Card - Floating Left */}
        <div className="relative h-full flex items-center px-6 md:px-12 lg:px-16">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 md:p-10 rounded-3xl max-w-lg w-full text-white shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
             
             {/* Decorative glow */}
             <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/40 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-primary px-3 py-1.5 rounded-full mb-6 shadow-lg shadow-red-900/20 border border-white/10">
                <Zap className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
                <span className="text-white text-[11px] font-extrabold tracking-widest uppercase">Premium Selection</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6 drop-shadow-sm">
                Genuine <br />
                <span className="text-primary drop-shadow-md">Performance</span>
              </h1>

              <p className="text-gray-200 text-sm md:text-base mb-8 leading-relaxed font-medium opacity-90 max-w-sm">
                Unlock your vehicle's true potential with components engineered for speed, durability, and precision.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-primary hover:bg-red-600 text-white text-sm font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center shadow-xl shadow-red-900/30 hover:shadow-red-600/40 hover:-translate-y-1">
                    Shop Now <ArrowRight className="ml-2 w-4 h-4" />
                </button>
                <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold py-4 px-8 rounded-full transition-all duration-300 backdrop-blur-sm hover:-translate-y-1">
                    View Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;