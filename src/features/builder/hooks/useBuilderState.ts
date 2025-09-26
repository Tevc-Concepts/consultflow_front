'use client';

import React, { useState, useCallback } from 'react';
import { BuilderState, Slide, Block, BlockKind } from '../types';
import { demoSlides, templateBlocks } from '../templates';

const STORAGE_KEY = 'consultflow:builder:v1';

export function useBuilderState() {
    const [state, setState] = useState<BuilderState>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    return {
                        slides: parsed.slides || demoSlides,
                        current: parsed.current || demoSlides[0]?.id || null,
                        selectedBlock: null
                    };
                } catch (error) {
                    console.error('Failed to parse stored builder state:', error);
                }
            }
        }
        return {
            slides: demoSlides,
            current: demoSlides[0]?.id || null,
            selectedBlock: null
        };
    });

    const saveToStorage = useCallback((newState: BuilderState) => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    slides: newState.slides,
                    current: newState.current
                }));
            } catch (error) {
                console.error('Failed to save builder state:', error);
            }
        }
    }, []);

    const updateState = useCallback((updater: (prev: BuilderState) => BuilderState) => {
        setState(prev => {
            const newState = updater(prev);
            saveToStorage(newState);
            return newState;
        });
    }, [saveToStorage]);

    const addSlide = useCallback(() => {
        updateState(prev => {
            const id = `slide-${Date.now()}`;
            const newSlide: Slide = {
                id,
                name: `Slide ${prev.slides.length + 1}`,
                blocks: []
            };
            return {
                ...prev,
                slides: [...prev.slides, newSlide],
                current: id
            };
        });
    }, [updateState]);

    const removeSlide = useCallback((slideId: string) => {
        updateState(prev => {
            const newSlides = prev.slides.filter(s => s.id !== slideId);
            const newCurrent = prev.current === slideId 
                ? (newSlides[0]?.id || null)
                : prev.current;
            return {
                ...prev,
                slides: newSlides,
                current: newCurrent,
                selectedBlock: null
            };
        });
    }, [updateState]);

    const updateSlide = useCallback((slideId: string, updater: (slide: Slide) => Slide) => {
        updateState(prev => ({
            ...prev,
            slides: prev.slides.map(slide => 
                slide.id === slideId ? updater(slide) : slide
            )
        }));
    }, [updateState]);

    const addBlock = useCallback((slideId: string, kind: BlockKind) => {
        const id = `block-${Date.now()}`;
        const template = { ...templateBlocks[kind], id };
        
        updateSlide(slideId, slide => ({
            ...slide,
            blocks: [...slide.blocks, template]
        }));
    }, [updateSlide]);

    const removeBlock = useCallback((slideId: string, blockId: string) => {
        updateSlide(slideId, slide => ({
            ...slide,
            blocks: slide.blocks.filter(b => b.id !== blockId)
        }));
        
        setState(prev => ({
            ...prev,
            selectedBlock: prev.selectedBlock === blockId ? null : prev.selectedBlock
        }));
    }, [updateSlide]);

    const updateBlock = useCallback((blockId: string, updater: (block: Block) => Block) => {
        updateState(prev => ({
            ...prev,
            slides: prev.slides.map(slide => ({
                ...slide,
                blocks: slide.blocks.map(block =>
                    block.id === blockId ? updater(block) : block
                )
            }))
        }));
    }, [updateState]);

    const setCurrentSlide = useCallback((slideId: string) => {
        updateState(prev => ({
            ...prev,
            current: slideId,
            selectedBlock: null
        }));
    }, [updateState]);

    const setSelectedBlock = useCallback((blockId: string | null) => {
        setState(prev => ({
            ...prev,
            selectedBlock: blockId
        }));
    }, []);

    const getCurrentSlide = useCallback((): Slide | null => {
        return state.slides.find(s => s.id === state.current) || null;
    }, [state.slides, state.current]);

    const getSelectedBlock = useCallback((): Block | null => {
        if (!state.selectedBlock) return null;
        
        for (const slide of state.slides) {
            const block = slide.blocks.find(b => b.id === state.selectedBlock);
            if (block) return block;
        }
        return null;
    }, [state.slides, state.selectedBlock]);

    return {
        state,
        actions: {
            addSlide,
            removeSlide,
            updateSlide,
            addBlock,
            removeBlock,
            updateBlock,
            setCurrentSlide,
            setSelectedBlock
        },
        selectors: {
            getCurrentSlide,
            getSelectedBlock
        }
    };
}