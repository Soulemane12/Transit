# NYC Transit Flood Monitor 🚇🌊

A real-time flood risk assessment system for NYC subway entrances that combines MTA data, stormwater flood maps, and crowdsourced rider reports to identify flooding hotspots and suggest mitigation strategies.

## 🎯 What it does

### Demo-ready features:
- **Risk Map**: Interactive visualization of subway entrances ranked by stormwater/flood exposure
- **Live Status**: Overlays MTA alerts + rider reports to spotlight active flooding issues
- **Action Panel**: Suggests nearby, feasible mitigations (modular barriers, rain gardens, permeable pavers) for each hotspot
- **Crowdsourced Reporting**: Allows riders to report flooding conditions in real-time

## 🗂️ Data Sources

### APIs & Datasets (all free/official):

1. **Subway Entrances/Exits**: NYS/MTA entrances dataset with coordinates & metadata
   - Source: [Data.gov - NY State](https://data.ny.gov/resource/i9wp-a4ja.json)

2. **Stormwater Flood Polygons**: NYC Stormwater Flood Maps (rainfall-based flooding)
   - Source: [NYC Open Data](https://data.cityofnewyork.us/resource/qcg9-hq2p.geojson)

3. **MTA Real-time Alerts**: Live service disruptions and alerts
   - Source: [MTA Developer Portal](https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts)

4. **Basemap & Visualization**: Mapbox for interactive mapping
   - Source: [Mapbox](https://www.mapbox.com/)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Mapbox account (free tier available)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Add your Mapbox token to `.env.local`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```

   Get a free token at: https://account.mapbox.com/access-tokens/

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Mapping**: Mapbox GL JS
- **Styling**: Tailwind CSS
- **Data Processing**: Turf.js for geospatial calculations
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 🗺️ Features Overview

### Interactive Map
- Color-coded subway entrances by flood risk (red = high, orange = medium, green = low)
- Flood zone overlays showing stormwater accumulation areas
- Real-time alert markers for active flooding incidents
- Clickable entrances for detailed information

### Entrance Detail Panel
- Flood risk assessment with exposure percentage
- Active alerts (both MTA official and crowdsourced)
- Suggested mitigation strategies with cost estimates
- Crowdsourced flood reporting form

### Dashboard Header
- Key statistics: total entrances, high-risk count, active alerts
- Real-time refresh capability
- Last updated timestamp

### Risk Assessment Algorithm
The flood risk calculation considers:
- Proximity to stormwater flood zones
- Historical flood depth data
- Real-time weather and alert data
- Entrance elevation and drainage characteristics

## 🛠️ Development

### Project Structure
```
src/
├── app/                    # Next.js app router
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard component
│   ├── FloodMap.tsx      # Mapbox map component
│   ├── EntrancePanel.tsx # Side panel for entrance details
│   └── StatusHeader.tsx  # Header with statistics
├── lib/                   # Utilities and services
│   ├── dataService.ts    # Data fetching and processing
│   └── constants.ts      # Configuration constants
├── types/                 # TypeScript type definitions
├── data/                  # Mock data for development
└── app/api/              # API routes
```

### Key Components

- **DataService**: Centralized data fetching from NYC APIs
- **FloodMap**: Mapbox integration with custom layers
- **EntrancePanel**: Detailed view with mitigation suggestions
- **Risk Calculator**: Geospatial analysis for flood exposure

## 🔧 Customization

### Adding New Data Sources
1. Define types in `src/types/index.ts`
2. Add API endpoints to `src/lib/constants.ts`
3. Implement fetch logic in `src/lib/dataService.ts`
4. Update visualization in `src/components/FloodMap.tsx`

### Modifying Risk Calculations
Edit the `calculateFloodRisk` method in `src/lib/dataService.ts` to adjust:
- Distance thresholds for flood zones
- Weight factors for different risk types
- Risk level boundaries

### Adding Mitigation Options
Update `MITIGATION_OPTIONS` in `src/lib/constants.ts` with new suggestions including:
- Cost estimates
- Implementation timeframes
- Effectiveness ratings

## 📱 Mobile Support

The application is responsive and works on mobile devices with:
- Touch-friendly map interactions
- Responsive panel layouts
- Optimized performance for mobile networks

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build image
docker build -t transit-flood-monitor .

# Run container
docker run -p 3000:3000 transit-flood-monitor
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For questions or issues:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs

---

Built with ❤️ for NYC transit riders and flood resilience.
