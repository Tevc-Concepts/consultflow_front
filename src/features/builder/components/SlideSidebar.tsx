'use client';

import React from 'react';
import Button from '@components/ui/Button';
import { Slide } from '../types';

interface SlideSidebarProps {
    slides: Slide[];
    currentSlideId: string | null;
    onSelectSlide: (id: string) => void;
    onAddSlide: () => void;
    onRemoveSlide: (id: string) => void;
    onUpdateSlideName: (id: string, name: string) => void;
    onDrop: (e: React.DragEvent, slideId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    slideRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export default function SlideSidebar({
    slides,
    currentSlideId,
    onSelectSlide,
    onAddSlide,
    onRemoveSlide,
    onUpdateSlideName,
    onDrop,
    onDragOver,
    slideRefs
}: SlideSidebarProps) {
    const [editingSlide, setEditingSlide] = React.useState<string | null>(null);
    const [editName, setEditName] = React.useState('');

    const startEditing = (slide: Slide) => {
        setEditingSlide(slide.id);
        setEditName(slide.name);
    };

    const finishEditing = () => {
        if (editingSlide && editName.trim()) {
            onUpdateSlideName(editingSlide, editName.trim());
        }
        setEditingSlide(null);
        setEditName('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            finishEditing();
        } else if (e.key === 'Escape') {
            setEditingSlide(null);
            setEditName('');
        }
    };

    return (
        <div className="w-64 shrink-0 border-r border-medium/60 bg-white overflow-y-auto">
            <div className="p-4 border-b border-medium/60">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Slides</h2>
                    <Button size="sm" onClick={onAddSlide}>
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                    </Button>
                </div>
            </div>

            <div className="p-2 space-y-2">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        ref={el => { slideRefs.current[slide.id] = el; }}
                        className={[
                            'border rounded-xl p-3 cursor-pointer transition-colors',
                            currentSlideId === slide.id
                                ? 'border-cobalt bg-cobalt/5'
                                : 'border-medium/60 hover:border-cobalt/50'
                        ].join(' ')}
                        onClick={() => onSelectSlide(slide.id)}
                        onDrop={(e) => onDrop(e, slide.id)}
                        onDragOver={onDragOver}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-deep-navy/70">
                                Slide {index + 1}
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEditing(slide);
                                    }}
                                    className="text-xs text-deep-navy/70 hover:text-deep-navy"
                                    title="Edit name"
                                >
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                {slides.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveSlide(slide.id);
                                        }}
                                        className="text-xs text-coral hover:text-coral/80"
                                        title="Delete slide"
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {editingSlide === slide.id ? (
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={finishEditing}
                                onKeyDown={handleKeyPress}
                                className="w-full text-sm font-medium bg-transparent border-b border-cobalt outline-none"
                                autoFocus
                            />
                        ) : (
                            <div className="text-sm font-medium mb-1">
                                {slide.name}
                            </div>
                        )}

                        <div className="text-xs text-deep-navy/60">
                            {slide.blocks.length} block{slide.blocks.length !== 1 ? 's' : ''}
                        </div>

                        {/* Mini preview */}
                        <div className="mt-2 grid grid-cols-2 gap-1">
                            {slide.blocks.slice(0, 4).map((block) => (
                                <div
                                    key={block.id}
                                    className="h-6 bg-medium/40 rounded text-xs flex items-center justify-center"
                                >
                                    {block.kind}
                                </div>
                            ))}
                            {slide.blocks.length > 4 && (
                                <div className="h-6 bg-medium/20 rounded text-xs flex items-center justify-center text-deep-navy/60">
                                    +{slide.blocks.length - 4}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}