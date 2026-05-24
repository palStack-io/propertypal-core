# petPal & carPal Module Specification
**PropertyPal Core - Module Extension Design**
*Version 1.0 - February 2025*

---

## Table of Contents
1. [Current State Analysis](#1-current-state-analysis)
2. [Module System Design](#2-module-system-design)
3. [petPal Complete Specification](#3-petpal-complete-specification)
4. [carPal Backend Specification](#4-carpal-backend-specification)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Risks & Open Questions](#6-risks--open-questions)

---

## 1. Current State Analysis

### 1.1 Architecture Overview

**Backend (Flask + SQLAlchemy + PostgreSQL)**
- 10 existing models (User, Property, Document, Maintenance, Appliance, Project, Expense, Budget, Settings, APIKey)
- 12 API blueprints with JWT authentication
- Blueprint-based routing with conditional registration support
- Single-user, single-property constraint
- Local file storage + optional S3 for documents
- Alembic migrations for schema changes

**Frontend (React + Tailwind CSS)**
- Context API for state management (no Redux)
- Component-based architecture (34 components)
- React Router 6 for routing
- Sidebar navigation with conditional rendering
- Axios-based API service layer

**Infrastructure**
- Docker Compose with 4 services (db, backend, frontend, nginx)
- PostgreSQL 14 primary database
- Nginx reverse proxy
- GitHub Container Registry for production images
- Environment-based configuration (no feature flags yet)

### 1.2 Existing Systems to Leverage

#### Document Storage System ✅ **Ready**
- **Location**: `/api/documents`, `backend/app/uploads/`
- **Features**:
  - File upload with UUID-based naming
  - 25 predefined categories (extensible)
  - Expiration date tracking
  - Links to User, Property, Appliance (polymorphic support needed)
  - Local + S3 storage options
- **Extension Needed**: Add `pet_id` and `vehicle_id` foreign keys to Document model

#### Cost Tracking System ✅ **Ready**
- **Location**: `/api/finances`
- **Models**: Expense (with categories, recurring support), Budget
- **Features**:
  - Amount stored in cents (integer precision)
  - Category-based tagging
  - Date range filtering
  - Recurring expense support
- **Extension Needed**: Add `pet_id` and `vehicle_id` to Expense model for tagged tracking

#### Scheduling/Reminders System ⚠️ **Partially Ready**
- **Current**: due_date field on Maintenance model
- **Missing**:
  - Background job scheduler (Celery/APScheduler)
  - Automated reminder emails
  - Notification service
- **Extension Needed**: Build notification infrastructure for medication reminders, maintenance alerts

#### Service Provider Management ❌ **Not Implemented**
- **Current**: None
- **Need to Build**:
  - ServiceProvider model (name, category, contact info, notes)
  - Categories: Vet, Groomer, Boarding, Mechanic, Dealership, Body Shop, etc.
  - API endpoints for CRUD operations
  - Frontend component for contact management
- **Priority**: High (critical for both modules)

#### Notification System ⚠️ **Minimal**
- **Current**: Email service for auth (password reset, verification)
- **Missing**:
  - Task/deadline reminders
  - Push notifications
  - SMS notifications
  - User notification preferences
- **Extension Needed**: Build comprehensive notification system

### 1.3 Key Architectural Patterns

**Database Models**
```python
# Pattern: SQLAlchemy ORM with relationships
class Model(db.Model):
    __tablename__ = 'table_name'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**API Blueprints**
```python
# Pattern: Blueprint with JWT protection
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint('resource', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
def get_resources():
    current_user_id = get_jwt_identity()
    # Filter by current_user_id for single-user constraint
    resources = Resource.query.filter_by(user_id=current_user_id).all()
    return jsonify([r.to_dict() for r in resources])
```

**Frontend Components**
```javascript
// Pattern: Functional component with hooks
const Component = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await apiHelpers.get('/api/endpoint')
      setData(response)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return <div>...</div>
}
```

### 1.4 Extension Points Identified

1. **Database Models**: Add to `backend/app/models/`, register in `__init__.py`
2. **API Blueprints**: Add to `backend/app/api/`, register in `app/__init__.py`
3. **Frontend Routes**: Add to `frontend/src/App.js`
4. **Sidebar Navigation**: Already shows petPal/carPal as "coming soon"
5. **Document Categories**: Extend `constants.py` with pet/vehicle categories
6. **Expense Categories**: Already flexible (string-based)

---

## 2. Module System Design

### 2.1 Design Goals

1. **Toggleable**: Self-hosters can enable/disable modules independently
2. **Clean**: Modules don't clutter the UI when disabled
3. **Integrated**: Modules leverage existing infrastructure (documents, costs, etc.)
4. **Scalable**: Easy to add future modules (finPal, bookPal, etc.)
5. **No Breaking Changes**: Core propertyPal works without modules enabled

### 2.2 Module Toggle Mechanism

#### Option A: Environment Variables (Recommended)
**Pros**: Simple, Docker-friendly, no database changes
**Cons**: Requires container restart to toggle

```bash
# .env
MODULES_ENABLED=petpal,carpal
# or
ENABLE_PETPAL=true
ENABLE_CARPAL=true
```

#### Option B: Database Feature Flags
**Pros**: Runtime toggling, per-user settings (future multi-user)
**Cons**: Requires new table, more complexity

```python
class FeatureFlag(db.Model):
    __tablename__ = 'feature_flags'
    id = db.Column(db.Integer, primary_key=True)
    feature_name = db.Column(db.String(50), unique=True, nullable=False)
    enabled = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
```

#### Option C: Hybrid (Best of Both)
**Pros**: Environment for defaults, database for overrides
**Cons**: Most complex

**Recommendation**: **Start with Option A (env variables)**, migrate to Option C if user-level toggles are needed.

### 2.3 Implementation Architecture

#### Backend: Conditional Blueprint Registration

**File**: `backend/config.py`
```python
class Config:
    # Module feature flags
    ENABLE_PETPAL = os.environ.get('ENABLE_PETPAL', 'false').lower() == 'true'
    ENABLE_CARPAL = os.environ.get('ENABLE_CARPAL', 'false').lower() == 'true'
```

**File**: `backend/app/__init__.py`
```python
def create_app(config_class=Config):
    # ... existing code ...

    # Register core blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(properties_bp, url_prefix='/api/properties')
    # ... other core blueprints ...

    # Conditionally register module blueprints
    if app.config['ENABLE_PETPAL']:
        from app.api.pets import pets_bp
        from app.api.pet_health import pet_health_bp
        app.register_blueprint(pets_bp, url_prefix='/api/pets')
        app.register_blueprint(pet_health_bp, url_prefix='/api/pet-health')
        print("petPal module enabled")

    if app.config['ENABLE_CARPAL']:
        from app.api.vehicles import vehicles_bp
        from app.api.vehicle_maintenance import vehicle_maintenance_bp
        app.register_blueprint(vehicles_bp, url_prefix='/api/vehicles')
        app.register_blueprint(vehicle_maintenance_bp, url_prefix='/api/vehicle-maintenance')
        print("carPal module enabled")

    return app
```

#### Frontend: Conditional Rendering

**File**: `frontend/src/config.js` (new)
```javascript
export const modules = {
  petPal: process.env.REACT_APP_ENABLE_PETPAL === 'true',
  carPal: process.env.REACT_APP_ENABLE_CARPAL === 'true',
}

// Runtime check via API (better approach)
export const fetchModuleConfig = async () => {
  const response = await apiHelpers.get('/api/config/modules')
  return response.modules
}
```

**File**: `backend/app/api/config.py` (new)
```python
@bp.route('/modules', methods=['GET'])
def get_modules():
    """Return enabled modules for frontend"""
    return jsonify({
        'modules': {
            'petPal': current_app.config['ENABLE_PETPAL'],
            'carPal': current_app.config['ENABLE_CARPAL'],
        }
    })
```

**File**: `frontend/src/components/layout/Sidebar.js`
```javascript
const [modules, setModules] = useState({ petPal: false, carPal: false })

useEffect(() => {
  fetchModuleConfig().then(setModules)
}, [])

// Conditionally render sections
{modules.petPal && (
  <Link to="/pets">
    <PawIcon /> Pets
  </Link>
)}

{modules.carPal && (
  <Link to="/vehicles">
    <CarIcon /> Vehicles
  </Link>
)}
```

**File**: `frontend/src/App.js`
```javascript
const [modules, setModules] = useState({ petPal: false, carPal: false })

useEffect(() => {
  fetchModuleConfig().then(setModules)
}, [])

<Routes>
  {/* Core routes */}
  <Route path="/dashboard" element={<Dashboard />} />

  {/* Module routes - conditionally rendered */}
  {modules.petPal && (
    <>
      <Route path="/pets" element={<PetList />} />
      <Route path="/pets/:id" element={<PetDetail />} />
    </>
  )}

  {modules.carPal && (
    <>
      <Route path="/vehicles" element={<VehicleList />} />
      <Route path="/vehicles/:id" element={<VehicleDetail />} />
    </>
  )}
</Routes>
```

### 2.4 Database Migration Strategy

**Challenge**: Module tables must exist even if module is disabled (for data persistence)

**Solution**: Migrations are always run, but API endpoints are conditionally registered

**Pattern**:
```bash
# Migration always creates tables
alembic revision -m "add_petpal_tables"
# Creates: pets, pet_health_records, pet_medications, etc.

# Module disabled → tables exist but no API access
ENABLE_PETPAL=false  # No /api/pets endpoint

# Module enabled → API routes registered
ENABLE_PETPAL=true   # /api/pets endpoint available
```

**Benefit**: Users can disable modules without losing data, re-enable later

### 2.5 Shared Infrastructure Extensions

#### Document Storage Extension

**Migration**: Add polymorphic foreign keys to Document model
```python
# backend/app/models/document.py
class Document(db.Model):
    # ... existing fields ...

    # Polymorphic associations (nullable - only one should be set)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=True)
    appliance_id = db.Column(db.Integer, db.ForeignKey('appliances.id'), nullable=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=True)  # NEW
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)  # NEW

    # Relationships
    pet = db.relationship('Pet', back_populates='documents')  # NEW
    vehicle = db.relationship('Vehicle', back_populates='documents')  # NEW
```

**New Document Categories** (`constants.py`)
```python
DOCUMENT_CATEGORIES = {
    # ... existing categories ...

    # Pet document categories
    'PET_ADOPTION': 'pet_adoption',
    'PET_VACCINATION': 'pet_vaccination',
    'PET_MEDICAL': 'pet_medical',
    'PET_INSURANCE': 'pet_insurance',
    'PET_LICENSE': 'pet_license',
    'PET_MICROCHIP': 'pet_microchip',

    # Vehicle document categories
    'VEHICLE_REGISTRATION': 'vehicle_registration',
    'VEHICLE_INSURANCE': 'vehicle_insurance',
    'VEHICLE_TITLE': 'vehicle_title',
    'VEHICLE_INSPECTION': 'vehicle_inspection',
    'VEHICLE_MAINTENANCE': 'vehicle_maintenance',
    'VEHICLE_WARRANTY': 'vehicle_warranty',
    'VEHICLE_RECEIPT': 'vehicle_receipt',
}

EXPIRING_DOCUMENT_CATEGORIES = [
    # ... existing ...
    DOCUMENT_CATEGORIES['PET_INSURANCE'],
    DOCUMENT_CATEGORIES['PET_LICENSE'],
    DOCUMENT_CATEGORIES['VEHICLE_REGISTRATION'],
    DOCUMENT_CATEGORIES['VEHICLE_INSURANCE'],
    DOCUMENT_CATEGORIES['VEHICLE_INSPECTION'],
]
```

#### Cost Tracking Extension

**Migration**: Add optional foreign keys to Expense model
```python
# backend/app/models/finance.py
class Expense(db.Model):
    # ... existing fields ...

    # Optional associations (only one should be set)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=True)  # NEW
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)  # NEW

    # Relationships
    pet = db.relationship('Pet', back_populates='expenses')  # NEW
    vehicle = db.relationship('Vehicle', back_populates='expenses')  # NEW
```

**New Expense Categories**
```python
# Pet expense categories
PET_EXPENSE_CATEGORIES = [
    'food',
    'treats',
    'veterinary',
    'grooming',
    'boarding',
    'toys',
    'supplies',
    'medication',
    'insurance',
    'training',
    'license',
    'other'
]

# Vehicle expense categories
VEHICLE_EXPENSE_CATEGORIES = [
    'fuel',
    'maintenance',
    'repairs',
    'insurance',
    'registration',
    'inspection',
    'car_wash',
    'parking',
    'tolls',
    'parts',
    'tires',
    'loan_payment',
    'other'
]
```

#### Service Provider System (NEW)

**Model**: `backend/app/models/service_provider.py`
```python
class ServiceProvider(db.Model):
    __tablename__ = 'service_providers'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Basic info
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # vet, groomer, mechanic, etc.
    business_name = db.Column(db.String(150))

    # Contact info
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    website = db.Column(db.String(255))

    # Address
    address = db.Column(db.String(255))
    city = db.Column(db.String(100))
    state = db.Column(db.String(50))
    zip_code = db.Column(db.String(20))

    # Additional details
    notes = db.Column(db.Text)
    is_preferred = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='service_providers')

# Categories
SERVICE_PROVIDER_CATEGORIES = [
    'vet',
    'groomer',
    'boarding',
    'pet_sitter',
    'trainer',
    'mechanic',
    'dealership',
    'body_shop',
    'tire_shop',
    'car_wash',
    'contractor',
    'plumber',
    'electrician',
    'hvac',
    'landscaper',
    'other'
]
```

**API**: `backend/app/api/service_providers.py`
```python
@bp.route('/', methods=['GET'])
@jwt_required()
def get_service_providers():
    current_user_id = get_jwt_identity()
    category = request.args.get('category')

    query = ServiceProvider.query.filter_by(user_id=current_user_id)
    if category:
        query = query.filter_by(category=category)

    providers = query.order_by(ServiceProvider.is_preferred.desc(), ServiceProvider.name).all()
    return jsonify([p.to_dict() for p in providers])

@bp.route('/', methods=['POST'])
@jwt_required()
def create_service_provider():
    # ... implementation
```

---

## 3. petPal Complete Specification

### 3.1 Database Schema

#### 3.1.1 Pet Model

**File**: `backend/app/models/pet.py`

```python
from app import db
from datetime import datetime

class Pet(db.Model):
    __tablename__ = 'pets'

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)

    # Basic profile
    name = db.Column(db.String(100), nullable=False)
    species = db.Column(db.String(50), nullable=False)  # dog, cat, bird, reptile, fish, rabbit, etc.
    breed = db.Column(db.String(100))
    mixed_breed = db.Column(db.Boolean, default=False)

    # Physical details
    color = db.Column(db.String(100))
    weight = db.Column(db.Float)  # in pounds
    weight_unit = db.Column(db.String(10), default='lbs')  # lbs or kg

    # Dates
    date_of_birth = db.Column(db.Date)
    adoption_date = db.Column(db.Date)
    date_of_passing = db.Column(db.Date, nullable=True)  # Memorial record

    # Identification
    microchip_number = db.Column(db.String(50))
    microchip_registry = db.Column(db.String(100))  # e.g., HomeAgain, AKC Reunite
    license_number = db.Column(db.String(50))

    # Medical status
    is_spayed_neutered = db.Column(db.Boolean, default=False)
    spay_neuter_date = db.Column(db.Date)

    # Photo
    photo_url = db.Column(db.String(255))

    # Additional info
    gender = db.Column(db.String(10))  # male, female, unknown
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)  # False if deceased

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='pets')
    property = db.relationship('Property', back_populates='pets')
    health_records = db.relationship('PetHealthRecord', back_populates='pet', cascade='all, delete-orphan')
    medications = db.relationship('PetMedication', back_populates='pet', cascade='all, delete-orphan')
    care_routines = db.relationship('PetCareRoutine', back_populates='pet', cascade='all, delete-orphan')
    documents = db.relationship('Document', back_populates='pet', foreign_keys='Document.pet_id')
    expenses = db.relationship('Expense', back_populates='pet', foreign_keys='Expense.pet_id')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'property_id': self.property_id,
            'name': self.name,
            'species': self.species,
            'breed': self.breed,
            'mixed_breed': self.mixed_breed,
            'color': self.color,
            'weight': self.weight,
            'weight_unit': self.weight_unit,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'adoption_date': self.adoption_date.isoformat() if self.adoption_date else None,
            'date_of_passing': self.date_of_passing.isoformat() if self.date_of_passing else None,
            'age': self.calculate_age(),
            'microchip_number': self.microchip_number,
            'microchip_registry': self.microchip_registry,
            'license_number': self.license_number,
            'is_spayed_neutered': self.is_spayed_neutered,
            'spay_neuter_date': self.spay_neuter_date.isoformat() if self.spay_neuter_date else None,
            'photo_url': self.photo_url,
            'gender': self.gender,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

    def calculate_age(self):
        """Calculate age in years and months"""
        if not self.date_of_birth:
            return None

        end_date = self.date_of_passing if self.date_of_passing else datetime.utcnow().date()
        age_days = (end_date - self.date_of_birth).days
        years = age_days // 365
        months = (age_days % 365) // 30

        return {
            'years': years,
            'months': months,
            'total_days': age_days
        }
