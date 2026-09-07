import React from 'react';
import { CreditCard, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-400 mt-20 border-t border-slate-800">
      {/* Features Bar */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <Truck className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">Fast Delivery</h4>
              <p className="text-xs text-gray-400">Express doorstep delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <CreditCard className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">Secure Razorpay Payments</h4>
              <p className="text-xs text-gray-400">100% Secure Checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <RefreshCw className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">Easy Returns</h4>
              <p className="text-xs text-gray-400">7-day hassle-free return</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <ShieldCheck className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">Buyer Protection</h4>
              <p className="text-xs text-gray-400">24/7 dedicated support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm">
              S
            </div>
            <span>ShopEase</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-400">
            A production-ready full-stack e-commerce site powered by @Tote Niwas
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Registraion Details</h4>
          <ul className="space-y-2 text-xs">
            <li><i class="fas fa-user"></i>👤 Production by Deepak</li>
            <li><i class="fas fa-user"></i>👑 Owned by Ritesh</li>
            <li><i class="fas fa-user"></i>📅 Co-owned by Suhana</li>
            <li><i class="fas fa-user"></i>🏠  Tote Niwas </li>
           
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Important Details  </h4>
          <ul className="space-y-2 text-xs">
            <li>Sponserd by FF</li>
            <li>Co-Sponserd by Supercell</li>
            <li>Production by Brawl Stars</li>
            <li>Directed by TMSL</li>
           
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Location</h4>
          <p className="text-xs leading-relaxed text-gray-400 mb-3">Abhishek Apartment</p>
          <p className="text-xs leading-relaxed text-gray-400 mb-3">
            Ghospara, Kestopur, Kolkata 700102
          </p>
          <p className="text-xs leading-relaxed text-gray-400 mb-3">West bengal</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-blue-400 rounded-md border border-slate-700">Spring Boot 3</span>
            <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-cyan-400 rounded-md border border-slate-700">React + Vite</span>
            <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-emerald-400 rounded-md border border-slate-700">Razorpay</span>
            <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-purple-400 rounded-md border border-slate-700">Kubernetes</span>
            <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-purple-400 rounded-md border border-slate-700">Docker</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} ShopEase Platform. All rights reserved.
      </div>
    </footer>
  );
}
