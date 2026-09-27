import React from 'react';
import { ShieldCheck, Truck, Clock, Headphones } from 'lucide-react';

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: 'Verified Sellers',
    subtitle: 'All marketplace vendors undergo rigorous ID verification',
  },
  {
    icon: Truck,
    title: 'Fast Direct Delivery',
    subtitle: 'Orders tracked across 4 stages with real-time updates',
  },
  {
    icon: Clock,
    title: 'Secure Balance Hold',
    subtitle: 'Funds held securely in escrow until successful delivery',
  },
  {
    icon: Headphones,
    title: 'Dedicated Customer Support',
    subtitle: 'Live ticket resolution between buyers, sellers, and support',
  },
];

// Duplicate set to create 2 perfectly balanced track halves for seamless infinite marquee
const TRACK_SET = [...TRUST_BADGES, ...TRUST_BADGES];

export const TrustBadgesTicker: React.FC = () => {
  return (
    <section className="bg-white border-y border-slate-200 py-4.5 sm:py-5 overflow-hidden w-full max-w-[100vw] select-none">
      <div className="w-full max-w-[100vw] overflow-hidden">
        <div className="flex w-max animate-marquee-ltr">
          {/* Track Half 1 */}
          <div className="flex items-center gap-12 md:gap-16 pr-12 md:pr-16 shrink-0">
            {TRACK_SET.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={`track-1-${idx}`} className="flex items-center gap-3.5 shrink-0">
                  <div className="w-10 h-10 rounded-none sm:rounded-[2px] bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-[#0F172A] shadow-xs">
                    <Icon className="w-5 h-5 text-accent-orange" />
                  </div>
                  <div className="whitespace-nowrap">
                    <h4 className="text-xs font-black text-[#0F172A] tracking-wider uppercase">
                      {badge.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {badge.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Track Half 2 (Identical duplicate for seamless looping) */}
          <div className="flex items-center gap-12 md:gap-16 pr-12 md:pr-16 shrink-0" aria-hidden="true">
            {TRACK_SET.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={`track-2-${idx}`} className="flex items-center gap-3.5 shrink-0">
                  <div className="w-10 h-10 rounded-none sm:rounded-[2px] bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-[#0F172A] shadow-xs">
                    <Icon className="w-5 h-5 text-accent-orange" />
                  </div>
                  <div className="whitespace-nowrap">
                    <h4 className="text-xs font-black text-[#0F172A] tracking-wider uppercase">
                      {badge.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {badge.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
