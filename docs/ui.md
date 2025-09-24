# UI & Design System

The UI is built with TailwindCSS and small, composable components.

## Design principles

- Modern minimal look, gradients for hero/headers
- Soft shadows and rounded corners (rounded-2xl for cards)
- Accessible typography and color contrast
- Responsive by default (single column on mobile, multi-column on desktop)

## Components

- `components/ui/*`: primitives like Button, Card, Modal, KPI, BrandBadge
- `shared/components/*`: feature-level components like ReportTable, PLPreview, ApprovalStatusBadge, ApprovalTimeline, OutboxPanel, AIWidget, CSVTemplateDownload

## Navigation & Shell

- App shell with sidebar and mobile nav in `shared/components/AppShell.tsx` and `shared/components/Sidebar.tsx` / `shared/components/MobileNav.tsx`
- Route transitions and subtle motion via Framer Motion (in AppShell)

## Theming

- Tailwind config defines brand colors (Deep Navy, Forest Green, spectrum accents) and utilities
- Global styles in `src/styles/globals.css`

## Accessibility

- Buttons and interactive elements provide clear focus states
- Tables use semantic markup; drill-down rows are tap friendly
