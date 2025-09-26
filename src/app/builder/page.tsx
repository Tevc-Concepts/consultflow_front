'use client';

import React from 'react';
import { Card } from '@components/ui/Card';
import Button from '@components/ui/Button';
import SlideSidebar from '@features/builder/components/SlideSidebar';
import BlockPalette from '@features/builder/components/BlockPalette';
import LiveBlock from '@features/builder/components/LiveBlock';
import BlockPropertiesPanel from '@features/builder/components/BlockPropertiesPanel';
import { useBuilderState } from '@features/builder/hooks/useBuilderState';
import { useDeck } from '@shared/state/deck';
import { BlockKind } from '@features/builder/types';

export default function BuilderPage() {
    const { state, actions, selectors } = useBuilderState();
    const slideRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
    const deck = useDeck();
    
    const currentSlide = selectors.getCurrentSlide();
    const selectedBlock = selectors.getSelectedBlock();

    // Drag and drop handlers
    const handleDropPalette = (e: React.DragEvent, slideId: string) => {
        e.preventDefault();
        const kind = e.dataTransfer.getData('text/block-kind') as BlockKind;
        if (!kind) return;
        actions.addBlock(slideId, kind);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleExportDeck = () => {
        deck.clear();
        state.slides.forEach(slide => {
            // Convert builder slide to deck slide format
            deck.addSlide({
                title: slide.name,
                summary: `Generated from ${slide.blocks.length} blocks`,
                bullets: slide.blocks.map(block => 
                    `${block.kind.toUpperCase()}: ${JSON.stringify(block.data).substring(0, 50)}...`
                ),
                notes: [`Original slide ID: ${slide.id}`],
                mode: 'CEO'
            });
        });
        
        // Navigate to deck view or show export success
        if (typeof window !== 'undefined') {
            window.open('/deck', '_blank');
        }
    };

    return (
        <div className="flex h-screen bg-light">
            {/* Slides Sidebar */}
            <SlideSidebar
                slides={state.slides}
                currentSlideId={state.current}
                onSelectSlide={actions.setCurrentSlide}
                onAddSlide={actions.addSlide}
                onRemoveSlide={actions.removeSlide}
                onUpdateSlideName={(id, name) => 
                    actions.updateSlide(id, slide => ({ ...slide, name }))
                }
                onDrop={handleDropPalette}
                onDragOver={handleDragOver}
                slideRefs={slideRefs}
            />

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="border-b border-medium/60 bg-white p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold">Report Builder</h1>
                            <p className="text-sm text-deep-navy/70">
                                {currentSlide ? `Editing: ${currentSlide.name}` : 'No slide selected'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                                Preview
                            </Button>
                            <Button onClick={handleExportDeck} size="sm">
                                Export Deck
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto p-6">
                    {currentSlide ? (
                        <div className="max-w-4xl mx-auto">
                            <Card className="min-h-[600px] p-6">
                                <div className="mb-4 pb-2 border-b border-medium/40">
                                    <h2 className="text-lg font-semibold">
                                        {currentSlide.name}
                                    </h2>
                                </div>
                                
                                {currentSlide.blocks.length === 0 ? (
                                    <div 
                                        className="h-96 border-2 border-dashed border-medium/60 rounded-xl flex items-center justify-center text-deep-navy/60"
                                        onDrop={(e) => handleDropPalette(e, currentSlide.id)}
                                        onDragOver={handleDragOver}
                                    >
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">📊</div>
                                            <p>Drag blocks from the palette to start building</p>
                                            <p className="text-sm mt-1">Configure data sources in the properties panel</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {currentSlide.blocks.map((block) => (
                                            <LiveBlock
                                                key={block.id}
                                                block={block}
                                                isSelected={selectedBlock?.id === block.id}
                                                onClick={() => actions.setSelectedBlock(block.id)}
                                                onRemove={() => actions.removeBlock(currentSlide.id, block.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-deep-navy/60">
                                <div className="text-4xl mb-2">📋</div>
                                <p>Select a slide to start editing</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Block Palette */}
            <BlockPalette />

            {/* Properties Panel */}
            <BlockPropertiesPanel
                block={selectedBlock}
                onUpdateBlock={(updater) => {
                    if (selectedBlock) {
                        actions.updateBlock(selectedBlock.id, updater);
                    }
                }}
            />
        </div>
    );
}