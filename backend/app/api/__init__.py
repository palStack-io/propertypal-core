# API package initialization
# app/api/__init__.py
"""
API package for propertyPal Core.

This package contains all the API routes for the application,
organized into blueprints by feature domain.

Blueprints:
- auth_bp: Authentication routes (login, register, etc.)
- properties_bp: Property management routes
- documents_bp: Document management routes
- maintenance_bp: Maintenance request routes
- appliances_bp: Appliance tracking routes
- projects_bp: Project management routes
"""

# You can define common API utilities or helper functions here
def get_pagination_params(request):
    """
    Extract pagination parameters from request.
    
    Args:
        request: Flask request object
        
    Returns:
        tuple: (page, per_page) with defaults applied if not provided
    """
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        return max(1, page), min(max(1, per_page), 100)  # Sensible limits
    except (ValueError, TypeError):
        return 1, 10  # Default values