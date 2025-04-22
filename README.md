# Schrauber Verwaltung

A management system for screwdriver data and operations.

## Project Structure

```
schrauber_verwaltung/
├── backend/           # Backend server and API
│   ├── src/          # Source code
│   ├── package.json  # Backend dependencies
│   └── database.sql  # Database schema
├── frontend/         # Frontend application
│   ├── js/          # JavaScript files
│   ├── css/         # Stylesheets
│   ├── index.html   # Main page
│   ├── reports.html # Reports page
│   ├── inactive.html# Inactive items page
│   └── attributes.html # Attributes management
└── data/            # Data storage
    ├── one_payload/ # Single payload files (one per screwdriver)
    └── all_data/    # Complete data files (multiple payloads)
```

## Data Structure

- `one_payload/`: Contains individual payload files from each screwdriver
- `all_data/`: Contains complete data sets with multiple payloads from the same screwdrivers

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   cd backend
   npm install
   ```

2. Configure environment variables (see `.env.example`)

3. Set up the database:
   ```bash
   mysql -u your_username -p < backend/database.sql
   ```

4. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

5. Open the frontend in your browser:
   - Navigate to `http://localhost:3001`

## Environment Configuration

Create a `.env` file in the backend directory with the following variables:
```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=schrauber_db
PORT=3000
```

## Features

- Screwdriver data management
- Real-time data processing
- Reporting and analytics
- Attribute management
- Inactive items tracking

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Add your license information here] 