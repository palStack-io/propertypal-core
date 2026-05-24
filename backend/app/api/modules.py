from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

modules_bp = Blueprint('modules', __name__)

@modules_bp.route('/', methods=['GET'])
@jwt_required()
def get_catalog():
    """Stub — core has no purchasable modules; return empty catalog."""
    return jsonify({"modules": [], "total": 0}), 200

@modules_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_modules():
    """Stub — core has no module system; return empty."""
    return jsonify({"modules": [], "slugs": []}), 200
