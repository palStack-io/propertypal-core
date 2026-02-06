# api/appliances.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.appliance import Appliance
from app.models.property import Property
from app.models.user import User
from datetime import datetime

appliances_bp = Blueprint('appliances', __name__)

@appliances_bp.route('/', methods=['GET'])
@jwt_required()
def get_appliances():
    """Get all appliances for the current user"""
    current_user_id = int(get_jwt_identity())

    property_id = request.args.get('property_id')

    # If property_id is provided, verify ownership
    if property_id:
        property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found"}), 404

        query = Appliance.query.filter_by(property_id=property_id)
    else:
        # Get all appliances for the user
        query = Appliance.query.filter_by(user_id=current_user_id)

    # Apply category filter if provided
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)

    # Execute query
    appliances = query.order_by(Appliance.created_at.desc()).all()

    result = []
    for appliance in appliances:
        result.append({
            'id': appliance.id,
            'name': appliance.name,
            'brand': appliance.brand,
            'model': appliance.model,
            'serial_number': appliance.serial_number,
            'purchase_date': appliance.purchase_date.isoformat() if appliance.purchase_date else None,
            'warranty_expiration': appliance.warranty_expiration.isoformat() if appliance.warranty_expiration else None,
            'notes': appliance.notes,
            'category': appliance.category,
            'created_at': appliance.created_at.isoformat(),
            'updated_at': appliance.updated_at.isoformat(),
            'property_id': appliance.property_id,
            'created_by': appliance.user_id
        })

    return jsonify(result)

@appliances_bp.route('/', methods=['POST'])
@jwt_required()
def create_appliance():
    """Add a new appliance"""
    current_user_id = int(get_jwt_identity())

    data = request.get_json()

    # Validate required fields
    if not data or not data.get('name') or not data.get('category'):
        return jsonify({"error": "Name and category are required"}), 400

    # If a property_id is provided, verify ownership
    property_id = data.get('property_id')
    if property_id:
        property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found"}), 404

    # Create new appliance
    new_appliance = Appliance(
        user_id=current_user_id,
        property_id=property_id,
        name=data.get('name'),
        brand=data.get('brand', ''),
        model=data.get('model', ''),
        serial_number=data.get('serial_number', ''),
        purchase_date=datetime.strptime(data.get('purchase_date'), '%Y-%m-%d').date() if data.get('purchase_date') else None,
        warranty_expiration=datetime.strptime(data.get('warranty_expiration'), '%Y-%m-%d').date() if data.get('warranty_expiration') else None,
        notes=data.get('notes', ''),
        category=data.get('category')
    )

    db.session.add(new_appliance)
    db.session.commit()

    return jsonify({
        'id': new_appliance.id,
        'name': new_appliance.name,
        'message': 'Appliance added successfully'
    }), 201

@appliances_bp.route('/<int:appliance_id>', methods=['GET'])
@jwt_required()
def get_appliance(appliance_id):
    """Get a specific appliance"""
    current_user_id = int(get_jwt_identity())

    appliance = Appliance.query.filter_by(id=appliance_id, user_id=current_user_id).first()
    if not appliance:
        return jsonify({"error": "Appliance not found"}), 404

    result = {
        'id': appliance.id,
        'name': appliance.name,
        'brand': appliance.brand,
        'model': appliance.model,
        'serial_number': appliance.serial_number,
        'purchase_date': appliance.purchase_date.isoformat() if appliance.purchase_date else None,
        'warranty_expiration': appliance.warranty_expiration.isoformat() if appliance.warranty_expiration else None,
        'notes': appliance.notes,
        'category': appliance.category,
        'created_at': appliance.created_at.isoformat(),
        'updated_at': appliance.updated_at.isoformat(),
        'property_id': appliance.property_id
    }

    return jsonify(result)

@appliances_bp.route('/<int:appliance_id>', methods=['PUT'])
@jwt_required()
def update_appliance(appliance_id):
    """Update an appliance"""
    current_user_id = int(get_jwt_identity())

    appliance = Appliance.query.filter_by(id=appliance_id, user_id=current_user_id).first()
    if not appliance:
        return jsonify({"error": "Appliance not found"}), 404

    data = request.get_json()

    # Update fields if provided
    if 'name' in data:
        appliance.name = data['name']

    if 'brand' in data:
        appliance.brand = data['brand']

    if 'model' in data:
        appliance.model = data['model']

    if 'serial_number' in data:
        appliance.serial_number = data['serial_number']

    if 'purchase_date' in data and data['purchase_date']:
        appliance.purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()

    if 'warranty_expiration' in data and data['warranty_expiration']:
        appliance.warranty_expiration = datetime.strptime(data['warranty_expiration'], '%Y-%m-%d').date()

    if 'notes' in data:
        appliance.notes = data['notes']

    if 'category' in data:
        appliance.category = data['category']

    # If property_id is being updated, verify ownership
    if 'property_id' in data and data['property_id'] != appliance.property_id:
        new_property_id = data['property_id']
        if new_property_id:
            property = Property.query.filter_by(id=new_property_id, user_id=current_user_id).first()
            if not property:
                return jsonify({"error": "Property not found"}), 404
        appliance.property_id = new_property_id

    db.session.commit()

    return jsonify({
        'id': appliance.id,
        'name': appliance.name,
        'message': 'Appliance updated successfully'
    })

@appliances_bp.route('/<int:appliance_id>', methods=['DELETE'])
@jwt_required()
def delete_appliance(appliance_id):
    """Delete an appliance"""
    current_user_id = int(get_jwt_identity())

    appliance = Appliance.query.filter_by(id=appliance_id, user_id=current_user_id).first()
    if not appliance:
        return jsonify({"error": "Appliance not found"}), 404

    db.session.delete(appliance)
    db.session.commit()

    return jsonify({
        'message': 'Appliance deleted successfully'
    })
