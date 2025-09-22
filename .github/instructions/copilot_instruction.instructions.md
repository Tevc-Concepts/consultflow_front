---
applyTo: '**'
---
---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.
# Consultflow Frontend Development Guidelines
This document outlines the coding guidelines and project context for the Consultflow frontend development. Adhering to these guidelines will ensure consistency, maintainability, and quality across the codebase.

## General Principles
1. **Clarity**: Code should be easy to read and understand. Use meaningful variable and function names.
2. **DRY**: Don't Repeat Yourself. Abstract common functionality into reusable components or functions.
3. **Testing**: Write tests for new features and bug fixes. Ensure all tests pass before submitting changes.
4. **Documentation**: Update documentation to reflect changes in functionality or usage.
5. **Performance**: Optimize for performance, especially in rendering and data fetching.
6. **Accessibility**: Ensure the application is accessible to all users, following WCAG guidelines.
7. **Security**: Follow best practices for security, especially when handling user data and authentication.
8. **Version Control**: Use clear and descriptive commit messages. Follow branching strategies as defined in the project.
9. **Code Reviews**: Participate in code reviews, providing constructive feedback and ensuring adherence to guidelines.
10. **Continuous Learning**: Stay updated with the latest technologies and best practices relevant to the project.
11. **compartmentalization**: Keep code modular and organized by feature or domain.
12. **Consistency**: Follow established patterns and conventions used in the codebase.
13. **Error Handling**: Implement robust error handling and logging mechanisms.
14. **State Management**: Use appropriate state management techniques (e.g., React Context, Redux) as per the project requirements.
15. **API Integration**: Follow the defined API contracts and handle responses and errors gracefully.
16. **Responsive Design**: Ensure the application is responsive and works well on various devices and screen sizes.
17. **Environment Variables**: Use environment variables for configuration and sensitive information, avoiding hardcoding values in the codebase.
18. **Dependency Management**: Regularly update dependencies and monitor for security vulnerabilities.
19. **Backward Compatibility**: Ensure new changes do not break existing functionality unless explicitly intended.

## Code Structure
- Organize code into modules and components.
- Follow a consistent file naming convention (e.g., `camelCase` for files and folders).
- Keep related code together and separate unrelated code.

## Styling
- Follow the project's coding style guide (e.g., indentation, spacing, line length).
- Use linters and formatters to enforce style rules.

- Write CSS in a modular way, using CSS-in-JS or CSS modules as appropriate.

# GitHub Copilot AI Agent Instruction

You are assisting in building **Consultflow Frontend** using:

* **Next.js (latest, App Router)** for React SSR/SSG
* **Vite** for local dev bundling and performance
* **TailwindCSS** for styling
* **shadcn/ui** components with consistent design system
* **framer-motion** for animations
* **next-pwa** for offline-first Progressive Web App
* **Frappe BaaS backend** (Consultflow API v2.0) for all server-side data and workflows (/doc/API_Documentation.md)
* **domain-driven architecture (DDA)** for modular code separation
* **Coesive UI/UX** with gradients, soft shadows, rounded cards, and modern minimal style
* **Code lines**: code lines should not exceed 300 lines per file for maintainability

## Goals

* Build a **PWA-ready**, **scalable**, and **accessible** front-end.
* Integrate seamlessly with **Frappe API endpoints** for authentication, donations, needs, logistics, impact tracking, and notifications.
* UI must use **gradient backgrounds**, **soft shadows**, **rounded cards**, and a **modern minimal style**.
* Follow **domain patterns**: `features/`, `entities/`, `shared/` directories to separate concerns.
* Ensure full **responsive design** across devices.

## Project Setup

1. Scaffold with `create-next-app@latest` and configure Vite plugin for Next.js.
2. Add **TailwindCSS** with custom theme (colors, typography, gradients).
3. Integrate **shadcn/ui** and configure `tailwind.config.js`.
4. Add **framer-motion** for smooth animations.
5. Configure **next-pwa** for offline-first experience and push notifications.
6. Setup **absolute imports & aliases** for `@features`, `@entities`, `@shared`.
7. Implement **eslint + prettier** for consistency.
8. Add **i18n** support with `next-intl`.
9. Create **API service layer** to interact with Frappe endpoints (`/auth_api`, `/need_api`, `/donation`, `/impact_api`, `/volunteer_api`, `/file_api`, `/notification_api`).
10. Implement token/session management using `sid` from Frappe authentication.

