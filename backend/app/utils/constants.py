# Add to a constants.py file or to the documents.py file

# Document categories
DOCUMENT_CATEGORIES = {
    # General document categories
    'GENERAL': 'general',
    'IMPORTANT': 'important',
    'RECEIPT': 'receipt',
    'CONTRACT': 'contract',
    'INVOICE': 'invoice',
    'REPORT': 'report',
    
    # Property document categories
    'PROPERTY_DEED': 'property_deed',
    'PROPERTY_TITLE': 'property_title',
    'PROPERTY_INSURANCE': 'property_insurance',
    'PROPERTY_TAX': 'property_tax',
    'PROPERTY_INSPECTION': 'property_inspection',
    'MORTGAGE': 'mortgage',
    
    # Maintenance document categories
    'MAINTENANCE_RECEIPT': 'maintenance_receipt',
    'MAINTENANCE_QUOTE': 'maintenance_quote',
    'MAINTENANCE_INVOICE': 'maintenance_invoice',
    'MAINTENANCE_REPORT': 'maintenance_report',
    'MAINTENANCE_WARRANTY': 'maintenance_warranty',
    
    # Appliance document categories
    'APPLIANCE_MANUAL': 'appliance_manual',
    'APPLIANCE_WARRANTY': 'appliance_warranty',
    'APPLIANCE_RECEIPT': 'appliance_receipt',
    'APPLIANCE_SERVICE': 'appliance_service',
    
    # Project document categories
    'PROJECT_PLAN': 'project_plan',
    'PROJECT_PERMIT': 'project_permit',
    'PROJECT_QUOTE': 'project_quote',
    'PROJECT_INVOICE': 'project_invoice',
    'PROJECT_CONTRACT': 'project_contract',
    'PROJECT_DESIGN': 'project_design',
}

# Map expiration-prone document categories
EXPIRING_DOCUMENT_CATEGORIES = [
    DOCUMENT_CATEGORIES['PROPERTY_INSURANCE'],
    DOCUMENT_CATEGORIES['APPLIANCE_WARRANTY'],
]