```

#### 3.1.2 PetHealthRecord Model

```python
class PetHealthRecord(db.Model):
    __tablename__ = 'pet_health_records'

    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Record details
    record_type = db.Column(db.String(50), nullable=False)  # vet_visit, vaccination, surgery, illness, injury, weight_check, other
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)

    # Provider info
    service_provider_id = db.Column(db.Integer, db.ForeignKey('service_providers.id'), nullable=True)
    vet_name = db.Column(db.String(100))  # Fallback if no service provider

    # Medical details
    diagnosis = db.Column(db.Text)
    treatment = db.Column(db.Text)
    medication_prescribed = db.Column(db.Text)
    notes = db.Column(db.Text)

    # Measurements
    weight = db.Column(db.Float)
    weight_unit = db.Column(db.String(10), default='lbs')
    temperature = db.Column(db.Float)
    temperature_unit = db.Column(db.String(10), default='F')

    # Vaccination specific
    vaccine_name = db.Column(db.String(100))  # e.g., Rabies, DHPP, Bordetella
    vaccine_lot_number = db.Column(db.String(50))
    vaccine_expiration_date = db.Column(db.Date)
    next_due_date = db.Column(db.Date)  # For vaccinations

    # Cost
    cost = db.Column(db.Integer)  # in cents

    # Follow-up
    follow_up_required = db.Column(db.Boolean, default=False)
    follow_up_date = db.Column(db.Date)
    follow_up_notes = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    pet = db.relationship('Pet', back_populates='health_records')
    user = db.relationship('User', back_populates='pet_health_records')
    service_provider = db.relationship('ServiceProvider')

    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'record_type': self.record_type,
            'title': self.title,
            'date': self.date.isoformat(),
            'vet_name': self.vet_name,
            'diagnosis': self.diagnosis,
            'treatment': self.treatment,
            'medication_prescribed': self.medication_prescribed,
            'notes': self.notes,
            'weight': self.weight,
            'weight_unit': self.weight_unit,
            'temperature': self.temperature,
            'temperature_unit': self.temperature_unit,
            'vaccine_name': self.vaccine_name,
            'vaccine_lot_number': self.vaccine_lot_number,
            'vaccine_expiration_date': self.vaccine_expiration_date.isoformat() if self.vaccine_expiration_date else None,
            'next_due_date': self.next_due_date.isoformat() if self.next_due_date else None,
            'cost': self.cost / 100 if self.cost else None,  # Convert cents to dollars
            'follow_up_required': self.follow_up_required,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'follow_up_notes': self.follow_up_notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

