# InnoAisle - Walmart Store Intelligence Platform

An AI-powered retail analytics platform for optimizing store traffic and energy efficiency using real ML data.

## Features

- **Real ML Data Integration**: Upload your CSV datasets and see actual ML-powered insights
- **Live Analytics Dashboard**: Real-time store traffic and energy optimization metrics
- **Interactive Store Blueprint**: Visual representation of store zones with heat mapping
- **AI-Powered Recommendations**: ML-generated layout and cooling optimization suggestions
- **Walmart Brand Colors**: Professional design using official Walmart brand colors

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS with custom Walmart brand colors
- Shadcn/ui components
- Recharts for data visualization

### Backend
- Flask Python server
- scikit-learn for ML processing
- pandas for data manipulation
- CORS enabled for frontend integration

## Quick Start

### 1. Install Dependencies

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Backend

```bash
cd backend
python app.py
```

The Flask server will start on `http://localhost:5000`

### 3. Start the Frontend

```bash
npm run dev
```

The React app will start on `http://localhost:8080`

### 4. Upload Your Data

1. Click "Upload CSV Data" in the application
2. Select your CSV file with the following columns:
   - `timestamp`: Date/time of the observation
   - `zone_id`: Zone identifier (Z1, Z2, Z3, etc.)
   - `footfall`: Number of visitors
   - `zone_temp`: Temperature in the zone (optional)
   - `sales_volume`: Sales volume (optional)
   - `phase`: Time phase (morning, afternoon, etc.)
   - `product_category`: Product category
   - `day_of_week`: Day of the week

## Data Format

Your CSV should have the following structure:

```csv
timestamp,zone_id,footfall,zone_temp,sales_volume,phase,product_category,day_of_week
2024-01-01 09:00:00,Z1,45,2.5,1200,morning,Dairy,Monday
2024-01-01 09:00:00,Z2,55,4.2,1800,morning,Vegetables,Monday
...
```

## ML Features

The platform uses your actual ML code to:

1. **Train Random Forest Model**: Predicts footfall based on historical data
2. **Heat Zone Detection**: Identifies zones with high traffic that need cooling optimization
3. **Layout Recommendations**: Suggests product placement changes to reduce energy costs
4. **Traffic Predictions**: Forecasts future visitor patterns
5. **Energy Optimization**: Calculates potential savings from layout changes

## API Endpoints

- `POST /api/upload-csv`: Upload and process CSV data
- `GET /api/data`: Get current processed data
- `GET /api/health`: Health check endpoint

## Sample Data

A sample CSV file (`sample_data.csv`) is included for testing the application.

## Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
python app.py        # Start Flask server with debug mode
```

## Environment Variables

No environment variables are required for basic functionality. The application uses default configurations for development.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with real data
5. Submit a pull request

## License

This project is for educational and demonstration purposes.
