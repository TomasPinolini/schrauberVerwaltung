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
- **List, Filter, and Sort**: View all screwdrivers, filter by active/inactive/all, and sort by name or any attribute.
- **Add & Edit**: Add new screwdrivers or edit existing ones, including dynamic, attribute-driven forms.
- **State Management**: Activate/deactivate screwdrivers (soft delete).
- **Validation**: Advanced form validation for required fields and attribute types.
- **Attribute History**: Track and view the full change history for each screwdriver’s attributes.

### 2. Attribute Management
- **Dynamic Attributes**: Create, edit, and manage custom attributes (with name, description, regex validation, required flag, and parent/child relationships).
- **Toggle State**: Activate/deactivate attributes.
- **Parent Attributes**: Hierarchical attribute organization and parent attribute value management.
- **Attribute Value Management**: Add, edit, and remove possible values for parent attributes.

### 3. Reporting & Statistics
- **Dashboard**: Overview with total, active, and inactive screwdriver counts.
- **Daily Creation Stats**: Visualize screwdriver creation over time.
- **Top Attributes**: See most-used attributes in the system.
- **Activity Log**: Full audit trail of all significant actions (create, update, delete, toggle) for screwdrivers and attributes.
- **Attribute Distribution**: Analyze value distributions for parent attributes.

### 4. Data Integrity & History
- **Structured Storage**: Organized storage in `one_payload` and `all_data` directories.
- **Validation Patterns**: Enforce data integrity with regex patterns on attributes.
- **Historical Records**: Maintain complete attribute and screwdriver change history.

### 5. User Experience
- **Modern React UI**: Responsive, consistent design with loading indicators and error handling.
- **Comprehensive Error Handling**: Clear feedback for all async and validation errors.

### 6. API & Extensibility
- **RESTful API**: Full-featured backend for CRUD operations, statistics, and reporting.
- **Extensible Models**: Easily add new attributes or extend screwdriver data model.

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