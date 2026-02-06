# api/maintenance_checklist.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.maintenance_checklist import MaintenanceChecklistItem
from app.models.user import User
from app.models.property import Property
from datetime import datetime

# Create blueprint for checklist routes
checklist_bp = Blueprint('maintenance_checklist', __name__, url_prefix='/api/maintenance/checklist')

@checklist_bp.route('/<season>', methods=['GET'])
@jwt_required()
def get_seasonal_checklist(season):
    """Get seasonal maintenance checklist for the current user"""
    current_user_id = int(get_jwt_identity())
    property_id = request.args.get('property_id')

    # Validate the season parameter
    valid_seasons = ['Spring', 'Summer', 'Fall', 'Winter']
    if season not in valid_seasons:
        return jsonify({"error": "Invalid season. Must be one of: Spring, Summer, Fall, Winter"}), 400

    # If property_id is provided, verify ownership
    if property_id:
        property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found"}), 404

        # Build the query for this property
        query = MaintenanceChecklistItem.query.filter_by(
            property_id=property_id,
            season=season
        )
    else:
        # Get checklist items for the user
        query = MaintenanceChecklistItem.query.filter_by(
            user_id=current_user_id,
            season=season
        )

    # Execute the query
    checklist_items = query.order_by(MaintenanceChecklistItem.is_completed,
                                    MaintenanceChecklistItem.task).all()

    # If no items exist for this property, create default items
    if not checklist_items and property_id:
        checklist_items = create_default_checklist_items(current_user_id, property_id, season)

    result = []
    for item in checklist_items:
        result.append({
            'id': item.id,
            'task': item.task,
            'description': item.description,
            'season': item.season,
            'is_completed': item.is_completed,
            'completed_at': item.completed_at.isoformat() if item.completed_at else None,
            'is_default': item.is_default,
            'property_id': item.property_id,
            'created_at': item.created_at.isoformat(),
            'updated_at': item.updated_at.isoformat(),
            'created_by': item.user_id
        })

    return jsonify(result)

@checklist_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_checklists():
    """Get all checklist items for the current user, optionally filtered by property"""
    current_user_id = int(get_jwt_identity())
    property_id = request.args.get('property_id')

    # If property_id is provided, verify ownership
    if property_id:
        property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found"}), 404

        # Build the query for this property
        query = MaintenanceChecklistItem.query.filter_by(property_id=property_id)
    else:
        # Get checklist items for the user
        query = MaintenanceChecklistItem.query.filter_by(user_id=current_user_id)

    # Execute the query
    items = query.order_by(MaintenanceChecklistItem.season,
                          MaintenanceChecklistItem.is_completed,
                          MaintenanceChecklistItem.task).all()

    # Group items by season
    result = {}
    for season in ['Spring', 'Summer', 'Fall', 'Winter']:
        result[season] = []

    for item in items:
        result[item.season].append({
            'id': item.id,
            'task': item.task,
            'description': item.description,
            'season': item.season,
            'is_completed': item.is_completed,
            'completed_at': item.completed_at.isoformat() if item.completed_at else None,
            'is_default': item.is_default,
            'property_id': item.property_id,
            'created_at': item.created_at.isoformat(),
            'updated_at': item.updated_at.isoformat(),
            'created_by': item.user_id
        })

    # Check if any seasons have no items for a specific property, create defaults for them
    if property_id:
        property_id_int = int(property_id)
        for season in ['Spring', 'Summer', 'Fall', 'Winter']:
            if not result[season]:
                new_items = create_default_checklist_items(current_user_id, property_id_int, season)
                for item in new_items:
                    result[season].append({
                        'id': item.id,
                        'task': item.task,
                        'description': item.description,
                        'season': item.season,
                        'is_completed': item.is_completed,
                        'completed_at': item.completed_at.isoformat() if item.completed_at else None,
                        'is_default': item.is_default,
                        'property_id': item.property_id,
                        'created_at': item.created_at.isoformat(),
                        'updated_at': item.updated_at.isoformat(),
                        'created_by': item.user_id
                    })

    return jsonify(result)

