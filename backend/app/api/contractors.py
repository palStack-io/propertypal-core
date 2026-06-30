from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.contractor import Contractor

contractors_bp = Blueprint('contractors', __name__)


def _validate_rating(value):
    if value is None:
        return None, None
    try:
        r = int(value)
    except (ValueError, TypeError):
        return None, 'rating must be an integer'
    if r < 1 or r > 5:
        return None, 'rating must be between 1 and 5'
    return r, None


@contractors_bp.route('/', methods=['GET'])
@jwt_required()
def list_contractors():
    user_id = int(get_jwt_identity())
    contractors = Contractor.query.filter_by(user_id=user_id).order_by(Contractor.name).all()
    return jsonify([c.to_dict() for c in contractors]), 200


@contractors_bp.route('/', methods=['POST'])
@jwt_required()
def create_contractor():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400

    rating, err = _validate_rating(data.get('rating'))
    if err:
        return jsonify({'error': err}), 400

    contractor = Contractor(
        user_id=user_id,
        name=name,
        company=(data.get('company') or '').strip() or None,
        phone=(data.get('phone') or '').strip() or None,
        email=(data.get('email') or '').strip() or None,
        trade=(data.get('trade') or '').strip() or None,
        rating=rating,
        notes=(data.get('notes') or '').strip() or None,
    )
    db.session.add(contractor)
    db.session.commit()
    return jsonify(contractor.to_dict()), 201


@contractors_bp.route('/<int:contractor_id>', methods=['GET'])
@jwt_required()
def get_contractor(contractor_id):
    user_id = int(get_jwt_identity())
    contractor = Contractor.query.filter_by(id=contractor_id, user_id=user_id).first_or_404()
    return jsonify(contractor.to_dict()), 200


@contractors_bp.route('/<int:contractor_id>', methods=['PUT'])
@jwt_required()
def update_contractor(contractor_id):
    user_id = int(get_jwt_identity())
    contractor = Contractor.query.filter_by(id=contractor_id, user_id=user_id).first_or_404()
    data = request.get_json(silent=True) or {}

    if 'name' in data:
        name = (data['name'] or '').strip()
        if not name:
            return jsonify({'error': 'name cannot be empty'}), 400
        contractor.name = name

    for field in ('company', 'phone', 'email', 'trade', 'notes'):
        if field in data:
            setattr(contractor, field, (data[field] or '').strip() or None)

    if 'rating' in data:
        rating, err = _validate_rating(data['rating'])
        if err:
            return jsonify({'error': err}), 400
        contractor.rating = rating

    db.session.commit()
    return jsonify(contractor.to_dict()), 200


@contractors_bp.route('/<int:contractor_id>', methods=['DELETE'])
@jwt_required()
def delete_contractor(contractor_id):
    user_id = int(get_jwt_identity())
    contractor = Contractor.query.filter_by(id=contractor_id, user_id=user_id).first_or_404()
    db.session.delete(contractor)
    db.session.commit()
    return jsonify({'message': 'Contractor deleted'}), 200
