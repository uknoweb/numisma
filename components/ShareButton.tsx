"use client";

import { useState } from "react";
import { shareContent, SharePlatform, ShareData } from "@/lib/social";
import { Share2, Check, Twitter, Send, MessageCircle } from "lucide-react";

interface ShareButtonProps {
  data: ShareData;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ShareButton({ 
  data, 
  variant = 'button',
  size = 'md',
  className = '' 
}: ShareButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async (platform: SharePlatform) => {
    const success = await shareContent(data, platform);
    if (success) {
      setShared(true);
      setShowOptions(false);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`${sizeClasses[size]} rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors ${className}`}
        >
          {shared ? (
            <Check className={iconSizeClasses[size]} />
          ) : (
            <Share2 className={iconSizeClasses[size]} />
          )}
        </button>

        {showOptions && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowOptions(false)}
            />
            <div className="absolute right-0 mt-2 bg-gray-900 border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => handleShare('twitter')}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
              >
                <Twitter className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-white">Twitter</span>
              </button>
              <button
                onClick={() => handleShare('telegram')}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
              >
                <Send className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-white">Telegram</span>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white">WhatsApp</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${className}`}
      >
        {shared ? (
          <>
            <Check className="w-5 h-5" />
            ¡Compartido!
          </>
        ) : (
          <>
            <Share2 className="w-5 h-5" />
            Compartir
          </>
        )}
      </button>

      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 mt-2 bg-gray-900 border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden min-w-[200px]">
            <button
              onClick={() => handleShare('twitter')}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-white">Compartir en Twitter</span>
            </button>
            <div className="h-px bg-white/10" />
            <button
              onClick={() => handleShare('telegram')}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
            >
              <Send className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-white">Compartir en Telegram</span>
            </button>
            <div className="h-px bg-white/10" />
            <button
              onClick={() => handleShare('whatsapp')}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-white">Compartir en WhatsApp</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
