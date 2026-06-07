
"use client"
import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { MENU_ITEMS, CATEGORIES } from '@/app/lib/menu-data';

export const Categories = () => {
  const router = useRouter();

  // Find a representative image from MENU_ITEMS for each category
  const categoryItems = CATEGORIES.filter(c => c !== 'All').map(cat => {
    const item = MENU_ITEMS.find(i => i.category === cat);
    return {
      name: cat,
      img: item?.imageUrl || `https://picsum.photos/seed/${cat}/200`
    };
  });

  return (
    <div className="flex overflow-x-auto gap-4 md:gap-8 pb-4 pt-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      {categoryItems.map((item, idx) => (
        <button 
          key={idx} 
          onClick={() => router.push(`/menu?q=${item.name}`)}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-white dark:bg-zinc-900 shadow-soft group-hover:shadow-xl transition-all duration-500 overflow-hidden relative border-2 border-transparent group-hover:border-primary/20">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors z-10" />
            <div className="relative w-full h-full transform group-hover:scale-110 transition-transform duration-500">
              <Image 
                src={item.img} 
                alt={item.name} 
                fill 
                className="object-cover" 
                unoptimized
              />
            </div>
          </div>
          <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            {item.name}
          </span>
        </button>
      ))}
    </div>
  );
};
