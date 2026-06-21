'use client';

import React, { useState, useEffect } from 'react';
import { contextualMealRecommendations } from '@/ai/flows/contextual-meal-recommendations-flow';
import { Sparkles, Sun, Coffee, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const SavorTool = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [context, setContext] = useState({
    weather: 'sunny',
    timeOfDay: 'afternoon',
    userMood: 'feeling adventurous',
  });

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const result = await contextualMealRecommendations(context);
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 5) timeOfDay = 'night';

    setContext((prev) => ({ ...prev, timeOfDay }));
  }, []);

  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-accent/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <Sparkles className="md:w-24 md:h-24 w-16 h-16 text-primary rotate-12" />
      </div>

      <div className="max-w-3xl relative z-10">
        <div className="flex items-center gap-2 text-primary font-bold md:mb-3 mb-2 uppercase tracking-widest text-[8px] md:text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by AI
        </div>
        <h2 className="text-xl md:text-3xl font-headline font-bold md:mb-4 mb-2 tracking-tight">
          The Intelligent <span className="text-primary">Savor Tool</span>
        </h2>
        <p className="text-muted-foreground text-sm md:text-base md:mb-6 mb-4 leading-relaxed">
          Not sure what to eat? Let our AI analyze the vibe and pick the perfect
          meal for you.
        </p>

        <div className="flex flex-wrap gap-2 md:mb-8 mb-5">
          <Badge
            variant="outline"
            className="px-3 py-1 rounded-full flex items-center gap-2 bg-white/50 dark:bg-black/20 backdrop-blur text-[9px] md:text-xs border-primary/20"
          >
            <Sun className="w-3 h-3 text-orange-500" /> {context.weather}
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1 rounded-full flex items-center gap-2 bg-white/50 dark:bg-black/20 backdrop-blur text-[9px] md:text-xs border-primary/20"
          >
            <Coffee className="w-3 h-3 text-amber-800" /> {context.timeOfDay}
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1 rounded-full flex items-center gap-2 bg-white/50 dark:bg-black/20 backdrop-blur text-[9px] md:text-xs border-primary/20"
          >
            <Heart className="w-3 h-3 text-pink-500" /> {context.userMood}
          </Badge>
        </div>

        <Button
          size="lg"
          onClick={getRecommendations}
          disabled={loading}
          className="rounded-full px-6 h-11 md:h-12 text-sm md:text-base font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-primary"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Thinking...
            </>
          ) : (
            'Magic Suggestion'
          )}
        </Button>

        {recommendations.length > 0 && (
          <div className="grid md:grid-cols-2 gap-3 md:mt-8 mt-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {recommendations.map((rec, idx) => (
              <Card
                key={idx}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-primary/10 hover:border-primary transition-colors cursor-pointer group rounded-xl shadow-sm"
              >
                <CardContent className="p-4 md:p-5">
                  <h4 className="font-bold text-base md:text-lg mb-1 group-hover:text-primary transition-colors">
                    {rec.name}
                  </h4>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-3 leading-relaxed">
                    {rec.description}
                  </p>
                  <div className="bg-primary/5 p-2.5 rounded-lg text-[9px] md:text-[11px] font-medium text-primary leading-relaxed border border-primary/10">
                    <span className="font-black uppercase tracking-widest mr-1 opacity-60">Logic:</span> {rec.reasoning}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
