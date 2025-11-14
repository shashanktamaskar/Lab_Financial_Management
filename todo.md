# Lab Finance Manager - Project TODO

## Core Database & Backend
- [ ] Design and implement database schema (expenses, debts, invoices, categories)
- [ ] Create database query helpers in server/db.ts
- [ ] Build tRPC procedures for CRUD operations on expenses and debts
- [ ] Implement invoice file upload and storage integration

## Invoice Import & Processing
- [ ] Set up file upload endpoint for invoice files (PDF, Excel, CSV)
- [ ] Implement invoice parsing logic to extract financial data
- [ ] Create invoice processing pipeline to populate expenses
- [ ] Add invoice history tracking and management

## Expense Tracking
- [ ] Build expense creation, read, update, delete procedures
- [ ] Implement expense categorization system
- [ ] Add date filtering and search capabilities
- [ ] Create expense list view with pagination

## Debt Management
- [ ] Design debt tracking schema with creditor/debtor info
- [ ] Implement debt CRUD operations (create, read, update, delete)
- [ ] Add debt status tracking (pending, paid, partial)
- [ ] Create debt settlement history tracking

## Dashboard & Reporting
- [ ] Build main dashboard layout with key metrics
- [ ] Implement monthly financial summary view
- [ ] Implement weekly financial summary view
- [ ] Create expense breakdown by category charts
- [ ] Add debt overview and status indicators
- [ ] Build total balance and cash flow visualization

## Frontend Pages & Components
- [ ] Create dashboard home page with overview
- [ ] Build expense tracking page with list and filters
- [ ] Create debt management page with CRUD interface
- [ ] Implement invoice upload page
- [ ] Add settings/configuration page
- [ ] Build navigation and layout structure

## Gemini API Integration
- [ ] Set up Gemini API key configuration
- [ ] Implement OneDrive folder data access via Gemini
- [ ] Create data import pipeline from OneDrive
- [ ] Add sync status and error handling

## Testing & Deployment
- [ ] Test all CRUD operations locally
- [ ] Verify invoice import functionality
- [ ] Test Gemini API integration
- [ ] Prepare deployment configuration
- [ ] Document deployment instructions

## Completed Features
- [x] Project initialized with full-stack setup
