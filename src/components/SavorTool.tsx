
"use client"
import React, { useState, useEffect } from 'react';
import { contextualMealRecommendations } from '@/ai/flows/contextual-meal-recommendations-flow';
import { Sparkles, Cloud, Sun, Moon, Coffee, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const SavorTool = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [context, setContext] = useState({
    weather: 'sunny',
    timeOfDay: 'afternoon',
    userMood: 'feeling adventurous'
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
    // Initial fetch
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 5) timeOfDay = 'night';
    
    setContext(prev => ({ ...prev, timeOfDay }));
  }, []);

  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-accent/20 rounded-3xl p-6 md:p-10 border shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Sparkles className="w-32 h-32 text-primary rotate-12" />
      </div>
      
      <div className="max-w-3xl relative z-10">
        <div className="flex items-center gap-2 text-primary font-bold mb-4 uppercase tracking-widest text-xs">
          <Sparkles className="w-4 h-4" />
          Powered by AI
        </div>
        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">
          The Intelligent <span className="text-primary">Savor Tool</span>
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          Not sure what to eat? Let our AI analyze the vibe and pick the perfect meal for you.
        </p>

        <div className="flex flex-wrap gap-4 mb-10">
          <Badge variant="outline" className="px-4 py-2 rounded-full flex items-center gap-2 bg-white/50 backdrop-blur">
            <Sun className="w-4 h-4 text-orange-500" /> {context.weather}
          </Badge>
          <Badge variant="outline" className="px-4 py-2 rounded-full flex items-center gap-2 bg-white/50 backdrop-blur">
            <Coffee className="w-4 h-4 text-brown-500" /> {context.timeOfDay}
          </Badge>
          <Badge variant="outline" className="px-4 py-2 rounded-full flex items-center gap-2 bg-white/50 backdrop-blur">
            <Heart className="w-4 h-4 text-pink-500" /> {context.userMood}
          </Badge>
        </div>

        <Button 
          size="lg" 
          onClick={getRecommendations} 
          disabled={loading}
          className="rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Thinking...
            </>
          ) : (
            'Magic Suggestion'
          )}
        </Button>

        {recommendations.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mt-10 animate-in fade-in slide-in-from-bottom duration-500">
            {recommendations.map((rec, idx) => (
              <Card key={idx} className="bg-white/80 backdrop-blur border-primary/20 hover:border-primary transition-colors cursor-pointer group">
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{rec.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  <div className="bg-primary/5 p-3 rounded-xl text-xs font-medium text-primary leading-relaxed">
                    <strong>Why?</strong> {rec.reasoning}
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
