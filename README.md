# Schrauber Verwaltung

A comprehensive system for managing and processing screwdriver controller data from multiple controller types, designed to handle real-time data processing, standardized storage, and detailed reporting.

## Recent Updates

- **Unified Processing**: Implemented a simplified unified processor that handles all controller types with a consistent approach
- **Batch Processing**: Added batch processing capabilities for historical data migration
- **Improved Data Extraction**: Enhanced field mapping for more accurate data extraction
- **Table Name Handling**: Added support for custom table names via payload.Table property
- **Improved UI**: Modern responsive interface with Tailwind CSS
- **Enhanced Navigation**: Fully functional navbar with mobile support
- **Better State Management**: Implemented useReducer for more robust form handling

## Project Overview

Schrauber Verwaltung is specialized in processing and storing data from various screwdriver controllers used in manufacturing. The system handles different controller types (MFV3, MFV23, MOE61, GH4) with varying data structures and formats, standardizing them for database storage and analysis. It combines data processing capabilities with a full-featured web application for screwdriver management, attribute tracking, and reporting.

## Project Structure

```
schrauber_verwaltung/
├── data/                            # Core data processing and storage
│   ├── all_data/                    # Aggregated data files for batch processing
│   ├── batch_results/               # SQL output files from batch processing
│   ├── analysis_results/            # Analysis reports and statistics
│   ├── processors/                  # Data processing scripts
│   │   ├── simplified_unified_processor.js  # Unified processor for all controller types
│   │   ├── batch_processor.js       # Batch processor for historical data
│   │   ├── deep_analysis_processor.js # Processor for detailed data analysis
│   │   ├── specific/                # Controller-specific processors (legacy)
│   │   │   ├── process_MFV3_*.js    # MFV3 controller processors
│   │   │   ├── process_MFV23_*.js   # MFV23 controller processors
│   │   │   ├── process_MOE61_*.js   # MOE61 controller processors
│   │   │   └── process_MOE6_*.js    # MOE6/GH4 controller processors
│   │   └── jsonKeys.txt             # Mapping of JSON fields to database columns
│   ├── Upserts/                     # Database upsert scripts
├── backend/                         # Backend server (Node.js + Express)
│   ├── src/
│   │   ├── controllers/             # API endpoints and business logic
│   │   │   ├── attributeController.js       # Attribute management
│   │   │   ├── attributeValueController.js  # Attribute value management
│   │   │   └── screwdriverController.js     # Screwdriver CRUD and reporting
│   │   ├── models/                  # Sequelize ORM models
│   │   ├── routes/                  # API route definitions
│   │   ├── middleware/              # Express middleware
│   │   ├── utils/                   # Utility functions
│   │   └── app.js                   # Express app configuration
│   ├── .env                         # Environment configuration
│   └── schrauber_verwaltung.sql     # Database schema
├── frontend/                        # Frontend React application
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── attributes/          # Attribute management UI
│   │   │   ├── reports/             # Reporting and dashboard widgets
│   │   │   ├── screwdrivers/        # Screwdriver management UI
│   │   │   └── ui/                  # Shared UI components
│   │   ├── pages/                   # Application pages
│   │   └── App.jsx                  # Main application component
│   └── index.html                   # HTML entry point
├── dashboard.json                   # Grafana dashboard configuration
├── node_red_errors.json             # Node-RED error handling configuration
└── package.json                     # Project dependencies and scripts
```

## Features

### 1. Multi-Controller Support
- **Standard Controllers**: Process data from MFV3, MFV23, and MOE61 controllers with flat JSON structures
- **GH4 Controller**: Handle nested data structures with multiple channels (up to 4 screwdrivers simultaneously)
- **Format Normalization**: Convert different naming conventions and data formats to a standardized structure

### 2. Data Processing
- **Unified Processing**: Single processor that handles all controller types with consistent field mapping
- **Batch Processing**: Process large historical data files with line-by-line JSON parsing
- **Deep Analysis**: Generate comprehensive statistics and reports from historical data
- **Base64 Decoding**: Process base64-encoded graph data for torque and angle measurements
- **ID Code Parsing**: Extract material and serial numbers from different ID code formats
- **Field Mapping**: Map varying JSON field names to standardized database columns
- **Tightening Method Support**: Handle both torque-based and angle-based final tightening methods
- **Custom Table Names**: Support for specifying the table name via payload.Table property

### 3. Data Storage
- **Standardized Database**: Store processed data in a consistent format regardless of source controller
- **Graph Data Preservation**: Store detailed torque and angle graph data for analysis
- **Metadata Retention**: Preserve controller-specific metadata for debugging and auditing

### 4. Screwdriver Management
- **CRUD Operations**: Create, read, update, and delete screwdriver records
- **State Management**: Activate/deactivate screwdrivers (soft delete)
- **Filtering & Sorting**: Filter by active/inactive state and sort by various attributes
- **Attribute History**: Track changes to screwdriver attributes over time

### 5. Attribute System
- **Dynamic Attributes**: Create and manage custom attributes for screwdrivers
- **Parent-Child Relationships**: Support hierarchical attribute structures
- **Validation Rules**: Apply validation patterns to ensure data integrity
- **Default Values**: Set default values for attributes

