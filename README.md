# RescueFinder 🐾

A web application to help find adoptable pets from shelters and rescues across Los Angeles County. Built with web scraping to aggregate pets from multiple shelter systems.

**🚀 Live Demo:** [Coming soon on Render]

## Features

- 🔍 **Search & Filter** - Find pets by species, breed, age, size, and gender
- 📸 **Photo Galleries** - Browse photos of each pet
- 🏠 **Shelter Info** - View shelter contact details and locations
- 📱 **Responsive Design** - Works beautifully on all devices
- 🔄 **Auto-Scraping** - Automatically fetches latest pets on first visit
- 🐕 **Real Data** - 160+ pets from 6 LA County Animal Care Centers

## Supported Shelters

### LA County Animal Care Centers (6 locations) ✅ Working
- Agoura, Baldwin Park, Carson, Castaic, Downey, Lancaster

### Coming Soon
- LA City Animal Services (6 locations)
- Pasadena Humane
- spcaLA (South Bay, Long Beach)
- Best Friends Animal Society - LA

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma)
- **ORM:** Prisma 5
- **Styling:** Tailwind CSS 4
- **Scraping:** Puppeteer (headless browser)
- **Hosting:** Render (free tier available)

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or free cloud like [Neon.tech](https://neon.tech))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rescuefinder.git
   cd rescuefinder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file
   echo 'DATABASE_URL="postgresql://user:password@localhost:5432/rescuefinder"' > .env
   echo 'NEXT_PUBLIC_BASE_URL="http://localhost:3000"' >> .env
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) - it will auto-scrape pets!

## 🚀 Deploy to Render (FREE)

### Option 1: One-Click Deploy (Recommended)

1. Fork this repository to your GitHub account

2. Go to [Render Dashboard](https://dashboard.render.com)

3. Click **"New +"** → **"Blueprint"**

4. Connect your GitHub and select your forked repo

5. Render will automatically:
   - Create a PostgreSQL database (free tier)
   - Create the web service
   - Set up the DATABASE_URL

6. Set the `NEXT_PUBLIC_BASE_URL` manually:
   - Go to your web service → Environment
   - Add: `NEXT_PUBLIC_BASE_URL` = `https://your-app-name.onrender.com`

7. Deploy! 🎉

### Option 2: Manual Setup

1. **Create PostgreSQL Database:**
   - Render Dashboard → New → PostgreSQL
   - Name: `rescuefinder-db`
   - Plan: Free
   - Copy the "External Database URL"

2. **Create Web Service:**
   - Render Dashboard → New → Web Service
   - Connect your GitHub repo
   - Settings:
     - **Build Command:** `npm install && npx prisma generate && npx prisma db push && npm run build`
     - **Start Command:** `npm start`
     - **Plan:** Free

3. **Set Environment Variables:**
   - `DATABASE_URL` = (paste your PostgreSQL URL)
   - `NEXT_PUBLIC_BASE_URL` = `https://your-app-name.onrender.com`

### Render Free Tier Limitations

- ⏰ **Sleep after 15 min inactivity** - First request after sleep takes ~30 seconds to wake up
- 💾 **PostgreSQL expires after 90 days** - Recreate or upgrade before expiry
- 🔄 **750 free hours/month** - Plenty for a portfolio project

**Upgrade to Starter ($7/mo)** for always-on service.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── pets/           # Pet search endpoint
│   │   ├── breeds/         # Breed list endpoint
│   │   ├── scrape/         # Scraping trigger endpoint
│   │   └── scrape-status/  # Check if scrape needed
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── SearchFilters.tsx
│   ├── PetCard.tsx
│   ├── PetGrid.tsx
│   ├── Pagination.tsx
│   ├── AdminPanel.tsx      # Manual scrape trigger
│   └── AutoScrapeLoader.tsx # Auto-scrape on first visit
├── lib/
│   ├── db.ts               # Prisma client
│   ├── shelters.ts         # Shelter registry
│   └── scrapers/
│       ├── index.ts        # Scraper orchestrator
│       ├── types.ts        # Shared types
│       └── la-county.ts    # LA County scraper (working!)
└── types/
    └── pet.ts
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_BASE_URL` | Your app's public URL | `https://rescuefinder.onrender.com` |

## Future Enhancements

- [ ] More shelter scrapers (LA City, spcaLA, etc.)
- [ ] User accounts & favorites
- [ ] Map view with shelter locations
- [ ] Email alerts for new pets
- [ ] Expand to other cities/counties

## Contributing

PRs welcome! Especially for new shelter scrapers.

## License

MIT License - feel free to use this for your own rescue pet finder!

---

Made with ❤️ for rescue pets everywhere. 🐕🐈