# Health record types
PET_HEALTH_RECORD_TYPES = [
    'vet_visit',
    'vaccination',
    'surgery',
    'illness',
    'injury',
    'dental',
    'weight_check',
    'allergy',
    'parasite_treatment',
    'other'
]
```

#### 3.1.3 PetMedication Model

```python
class PetMedication(db.Model):
    __tablename__ = 'pet_medications'

    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Medication details
    medication_name = db.Column(db.String(200), nullable=False)
    medication_type = db.Column(db.String(50))  # oral, topical, injection, drops

    # Dosage
    dosage = db.Column(db.String(100), nullable=False)  # e.g., "10mg", "1 tablet"
    frequency = db.Column(db.String(100), nullable=False)  # e.g., "twice daily", "every 8 hours"

    # Schedule
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)  # Null for ongoing medications
    is_ongoing = db.Column(db.Boolean, default=False)

    # Administration
    administration_time = db.Column(db.String(100))  # e.g., "morning and evening", "with food"
    administration_instructions = db.Column(db.Text)

    # Prescription info
    prescribed_by = db.Column(db.String(100))
    prescription_number = db.Column(db.String(50))
    refills_remaining = db.Column(db.Integer)
    refill_reminder_days = db.Column(db.Integer, default=7)  # Days before running out to remind

    # Purpose
    purpose = db.Column(db.Text)  # What condition is this treating?

    # Status
    is_active = db.Column(db.Boolean, default=True)

    # Notes
    side_effects = db.Column(db.Text)
    notes = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    pet = db.relationship('Pet', back_populates='medications')
    user = db.relationship('User', back_populates='pet_medications')

    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'medication_name': self.medication_name,
            'medication_type': self.medication_type,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_ongoing': self.is_ongoing,
            'administration_time': self.administration_time,
            'administration_instructions': self.administration_instructions,
            'prescribed_by': self.prescribed_by,
            'prescription_number': self.prescription_number,
            'refills_remaining': self.refills_remaining,
            'refill_reminder_days': self.refill_reminder_days,
            'purpose': self.purpose,
            'is_active': self.is_active,
            'side_effects': self.side_effects,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
```

#### 3.1.4 PetCareRoutine Model

```python
class PetCareRoutine(db.Model):
    __tablename__ = 'pet_care_routines'

    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Routine type
    routine_type = db.Column(db.String(50), nullable=False)  # feeding, exercise, grooming, training
    title = db.Column(db.String(200), nullable=False)

    # Feeding details (if routine_type = 'feeding')
    food_brand = db.Column(db.String(100))
    food_type = db.Column(db.String(50))  # dry, wet, raw, homemade
    portion_size = db.Column(db.String(100))  # e.g., "1 cup", "1 can"
    feeding_time = db.Column(db.String(50))  # e.g., "7:00 AM, 6:00 PM"

    # Exercise details (if routine_type = 'exercise')
    activity_type = db.Column(db.String(100))  # walk, run, play, swim
    duration_minutes = db.Column(db.Integer)

    # Schedule
    frequency = db.Column(db.String(100))  # daily, twice daily, weekly, as needed

    # Instructions
    instructions = db.Column(db.Text)
    notes = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    pet = db.relationship('Pet', back_populates='care_routines')
    user = db.relationship('User', back_populates='pet_care_routines')

    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'routine_type': self.routine_type,
            'title': self.title,
            'food_brand': self.food_brand,
            'food_type': self.food_type,
            'portion_size': self.portion_size,
            'feeding_time': self.feeding_time,
            'activity_type': self.activity_type,
            'duration_minutes': self.duration_minutes,
            'frequency': self.frequency,
            'instructions': self.instructions,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