### 6. Reporting & Analytics
- **Dashboard Integration**: Grafana dashboard for visualizing screwdriver data
- **Statistical Reports**: View screwdriver counts, attribute distributions, and usage patterns
- **Activity Logging**: Track all significant actions in the system
- **Data Export**: Export reports and data for external analysis

### 7. User Interface
- **React Frontend**: Modern, responsive user interface built with React
- **Interactive Components**: Dynamic forms, tables, and charts
- **Navigation**: Intuitive navigation between different system areas

## Data Processing System

### Simplified Unified Processor
The core of the data processing system is the simplified unified processor (`simplified_unified_processor.js`), which:
- Handles all controller types with a single, consistent approach
- Automatically detects controller type from payload structure
- Extracts data using standardized field mapping
- Supports custom table names via payload.Table property
- Generates SQL statements for database insertion
- Provides detailed error handling and reporting

### Batch Processor
For processing historical data, the batch processor (`batch_processor.js`):
- Processes large text files containing multiple JSON payloads
- Handles each line as a separate JSON object
- Uses the simplified unified processor for consistent data extraction
- Generates SQL files for database import
- Provides progress tracking and success rate statistics

### Deep Analysis Processor
For detailed data analysis, the deep analysis processor (`deep_analysis_processor.js`):
- Analyzes data across all controller types
- Collects statistics on torque and angle values
- Generates comprehensive reports on data quality and distribution
- Identifies patterns and anomalies in the data

## Controller Data Structures

### Standard Controllers (MFV3, MFV23, MOE61)
- **ID Format**: "L 000000151112"
- **Structure**: Flat JSON with single controller data
- **Graph Data**: May use base64 encoding or array format
- **Example Fields**: `date`, `id code`, `prg nr`, `tightening steps`

### GH4 Controller (MOE6_Halle206_GH4)
- **ID Format**: "R901450936-1108_001" (includes material and serial numbers)
- **Structure**: Nested JSON with `channels` array containing multiple screwdriver data
- **Graph Data**: Primarily uses base64 encoding
- **Example Fields**: Root level `date`, `channels[x].tightening steps`

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- SQL Server (with database schema from `backend/schrauber_verwaltung.sql`)
- Node-RED (for live data processing)

### Running the Batch Processor
```bash
# Navigate to the project directory
cd schrauber_verwaltung

# Run the batch processor
node data/processors/batch_processor.js
```

### Using the Unified Processor in Node-RED
1. Create a new function node in your Node-RED flow
2. Copy the entire contents of `data/processors/simplified_unified_processor.js` into the function node
3. Configure the input to receive JSON payloads from your MQTT or HTTP source
4. Add a change node before the function to set `msg.payload.Table` to the appropriate table name
5. Connect the output to your database node for SQL execution
- XAMPP (for local development)

### Installation
1. Clone the repository
```bash
git clone https://github.com/TomasPinolini/SchrauberVerwaltung.git
cd schrauber_verwaltung
```

2. Install dependencies for all components
```bash
npm run install:all
```

3. Configure database connection
   - Update database connection settings in `backend/.env`

4. Initialize the database
```bash
cd backend
mysql -u your_username -p < schrauber_verwaltung.sql
```

5. Run the application
```bash
npm start
```

## Data Processing Flow

1. Screwdriver controller generates JSON payload
2. System identifies controller type and selects appropriate processor
3. Processor extracts and normalizes data fields according to jsonKeys.txt mapping
4. Processor decodes any base64-encoded graph data
5. Normalized data is inserted into the database
6. Data becomes available for reporting and analysis through the web interface

## API Endpoints

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

### Statistics
- GET `/api/screwdrivers/statistics/overview` - Get overview statistics
- GET `/api/screwdrivers/statistics/attribute/:attributeId` - Get distribution for a parent attribute

### Auftraege
- GET `/api/auftraege` - Get all screwdrivers
- POST `/api/auftraege` - Create new screwdriver
- GET `/api/auftraege/:id` - Get specific screwdriver
- PUT `/api/auftraege/:id` - Update screwdriver
- DELETE `/api/auftraege/:id` - Delete screwdriver

<!-- ### Log
- GET `/api/log` - Get all log entries
- POST `/api/log` - Create new log entry
- GET `/api/log/:id` - Get specific log entry
- PUT `/api/log/:id` - Update log entry
- DELETE `/api/log/:id` - Delete log entry

### Health
- GET `/api/health` - Get health status

### Test DB
- GET `/api/test-db` - Test database connection -->

## Database Schema

The system uses a standardized database schema with the following key tables:
- `dbo.Auftraege`: Main table for storing processed screwdriver data
- `Screwdriver`: Screwdriver entity information
- `Attribute`: Attribute definitions
- `ScrewdriverAttribute`: Mapping of screwdrivers to their attributes/values
- `ActivityLog`: Audit trail of all significant actions

## Node-RED Integration

The system includes Node-RED flows for data processing automation:
- Controller-specific processing nodes
- Error handling and logging
- Database integration

## Grafana Dashboard

The included Grafana dashboard (dashboard.json) provides:
- Real-time monitoring of screwdriver operations
- Historical trend analysis
- Performance metrics visualization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "HH:MM - DD/MM/YYYY - Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add your license information here]