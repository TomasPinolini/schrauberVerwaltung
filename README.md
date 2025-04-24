# Schrauber Verwaltung

A comprehensive management system for screwdriver data and operations, designed to handle real-time data processing, attribute management, and detailed reporting.

## Project Structure

```
schrauber_verwaltung/
├── backend/           # Backend server and API
│   ├── src/          # Source code
│   │   ├── controllers/  # API controllers
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Custom middleware
│   │   └── utils/       # Utility functions
│   ├── package.json  # Backend dependencies
│   └── database.sql  # Database schema
├── frontend/         # Frontend application
│   ├── src/         # Source code
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── utils/      # Utility functions
│   ├── public/      # Static assets
│   └── package.json # Frontend dependencies
└── data/            # Data storage
    ├── one_payload/ # Single payload files (one per screwdriver)
    └── all_data/    # Complete data files (multiple payloads)
```

## Features

### 1. Screwdriver Management
- **Real-time Data Processing**: Capture and process screwdriver data in real-time
- **Data Validation**: Validate screwdriver data against predefined patterns
- **State Management**: Track active/inactive status of screwdrivers
- **Detailed Information**: Store comprehensive screwdriver details including:
  - IP Address
  - MAC Address
  - Department information
  - Custom attributes

### 2. Attribute Management
- **Dynamic Attributes**: Create and manage custom attributes with a streamlined interface
- **Validation Patterns**: Define optional regex patterns for data validation
- **State Control**: Toggle attribute states (active/inactive) with visual feedback
- **Required Fields**: Mark attributes as mandatory or optional
- **Parent Attributes**: Designate attributes as parents for hierarchical organization
- **Description Support**: Add detailed descriptions for better user understanding
- **Consistent UI**: Unified design patterns across attribute and screwdriver forms

### 3. Reporting System
- **Comprehensive Reports**: Generate detailed reports on screwdriver data
- **Custom Filters**: Filter reports by various criteria
- **Export Capabilities**: Export reports in multiple formats
- **Historical Data**: Track and analyze historical screwdriver data

### 4. Data Management
- **Structured Storage**: Organized data storage in one_payload and all_data directories
- **Data Validation**: Ensure data integrity through validation patterns
- **State Tracking**: Monitor and manage screwdriver states
- **Historical Records**: Maintain complete history of screwdriver data

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone [repository-url]
cd schrauber_verwaltung
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=schrauber_db
PORT=3000
JWT_SECRET=your_jwt_secret
```

Initialize the database:
```bash
mysql -u your_username -p < database.sql
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Start the Application

Start the backend server:
```bash
cd backend
npm start
```

Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## API Documentation

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout

### Screwdrivers
- GET `/api/screwdrivers` - Get all screwdrivers
- POST `/api/screwdrivers` - Create new screwdriver
- GET `/api/screwdrivers/:id` - Get specific screwdriver
- PUT `/api/screwdrivers/:id` - Update screwdriver
- DELETE `/api/screwdrivers/:id` - Delete screwdriver

### Attributes
- GET `/api/attributes` - Get all attributes
- POST `/api/attributes` - Create new attribute
- GET `/api/attributes/:id` - Get specific attribute
- PUT `/api/attributes/:id` - Update attribute
- PATCH `/api/attributes/:id/toggle-state` - Toggle attribute state
- DELETE `/api/attributes/:id` - Delete attribute

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "HH:MM - DD/MM/YYYY - Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add your license information here] 