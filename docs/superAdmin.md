SuperAdmin Features
1. Authentication & Access Control
SuperAdmin has separate login route (/superadmin/login).
Role-based access enforcement.
Session management + environment badge (Demo 🟠 / Live 🟢).



2. Consultant (Tenant) Management
Create, update, suspend, or delete consultant accounts.
Assign subscription plans to consultants.
View consultant usage statistics (number of clients, reports processed, storage usage).
Reset consultant credentials.



3. Subscription & Billing
Define subscription tiers (Free, Pro, Enterprise).
Configure pricing per consultant.
Trial management (start/end dates).
Integration-ready with payment gateway (Stripe/Paystack/Flutterwave).
LocalStorage mock data for demo mode.



4. Client Management (Indirect)
View all clients onboarded under consultants.
Drill-down into client reports, tickets, and approvals (read-only for audit).
Option to disable/enable client accounts in emergencies.



5. Reports & Analytics
Platform-wide dashboards:
Total consultants
Total clients
Reports generated
Approvals pending
Subscription revenue (mocked in demo)
Export options (CSV, PDF).



6. Feature Flags & Configuration
Enable/disable modules per consultant:
Consolidated Reporting
Forecasting
Stress Testing
Ticketing
Rollout new features gradually.



7. Support & Ticket Oversight
View escalated client tickets not resolved by consultant.
Assign system-level support staff (future feature).



8. System Monitoring
Audit logs (logins, approvals, rejections).
Health checks (in demo, just mock states: “Healthy”, “Warning”, “Critical”).
Notifications (system-wide messages).
