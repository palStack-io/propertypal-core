# api/property_photos.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from app import db
from app.models.document import Document
from app.models.property import Property

property_photos_bp = Blueprint('property_photos', __name__)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@property_photos_bp.route('/', methods=['POST'])
@jwt_required()
def upload_property_photo():
    """Upload a new property photo"""
    current_user_id = int(get_jwt_identity())

    # Check if request has the file
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']

    # Check if filename is empty
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Check if property_id is provided
    property_id = request.form.get('property_id')
    if not property_id:
        return jsonify({"error": "Property ID is required"}), 400

    # Verify property belongs to user
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Property not found"}), 404

    # Check if file type is allowed
    if not allowed_file(file.filename):
        return jsonify({"error": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    # Get base folder path
    photos_base_folder = os.path.join(current_app.root_path, 'uploads/documents/photos')

    # Create property-specific folder
    property_folder = os.path.join(photos_base_folder, f"property_{property_id}")
    os.makedirs(property_folder, exist_ok=True)

    # Secure the filename and generate a unique filename
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(property_folder, unique_filename)

    # Get form data
    title = request.form.get('title', 'Property Photo')
    is_primary = request.form.get('is_primary', 'false').lower() == 'true'

    # Save the file
    file.save(file_path)

    # Get file metadata
    file_size = os.path.getsize(file_path)
    file_type = file.content_type or 'image/jpeg'

    # Create document record
    new_photo = Document(
        user_id=current_user_id,
        property_id=property_id,
        title=title,
        description=request.form.get('description', ''),
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        category='property_photo'
    )

    db.session.add(new_photo)

    # If this is set as primary, update property's main image_url
    if is_primary:
        relative_path = f"/uploads/documents/photos/property_{property_id}/{unique_filename}"
        property.image_url = relative_path

    db.session.commit()

    return jsonify({
        'id': new_photo.id,
        'title': new_photo.title,
        'url': f"/uploads/documents/photos/property_{property_id}/{unique_filename}",
        'is_primary': property.image_url == f"/uploads/documents/photos/property_{property_id}/{unique_filename}",
        'message': 'Photo uploaded successfully'
    }), 201

@property_photos_bp.route('/<int:property_id>', methods=['GET'])
@jwt_required()
def get_property_photos(property_id):
    """Get all photos for a specific property"""
    current_user_id = int(get_jwt_identity())

    # Verify property belongs to user
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Property not found"}), 404

    # Query documents that are photos for this property
    photos = Document.query.filter_by(
        property_id=property_id,
        category='property_photo'
    ).order_by(Document.created_at.desc()).all()

    result = []
    for photo in photos:
        # Extract filename from file_path
        filename = os.path.basename(photo.file_path)

        result.append({
            'id': photo.id,
            'title': photo.title,
            'description': photo.description,
            'url': f"/uploads/documents/photos/property_{property_id}/{filename}",
            'is_primary': property.image_url == f"/uploads/documents/photos/property_{property_id}/{filename}",
            'created_at': photo.created_at.isoformat(),
            'created_by': photo.user_id
        })

    return jsonify(result)

@property_photos_bp.route('/<int:photo_id>/set-primary', methods=['PUT'])
@jwt_required()
def set_primary_photo(photo_id):
    """Set a photo as the primary photo for a property"""
    current_user_id = int(get_jwt_identity())

    photo = Document.query.filter_by(id=photo_id, category='property_photo').first()
    if not photo:
        return jsonify({"error": "Photo not found"}), 404

    # Verify property belongs to user
    property = Property.query.filter_by(id=photo.property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Property not found"}), 404

    # Extract filename from file_path
    filename = os.path.basename(photo.file_path)

    # Update property's main image_url
    property.image_url = f"/uploads/documents/photos/property_{photo.property_id}/{filename}"
    db.session.commit()

    return jsonify({
        'id': photo.id,
        'message': 'Photo set as primary successfully'
    })

@property_photos_bp.route('/<int:photo_id>', methods=['DELETE'])
@jwt_required()
def delete_property_photo(photo_id):
    """Delete a property photo"""
    current_user_id = int(get_jwt_identity())

    photo = Document.query.filter_by(id=photo_id, category='property_photo').first()
    if not photo:
        return jsonify({"error": "Photo not found"}), 404

    # Verify property belongs to user
    property = Property.query.filter_by(id=photo.property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Property not found"}), 404

    # Check if this is the primary photo
    filename = os.path.basename(photo.file_path)
    if property.image_url == f"/uploads/documents/photos/property_{photo.property_id}/{filename}":
        property.image_url = None

    # Delete the file from storage
    if os.path.exists(photo.file_path):
        os.remove(photo.file_path)

    # Delete from database
    db.session.delete(photo)
    db.session.commit()

    return jsonify({
        'message': 'Photo deleted successfully'
    })
