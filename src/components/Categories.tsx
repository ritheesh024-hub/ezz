"use client"
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MENU_ITEMS, CATEGORIES } from '@/app/lib/menu-data';
import placeholderData from '@/app/lib/placeholder-images.json';

export const Categories = () => {
  const router = useRouter();

  // Find a representative image for each category
  const categoryItems = CATEGORIES.filter(c => c !== 'All').map(cat => {
    // 1. Check for dedicated category image first (id matches cat-category-name)
    const catId = `cat-${cat.toLowerCase().replace(/\s+/g, '-')}`;
    const dedicatedImg = placeholderData.placeholderImages.find(img => img.id === catId)?.imageUrl;
    
    if (dedicatedImg) {
      return { name: cat, img: dedicatedImg };
    }

    // 2. Fallback to representative item from MENU_ITEMS
    const item = MENU_ITEMS.find(i => i.category === cat);
    return {
      name: cat,
      img: item?.imageUrl || `https://picsum.photos/seed/${cat}/200`
    };
  });

  return (
    <div className="flex overflow-x-auto gap-3.5 md:gap-6 pb-3 pt-0.5 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      {categoryItems.map((item, idx) => (
        <button 
          key={idx} 
          onClick={() => {
            const section = document.getElementById(`section-${item.name}`);
            if (section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              router.push(`/menu?q=${item.name}`);
            }
          }}
          className="flex flex-col items-center gap-1.5 shrink-0 group perspective-1000"
        >
          <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-white dark:bg-zinc-900 shadow-md group-hover:shadow-xl transition-all duration-500 overflow-hidden relative border-2 border-transparent group-hover:border-primary/40 group-active:scale-90">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors z-10" />
            <div className="relative w-full h-full transform group-hover:scale-110 transition-transform duration-700">
              <Image 
                src={item.img} 
                alt={item.name} 
                fill 
                className="object-cover" 
                unoptimized
              />
            </div>
          </div>
          <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            {item.name}
          </span>
        </button>
      ))}
    </div>
  );
};
