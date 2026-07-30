import React, { useEffect, useRef, useState } from 'react';
import leumiImg from '@/assets/banks/leumi.png';
import hapoalimImg from '@/assets/banks/hapoalim.png';
import discountImg from '@/assets/banks/discount.png';
import mizrachiImg from '@/assets/banks/mizrachi.png';
import yerushalayimImg from '@/assets/banks/yerushalayim.png';
import beinleumiImg from '@/assets/banks/beinleumi.png';

const banks = [
  { name: 'לאומי', img: leumiImg, heightScale: 1.15 },
  { name: 'הפועלים', img: hapoalimImg },
  { name: 'דיסקונט', img: discountImg },
  { name: 'מזרחי טפחות', img: mizrachiImg, heightScale: 1.1 },
  { name: 'ירושלים', img: yerushalayimImg, heightScale: 0.9775 },
  { name: 'הבינלאומי', img: beinleumiImg, heightScale: 0.8 },
];

export default function BankLogosCarousel() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white py-9 px-4 sm:px-8">
      <div
        ref={sectionRef}
        className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-[#959EFF] to-[#4D87F7] px-6 sm:px-10 py-8 sm:py-10 text-center overflow-hidden"
      >
        <h2 className="text-[#0C084A] text-sm sm:text-base font-medium mb-8">
          בשיתוף פעולה עם כל הבנקים המובילים במשק
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {banks.map((bank, i) => (
            <div key={bank.name} className="flex items-center justify-center">
              <img
                src={bank.img}
                alt={`בנק ${bank.name}`}
                style={{
                  height: `${2 * (bank.heightScale || 1)}rem`,
                  transform: `translateY(${visible ? 0 : 14}px)`,
                  transitionDelay: `${i * 90}ms`,
                }}
                className={`w-auto object-contain transition-all duration-700 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
