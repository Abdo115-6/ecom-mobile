import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  X, 
  Image as ImageIcon, 
  Film, 
  Sparkles, 
  ZoomIn, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface RichProductDescriptionProps {
  description: string;
  productName?: string;
  className?: string;
}

interface MediaBlock {
  type: 'image' | 'gif' | 'video' | 'youtube' | 'text';
  url?: string;
  caption?: string;
  alt?: string;
  videoId?: string;
  content?: string;
}

export const RichProductDescription: React.FC<RichProductDescriptionProps> = ({
  description,
  productName = 'Produit',
  className = ''
}) => {
  const [activeLightbox, setActiveLightbox] = useState<{ url: string; caption?: string; type: 'image' | 'gif' } | null>(null);

  // Parse description text into ordered blocks (paragraphs, images, gifs, videos)
  const blocks = parseDescriptionBlocks(description);

  // Count media types for badges
  const imageCount = blocks.filter(b => b.type === 'image').length;
  const gifCount = blocks.filter(b => b.type === 'gif').length;
  const videoCount = blocks.filter(b => b.type === 'video' || b.type === 'youtube').length;
  const hasRichMedia = imageCount > 0 || gifCount > 0 || videoCount > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mobile media quick indicators if media is present */}
      {hasRichMedia && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Contenu multimédia :
          </span>
          {imageCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[11px] font-semibold">
              <ImageIcon className="w-3 h-3" />
              <span>{imageCount} {imageCount > 1 ? 'Images HD' : 'Image HD'}</span>
            </span>
          )}
          {gifCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/60 rounded-full text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{gifCount} {gifCount > 1 ? 'GIFs animés' : 'GIF animé'}</span>
            </span>
          )}
          {videoCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full text-[11px] font-semibold">
              <Film className="w-3 h-3" />
              <span>{videoCount} {videoCount > 1 ? 'Vidéos démo' : 'Vidéo démo'}</span>
            </span>
          )}
        </div>
      )}

      {/* Render sequence of text and media */}
      <div className="space-y-6">
        {blocks.map((block, index) => {
          if (block.type === 'text') {
            return (
              <div key={index} className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal space-y-2">
                {block.content?.split('\n').map((line, lineIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;

                  // Bullet points
                  if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
                    return (
                      <div key={lineIdx} className="flex items-start gap-2.5 pl-1 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 shrink-0"></span>
                        <span className="text-slate-700 font-medium">{bulletText}</span>
                      </div>
                    );
                  }

                  // Subheadings (e.g. ## or bold title)
                  if (trimmed.startsWith('#')) {
                    const headingText = trimmed.replace(/^#+\s*/, '');
                    return (
                      <h3 key={lineIdx} className="text-sm sm:text-base font-bold text-slate-900 pt-2 pb-1">
                        {headingText}
                      </h3>
                    );
                  }

                  return (
                    <p key={lineIdx} className="text-slate-600">
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            );
          }

          if (block.type === 'image' && block.url) {
            return (
              <div 
                key={index} 
                className="my-4 group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition-all hover:shadow-md"
              >
                <div 
                  className="relative cursor-pointer overflow-hidden aspect-auto max-h-[500px] flex items-center justify-center bg-slate-100"
                  onClick={() => setActiveLightbox({ url: block.url!, caption: block.caption, type: 'image' })}
                >
                  <img
                    src={block.url}
                    alt={block.alt || block.caption || productName}
                    className="w-full h-auto object-cover max-h-[500px] transition-transform duration-500 group-hover:scale-102"
                    loading="lazy"
                  />
                  {/* Mobile Tap to Zoom Badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-3 h-3" />
                    <span>Zoomer</span>
                  </div>
                </div>

                {block.caption && (
                  <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-600">
                    <span className="font-medium text-slate-700">{block.caption}</span>
                    <span className="text-[10px] text-slate-400 font-mono">HD</span>
                  </div>
                )}
              </div>
            );
          }

          if (block.type === 'gif' && block.url) {
            return (
              <div 
                key={index} 
                className="my-4 group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-200/80 bg-purple-50/20 shadow-sm transition-all hover:shadow-md"
              >
                <div 
                  className="relative cursor-pointer overflow-hidden aspect-auto max-h-[500px] flex items-center justify-center bg-slate-950"
                  onClick={() => setActiveLightbox({ url: block.url!, caption: block.caption, type: 'gif' })}
                >
                  <img
                    src={block.url}
                    alt={block.alt || block.caption || `${productName} Démo GIF`}
                    className="w-full h-auto object-contain max-h-[480px]"
                    loading="lazy"
                  />
                  {/* GIF Badge top-left */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>GIF ANIMÉ</span>
                  </div>
                  {/* Tap to Zoom Badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-3 h-3" />
                    <span>Plein écran</span>
                  </div>
                </div>

                {block.caption && (
                  <div className="px-4 py-2.5 bg-white border-t border-purple-100 flex items-center justify-between text-[11px] sm:text-xs text-purple-950">
                    <span className="font-semibold text-purple-900">{block.caption}</span>
                    <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">Animation boucle</span>
                  </div>
                )}
              </div>
            );
          }

          if (block.type === 'video' && block.url) {
            return (
              <VideoPlayerCard
                key={index}
                url={block.url}
                caption={block.caption}
                productName={productName}
              />
            );
          }

          if (block.type === 'youtube' && block.videoId) {
            return (
              <div 
                key={index} 
                className="my-5 overflow-hidden rounded-2xl sm:rounded-3xl border border-rose-200/80 bg-slate-900 shadow-md"
              >
                <div className="relative aspect-video w-full">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${block.videoId}?rel=0&modestbranding=1`}
                    title={`${productName} Démonstration Vidéo`}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {block.caption && (
                  <div className="px-4 py-2.5 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between text-[11px] sm:text-xs">
                    <div className="flex items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-rose-400" />
                      <span className="font-semibold text-slate-200">{block.caption}</span>
                    </div>
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Vidéo HD</span>
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Lightbox Modal for mobile fullscreen view */}
      {activeLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setActiveLightbox(null)}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                {activeLightbox.type === 'gif' ? 'GIF Animé' : 'Image HD'}
              </span>
              <span className="text-xs font-medium text-slate-300 truncate max-w-[200px] sm:max-w-md">
                {activeLightbox.caption || productName}
              </span>
            </div>
            <button
              onClick={() => setActiveLightbox(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center media */}
          <div 
            className="flex-1 flex items-center justify-center p-2 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img loading="lazy" decoding="async"
              src={activeLightbox.url}
              alt={activeLightbox.caption || productName}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
            />
          </div>

          {/* Footer Caption */}
          {activeLightbox.caption && (
            <div className="text-center text-xs text-slate-300 pt-3 border-t border-white/10 shrink-0">
              {activeLightbox.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Sleek Custom Video Player Component for direct video URLs
const VideoPlayerCard: React.FC<{
  url: string;
  caption?: string;
  productName?: string;
}> = ({ url, caption, productName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="my-5 mx-auto w-full max-w-sm overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-950 shadow-lg text-white">
      <div className="relative aspect-[9/16] w-full bg-black flex items-center justify-center group">
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-cover"
          playsInline
          controls
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Video Overlay controls on hover/pause if needed */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95"
            title="Lire la vidéo"
          >
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </button>
        )}

        {/* Video Badge top-left */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-rose-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/10 pointer-events-none">
          <Film className="w-3 h-3 text-rose-500" />
          <span>VIDÉO DÉMO</span>
        </div>
      </div>

      {caption && (
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
          <span className="font-medium text-slate-300">{caption}</span>
          <span className="text-[10px] text-slate-400 font-mono">1080p</span>
        </div>
      )}
    </div>
  );
};

// Helper to extract YouTube ID
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Robust block parser supporting Markdown, custom tags, and plain URLs
function parseDescriptionBlocks(text: string): MediaBlock[] {
  if (!text || !text.trim()) return [];

  const blocks: MediaBlock[] = [];
  const lines = text.split('\n');
  let textBuffer: string[] = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      const content = textBuffer.join('\n').trim();
      if (content) {
        blocks.push({ type: 'text', content });
      }
      textBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Tag format: [video: url | caption] or [video: url]
    const videoTagMatch = line.match(/^\[video:\s*([^\|\]]+)(?:\|\s*([^\]]*))?\]$/i);
    if (videoTagMatch) {
      flushText();
      const url = videoTagMatch[1].trim();
      const caption = videoTagMatch[2]?.trim();
      const ytId = getYouTubeId(url);
      if (ytId) {
        blocks.push({ type: 'youtube', videoId: ytId, url, caption });
      } else {
        blocks.push({ type: 'video', url, caption });
      }
      continue;
    }

    // 2. Tag format: [gif: url | caption] or [gif: url]
    const gifTagMatch = line.match(/^\[gif:\s*([^\|\]]+)(?:\|\s*([^\]]*))?\]$/i);
    if (gifTagMatch) {
      flushText();
      const url = gifTagMatch[1].trim();
      const caption = gifTagMatch[2]?.trim();
      blocks.push({ type: 'gif', url, caption });
      continue;
    }

    // 3. Tag format: [image: url | caption] or [image: url]
    const imageTagMatch = line.match(/^\[image:\s*([^\|\]]+)(?:\|\s*([^\]]*))?\]$/i);
    if (imageTagMatch) {
      flushText();
      const url = imageTagMatch[1].trim();
      const caption = imageTagMatch[2]?.trim();
      // Check if URL ends with .gif
      if (url.toLowerCase().includes('.gif')) {
        blocks.push({ type: 'gif', url, caption });
      } else {
        blocks.push({ type: 'image', url, caption });
      }
      continue;
    }

    // 4. Markdown image: ![alt](url)
    const mdImageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (mdImageMatch) {
      flushText();
      const altOrCaption = mdImageMatch[1].trim();
      const url = mdImageMatch[2].trim();
      if (url.toLowerCase().includes('.gif')) {
        blocks.push({ type: 'gif', url, caption: altOrCaption, alt: altOrCaption });
      } else {
        blocks.push({ type: 'image', url, caption: altOrCaption, alt: altOrCaption });
      }
      continue;
    }

    // 5. HTML tags: <img loading="lazy" decoding="async" src="url" ... /> or <video src="url" ...>
    const htmlImgMatch = line.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (htmlImgMatch) {
      flushText();
      const url = htmlImgMatch[1].trim();
      const altMatch = line.match(/alt=["']([^"']+)["']/i);
      const caption = altMatch ? altMatch[1] : undefined;
      if (url.toLowerCase().includes('.gif')) {
        blocks.push({ type: 'gif', url, caption });
      } else {
        blocks.push({ type: 'image', url, caption });
      }
      continue;
    }

    const htmlVideoMatch = line.match(/<video\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (htmlVideoMatch) {
      flushText();
      const url = htmlVideoMatch[1].trim();
      blocks.push({ type: 'video', url });
      continue;
    }

    // 6. Direct URLs on their own line
    // YouTube
    const ytId = getYouTubeId(line);
    if (ytId && (line.startsWith('http://') || line.startsWith('https://'))) {
      flushText();
      blocks.push({ type: 'youtube', videoId: ytId, url: line });
      continue;
    }

    // Direct MP4 / WebM video link
    if ((line.startsWith('http://') || line.startsWith('https://') || line.startsWith('/uploads/')) && 
        (line.toLowerCase().endsWith('.mp4') || line.toLowerCase().endsWith('.webm') || line.toLowerCase().endsWith('.mov') || line.toLowerCase().includes('/vid_'))) {
      flushText();
      blocks.push({ type: 'video', url: line });
      continue;
    }

    // Direct GIF link
    if ((line.startsWith('http://') || line.startsWith('https://') || line.startsWith('/uploads/')) && 
        (line.toLowerCase().endsWith('.gif') || line.toLowerCase().includes('/gif_') || line.includes('giphy.com') || line.includes('tenor.com'))) {
      flushText();
      blocks.push({ type: 'gif', url: line });
      continue;
    }

    // Direct Image link on its own line
    if ((line.startsWith('http://') || line.startsWith('https://') || line.startsWith('/uploads/')) && 
        (line.toLowerCase().endsWith('.webp') || line.toLowerCase().endsWith('.png') || line.toLowerCase().endsWith('.jpg') || line.toLowerCase().endsWith('.jpeg') || line.includes('images.unsplash.com'))) {
      flushText();
      blocks.push({ type: 'image', url: line });
      continue;
    }

    // Otherwise, standard text line
    textBuffer.push(rawLine);
  }

  flushText();
  return blocks;
}
