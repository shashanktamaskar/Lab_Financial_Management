# Lab Finance Manager

A comprehensive financial management web application built for laboratory and research organizations. Track expenses, manage debts, process invoices, and visualize financial data with an intuitive dashboard.

## Features

- **Expense Tracking**: Record and categorize lab expenses with detailed notes
- **Debt Management**: Track loans, leases, and payment schedules
- **Invoice Processing**: Upload and parse PDF/Excel/CSV invoices automatically
- **Analytics Dashboard**: Visualize spending trends with interactive charts
- **Multi-Category Support**: Organize expenses with customizable categories
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode Support**: Built-in theme switching capability

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Radix UI** for accessible components
- **Recharts** for data visualization
- **tRPC** for type-safe API calls
- **React Query** for data fetching

### Backend
- **Node.js** with Express
- **tRPC** for API endpoints
- **Drizzle ORM** for database management
- **MySQL** database
- **AWS S3** for file storage

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (package manager)
- MySQL 8+ (for full-stack development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shashanktamaskar/Lab_Financial_Management.git
   cd Lab_Financial_Management
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Start MySQL and create database
   mysql -u root -p -e "CREATE DATABASE lab_finance;"

   # Run migrations
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   # Start backend
   pnpm dev

   # In another terminal, start frontend
   cd client
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## Project Structure

```
Lab_Financial_Management/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # Reusable UI components
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── pages/        # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Expenses.tsx
│   │   │   ├── Debts.tsx
│   │   │   ├── Invoices.tsx
│   │   │   └── NotFound.tsx
│   │   ├── contexts/     # React contexts
│   │   ├── lib/          # Utilities and helpers
│   │   ├── App.tsx       # Main app component
│   │   ├── main.tsx      # Entry point
│   │   └── index.css     # Global styles
│   └── index.html        # HTML template
├── server/               # Backend application
│   ├── _core/           # Core server files
│   │   ├── index.ts     # Server entry point
│   │   └── trpc.ts      # tRPC configuration
│   ├── db.ts            # Database queries
│   ├── routers.ts       # API routes
│   ├── schema.ts        # Database schema
│   ├── storage.ts       # S3 storage utilities
│   ├── invoiceParser.ts # Invoice parsing logic
│   └── invoiceUpload.ts # Invoice upload handler
├── .github/             # GitHub Actions workflows
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind configuration
├── drizzle.config.ts    # Drizzle ORM configuration
└── package.json         # Dependencies and scripts
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm check` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema changes

## Database Schema

The application uses the following main tables:

- **users** - User accounts
- **expenseCategories** - Expense categories with colors
- **expenses** - Expense records
- **invoices** - Uploaded invoice files
- **debts** - Debt tracking
- **debtPayments** - Payment history
- **onedriveSync** - OneDrive sync status

## Environment Variables

See `.env.example` for all required environment variables:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/lab_finance

# Server
PORT=3000
NODE_ENV=development

# AWS S3 (for invoice storage)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket

# Session
SESSION_SECRET=your_secret_key
```

## Deployment

### GitHub Pages (Demo Mode)

The application can be deployed to GitHub Pages in demo mode with mock data:

1. **Enable GitHub Pages** in your repository settings
2. **Push to main branch** - GitHub Actions will automatically build and deploy

The workflow is configured in `.github/workflows/deploy.yml`

### Full Stack Deployment

For a full deployment with backend:

1. **Frontend**: Deploy to Vercel, Netlify, or GitHub Pages
2. **Backend**: Deploy to Railway, Render, or AWS
3. **Database**: Use PlanetScale, AWS RDS, or DigitalOcean

Update the `VITE_API_URL` in your frontend environment to point to your backend API.

## Features in Detail

### Expense Tracking
- Create, read, update, and delete expenses
- Categorize expenses with color-coded categories
- Add detailed notes and descriptions
- Filter by date range
- View spending trends over time

### Debt Management
- Track multiple debts with creditor information
- Monitor interest rates and due dates
- Record payment history
- Track debt status (active, paid, overdue)
- Calculate total outstanding balances

### Invoice Processing
- Upload PDF, Excel, or CSV invoice files
- Automatic data extraction using pattern matching
- Parse invoice numbers, dates, and line items
- Convert invoices to expense entries
- Store files in AWS S3

### Dashboard Analytics
- Daily, weekly, and monthly spending trends
- Expense breakdown by category (pie chart)
- Debt status distribution (bar chart)
- Key metrics: total expenses, total debt, average spending
- Interactive charts with Recharts

## Development

### Adding New Features

1. **Define Database Schema** in `server/schema.ts`
2. **Create tRPC Routes** in `server/routers.ts`
3. **Add Database Queries** in `server/db.ts`
4. **Create UI Components** in `client/src/components`
5. **Add Pages** in `client/src/pages`
6. **Update Router** in `client/src/App.tsx`

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Maintain consistent naming conventions
- Add comments for complex logic

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Vite cache
rm -rf client/node_modules/.vite
```

### Database Connection Issues

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Type Errors

```bash
# Run type checking
pnpm check

# Regenerate types
pnpm db:push
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Roadmap

- [ ] User authentication with OAuth
- [ ] OneDrive integration for automatic invoice sync
- [ ] Gemini AI for advanced invoice parsing
- [ ] Export financial reports to PDF
- [ ] Recurring expense tracking
- [ ] Budget planning and forecasting
- [ ] Multi-currency support
- [ ] Email notifications for due dates
- [ ] Mobile app (React Native)

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)

---

**Made with ❤️ for laboratory financial management**