## Domain Pattern Architecture

```
/src
 ├── app/                 # Next.js app router pages/layouts
 ├── features/            # Business capabilities (donations, logistics, volunteers)
 ├── entities/            # Core domain models (user, organization, need, donation)
 ├── shared/              # UI components, hooks, utils, API client
 ├── styles/              # Tailwind/global styles
 └── config/              # App-level config, pwa, i18n, API base URL
```


## UI Guidelines

* Gradients for headers and hero sections (`bg-gradient-to-r from-indigo-500 to-purple-600`)
* Soft shadows (`shadow-lg`, `shadow-indigo-200/50`)
* Rounded corners (`rounded-2xl`)
* Minimal, accessible typography
* Consistent card-based layout with hover states
* Support dark mode

## Design System Rules (Consultflow Brand)

- **Primary Colors**  
  - Deep Navy `#0C2340` (main brand, headers, CTAs)  
  - Forest Green `#003C2D` (secondary brand, accents)  

- **Spectrum Colors** (for features, role highlights, infographics):  
  - Emerald `#3AD29F`  
  - Teal `#12B5B1`  
  - Cobalt `#2774FF`  
  - Amber `#FFB547`  
  - Coral `#FF6F59`  
  - Violet `#8D4DFF`  

- **Neutral Colors** (backgrounds, cards, typography balance):  
  - Light `#F5F8F6`  
  - Medium `#E8ECEB`  

### Gradient & Shadow Usage
- Use **gradient overlays** to give depth to hero, CTA, and section dividers. Examples:  
  - `from-deep-navy via-forest-green to-cobalt` for corporate/NGO sections.  
  - `from-amber to-coral` for donation-related highlights.  
  - `from-emerald to-teal` for volunteer & logistics sections.  
- **Card shadows** must feel soft but modern:  
  - Default card: `shadow-lg shadow-deep-navy/10`  
  - Hover: `shadow-xl shadow-cobalt/20` with slight scale via `framer-motion`.  
- **Rounded corners**: always `rounded-2xl` for cards and `rounded-full` for badges/buttons.  

### Landing Page Enforcement
- The marketing landing page **must follow the provided mockup**:  
  - Hero with gradient background, logo top-left, nav items top-right.  
  - Sections: About, Services, Contact, each with consistent use of brand colors.  
  - Icons/illustrations can use **Spectrum Colors** as accents.  
  - Typography hierarchy:  
    - Headings: serif or display-like font (via `next/font`), Deep Navy or Forest Green.  
    - Body: modern sans-serif, neutral colors.  

### Role-based Section Visual Identity
- Donor flows: Coral + Amber  
- NGO flows: Forest Green + Teal  
- Corporate: Deep Navy + Cobalt  
- Volunteers: Emerald + Teal  
- Logistics: Cobalt + Violet  

### High-level feature list (frontend)

Your frontend must include these features (generate UIs & demo flows):
Core UI flows (MVP):
- Auth (mock) + role switch (Consultant / Client).
- Dashboard (company selector, consolidated KPIs: Revenue, Gross Profit, Net Income, Cash Balance, Burn Rate).
- Multi-entity consolidation UI (group selector).
Reports view:
- P&L, Balance Sheet, Cash Flow with date picker and compare mode.
- Drill-down rows (touch-friendly).
- Report Builder (drag & drop cards into a presentation slide).
AI Assistant widget:
- Natural-language questions → returns summary (mocked by demo API).
“Explain like I’m a CEO/CFO/Accountant”.
Presentations export:
Generate PDF slide deck from report (jspdf/html2canvas demo).
Tax Compliance page:
- VAT, PAYE, WHT, CIT forms prefilled from demo data.
- Compliance calendar with reminders.
Bank sync (mock):
- Reconcile transactions, show bank feed.
- Upload & data-cleaning:
- CSV/Excel upload with preview & smart mapping UI.
Client Portal:
- Share reports, comment, approve (simple annotation).
Settings & integrations:
- Connectors (ERPNext, QuickBooks, Xero) — for demo, add toggles that simulate data pulls.
- Make every page responsive — one column cards on mobile, 2+ columns on desktop.