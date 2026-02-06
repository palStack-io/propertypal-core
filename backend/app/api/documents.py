# api/documents.py
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from app import db
from app.models.document import Document
from app.models.user import User
from app.models.property import Property
from datetime import datetime, timedelta
from app.utils.constants import DOCUMENT_CATEGORIES, EXPIRING_DOCUMENT_CATEGORIES


documents_bp = Blueprint('documents', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'txt', 'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@documents_bp.route('/', methods=['GET'])
@jwt_required()
def get_documents():
    """Get all documents for the current user"""
    current_user_id = int(get_jwt_identity())

    property_id = request.args.get('property_id')
    appliance_id = request.args.get('appliance_id')
    category = request.args.get('category')

    # If property_id is provided, verify ownership
    if property_id:
        property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found"}), 404

        query = Document.query.filter_by(property_id=property_id)
    elif appliance_id:
        # Verify appliance exists and user has access
        from app.models.appliance import Appliance
        appliance = Appliance.query.get(appliance_id)
        if not appliance:
            return jsonify({"error": "Appliance not found"}), 404

        # Check if user owns the appliance or owns its property
        if appliance.user_id != current_user_id:
            if appliance.property_id:
                property = Property.query.filter_by(id=appliance.property_id, user_id=current_user_id).first()
                if not property:
                    return jsonify({"error": "Appliance not found or access denied"}), 404
            else:
                return jsonify({"error": "Appliance not found or access denied"}), 404

        query = Document.query.filter_by(appliance_id=appliance_id)
    else:
        # No property_id or appliance_id - get all documents for the user
        query = Document.query.filter_by(user_id=current_user_id)

    # Apply category filter if provided
    if category:
        query = query.filter_by(category=category)

    # Execute query
    documents = query.order_by(Document.created_at.desc()).all()

    result = []
    for doc in documents:
        # Generate URL based on file path
        filename = os.path.basename(doc.file_path)

        # Determine the URL based on document association
        if doc.property_id:
            url = f"/uploads/documents/files/property_{doc.property_id}/{filename}"
        else:
            url = f"/uploads/documents/files/user_{current_user_id}/{filename}"

        result.append({
            'id': doc.id,
            'title': doc.title,
            'description': doc.description,
            'file_type': doc.file_type,
            'file_size': doc.file_size,
            'category': doc.category,
            'created_at': doc.created_at.isoformat(),
            'updated_at': doc.updated_at.isoformat(),
            'property_id': doc.property_id,
            'appliance_id': doc.appliance_id,
            'expiration_date': doc.expiration_date.isoformat() if doc.expiration_date else None,
            'url': url,
            'created_by': doc.user_id
        })

    return jsonify(result)

@documents_bp.route('/', methods=['POST'])
@jwt_required()
def upload_document():
    """Upload a new document"""
    current_user_id = int(get_jwt_identity())

    # Check if request has the file
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']

    # Check if filename is empty
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Check if file type is allowed
    if not allowed_file(file.filename):
        return jsonify({"error": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    # Get base upload folder
    base_upload_folder = os.path.join(current_app.root_path, 'uploads/documents')

    # Get form data
    title = request.form.get('title')
    description = request.form.get('description', '')
    category = request.form.get('category')
    property_id = request.form.get('property_id')
    appliance_id = request.form.get('appliance_id')
    expiration_date = request.form.get('expiration_date')

    if not title:
        return jsonify({"error": "Title is required"}), 400

    if not category:
        return jsonify({"error": "Category is required"}), 400

    # If a property_id is provided, verify ownership
    if property_id:
        property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found"}), 404

        # Create property-specific folder
        files_folder = os.path.join(base_upload_folder, 'files', f"property_{property_id}")
        os.makedirs(files_folder, exist_ok=True)
    else:
        # If no property, use a user-specific folder
        files_folder = os.path.join(base_upload_folder, 'files', f"user_{current_user_id}")
        os.makedirs(files_folder, exist_ok=True)

    # Validate appliance_id if provided
    if appliance_id:
        from app.models.appliance import Appliance
        appliance = Appliance.query.get(appliance_id)
        if not appliance:
            return jsonify({"error": "Appliance not found"}), 404

        # Check if user owns the appliance or owns its property
        if appliance.user_id != current_user_id:
            if appliance.property_id:
                property = Property.query.filter_by(id=appliance.property_id, user_id=current_user_id).first()
                if not property:
                    return jsonify({"error": "You don't have permission to upload documents for this appliance"}), 403
            else:
                return jsonify({"error": "Appliance not found or access denied"}), 404

    # Secure the filename and generate a unique filename
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(files_folder, unique_filename)

    # Save the file
    file.save(file_path)

    # Get file metadata
    file_size = os.path.getsize(file_path)
    file_type = file.content_type or 'application/octet-stream'

    # Create document record
    new_document = Document(
        user_id=current_user_id,
        property_id=property_id if property_id else None,
        appliance_id=appliance_id if appliance_id else None,
        title=title,
        description=description,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        category=category,
        expiration_date=datetime.strptime(expiration_date, '%Y-%m-%d').date() if expiration_date else None
    )

    db.session.add(new_document)
    db.session.commit()

    # Determine the relative path for API responses
    if property_id:
        relative_path = f"/uploads/documents/files/property_{property_id}/{unique_filename}"
    else:
        relative_path = f"/uploads/documents/files/user_{current_user_id}/{unique_filename}"

    return jsonify({
        'id': new_document.id,
        'title': new_document.title,
        'url': relative_path,
        'message': 'Document uploaded successfully'
    }), 201

@documents_bp.route('/<int:document_id>', methods=['PUT'])
@jwt_required()
def update_document(document_id):
    """Update document metadata"""
    current_user_id = int(get_jwt_identity())

    document = Document.query.filter_by(id=document_id).first()
    if not document:
        return jsonify({"error": "Document not found"}), 404

    # Check if document belongs to user or if user owns the property
    if document.user_id != current_user_id:
        if document.property_id:
            property = Property.query.filter_by(id=document.property_id, user_id=current_user_id).first()
            if not property:
                return jsonify({"error": "You don't have permission to update this document"}), 403
        else:
            return jsonify({"error": "Document not found or access denied"}), 404

    data = request.get_json()

    if 'title' in data:
        document.title = data['title']

    if 'description' in data:
        document.description = data['description']

    if 'category' in data:
        document.category = data['category']

    if 'property_id' in data:
        # Verify ownership of the new property
        if data['property_id']:
            property = Property.query.filter_by(id=data['property_id'], user_id=current_user_id).first()
            if not property:
                return jsonify({"error": "Property not found"}), 404
        document.property_id = data['property_id']

    if 'appliance_id' in data:
        # Validate appliance_id if provided and not null
        if data['appliance_id']:
            from app.models.appliance import Appliance
            appliance = Appliance.query.get(data['appliance_id'])
            if not appliance:
                return jsonify({"error": "Appliance not found"}), 404

            # Check if user owns the appliance or owns its property
            if appliance.user_id != current_user_id:
                if appliance.property_id:
                    property = Property.query.filter_by(id=appliance.property_id, user_id=current_user_id).first()
                    if not property:
                        return jsonify({"error": "You don't have permission to link documents to this appliance"}), 403
                else:
                    return jsonify({"error": "Appliance not found or access denied"}), 404
        document.appliance_id = data['appliance_id']

    if 'expiration_date' in data and data['expiration_date']:
        document.expiration_date = datetime.strptime(data['expiration_date'], '%Y-%m-%d').date()

    db.session.commit()

    # Get the filename from the file path
    filename = os.path.basename(document.file_path)

    # Generate URL for the response
    if document.property_id:
        url = f"/uploads/documents/files/property_{document.property_id}/{filename}"
    else:
        url = f"/uploads/documents/files/user_{current_user_id}/{filename}"

    return jsonify({
        'id': document.id,
        'title': document.title,
        'url': url,
        'message': 'Document updated successfully'
    })

@documents_bp.route('/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    """Delete a document"""
    current_user_id = int(get_jwt_identity())

    document = Document.query.filter_by(id=document_id).first()
    if not document:
        return jsonify({"error": "Document not found"}), 404

    # Check if document belongs to user or if user owns the property
    if document.user_id != current_user_id:
        if document.property_id:
            property = Property.query.filter_by(id=document.property_id, user_id=current_user_id).first()
            if not property:
                return jsonify({"error": "You don't have permission to delete this document"}), 403
        else:
            return jsonify({"error": "Document not found or access denied"}), 404

    # Delete the file from storage
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    # Delete from database
    db.session.delete(document)
    db.session.commit()

    return jsonify({
        'message': 'Document deleted successfully'
    })

@documents_bp.route('/<int:document_id>/download', methods=['GET'])
@jwt_required()
def download_document(document_id):
    """Download a document"""
    current_user_id = int(get_jwt_identity())

    document = Document.query.filter_by(id=document_id).first()
    if not document:
        return jsonify({"error": "Document not found"}), 404

    # Check if document belongs to user or if user owns the property
    if document.user_id != current_user_id:
        if document.property_id:
            property = Property.query.filter_by(id=document.property_id, user_id=current_user_id).first()
            if not property:
                return jsonify({"error": "You don't have permission to download this document"}), 403
        else:
            return jsonify({"error": "Document not found or access denied"}), 404

    # Check if file exists
    if not os.path.exists(document.file_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(document.file_path, as_attachment=True)

@documents_bp.route('/expiring', methods=['GET'])
@jwt_required()
def get_expiring_documents():
    """Get documents that are expiring soon (within 30 days by default)"""
    current_user_id = int(get_jwt_identity())

    days = int(request.args.get('days', 30))

    # Calculate the date threshold
    today = datetime.now().date()
    expiration_threshold = today + timedelta(days=days)

    # Get documents that have an expiration date and are expiring within the threshold
    documents = Document.query.filter(
        Document.user_id == current_user_id,
        Document.expiration_date.isnot(None),
        Document.expiration_date <= expiration_threshold,
        Document.expiration_date >= today
    ).order_by(Document.expiration_date.asc()).all()

    result = []
    for doc in documents:
        # Generate URL for the document
        filename = os.path.basename(doc.file_path)
        if doc.property_id:
            url = f"/uploads/documents/files/property_{doc.property_id}/{filename}"
        else:
            url = f"/uploads/documents/files/user_{current_user_id}/{filename}"

        result.append({
            'id': doc.id,
            'title': doc.title,
            'file_type': doc.file_type,
            'category': doc.category,
            'expiration_date': doc.expiration_date.isoformat(),
            'days_until_expiration': (doc.expiration_date - today).days,
            'property_id': doc.property_id,
            'url': url
        })

    return jsonify(result)

@documents_bp.route('/category/<category>', methods=['GET'])
@jwt_required()
def get_documents_by_category(category):
    """Get documents by category"""
    current_user_id = int(get_jwt_identity())

    query = Document.query.filter_by(user_id=current_user_id, category=category)

    documents = query.order_by(Document.created_at.desc()).all()

    result = []
    for doc in documents:
        # Generate URL for the document
        filename = os.path.basename(doc.file_path)
        if doc.property_id:
            url = f"/uploads/documents/files/property_{doc.property_id}/{filename}"
        else:
            url = f"/uploads/documents/files/user_{current_user_id}/{filename}"

        result.append({
            'id': doc.id,
            'title': doc.title,
            'description': doc.description,
            'file_type': doc.file_type,
            'file_size': doc.file_size,
            'category': doc.category,
            'created_at': doc.created_at.isoformat(),
            'updated_at': doc.updated_at.isoformat(),
            'property_id': doc.property_id,
            'expiration_date': doc.expiration_date.isoformat() if doc.expiration_date else None,
            'url': url
        })

    return jsonify(result)

@documents_bp.route('/search', methods=['GET'])
@jwt_required()
def search_documents():
    """Search documents by keyword"""
    current_user_id = int(get_jwt_identity())

    keyword = request.args.get('q', '')

    query = Document.query.filter(
        Document.user_id == current_user_id,
        (Document.title.ilike(f'%{keyword}%') | Document.description.ilike(f'%{keyword}%'))
    )

    documents = query.order_by(Document.created_at.desc()).all()

    result = []
    for doc in documents:
        # Generate URL for the document
        filename = os.path.basename(doc.file_path)
        if doc.property_id:
            url = f"/uploads/documents/files/property_{doc.property_id}/{filename}"
        else:
            url = f"/uploads/documents/files/user_{current_user_id}/{filename}"

        result.append({
            'id': doc.id,
            'title': doc.title,
            'description': doc.description,
            'file_type': doc.file_type,
            'file_size': doc.file_size,
            'category': doc.category,
            'created_at': doc.created_at.isoformat(),
            'updated_at': doc.updated_at.isoformat(),
            'property_id': doc.property_id,
            'expiration_date': doc.expiration_date.isoformat() if doc.expiration_date else None,
            'url': url
        })

    return jsonify(result)
