# LeaveXact

A modern leave management system built with Next.js, React, and MongoDB.

## Features

- Employee leave request management
- Leave balance tracking
- Admin dashboard for approvals
- User authentication with JWT
- Responsive UI with Radix UI components
- Dark mode support
- Document generation (DOCX)
- Analytics and reporting

## Tech Stack

- **Framework:** Next.js 15.2.4
- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Backend:** Express, MongoDB with Mongoose
- **Authentication:** JWT, bcryptjs
- **Forms:** React Hook Form with Zod validation
- **Charts:** Recharts
- **UI Components:** shadcn/ui components

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd leavexact
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration.

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run report` - Generate reports

## Project Structure

```
leavexact/
├── app/              # Next.js app directory
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and configurations
├── public/           # Static assets
├── server/           # Backend API
├── styles/           # Global styles
└── docs/             # Documentation
```

## License

Private project.