# Care routine types
PET_CARE_ROUTINE_TYPES = [
    'feeding',
    'exercise',
    'grooming',
    'training',
    'medication',  # Link to PetMedication
    'other'
]
```

#### 3.1.5 PetEmergencyInfo Model

```python
class PetEmergencyInfo(db.Model):
    __tablename__ = 'pet_emergency_info'

    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False, unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Primary vet
    primary_vet_id = db.Column(db.Integer, db.ForeignKey('service_providers.id'), nullable=True)
    primary_vet_phone = db.Column(db.String(20))

    # Emergency vet
    emergency_vet_name = db.Column(db.String(100))
    emergency_vet_phone = db.Column(db.String(20))
    emergency_vet_address = db.Column(db.String(255))

    # Pet insurance
    has_insurance = db.Column(db.Boolean, default=False)
    insurance_provider = db.Column(db.String(100))
    insurance_policy_number = db.Column(db.String(100))
    insurance_phone = db.Column(db.String(20))

    # Poison control
    poison_control_phone = db.Column(db.String(20), default='(888) 426-4435')  # ASPCA Poison Control

    # Medical alerts
    allergies = db.Column(db.Text)  # Known allergies
    chronic_conditions = db.Column(db.Text)  # Ongoing health issues
    behavioral_notes = db.Column(db.Text)  # e.g., "fearful of strangers", "aggressive with other dogs"

    # Additional contacts
    emergency_contact_name = db.Column(db.String(100))
    emergency_contact_phone = db.Column(db.String(20))
    emergency_contact_relationship = db.Column(db.String(50))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    pet = db.relationship('Pet', backref=db.backref('emergency_info', uselist=False))
    user = db.relationship('User')
    primary_vet = db.relationship('ServiceProvider', foreign_keys=[primary_vet_id])

    def to_dict(self):
        return {
            'id': self.id,
            'pet_id': self.pet_id,
            'primary_vet_phone': self.primary_vet_phone,
            'emergency_vet_name': self.emergency_vet_name,
            'emergency_vet_phone': self.emergency_vet_phone,
            'emergency_vet_address': self.emergency_vet_address,
            'has_insurance': self.has_insurance,
            'insurance_provider': self.insurance_provider,
            'insurance_policy_number': self.insurance_policy_number,
            'insurance_phone': self.insurance_phone,
            'poison_control_phone': self.poison_control_phone,
            'allergies': self.allergies,
            'chronic_conditions': self.chronic_conditions,
            'behavioral_notes': self.behavioral_notes,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'emergency_contact_relationship': self.emergency_contact_relationship,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
```

### 3.2 API Endpoints

#### 3.2.1 Pets API (`/api/pets`)

**File**: `backend/app/api/pets.py`

```python
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.pet import Pet
from datetime import datetime

pets_bp = Blueprint('pets', __name__)

@pets_bp.route('/', methods=['GET'])
@jwt_required()
def get_pets():
    """Get all pets for current user"""
    current_user_id = get_jwt_identity()

    # Filters
    is_active = request.args.get('is_active', 'true').lower() == 'true'
    species = request.args.get('species')

    query = Pet.query.filter_by(user_id=current_user_id, is_active=is_active)
    if species:
        query = query.filter_by(species=species)

    pets = query.order_by(Pet.name).all()
    return jsonify([pet.to_dict() for pet in pets])

@pets_bp.route('/<int:pet_id>', methods=['GET'])
@jwt_required()
def get_pet(pet_id):
    """Get single pet by ID"""
    current_user_id = get_jwt_identity()
    pet = Pet.query.filter_by(id=pet_id, user_id=current_user_id).first()

    if not pet:
        return jsonify({'error': 'Pet not found'}), 404

    return jsonify(pet.to_dict())

@pets_bp.route('/', methods=['POST'])
@jwt_required()
def create_pet():
    """Create new pet"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Validation
    required_fields = ['name', 'species', 'property_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Parse dates
    date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() if data.get('date_of_birth') else None
    adoption_date = datetime.strptime(data['adoption_date'], '%Y-%m-%d').date() if data.get('adoption_date') else None
    spay_neuter_date = datetime.strptime(data['spay_neuter_date'], '%Y-%m-%d').date() if data.get('spay_neuter_date') else None

    pet = Pet(
        user_id=current_user_id,
        property_id=data['property_id'],
        name=data['name'],
        species=data['species'],
        breed=data.get('breed'),
        mixed_breed=data.get('mixed_breed', False),
        color=data.get('color'),
        weight=data.get('weight'),
        weight_unit=data.get('weight_unit', 'lbs'),
        date_of_birth=date_of_birth,
        adoption_date=adoption_date,
        microchip_number=data.get('microchip_number'),
        microchip_registry=data.get('microchip_registry'),
        license_number=data.get('license_number'),
        is_spayed_neutered=data.get('is_spayed_neutered', False),
        spay_neuter_date=spay_neuter_date,
        photo_url=data.get('photo_url'),
        gender=data.get('gender'),
        notes=data.get('notes'),
    )

    db.session.add(pet)
    db.session.commit()

    return jsonify(pet.to_dict()), 201

@pets_bp.route('/<int:pet_id>', methods=['PUT'])
@jwt_required()
def update_pet(pet_id):
    """Update pet"""
    current_user_id = get_jwt_identity()
    pet = Pet.query.filter_by(id=pet_id, user_id=current_user_id).first()

    if not pet:
        return jsonify({'error': 'Pet not found'}), 404

    data = request.get_json()

    # Update fields
    updateable_fields = [
        'name', 'species', 'breed', 'mixed_breed', 'color', 'weight', 'weight_unit',
        'microchip_number', 'microchip_registry', 'license_number', 'is_spayed_neutered',
        'photo_url', 'gender', 'notes', 'is_active'
    ]

    for field in updateable_fields:
        if field in data:
            setattr(pet, field, data[field])

    # Handle date fields
    date_fields = ['date_of_birth', 'adoption_date', 'spay_neuter_date', 'date_of_passing']
    for field in date_fields:
        if field in data and data[field]:
            setattr(pet, field, datetime.strptime(data[field], '%Y-%m-%d').date())

    pet.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(pet.to_dict())

@pets_bp.route('/<int:pet_id>', methods=['DELETE'])
@jwt_required()
def delete_pet(pet_id):
    """Delete pet (soft delete by default)"""
    current_user_id = get_jwt_identity()
    pet = Pet.query.filter_by(id=pet_id, user_id=current_user_id).first()

    if not pet:
        return jsonify({'error': 'Pet not found'}), 404

    # Soft delete by default
    hard_delete = request.args.get('hard_delete', 'false').lower() == 'true'

    if hard_delete:
        db.session.delete(pet)
    else:
        pet.is_active = False

    db.session.commit()
    return jsonify({'message': 'Pet deleted successfully'}), 200

@pets_bp.route('/species', methods=['GET'])
@jwt_required()
def get_species():
    """Get list of supported species"""
    species = [
        {'value': 'dog', 'label': 'Dog'},
        {'value': 'cat', 'label': 'Cat'},
        {'value': 'bird', 'label': 'Bird'},
        {'value': 'reptile', 'label': 'Reptile'},
        {'value': 'fish', 'label': 'Fish'},
        {'value': 'rabbit', 'label': 'Rabbit'},
        {'value': 'hamster', 'label': 'Hamster'},
        {'value': 'guinea_pig', 'label': 'Guinea Pig'},
        {'value': 'ferret', 'label': 'Ferret'},
        {'value': 'horse', 'label': 'Horse'},
        {'value': 'other', 'label': 'Other'},
    ]
    return jsonify(species)
```

#### 3.2.2 Pet Health Records API (`/api/pet-health`)

**Endpoints**:
- `GET /api/pet-health?pet_id=1` - Get all health records for a pet
- `GET /api/pet-health/<id>` - Get single health record
- `POST /api/pet-health` - Create health record
- `PUT /api/pet-health/<id>` - Update health record
- `DELETE /api/pet-health/<id>` - Delete health record
- `GET /api/pet-health/vaccinations?pet_id=1` - Get vaccination history
- `GET /api/pet-health/upcoming?pet_id=1` - Get upcoming vaccinations/checkups

#### 3.2.3 Pet Medications API (`/api/pet-medications`)

**Endpoints**:
- `GET /api/pet-medications?pet_id=1&is_active=true` - Get medications
- `GET /api/pet-medications/<id>` - Get single medication
- `POST /api/pet-medications` - Create medication
- `PUT /api/pet-medications/<id>` - Update medication
- `DELETE /api/pet-medications/<id>` - Delete medication
- `GET /api/pet-medications/refill-reminders` - Get medications needing refills

#### 3.2.4 Pet Care Routines API (`/api/pet-care`)

**Endpoints**:
- `GET /api/pet-care?pet_id=1` - Get care routines
- `POST /api/pet-care` - Create routine
- `PUT /api/pet-care/<id>` - Update routine
- `DELETE /api/pet-care/<id>` - Delete routine

#### 3.2.5 Pet Emergency Info API (`/api/pet-emergency`)

**Endpoints**:
- `GET /api/pet-emergency/<pet_id>` - Get emergency info for pet
- `POST /api/pet-emergency` - Create emergency info
- `PUT /api/pet-emergency/<pet_id>` - Update emergency info

#### 3.2.6 Pet Sitter Share Mode API (`/api/pet-share`)

**Endpoints**:
- `POST /api/pet-share/<pet_id>` - Generate shareable link (with expiry)
- `GET /api/pet-share/<token>` - View shared pet info (no auth required)
- `DELETE /api/pet-share/<token>` - Revoke share link

**Share Token Model**:
```python
class PetShareToken(db.Model):
    __tablename__ = 'pet_share_tokens'

    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    token = db.Column(db.String(64), unique=True, nullable=False)  # Random secure token
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    # What to share
    include_health_records = db.Column(db.Boolean, default=True)
    include_medications = db.Column(db.Boolean, default=True)
    include_care_routines = db.Column(db.Boolean, default=True)
    include_emergency_info = db.Column(db.Boolean, default=True)

    # Tracking
    access_count = db.Column(db.Integer, default=0)
    last_accessed_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### 3.3 Frontend Components

#### 3.3.1 Component Structure

```
frontend/src/components/petpal/
├── PetList.jsx                    # Pet overview cards
├── PetDetail.jsx                  # Single pet detail view
├── PetForm.jsx                    # Add/edit pet form
├── HealthRecordList.jsx           # Health timeline
├── HealthRecordForm.jsx           # Add health record
├── VaccinationCard.jsx            # Vaccination status widget
├── MedicationList.jsx             # Active medications
├── MedicationForm.jsx             # Add/edit medication
├── CareRoutineList.jsx            # Feeding/exercise schedules
├── CareRoutineForm.jsx            # Add/edit routine
├── EmergencyCard.jsx              # Emergency info display
├── EmergencyCardForm.jsx          # Edit emergency info
├── PetSitterShareModal.jsx        # Generate share link
├── PetSitterView.jsx              # Public read-only view (no auth)
└── PetDashboard.jsx               # Main petPal dashboard
```

#### 3.3.2 PetList Component (Example)

```javascript
// frontend/src/components/petpal/PetList.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiHelpers } from '../../services/api'
import Navigation from '../layout/Navigation'
import { PlusIcon, PawPrintIcon } from '@heroicons/react/24/outline'

const PetList = () => {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, memorial

  useEffect(() => {
    fetchPets()
  }, [filter])

  const fetchPets = async () => {
    try {
      const is_active = filter === 'memorial' ? false : true
      const response = await apiHelpers.get('/api/pets', {
        params: { is_active }
      })
      setPets(response)
    } catch (error) {
      console.error('Error fetching pets:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 +
                        (today.getMonth() - birthDate.getMonth())
    const years = Math.floor(ageInMonths / 12)
    const months = ageInMonths % 12

    if (years === 0) return `${months} months`
    return `${years} years${months > 0 ? `, ${months} months` : ''}`
  }

  return (
    <Navigation>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Pets</h1>
            <p className="text-gray-600 mt-1">Manage your pet profiles and health records</p>
          </div>
          <Link
            to="/pets/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Pet
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Active Pets
          </button>
          <button
            onClick={() => setFilter('memorial')}
            className={`px-4 py-2 rounded-lg ${filter === 'memorial' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Memorial
          </button>
        </div>

        {/* Pet grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : pets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <PawPrintIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pets yet</h3>
            <p className="text-gray-600 mb-4">Add your first pet to get started</p>
            <Link
              to="/pets/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Pet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map(pet => (
              <Link
                key={pet.id}
                to={`/pets/${pet.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                {/* Pet photo */}
                {pet.photo_url ? (
                  <img
                    src={pet.photo_url}
                    alt={pet.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <PawPrintIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}

                {/* Pet info */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{pet.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Species:</span> {pet.species}</p>
                  {pet.breed && <p><span className="font-medium">Breed:</span> {pet.breed}</p>}
                  {pet.date_of_birth && (
                    <p><span className="font-medium">Age:</span> {calculateAge(pet.date_of_birth)}</p>
                  )}
                  {pet.weight && (
                    <p><span className="font-medium">Weight:</span> {pet.weight} {pet.weight_unit}</p>
                  )}
                </div>

                {/* Status badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {pet.is_spayed_neutered && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Spayed/Neutered
                    </span>
                  )}
                  {pet.microchip_number && (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Microchipped
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Navigation>
  )
}

export default PetList
```

### 3.4 Integration Points

#### 3.4.1 Service Providers Integration
- Add "Vet", "Groomer", "Boarding", "Pet Sitter", "Trainer" categories to ServiceProvider
- Link PetHealthRecord to ServiceProvider for vet visits
- Display vet contact info on pet detail page

#### 3.4.2 Cost Tracking Integration
- Add `pet_id` foreign key to Expense model
- New expense categories: food, veterinary, grooming, boarding, toys, supplies, medication, insurance
- Pet expense dashboard showing monthly costs per pet
- Integration with finPal (future) for budget tracking

#### 3.4.3 Document Storage Integration
- Add pet document categories: adoption papers, vaccination records, medical records, insurance, license, microchip registration
- Link Document to Pet via `pet_id` foreign key
- Document expiration tracking for pet insurance, license renewals

#### 3.4.4 Notification System Integration
- **Medication reminders**: Daily/scheduled notifications for medication administration
- **Vaccination due dates**: Reminder 30 days before vaccination due
- **Vet appointment reminders**: Reminder 3 days before appointment
- **Refill reminders**: Alert when medication refills needed (based on refill_reminder_days)
- **License renewal**: Alert when pet license expiring
- **Insurance renewal**: Alert when pet insurance expiring

#### 3.4.5 Mobile App Considerations
- Pet photos: Use device camera for pet photos
- Medication reminders: Push notifications on mobile
- QR code scanning: Scan pet sitter share QR codes
- Offline mode: Cache pet emergency info for offline access

### 3.5 Pet Sitter Share Mode

#### Use Case
Pet owners can generate a temporary, read-only shareable link for pet sitters, boarders, or emergency contacts. The link provides access to:
- Pet profile (name, species, breed, weight, photo)
- Emergency contact info (vet, emergency vet, insurance, poison control)
- Current medications (name, dosage, frequency, administration instructions)
- Care routines (feeding schedule, portion sizes, exercise needs)
- Allergies and chronic conditions
- Behavioral notes

#### Implementation

**Backend**: Generate secure token with expiration
```python
import secrets
from datetime import datetime, timedelta

@pets_bp.route('/<int:pet_id>/share', methods=['POST'])
@jwt_required()
def create_share_link(pet_id):
    current_user_id = get_jwt_identity()
    pet = Pet.query.filter_by(id=pet_id, user_id=current_user_id).first()

    if not pet:
        return jsonify({'error': 'Pet not found'}), 404

    data = request.get_json()

    # Generate secure token
    token = secrets.token_urlsafe(48)

    # Set expiration (default 7 days)
    expiration_days = data.get('expiration_days', 7)
    expires_at = datetime.utcnow() + timedelta(days=expiration_days)

    share_token = PetShareToken(
        pet_id=pet_id,
        user_id=current_user_id,
        token=token,
        expires_at=expires_at,
        include_health_records=data.get('include_health_records', True),
        include_medications=data.get('include_medications', True),
        include_care_routines=data.get('include_care_routines', True),
        include_emergency_info=data.get('include_emergency_info', True),
    )

    db.session.add(share_token)
    db.session.commit()

    share_url = f"{request.host_url}pet-sitter/{token}"

    return jsonify({
        'token': token,
        'share_url': share_url,
        'expires_at': expires_at.isoformat(),
        'qr_code_url': f"/api/pet-share/{token}/qr"  # Generate QR code endpoint
    }), 201
```

**Frontend**: Read-only view (no authentication required)
```javascript
// frontend/src/components/petpal/PetSitterView.jsx
const PetSitterView = () => {
  const { token } = useParams()
  const [petData, setPetData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSharedPetData()
  }, [token])

  const fetchSharedPetData = async () => {
    try {
      // No auth required - public endpoint
      const response = await axios.get(`/api/pet-share/${token}`)
      setPetData(response.data)
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid or expired link')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Pet profile */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{petData.pet.name}</h1>
        {/* ... pet details ... */}
      </div>

      {/* Emergency contacts */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-red-900 mb-4">Emergency Contacts</h2>
        {/* ... emergency info ... */}
      </div>

      {/* Medications */}
      {petData.medications && petData.medications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Current Medications</h2>
          {/* ... medication list ... */}
        </div>
      )}

      {/* Care routines */}
      {petData.care_routines && petData.care_routines.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Care Instructions</h2>
          {/* ... care routine list ... */}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 mt-8">
        <p>This link expires on {new Date(petData.expires_at).toLocaleDateString()}</p>
        <p className="mt-2">Powered by <a href="https://propertypal.app" className="text-blue-600">PropertyPal petPal</a></p>
      </div>
    </div>
  )
}
```

---

## 4. carPal Backend Specification

### 4.1 Database Schema

#### 4.1.1 Vehicle Model

**File**: `backend/app/models/vehicle.py`

```python
from app import db
from datetime import datetime

class Vehicle(db.Model):
    __tablename__ = 'vehicles'

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)

    # Basic info
    nickname = db.Column(db.String(100))  # e.g., "My Truck", "Daily Driver"
    year = db.Column(db.Integer, nullable=False)
    make = db.Column(db.String(100), nullable=False)  # e.g., Toyota, Ford, Honda
    model = db.Column(db.String(100), nullable=False)  # e.g., Camry, F-150, Civic
    trim = db.Column(db.String(100))  # e.g., Limited, XLT, Sport

    # Identification
    vin = db.Column(db.String(17))  # Vehicle Identification Number
    license_plate = db.Column(db.String(20))
    license_plate_state = db.Column(db.String(50))

    # Details
    color = db.Column(db.String(50))
    body_type = db.Column(db.String(50))  # sedan, suv, truck, coupe, van, motorcycle
    transmission = db.Column(db.String(50))  # automatic, manual, cvt
    fuel_type = db.Column(db.String(50))  # gasoline, diesel, hybrid, electric, plug-in hybrid

    # Odometer
    current_mileage = db.Column(db.Integer)  # in miles
    mileage_unit = db.Column(db.String(10), default='miles')  # miles or km

    # Ownership
    purchase_date = db.Column(db.Date)
    purchase_price = db.Column(db.Integer)  # in cents
    current_value = db.Column(db.Integer)  # in cents

    # Photo
    photo_url = db.Column(db.String(255))

    # Status
    is_active = db.Column(db.Boolean, default=True)  # False if sold/totaled
    status = db.Column(db.String(50), default='active')  # active, sold, totaled

    # Notes
    notes = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='vehicles')
    property = db.relationship('Property', back_populates='vehicles')
    maintenance_records = db.relationship('VehicleMaintenanceRecord', back_populates='vehicle', cascade='all, delete-orphan')
    maintenance_schedules = db.relationship('VehicleMaintenanceSchedule', back_populates='vehicle', cascade='all, delete-orphan')
    fuel_logs = db.relationship('VehicleFuelLog', back_populates='vehicle', cascade='all, delete-orphan')
    documents = db.relationship('Document', back_populates='vehicle', foreign_keys='Document.vehicle_id')
    expenses = db.relationship('Expense', back_populates='vehicle', foreign_keys='Expense.vehicle_id')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'property_id': self.property_id,
            'nickname': self.nickname,
            'year': self.year,
            'make': self.make,
            'model': self.model,
            'trim': self.trim,
            'display_name': f"{self.year} {self.make} {self.model}" + (f" {self.trim}" if self.trim else ""),
            'vin': self.vin,
            'license_plate': self.license_plate,
            'license_plate_state': self.license_plate_state,
            'color': self.color,
            'body_type': self.body_type,
            'transmission': self.transmission,
            'fuel_type': self.fuel_type,
            'current_mileage': self.current_mileage,
            'mileage_unit': self.mileage_unit,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'purchase_price': self.purchase_price / 100 if self.purchase_price else None,
            'current_value': self.current_value / 100 if self.current_value else None,
            'photo_url': self.photo_url,
            'is_active': self.is_active,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
```

#### 4.1.2 VehicleMaintenanceRecord Model

```python
class VehicleMaintenanceRecord(db.Model):
    __tablename__ = 'vehicle_maintenance_records'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Record details
    maintenance_type = db.Column(db.String(50), nullable=False)  # oil_change, tire_rotation, inspection, repair, etc.
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

    # Date & mileage
    date = db.Column(db.Date, nullable=False)
    mileage_at_service = db.Column(db.Integer)  # Odometer reading at time of service

    # Service provider
    service_provider_id = db.Column(db.Integer, db.ForeignKey('service_providers.id'), nullable=True)
    shop_name = db.Column(db.String(100))  # Fallback if no service provider

    # Cost
    cost = db.Column(db.Integer)  # in cents
    labor_cost = db.Column(db.Integer)  # in cents
    parts_cost = db.Column(db.Integer)  # in cents

    # Parts/materials used
    parts_replaced = db.Column(db.Text)  # JSON or comma-separated list

    # Follow-up
    next_service_date = db.Column(db.Date)  # Calendar-based reminder
    next_service_mileage = db.Column(db.Integer)  # Mileage-based reminder

    # Warranty
    warranty_until_date = db.Column(db.Date)
    warranty_until_mileage = db.Column(db.Integer)

    # Notes
    notes = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    vehicle = db.relationship('Vehicle', back_populates='maintenance_records')
    user = db.relationship('User', back_populates='vehicle_maintenance_records')
    service_provider = db.relationship('ServiceProvider')

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'maintenance_type': self.maintenance_type,
            'title': self.title,
            'description': self.description,
            'date': self.date.isoformat(),
            'mileage_at_service': self.mileage_at_service,
            'shop_name': self.shop_name,
            'cost': self.cost / 100 if self.cost else None,
            'labor_cost': self.labor_cost / 100 if self.labor_cost else None,
            'parts_cost': self.parts_cost / 100 if self.parts_cost else None,
            'parts_replaced': self.parts_replaced,
            'next_service_date': self.next_service_date.isoformat() if self.next_service_date else None,
            'next_service_mileage': self.next_service_mileage,
            'warranty_until_date': self.warranty_until_date.isoformat() if self.warranty_until_date else None,
            'warranty_until_mileage': self.warranty_until_mileage,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

# Maintenance types
VEHICLE_MAINTENANCE_TYPES = [
    'oil_change',
    'tire_rotation',
    'brake_service',
    'alignment',
    'transmission_service',
    'coolant_flush',
    'air_filter',
    'cabin_filter',
    'spark_plugs',
    'battery',
    'inspection',
    'emissions_test',
    'tire_replacement',
    'windshield_wiper',
    'lights',
    'repair',
    'body_work',
    'detailing',
    'other'
]
```

#### 4.1.3 VehicleMaintenanceSchedule Model

```python
class VehicleMaintenanceSchedule(db.Model):
    __tablename__ = 'vehicle_maintenance_schedules'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Schedule details
    maintenance_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

    # Recurrence - either time-based OR mileage-based OR both
    interval_months = db.Column(db.Integer)  # e.g., 6 for every 6 months
    interval_miles = db.Column(db.Integer)  # e.g., 5000 for every 5000 miles

    # Last completed
    last_completed_date = db.Column(db.Date)
    last_completed_mileage = db.Column(db.Integer)

    # Next due (calculated based on last completed + interval)
    next_due_date = db.Column(db.Date)
    next_due_mileage = db.Column(db.Integer)

    # Reminders
    reminder_days_before = db.Column(db.Integer, default=7)  # Days before due date
    reminder_miles_before = db.Column(db.Integer, default=500)  # Miles before due mileage

    # Status
    is_active = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    vehicle = db.relationship('Vehicle', back_populates='maintenance_schedules')
    user = db.relationship('User', back_populates='vehicle_maintenance_schedules')

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'maintenance_type': self.maintenance_type,
            'title': self.title,
            'description': self.description,
            'interval_months': self.interval_months,
            'interval_miles': self.interval_miles,
            'last_completed_date': self.last_completed_date.isoformat() if self.last_completed_date else None,
            'last_completed_mileage': self.last_completed_mileage,
            'next_due_date': self.next_due_date.isoformat() if self.next_due_date else None,
            'next_due_mileage': self.next_due_mileage,
            'reminder_days_before': self.reminder_days_before,
            'reminder_miles_before': self.reminder_miles_before,
            'is_active': self.is_active,
            'is_due_soon': self.is_due_soon(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

    def is_due_soon(self):
        """Check if maintenance is due soon based on date or mileage"""
        from datetime import date, timedelta

        is_due = False

        # Check date-based
        if self.next_due_date:
            days_until_due = (self.next_due_date - date.today()).days
            if days_until_due <= self.reminder_days_before:
                is_due = True

        # Check mileage-based
        if self.next_due_mileage and self.vehicle.current_mileage:
            miles_until_due = self.next_due_mileage - self.vehicle.current_mileage
            if miles_until_due <= self.reminder_miles_before:
                is_due = True

        return is_due

    def calculate_next_due(self):
        """Calculate next due date/mileage based on last completed + interval"""
        from datetime import timedelta
        from dateutil.relativedelta import relativedelta

        # Calculate next due date
        if self.last_completed_date and self.interval_months:
            self.next_due_date = self.last_completed_date + relativedelta(months=self.interval_months)

        # Calculate next due mileage
        if self.last_completed_mileage and self.interval_miles:
            self.next_due_mileage = self.last_completed_mileage + self.interval_miles
```

#### 4.1.4 VehicleFuelLog Model (Optional)

```python
class VehicleFuelLog(db.Model):
    __tablename__ = 'vehicle_fuel_logs'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Fill-up details
    date = db.Column(db.Date, nullable=False)
    mileage = db.Column(db.Integer, nullable=False)  # Odometer reading at fill-up

    # Fuel details
    gallons = db.Column(db.Float, nullable=False)
    gallons_unit = db.Column(db.String(10), default='gal')  # gal or L
    price_per_gallon = db.Column(db.Float)
    total_cost = db.Column(db.Integer)  # in cents

    # Calculated MPG (optional - can be calculated from previous fill-up)
    mpg = db.Column(db.Float)  # Miles per gallon

    # Station info
    station_name = db.Column(db.String(100))
    location = db.Column(db.String(200))

    # Full tank indicator
    is_full_tank = db.Column(db.Boolean, default=True)  # Important for MPG calculations

    # Notes
    notes = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    vehicle = db.relationship('Vehicle', back_populates='fuel_logs')
    user = db.relationship('User', back_populates='vehicle_fuel_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'date': self.date.isoformat(),
            'mileage': self.mileage,
            'gallons': self.gallons,
            'gallons_unit': self.gallons_unit,
            'price_per_gallon': self.price_per_gallon,
            'total_cost': self.total_cost / 100 if self.total_cost else None,
            'mpg': self.mpg,
            'station_name': self.station_name,
            'location': self.location,
            'is_full_tank': self.is_full_tank,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
```

### 4.2 API Endpoints

#### 4.2.1 Vehicles API (`/api/vehicles`)

**Endpoints**:
- `GET /api/vehicles` - Get all vehicles for current user
- `GET /api/vehicles/<id>` - Get single vehicle
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/<id>` - Update vehicle
- `DELETE /api/vehicles/<id>` - Delete vehicle (soft delete)
- `PUT /api/vehicles/<id>/mileage` - Update current mileage

**Implementation Pattern**: Same as petPal pets API (JWT-protected, user-filtered)

#### 4.2.2 Vehicle Maintenance Records API (`/api/vehicle-maintenance`)

**Endpoints**:
- `GET /api/vehicle-maintenance?vehicle_id=1` - Get maintenance history
- `GET /api/vehicle-maintenance/<id>` - Get single record
- `POST /api/vehicle-maintenance` - Create maintenance record
- `PUT /api/vehicle-maintenance/<id>` - Update record
- `DELETE /api/vehicle-maintenance/<id>` - Delete record
- `GET /api/vehicle-maintenance/summary?vehicle_id=1` - Get cost summary

#### 4.2.3 Vehicle Maintenance Schedules API (`/api/vehicle-schedules`)

**Endpoints**:
- `GET /api/vehicle-schedules?vehicle_id=1` - Get maintenance schedules
- `GET /api/vehicle-schedules/<id>` - Get single schedule
- `POST /api/vehicle-schedules` - Create schedule
- `PUT /api/vehicle-schedules/<id>` - Update schedule
- `DELETE /api/vehicle-schedules/<id>` - Delete schedule
- `GET /api/vehicle-schedules/due-soon?vehicle_id=1` - Get upcoming maintenance
- `POST /api/vehicle-schedules/<id>/complete` - Mark schedule as completed (creates maintenance record, recalculates next due)

#### 4.2.4 Vehicle Fuel Logs API (`/api/vehicle-fuel`)

**Endpoints**:
- `GET /api/vehicle-fuel?vehicle_id=1` - Get fuel logs
- `GET /api/vehicle-fuel/<id>` - Get single log
- `POST /api/vehicle-fuel` - Create fuel log
- `PUT /api/vehicle-fuel/<id>` - Update log
- `DELETE /api/vehicle-fuel/<id>` - Delete log
- `GET /api/vehicle-fuel/stats?vehicle_id=1` - Get MPG statistics

#### 4.2.5 Vehicle Documents API (extends `/api/documents`)

**New Query Params**:
- `GET /api/documents?vehicle_id=1` - Get vehicle documents
- Same CRUD operations as existing document API

**New Categories**: vehicle_registration, vehicle_insurance, vehicle_title, vehicle_inspection, vehicle_maintenance, vehicle_warranty

### 4.3 Integration Points

#### 4.3.1 Service Providers Integration
- Add "Mechanic", "Dealership", "Body Shop", "Tire Shop", "Car Wash" categories
- Link VehicleMaintenanceRecord to ServiceProvider
- Display mechanic contact info on vehicle detail page

#### 4.3.2 Cost Tracking Integration
- Add `vehicle_id` foreign key to Expense model
- New expense categories: fuel, maintenance, repairs, insurance, registration, inspection, car_wash, parking, tolls, parts, tires, loan_payment
- Vehicle expense dashboard showing monthly costs per vehicle
- Calculate cost per mile metrics

#### 4.3.3 Document Storage Integration
- Add vehicle document categories (listed above)
- Link Document to Vehicle via `vehicle_id` foreign key
- Document expiration tracking for registration, insurance, inspection

#### 4.3.4 Notification System Integration
- **Maintenance due alerts**: Notify when scheduled maintenance is due soon (date or mileage)
- **Registration renewal**: Alert 30 days before registration expires
- **Insurance renewal**: Alert 30 days before insurance expires
- **Inspection due**: Alert based on inspection expiration date
- **Oil change reminder**: Mileage-based alert (e.g., every 5000 miles)

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal**: Set up module system infrastructure and shared services

#### Tasks:
1. **Module Toggle System**
   - Add `ENABLE_PETPAL` and `ENABLE_CARPAL` to config.py
   - Implement conditional blueprint registration in `app/__init__.py`
   - Create `/api/config/modules` endpoint for frontend
   - Add module config fetching to frontend (config.js)
   - **Complexity**: Low
   - **Dependencies**: None

2. **Service Provider System** (NEW)
   - Create ServiceProvider model
   - Create `/api/service-providers` blueprint
   - Frontend: ServiceProviderList and ServiceProviderForm components
   - **Complexity**: Medium
   - **Dependencies**: None
   - **Note**: Shared by both petPal and carPal

3. **Document Storage Extensions**
   - Add `pet_id` and `vehicle_id` foreign keys to Document model
   - Migration: `add_pet_vehicle_to_documents`
   - Add new document categories to constants.py
   - **Complexity**: Low
   - **Dependencies**: None

4. **Cost Tracking Extensions**
   - Add `pet_id` and `vehicle_id` foreign keys to Expense model
   - Migration: `add_pet_vehicle_to_expenses`
   - Add new expense categories
   - **Complexity**: Low
   - **Dependencies**: None

5. **User Model Updates**
   - Add relationships: `pets`, `vehicles`, `service_providers`, `pet_health_records`, etc.
   - **Complexity**: Low
   - **Dependencies**: None

### Phase 2: petPal Backend (Week 3-4)

**Goal**: Build complete petPal backend API

#### Tasks:
1. **Pet Model & API**
   - Create Pet model (`backend/app/models/pet.py`)
   - Migration: `create_pets_table`
   - Create `/api/pets` blueprint
   - CRUD endpoints + species list endpoint
   - **Complexity**: Medium
   - **Dependencies**: Phase 1 complete

2. **Pet Health Records**
   - Create PetHealthRecord model
   - Migration: `create_pet_health_records_table`
   - Create `/api/pet-health` blueprint
   - CRUD endpoints + vaccination history endpoint
   - **Complexity**: Medium
   - **Dependencies**: Pet model

3. **Pet Medications**
   - Create PetMedication model
   - Migration: `create_pet_medications_table`
   - Create `/api/pet-medications` blueprint
   - CRUD endpoints + refill reminders endpoint
   - **Complexity**: Medium
   - **Dependencies**: Pet model

4. **Pet Care Routines**
   - Create PetCareRoutine model
   - Migration: `create_pet_care_routines_table`
   - Create `/api/pet-care` blueprint
   - CRUD endpoints
   - **Complexity**: Low-Medium
   - **Dependencies**: Pet model

5. **Pet Emergency Info**
   - Create PetEmergencyInfo model
   - Migration: `create_pet_emergency_info_table`
   - Create `/api/pet-emergency` blueprint
   - CRUD endpoints
   - **Complexity**: Low
   - **Dependencies**: Pet model, ServiceProvider model

6. **Pet Sitter Share Mode**
   - Create PetShareToken model
   - Migration: `create_pet_share_tokens_table`
   - Create `/api/pet-share` blueprint
   - Generate shareable link endpoint (with QR code)
   - Public read-only endpoint (no auth)
   - **Complexity**: Medium-High
   - **Dependencies**: All pet models complete

### Phase 3: petPal Frontend (Week 5-6)

**Goal**: Build complete petPal user interface

#### Tasks:
1. **Pet List & Detail Views**
   - PetList component (grid of pet cards)
   - PetDetail component (profile, tabs for health/meds/care)
   - PetForm component (add/edit pet)
   - Routing: `/pets`, `/pets/:id`, `/pets/new`, `/pets/:id/edit`
   - **Complexity**: Medium
   - **Dependencies**: Pet API complete

2. **Health Records UI**
   - HealthRecordList component (timeline view)
   - HealthRecordForm component (add/edit record)
   - VaccinationCard component (upcoming vaccinations widget)
   - **Complexity**: Medium
   - **Dependencies**: Pet Health API complete

3. **Medications UI**
   - MedicationList component (active meds with schedule)
   - MedicationForm component (add/edit medication)
   - Medication refill alerts UI
   - **Complexity**: Medium
   - **Dependencies**: Pet Medications API complete

4. **Care Routines UI**
   - CareRoutineList component (feeding/exercise schedules)
   - CareRoutineForm component (add/edit routine)
   - **Complexity**: Low-Medium
   - **Dependencies**: Pet Care API complete

5. **Emergency Card UI**
   - EmergencyCard component (read-only display)
   - EmergencyCardForm component (edit emergency info)
   - Print/export emergency card (PDF generation)
   - **Complexity**: Medium
   - **Dependencies**: Pet Emergency API complete

6. **Pet Sitter Share UI**
   - PetSitterShareModal component (generate link modal)
   - PetSitterView component (public read-only view)
   - QR code display
   - Share link management (revoke, expiry settings)
   - **Complexity**: Medium-High
   - **Dependencies**: Pet Share API complete

7. **Navigation Integration**
   - Update Sidebar with petPal section (conditionally rendered)
   - Add petPal routes to App.js (conditionally rendered)
   - petPal dashboard/landing page
   - **Complexity**: Low
   - **Dependencies**: All petPal components complete

### Phase 4: carPal Backend (Week 7-8)

**Goal**: Build complete carPal backend API

#### Tasks:
1. **Vehicle Model & API**
   - Create Vehicle model (`backend/app/models/vehicle.py`)
   - Migration: `create_vehicles_table`
   - Create `/api/vehicles` blueprint
   - CRUD endpoints + mileage update endpoint
   - **Complexity**: Medium
   - **Dependencies**: Phase 1 complete

2. **Vehicle Maintenance Records**
   - Create VehicleMaintenanceRecord model
   - Migration: `create_vehicle_maintenance_records_table`
   - Create `/api/vehicle-maintenance` blueprint
   - CRUD endpoints + cost summary endpoint
   - **Complexity**: Medium
   - **Dependencies**: Vehicle model

3. **Vehicle Maintenance Schedules**
   - Create VehicleMaintenanceSchedule model
   - Migration: `create_vehicle_maintenance_schedules_table`
   - Create `/api/vehicle-schedules` blueprint
   - CRUD endpoints + due-soon endpoint
   - Complete schedule endpoint (creates record, recalculates next due)
   - **Complexity**: High (complex scheduling logic)
   - **Dependencies**: Vehicle model, VehicleMaintenanceRecord model

4. **Vehicle Fuel Logs** (Optional)
   - Create VehicleFuelLog model
   - Migration: `create_vehicle_fuel_logs_table`
   - Create `/api/vehicle-fuel` blueprint
   - CRUD endpoints + MPG statistics endpoint
   - **Complexity**: Medium
   - **Dependencies**: Vehicle model

5. **Vehicle Documents Integration**
   - Extend `/api/documents` to support `vehicle_id` query param
   - Add vehicle document categories
   - **Complexity**: Low
   - **Dependencies**: Phase 1 document extensions complete

### Phase 5: carPal Frontend (Week 9-10) - FUTURE

**Goal**: Build complete carPal user interface (deferred - backend first)

#### Tasks (Deferred to Future Iteration):
1. Vehicle list and detail views
2. Maintenance record timeline
3. Maintenance schedule dashboard
4. Fuel log tracker
5. MPG statistics charts
6. Navigation integration

### Phase 6: Notification System (Week 11-12)

**Goal**: Build notification infrastructure for reminders

#### Tasks:
1. **Notification Service Backend**
   - Implement APScheduler for background jobs
   - Email notification templates
   - Notification preferences in Settings model
   - **Complexity**: High
   - **Dependencies**: All models complete

2. **petPal Notifications**
   - Medication reminders (daily, scheduled)
   - Vaccination due alerts (30 days before)
   - Vet appointment reminders
   - Pet insurance/license renewal alerts
   - **Complexity**: Medium
   - **Dependencies**: Notification service, petPal complete

3. **carPal Notifications**
   - Maintenance due alerts (date and mileage-based)
   - Registration renewal (30 days before)
   - Insurance renewal (30 days before)
   - Inspection due alerts
   - **Complexity**: Medium
   - **Dependencies**: Notification service, carPal backend complete

4. **Notification Preferences UI**
   - Settings page section for notification preferences
   - Toggle notifications per module
   - Configure reminder timing
   - **Complexity**: Medium
   - **Dependencies**: Notification service complete

### Phase 7: Testing & Polish (Week 13-14)

**Goal**: Testing, bug fixes, documentation

#### Tasks:
1. **Backend Tests**
   - Unit tests for all new models
   - API endpoint integration tests
   - Test notification system
   - **Complexity**: High
   - **Dependencies**: All backend features complete

2. **Frontend Tests**
   - Component tests
   - E2E tests for key flows
   - **Complexity**: High
   - **Dependencies**: All frontend features complete

3. **Documentation**
   - Update README with module instructions
   - API documentation for new endpoints
   - User guide for petPal and carPal
   - **Complexity**: Medium
   - **Dependencies**: All features complete

4. **Docker & Deployment**
   - Test module toggles in Docker environment
   - Update docker-compose.yml with new env vars
   - Migration testing
   - **Complexity**: Medium
   - **Dependencies**: All features complete

---

## 6. Risks & Open Questions

### 6.1 Technical Risks

#### Risk 1: Database Migration Complexity
**Description**: Adding foreign keys to Document and Expense models could cause migration issues if data exists
**Mitigation**: Migrations are nullable, existing data unaffected
**Severity**: Low

#### Risk 2: Notification System Performance
**Description**: Background job scheduler could impact performance
**Mitigation**: Use APScheduler with optimized queries, consider celery for production
**Severity**: Medium

#### Risk 3: Module Toggle Complexity
**Description**: Frontend routing with conditional modules could get complex
**Mitigation**: Centralize module config in single source, use context
**Severity**: Low

#### Risk 4: Pet Sitter Share Security
**Description**: Public endpoint could be abused
**Mitigation**: Rate limiting, token expiration, access tracking
**Severity**: Medium

### 6.2 Open Questions

#### Question 1: Notification Preferences Granularity
**Question**: Should notification preferences be per-user, per-pet, per-vehicle, or all three?
**Options**:
  - A) Per-user only (simplest)
  - B) Per-user + per-pet/vehicle overrides (most flexible)
  - C) Per-notification-type only
**Recommendation**: Start with (A), add (B) if users request it

#### Question 2: Multi-Pet/Multi-Vehicle UI
**Question**: Should the UI show all pets/vehicles on one dashboard, or separate pages per pet/vehicle?
**Options**:
  - A) List view → detail view (current pattern)
  - B) Tabbed interface (all pets on one page)
  - C) Dashboard with widgets (all pets summarized)
**Recommendation**: (A) for consistency with existing propertyPal patterns

#### Question 3: Fuel Tracking Priority
**Question**: Is fuel tracking essential for MVP, or can it be deferred?
**Options**:
  - A) Include in Phase 4 (complete feature set)
  - B) Defer to Phase 8 (future enhancement)
**Recommendation**: (B) - not critical for launch, can add later

#### Question 4: Mobile App Timeline
**Question**: When should mobile-specific features (camera, push notifications, offline mode) be built?
**Options**:
  - A) After web MVP (Phase 7+)
  - B) In parallel with web frontend
  - C) Deferred indefinitely
**Recommendation**: (A) - web first, mobile optimizations later

#### Question 5: finPal Integration
**Question**: Should expense data flow to finPal automatically, or manual export?
**Options**:
  - A) Automatic sync (when finPal built)
  - B) Manual CSV export
  - C) API integration only
**Recommendation**: (A) - automatic sync via shared database (petPal and carPal expenses already in Expense table)

### 6.3 Design Decisions Needed

#### Decision 1: Species-Specific Fields
**Question**: Should Pet model have species-specific fields (e.g., bird: wing_span, fish: tank_size), or generic notes field?
**Current Design**: Generic notes field + optional species-specific UI components
**Alternative**: JSON field for species_specific_data
**Input Needed**: User feedback on what fields are essential

#### Decision 2: Medication Dosing Schedule
**Question**: Should medication schedule be simple (string: "twice daily") or structured (time-based: 8:00 AM, 8:00 PM)?
**Current Design**: String-based (flexible)
**Alternative**: Structured schedule with notification times
**Input Needed**: Notification system requirements

#### Decision 3: Vehicle Maintenance Auto-Scheduling
**Question**: Should maintenance schedules auto-recalculate next due dates, or require manual updates?
**Current Design**: Auto-recalculate when maintenance record created via "complete schedule" endpoint
**Alternative**: Manual recalculation only
**Input Needed**: UX design review

#### Decision 4: Document Storage per Module
**Question**: Should petPal/carPal documents be stored in separate folders, or same `/uploads/documents/` folder?
**Current Design**: Same folder with category-based subfolders
**Alternative**: `/uploads/pet-documents/`, `/uploads/vehicle-documents/`
**Input Needed**: Deployment/backup considerations

---

## 7. Success Metrics

### 7.1 Development Metrics
- All database migrations run successfully without data loss
- API test coverage >80%
- Frontend component test coverage >70%
- Module toggles work in Docker environment
- No breaking changes to core propertyPal functionality

### 7.2 User Adoption Metrics (Post-Launch)
- % of users enabling petPal module
- % of users enabling carPal module
- Average pets per user
- Average vehicles per user
- Notification engagement rate (click-through on reminders)

### 7.3 Technical Performance Metrics
- API response time <200ms (p95)
- Background jobs complete within 5 minutes
- No database query N+1 issues
- Mobile-responsive UI (all breakpoints tested)

---

## Appendix A: Model Relationship Diagram

```
User
├── pets (1:many)
├── vehicles (1:many)
├── service_providers (1:many)
├── pet_health_records (1:many)
├── pet_medications (1:many)
├── pet_care_routines (1:many)
├── vehicle_maintenance_records (1:many)
├── vehicle_maintenance_schedules (1:many)
├── vehicle_fuel_logs (1:many)
└── expenses (1:many)

Property
├── pets (1:many)
└── vehicles (1:many)

Pet
├── health_records (1:many)
├── medications (1:many)
├── care_routines (1:many)
├── emergency_info (1:1)
├── documents (1:many via pet_id)
└── expenses (1:many via pet_id)

Vehicle
├── maintenance_records (1:many)
├── maintenance_schedules (1:many)
├── fuel_logs (1:many)
├── documents (1:many via vehicle_id)
└── expenses (1:many via vehicle_id)

Document (polymorphic)
├── property_id (nullable)
├── appliance_id (nullable)
├── pet_id (nullable)
└── vehicle_id (nullable)

Expense (polymorphic)
├── property_id (nullable)
├── pet_id (nullable)
└── vehicle_id (nullable)

ServiceProvider
├── pet_health_records (1:many)
└── vehicle_maintenance_records (1:many)
```

---

## Appendix B: Environment Variables

```bash
# Module Toggles
ENABLE_PETPAL=true
ENABLE_CARPAL=true

# Existing Variables (no changes)
SECRET_KEY=...
JWT_SECRET_KEY=...
DATABASE_URL=...
DEMO_MODE=false
SKIP_EMAIL_VERIFICATION=true

# Notification System (Phase 6)
ENABLE_NOTIFICATIONS=true
NOTIFICATION_EMAIL_FROM=noreply@propertypal.app
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...

# Optional: Twilio for SMS notifications (future)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

---

## Appendix C: API Endpoint Summary

### petPal Endpoints (14 total)
- `/api/pets` (GET, POST)
- `/api/pets/<id>` (GET, PUT, DELETE)
- `/api/pets/species` (GET)
- `/api/pet-health` (GET, POST)
- `/api/pet-health/<id>` (GET, PUT, DELETE)
- `/api/pet-health/vaccinations` (GET)
- `/api/pet-health/upcoming` (GET)
- `/api/pet-medications` (GET, POST)
- `/api/pet-medications/<id>` (GET, PUT, DELETE)
- `/api/pet-medications/refill-reminders` (GET)
- `/api/pet-care` (GET, POST)
- `/api/pet-care/<id>` (GET, PUT, DELETE)
- `/api/pet-emergency/<pet_id>` (GET, POST, PUT)
- `/api/pet-share/<pet_id>` (POST)
- `/api/pet-share/<token>` (GET, DELETE)

### carPal Endpoints (16 total)
- `/api/vehicles` (GET, POST)
- `/api/vehicles/<id>` (GET, PUT, DELETE)
- `/api/vehicles/<id>/mileage` (PUT)
- `/api/vehicle-maintenance` (GET, POST)
- `/api/vehicle-maintenance/<id>` (GET, PUT, DELETE)
- `/api/vehicle-maintenance/summary` (GET)
- `/api/vehicle-schedules` (GET, POST)
- `/api/vehicle-schedules/<id>` (GET, PUT, DELETE)
- `/api/vehicle-schedules/due-soon` (GET)
- `/api/vehicle-schedules/<id>/complete` (POST)
- `/api/vehicle-fuel` (GET, POST)
- `/api/vehicle-fuel/<id>` (GET, PUT, DELETE)
- `/api/vehicle-fuel/stats` (GET)

### Shared Infrastructure Endpoints
- `/api/service-providers` (GET, POST)
- `/api/service-providers/<id>` (GET, PUT, DELETE)
- `/api/config/modules` (GET)
- `/api/documents?pet_id=1` (GET)
- `/api/documents?vehicle_id=1` (GET)
- `/api/expenses?pet_id=1` (GET)
- `/api/expenses?vehicle_id=1` (GET)

---

**END OF SPECIFICATION**