@checklist_bp.route('/', methods=['POST'])
@jwt_required()
def create_checklist_item():
    """Create a new custom checklist item"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # Validate required fields
    if not data or not data.get('task') or not data.get('season'):
        return jsonify({"error": "Task and season are required"}), 400

    # Validate season
    valid_seasons = ['Spring', 'Summer', 'Fall', 'Winter']
    if data.get('season') not in valid_seasons:
        return jsonify({"error": "Invalid season. Must be one of: Spring, Summer, Fall, Winter"}), 400

    # Create new checklist item
    new_item = MaintenanceChecklistItem(
        user_id=current_user_id,
        property_id=data.get('property_id'),
        task=data.get('task'),
        description=data.get('description', ''),
        season=data.get('season'),
        is_completed=data.get('is_completed', False),
        is_default=False
    )

    # Set completed_at timestamp if item is already completed
    if new_item.is_completed:
        new_item.completed_at = datetime.utcnow()

    db.session.add(new_item)
    db.session.commit()

    return jsonify({
        'id': new_item.id,
        'task': new_item.task,
        'description': new_item.description,
        'season': new_item.season,
        'is_completed': new_item.is_completed,
        'completed_at': new_item.completed_at.isoformat() if new_item.completed_at else None,
        'is_default': new_item.is_default,
        'property_id': new_item.property_id,
        'created_at': new_item.created_at.isoformat(),
        'updated_at': new_item.updated_at.isoformat(),
        'message': 'Checklist item created successfully'
    }), 201

@checklist_bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_checklist_item(item_id):
    """Get a specific checklist item"""
    current_user_id = int(get_jwt_identity())

    item = MaintenanceChecklistItem.query.filter_by(
        id=item_id,
        user_id=current_user_id
    ).first()

    if not item:
        return jsonify({"error": "Checklist item not found or access denied"}), 404

    result = {
        'id': item.id,
        'task': item.task,
        'description': item.description,
        'season': item.season,
        'is_completed': item.is_completed,
        'completed_at': item.completed_at.isoformat() if item.completed_at else None,
        'is_default': item.is_default,
        'property_id': item.property_id,
        'created_at': item.created_at.isoformat(),
        'updated_at': item.updated_at.isoformat()
    }

    return jsonify(result)

@checklist_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_checklist_item(item_id):
    """Update an existing checklist item"""
    current_user_id = int(get_jwt_identity())

    item = MaintenanceChecklistItem.query.filter_by(
        id=item_id,
        user_id=current_user_id
    ).first()

    if not item:
        return jsonify({"error": "Checklist item not found or access denied"}), 404

    data = request.get_json()

    # Update fields if provided
    if 'task' in data:
        item.task = data['task']

    if 'description' in data:
        item.description = data['description']

    if 'season' in data:
        # Validate season
        valid_seasons = ['Spring', 'Summer', 'Fall', 'Winter']
        if data['season'] not in valid_seasons:
            return jsonify({"error": "Invalid season. Must be one of: Spring, Summer, Fall, Winter"}), 400
        item.season = data['season']

    if 'is_completed' in data:
        # Update completion status and timestamp
        if data['is_completed'] and not item.is_completed:
            item.completed_at = datetime.utcnow()
        elif not data['is_completed'] and item.is_completed:
            item.completed_at = None

        item.is_completed = data['is_completed']

    if 'property_id' in data:
        item.property_id = data['property_id']

    # If a default item is edited, it's no longer a default
    if item.is_default and ('task' in data or 'description' in data or 'season' in data):
        item.is_default = False

    db.session.commit()

    return jsonify({
        'id': item.id,
        'task': item.task,
        'description': item.description,
        'season': item.season,
        'is_completed': item.is_completed,
        'completed_at': item.completed_at.isoformat() if item.completed_at else None,
        'is_default': item.is_default,
        'property_id': item.property_id,
        'created_at': item.created_at.isoformat(),
        'updated_at': item.updated_at.isoformat(),
        'message': 'Checklist item updated successfully'
    })

@checklist_bp.route('/<int:item_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_checklist_item(item_id):
    """Toggle completion status of a checklist item"""
    current_user_id = int(get_jwt_identity())

    item = MaintenanceChecklistItem.query.filter_by(
        id=item_id,
        user_id=current_user_id
    ).first()

    if not item:
        return jsonify({"error": "Checklist item not found or access denied"}), 404

    # Toggle completion status
    item.is_completed = not item.is_completed

    # Update completed_at timestamp
    if item.is_completed:
        item.completed_at = datetime.utcnow()
    else:
        item.completed_at = None

    db.session.commit()

    return jsonify({
        'id': item.id,
        'task': item.task,
        'is_completed': item.is_completed,
        'completed_at': item.completed_at.isoformat() if item.completed_at else None,
        'message': 'Checklist item toggled successfully'
    })

@checklist_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_checklist_item(item_id):
    """Delete a checklist item"""
    current_user_id = int(get_jwt_identity())

    item = MaintenanceChecklistItem.query.filter_by(
        id=item_id,
        user_id=current_user_id
    ).first()

    if not item:
        return jsonify({"error": "Checklist item not found or access denied"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({
        'message': 'Checklist item deleted successfully'
    })

@checklist_bp.route('/reset/<season>', methods=['POST'])
@jwt_required()
def reset_seasonal_checklist(season):
    """Reset a seasonal checklist to default items"""
    current_user_id = int(get_jwt_identity())
    property_id = request.args.get('property_id')

    # Validate the season parameter
    valid_seasons = ['Spring', 'Summer', 'Fall', 'Winter']
    if season not in valid_seasons:
        return jsonify({"error": "Invalid season. Must be one of: Spring, Summer, Fall, Winter"}), 400

    # Delete existing checklist items for this season and property
    query = MaintenanceChecklistItem.query.filter_by(
        user_id=current_user_id,
        season=season
    )

    if property_id:
        query = query.filter_by(property_id=property_id)

    query.delete()
    db.session.commit()

    # Create new default items
    property_id_int = int(property_id) if property_id else None
    checklist_items = create_default_checklist_items(current_user_id, property_id_int, season)

    result = []
    for item in checklist_items:
        result.append({
            'id': item.id,
            'task': item.task,
            'description': item.description,
            'season': item.season,
            'is_completed': item.is_completed,
            'completed_at': item.completed_at.isoformat() if item.completed_at else None,
            'is_default': item.is_default,
            'property_id': item.property_id,
            'created_at': item.created_at.isoformat(),
            'updated_at': item.updated_at.isoformat()
        })

    return jsonify({
        'message': f'Checklist for {season} has been reset to defaults',
        'items': result
    })

@checklist_bp.route('/batch-update', methods=['PUT'])
@jwt_required()
def batch_update_checklist():
    """Update multiple checklist items at once"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not isinstance(data.get('items'), list):
        return jsonify({"error": "Request must include an 'items' array"}), 400

    updated_items = []
    errors = []

    for item_data in data['items']:
        if not item_data.get('id'):
            errors.append({"error": "Each item must have an id", "item": item_data})
            continue

        item = MaintenanceChecklistItem.query.filter_by(
            id=item_data['id'],
            user_id=current_user_id
        ).first()

        if not item:
            errors.append({"error": "Item not found or access denied", "item_id": item_data['id']})
            continue

        # Update fields if provided
        if 'task' in item_data:
            item.task = item_data['task']
            if item.is_default:
                item.is_default = False

        if 'description' in item_data:
            item.description = item_data['description']
            if item.is_default:
                item.is_default = False

        if 'is_completed' in item_data:
            # Update completion status and timestamp
            if item_data['is_completed'] and not item.is_completed:
                item.completed_at = datetime.utcnow()
            elif not item_data['is_completed'] and item.is_completed:
                item.completed_at = None

            item.is_completed = item_data['is_completed']

        updated_items.append({
            'id': item.id,
            'task': item.task,
            'description': item.description,
            'season': item.season,
            'is_completed': item.is_completed,
            'completed_at': item.completed_at.isoformat() if item.completed_at else None,
            'is_default': item.is_default
        })

    db.session.commit()

    return jsonify({
        'updated_items': updated_items,
        'errors': errors,
        'message': f'Updated {len(updated_items)} checklist items'
    })

