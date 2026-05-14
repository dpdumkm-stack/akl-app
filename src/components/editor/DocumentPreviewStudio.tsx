"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize, Minimize, Move, 
  RotateCcw, MousePointer2, ChevronRight, ChevronLeft 
} from 'lucide-react';

interface DocumentPreviewStudioProps {
    children: React.ReactNode;
    title?: string;
    initialZoom?: number;
}

export default function DocumentPreviewStudio({ 
    children, 
    title = "Document Studio", 
    initialZoom = 0.8 
}: DocumentPreviewStudioProps) {
    const [zoom, setZoom] = useState(initialZoom);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-fit logic on mount
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setZoom(0.45);
            } else if (window.innerWidth < 1024) {
                setZoom(0.6);
            } else {
                setZoom(initialZoom);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [initialZoom]);

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.min(Math.max(prev + delta, 0.2), 3));
    };

    const resetView = () => {
        setZoom(initialZoom);
        setOffset({ x: 0, y: 0 });
    };

    // Mouse Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Touch Gestures (Mobile)
    const lastTouchDistance = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({ 
                x: e.touches[0].clientX - offset.x, 
                y: e.touches[0].clientY - offset.y 
            });
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            lastTouchDistance.current = dist;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && isDragging) {
            setOffset({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (lastTouchDistance.current !== null) {
                const delta = (dist - lastTouchDistance.current) * 0.01;
                handleZoom(delta);
            }
            lastTouchDistance.current = dist;
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative">
            {/* STUDIO HEADER */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{title}</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-0.5">Interactive Preview Mode</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
                    <div className="px-3 py-1 text-[9px] font-black text-blue-400 bg-blue-500/10 rounded-lg">
                        {(zoom * 100).toFixed(0)}%
                    </div>
                </div>
            </div>

            {/* VIEWER AREA */}
            <div 
                ref={containerRef}
                className={`flex-1 relative cursor-grab active:cursor-grabbing touch-action-none overflow-hidden select-none flex items-start justify-center p-12 lg:p-20`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => { setIsDragging(false); lastTouchDistance.current = null; }}
            >
                <div 
                    className="gpu-accel transition-transform duration-75 ease-out origin-top"
                    style={{ 
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    }}
                >
                    {children}
                </div>
            </div>

            {/* COMPACT FLOATING CONTROLS (Bottom Right) */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
                <div className="flex flex-col bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                    <button 
                        onClick={() => handleZoom(0.1)}
                        className="p-3.5 hover:bg-blue-600 text-white transition-all active:scale-90 border-b border-white/10"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <button 
                        onClick={() => handleZoom(-0.1)}
                        className="p-3.5 hover:bg-blue-600 text-white transition-all active:scale-90 border-b border-white/10"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <button 
                        onClick={resetView}
                        className="p-3.5 hover:bg-blue-600 text-blue-400 hover:text-white transition-all active:scale-90"
                        title="Reset View"
                    >
                        <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                    </button>
                </div>
                
                {/* ZOOM INDICATOR */}
                <div className="bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md text-center">
                    <span className="text-[10px] font-black text-blue-400 tracking-tighter">
                        {(zoom * 100).toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* INTERACTION HELPER (Desktop Only) */}
            <div className="absolute top-24 right-8 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex">
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex flex-col items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-slate-500" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Drag to<br/>Move</span>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex flex-col items-center gap-2">
                    <Move className="w-4 h-4 text-slate-500" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Pinch to<br/>Zoom</span>
                </div>
            </div>
        </div>
    );
}
