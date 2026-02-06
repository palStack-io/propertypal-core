# api/properties.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.property import Property
from app.models.user import User
from app import db
from datetime import datetime

properties_bp = Blueprint('properties', __name__)

@properties_bp.route('/', methods=['GET'])
@jwt_required()
def get_properties():
    """Get the user's property (single property per instance)"""
    current_user_id = int(get_jwt_identity())

    # Get the user's property
    property = Property.query.filter_by(user_id=current_user_id).first()

    if not property:
        return jsonify([]), 200  # Return empty array for compatibility

    # Return as array for frontend compatibility
    properties_data = [{
        'id': property.id,
        'address': property.address,
        'city': property.city,
        'state': property.state,
        'zip': property.zip,
        'property_type': property.property_type,
        'status': property.status,
        'purchase_date': property.purchase_date.isoformat() if property.purchase_date else None,
        'purchase_price': property.purchase_price,
        'current_value': property.current_value,
        'bedrooms': property.bedrooms,
        'bathrooms': property.bathrooms,
        'square_footage': property.square_footage,
        'is_primary_residence': True,  # Always primary in single-property mode
        'created_at': property.created_at.isoformat(),
        'role': 'owner'  # Always owner in single-user mode
    }]

    return jsonify(properties_data), 200

@properties_bp.route('/', methods=['POST'])
@jwt_required()
def create_property():
    """Create the user's property (only one allowed)"""
    current_user_id = int(get_jwt_identity())

    # Check if user already has a property
    existing_property = Property.query.filter_by(user_id=current_user_id).first()
    if existing_property:
        return jsonify({
            "error": "You already have a property. PropertyPal Core supports one property per user."
        }), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['address', 'city', 'state', 'zip', 'property_type']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Create new property
    new_property = Property(
        user_id=current_user_id,
        address=data['address'],
        city=data['city'],
        state=data['state'],
        zip=data['zip'],
        property_type=data['property_type'],
        status=data.get('status', 'active'),
        bedrooms=data.get('bedrooms'),
        bathrooms=data.get('bathrooms'),
        square_footage=data.get('square_footage'),
        purchase_date=data.get('purchase_date'),
        purchase_price=data.get('purchase_price'),
        current_value=data.get('current_value'),
        description=data.get('description', ''),
        is_primary_residence=True  # Always primary in single-property mode
    )

    db.session.add(new_property)
    db.session.commit()

    return jsonify({
        'id': new_property.id,
        'address': new_property.address,
        'message': 'Property created successfully'
    }), 201

@properties_bp.route('/<int:property_id>', methods=['GET'])
@jwt_required()
def get_property(property_id):
    """Get the user's property by ID"""
    current_user_id = int(get_jwt_identity())

    # Check if property belongs to user
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()

    if not property:
        return jsonify({"error": "Property not found"}), 404

    property_data = {
        'id': property.id,
        'address': property.address,
        'city': property.city,
        'state': property.state,
        'zip': property.zip,
        'property_type': property.property_type,
        'status': property.status,
        'purchase_date': property.purchase_date.isoformat() if property.purchase_date else None,
        'purchase_price': property.purchase_price,
        'current_value': property.current_value,
        'bedrooms': property.bedrooms,
        'bathrooms': property.bathrooms,
        'square_footage': property.square_footage,
        'created_at': property.created_at.isoformat(),
        'role': 'owner'  # Always owner in single-user mode
    }

    return jsonify(property_data), 200

@properties_bp.route('/<int:property_id>', methods=['PUT'])
@jwt_required()
def update_property(property_id):
    """Update the user's property"""
    current_user_id = int(get_jwt_identity())

    # Check if property belongs to user
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()

    if not property:
        return jsonify({"error": "Property not found"}), 404

    data = request.get_json()

    # Update property fields if provided in the request
    if 'address' in data:
        property.address = data['address']
    if 'city' in data:
        property.city = data['city']
    if 'state' in data:
        property.state = data['state']
    if 'zip' in data:
        property.zip = data['zip']
    if 'property_type' in data:
        property.property_type = data['property_type']
    if 'status' in data:
        property.status = data['status']
    if 'bedrooms' in data:
        property.bedrooms = data['bedrooms']
    if 'bathrooms' in data:
        property.bathrooms = data['bathrooms']
    if 'square_footage' in data:
        property.square_footage = data['square_footage']
    if 'purchase_date' in data:
        property.purchase_date = data['purchase_date']
    if 'purchase_price' in data:
        property.purchase_price = data['purchase_price']
    if 'current_value' in data:
        property.current_value = data['current_value']
    if 'description' in data:
        property.description = data['description']

    db.session.commit()

    return jsonify({
        'id': property.id,
        'message': 'Property updated successfully'
    }), 200

@properties_bp.route('/<int:property_id>', methods=['DELETE'])
@jwt_required()
def delete_property(property_id):
    """Delete the user's property"""
    current_user_id = int(get_jwt_identity())

    # Check if property belongs to user
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()

    if not property:
        return jsonify({"error": "Property not found"}), 404

    db.session.delete(property)
    db.session.commit()

    return jsonify({
        'message': 'Property deleted successfully'
    }), 200

@properties_bp.route('/<int:property_id>/set-primary', methods=['POST'])
@jwt_required()
def set_primary_residence(property_id):
    """Set a property as primary residence (no-op in single property mode, kept for API compatibility)"""
    current_user_id = int(get_jwt_identity())

    # Check if property belongs to user
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()

    if not property:
        return jsonify({"error": "Property not found"}), 404

    # In single-property mode, the property is always primary
    property.is_primary_residence = True
    db.session.commit()

    return jsonify({
        'id': property.id,
        'address': property.address,
        'message': 'Property set as primary residence successfully'
    })