@checklist_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_checklist_stats():
    """Get statistics about checklist completion by season"""
    current_user_id = int(get_jwt_identity())
    property_id = request.args.get('property_id')

    seasons = ['Spring', 'Summer', 'Fall', 'Winter']
    stats = {}

    for season in seasons:
        query = MaintenanceChecklistItem.query.filter_by(
            user_id=current_user_id,
            season=season
        )

        if property_id:
            query = query.filter_by(property_id=property_id)

        total_items = query.count()
        completed_items = query.filter_by(is_completed=True).count()

        completion_percentage = 0
        if total_items > 0:
            completion_percentage = (completed_items / total_items) * 100

        stats[season] = {
            'total': total_items,
            'completed': completed_items,
            'percentage': round(completion_percentage, 1)
        }

    # Calculate overall stats
    total_all = sum(s['total'] for s in stats.values())
    completed_all = sum(s['completed'] for s in stats.values())

    overall_percentage = 0
    if total_all > 0:
        overall_percentage = (completed_all / total_all) * 100

    stats['overall'] = {
        'total': total_all,
        'completed': completed_all,
        'percentage': round(overall_percentage, 1)
    }

    return jsonify(stats)

def create_default_checklist_items(user_id, property_id, season):
    """Create default checklist items for a given season"""
    default_items = {
        'Spring': [
            {'task': 'Clean gutters and downspouts', 'description': 'Remove debris and check for proper drainage'},
            {'task': 'Inspect roof for damage', 'description': 'Check for missing/damaged shingles or signs of leaks'},
            {'task': 'Service air conditioning system', 'description': 'Schedule professional maintenance'},
            {'task': 'Check exterior drainage', 'description': 'Ensure water flows away from foundation'},
            {'task': 'Inspect and clean deck', 'description': 'Clean, repair, and reseal if needed'},
            {'task': 'Test smoke and CO detectors', 'description': 'Replace batteries and test functionality'},
            {'task': 'Check for leaks around windows and doors', 'description': 'Inspect seals and weatherstripping'},
            {'task': 'Trim trees and shrubs', 'description': 'Remove branches near the house and roof'},
            {'task': 'Inspect foundation for cracks', 'description': 'Note and repair any new or expanding cracks'},
            {'task': 'Clean outdoor furniture', 'description': 'Clean and prepare patio furniture for use'}
        ],
        'Summer': [
            {'task': 'Check irrigation systems', 'description': 'Ensure sprinklers and watering systems are working properly'},
            {'task': 'Inspect for pest infestations', 'description': 'Look for signs of termites, ants, or other pests'},
            {'task': 'Clean and inspect outdoor grill', 'description': 'Clean grates and check propane connections'},
            {'task': 'Check window screens', 'description': 'Repair any tears or holes in window screens'},
            {'task': 'Service lawn equipment', 'description': 'Sharpen mower blades and check other equipment'},
            {'task': 'Check pool maintenance', 'description': 'Test water, clean filters, check equipment (if applicable)'},
            {'task': 'Test garage door and lubricate', 'description': 'Ensure proper operation and safety features'},
            {'task': 'Clean dryer vent', 'description': 'Remove lint buildup to prevent fire hazards'},
            {'task': 'Check attic ventilation', 'description': 'Ensure proper airflow to prevent heat buildup'},
            {'task': 'Inspect driveway and walkways', 'description': 'Repair cracks and seal if needed'}
        ],
        'Fall': [
            {'task': 'Clean gutters and downspouts', 'description': 'Remove fallen leaves and debris'},
            {'task': 'Service heating system', 'description': 'Schedule professional maintenance before winter'},
            {'task': 'Check chimney and fireplace', 'description': 'Clean and inspect for safe operation'},
            {'task': 'Seal gaps and cracks', 'description': 'Prevent drafts and pests from entering'},
            {'task': 'Test smoke and CO detectors', 'description': 'Replace batteries and test functionality'},
            {'task': 'Store outdoor furniture', 'description': 'Clean and store or cover for winter'},
            {'task': 'Drain and store garden hoses', 'description': 'Prevent freezing and damage'},
            {'task': 'Winterize irrigation system', 'description': 'Drain water to prevent freezing damage'},
            {'task': 'Inspect roof and repair if needed', 'description': 'Address issues before winter weather'},
            {'task': 'Rake leaves and aerate lawn', 'description': 'Prepare lawn for winter dormancy'}
        ],
        'Winter': [
            {'task': 'Check for ice dams on roof', 'description': 'Remove snow buildup to prevent ice dams'},
            {'task': 'Test sump pump', 'description': 'Ensure proper operation before spring thaw'},
            {'task': 'Check for drafts', 'description': 'Identify and seal cold air leaks'},
            {'task': 'Inspect attic insulation', 'description': 'Check for proper coverage and no moisture issues'},
            {'task': 'Check basement for water leaks', 'description': 'Inspect during thaws or heavy rain'},
            {'task': 'Monitor humidity levels', 'description': 'Maintain proper indoor humidity (30-50%)'},
            {'task': 'Check water heater', 'description': 'Inspect for leaks and flush if needed'},
            {'task': 'Clean refrigerator coils', 'description': 'Remove dust to improve efficiency'},
            {'task': 'Check emergency supplies', 'description': 'Update emergency kit for winter storms'},
            {'task': 'Protect outdoor faucets', 'description': 'Ensure they are drained and insulated'}
        ]
    }

    items = []
    for task_data in default_items.get(season, []):
        item = MaintenanceChecklistItem(
            user_id=user_id,
            property_id=property_id,
            task=task_data['task'],
            description=task_data['description'],
            season=season,
            is_completed=False,
            is_default=True
        )
        db.session.add(item)
        items.append(item)

    db.session.commit()
    return items
