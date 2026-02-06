# api/finances.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.finance import Expense, Budget
from app.models.property import Property
from app.models.user import User
from datetime import datetime
from sqlalchemy import func

finances_bp = Blueprint('finances', __name__)

@finances_bp.route('/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    """Get all expenses for the current user with optional filters"""
    current_user_id = int(get_jwt_identity())

    # Get query parameters
    property_id = request.args.get('property_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')

    # If property_id is provided, verify ownership
    if property_id:
        property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found"}), 404

        query = Expense.query.filter_by(property_id=property_id)
    else:
        # Get expenses for all properties owned by user
        user_property = Property.query.filter_by(user_id=current_user_id).first()
        if user_property:
            query = Expense.query.filter_by(property_id=user_property.id)
        else:
            query = Expense.query.filter_by(user_id=current_user_id)

    # Apply date filters if provided
    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Expense.date >= start_date)
        except ValueError:
            return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD"}), 400

    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Expense.date <= end_date)
        except ValueError:
            return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD"}), 400

    # Apply category filter if provided
    if category:
        query = query.filter_by(category=category)

    # Execute query
    expenses = query.order_by(Expense.date.desc()).all()

    # Convert to dictionaries
    result = []
    for expense in expenses:
        expense_dict = expense.to_dict()
        expense_dict['created_by'] = expense.user_id
        result.append(expense_dict)

    return jsonify(result)

@finances_bp.route('/expenses', methods=['POST'])
@jwt_required()
def create_expense():
    """Create a new expense"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # Validate required fields
    required_fields = ['title', 'amount', 'category', 'date', 'property_id']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Verify property ownership
    property_id = data['property_id']
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Property not found"}), 404

    # Validate amount is positive
    try:
        amount_dollars = float(data['amount'])
        if amount_dollars <= 0:
            return jsonify({"error": "Amount must be positive"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Amount must be a valid number"}), 400

    # Parse date
    try:
        expense_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Create new expense
    new_expense = Expense(
        user_id=current_user_id,
        property_id=property_id,
        title=data['title'],
        amount=int(amount_dollars * 100),
        category=data['category'],
        date=expense_date,
        description=data.get('description', ''),
        recurring=data.get('recurring', False),
        recurring_interval=data.get('recurring_interval')
    )

    db.session.add(new_expense)
    db.session.commit()

    return jsonify({
        'id': new_expense.id,
        'title': new_expense.title,
        'message': 'Expense created successfully'
    }), 201

@finances_bp.route('/expenses/<int:expense_id>', methods=['GET'])
@jwt_required()
def get_expense(expense_id):
    """Get a specific expense"""
    current_user_id = int(get_jwt_identity())

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    # Verify property ownership
    property = Property.query.filter_by(id=expense.property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Expense not found"}), 404

    expense_dict = expense.to_dict()
    expense_dict['created_by'] = expense.user_id

    return jsonify(expense_dict)

@finances_bp.route('/expenses/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """Update an expense"""
    current_user_id = int(get_jwt_identity())

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    # Verify property ownership
    property = Property.query.filter_by(id=expense.property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Expense not found"}), 404

    data = request.get_json()

    # Update fields if provided
    if 'title' in data:
        expense.title = data['title']

    if 'amount' in data:
        try:
            amount_dollars = float(data['amount'])
            if amount_dollars <= 0:
                return jsonify({"error": "Amount must be positive"}), 400
            expense.amount = int(amount_dollars * 100)
        except (ValueError, TypeError):
            return jsonify({"error": "Amount must be a valid number"}), 400

    if 'category' in data:
        expense.category = data['category']

    if 'date' in data:
        try:
            expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if 'description' in data:
        expense.description = data['description']

    if 'recurring' in data:
        expense.recurring = data['recurring']

    if 'recurring_interval' in data:
        expense.recurring_interval = data['recurring_interval']

    # If property_id is being updated, verify ownership of new property
    if 'property_id' in data and data['property_id'] != expense.property_id:
        new_property_id = data['property_id']
        if new_property_id:
            new_property = Property.query.filter_by(id=new_property_id, user_id=current_user_id).first()
            if not new_property:
                return jsonify({"error": "Property not found"}), 404
        expense.property_id = new_property_id

    db.session.commit()

    return jsonify({
        'id': expense.id,
        'title': expense.title,
        'message': 'Expense updated successfully'
    })

@finances_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Delete an expense"""
    current_user_id = int(get_jwt_identity())

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    # Verify property ownership
    property = Property.query.filter_by(id=expense.property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Expense not found"}), 404

    db.session.delete(expense)
    db.session.commit()

    return jsonify({
        'message': 'Expense deleted successfully'
    })

@finances_bp.route('/expenses/categories', methods=['GET'])
@jwt_required()
def get_expense_categories():
    """Get expense categories"""
    categories = [
        'Mortgage', 'Utilities', 'Insurance', 'Property Tax', 'Maintenance',
        'Repairs', 'Improvements', 'HOA Fees', 'Landscaping', 'Pest Control',
        'Cleaning', 'Furnishings', 'Appliances', 'Other'
    ]

    return jsonify(categories)

# Budget API endpoints
@finances_bp.route('/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    """Get all budgets for the current user with optional filters"""
    current_user_id = int(get_jwt_identity())

    # Get query parameters
    property_id = request.args.get('property_id')
    year = request.args.get('year')
    month = request.args.get('month')

    # If property_id is provided, verify ownership
    if property_id:
        property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found"}), 404

        query = Budget.query.filter_by(property_id=property_id)
    else:
        # Get budgets for user's property
        user_property = Property.query.filter_by(user_id=current_user_id).first()
        if user_property:
            query = Budget.query.filter_by(property_id=user_property.id)
        else:
            query = Budget.query.filter_by(user_id=current_user_id)

    # Apply filters
    if year:
        try:
            query = query.filter_by(year=int(year))
        except ValueError:
            return jsonify({"error": "Year must be a valid integer"}), 400

    if month:
        try:
            month_int = int(month)
            if not 1 <= month_int <= 12:
                return jsonify({"error": "Month must be between 1 and 12"}), 400
            query = query.filter_by(month=month_int)
        except ValueError:
            return jsonify({"error": "Month must be a valid integer"}), 400

    # Execute query
    budgets = query.order_by(Budget.year, Budget.month, Budget.category).all()

    # Convert to dictionaries
    result = []
    for budget in budgets:
        budget_dict = budget.to_dict()
        budget_dict['created_by'] = budget.user_id
        result.append(budget_dict)

    return jsonify(result)

@finances_bp.route('/budgets', methods=['POST'])
@jwt_required()
def create_budget():
    """Create a new budget"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # Validate required fields
    required_fields = ['category', 'amount', 'month', 'year', 'property_id']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Verify property ownership
    property_id = data['property_id']
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Property not found"}), 404

    # Validate amount is positive
    try:
        amount_dollars = float(data['amount'])
        if amount_dollars <= 0:
            return jsonify({"error": "Amount must be positive"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Amount must be a valid number"}), 400

    # Validate month
    try:
        month = int(data['month'])
        if not 1 <= month <= 12:
            return jsonify({"error": "Month must be between 1 and 12"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Month must be a valid integer"}), 400

    # Validate year
    try:
        year = int(data['year'])
        if year < 2000 or year > 2100:
            return jsonify({"error": "Year must be between 2000 and 2100"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Year must be a valid integer"}), 400

    # Check for existing budget
    existing_budget = Budget.query.filter_by(
        category=data['category'],
        month=month,
        year=year,
        property_id=data['property_id']
    ).first()

    if existing_budget:
        return jsonify({"error": "A budget already exists for this category, month, year, and property"}), 409

    # Create new budget
    new_budget = Budget(
        user_id=current_user_id,
        property_id=data['property_id'],
        category=data['category'],
        amount=int(amount_dollars * 100),
        month=month,
        year=year
    )

    db.session.add(new_budget)
    db.session.commit()

    return jsonify({
        'id': new_budget.id,
        'category': new_budget.category,
        'message': 'Budget created successfully'
    }), 201

@finances_bp.route('/budgets/<int:budget_id>', methods=['GET'])
@jwt_required()
def get_budget(budget_id):
    """Get a specific budget"""
    current_user_id = int(get_jwt_identity())

    budget = Budget.query.get(budget_id)
    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    # Verify property ownership
    property = Property.query.filter_by(id=budget.property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Budget not found"}), 404

    budget_dict = budget.to_dict()
    budget_dict['created_by'] = budget.user_id

    return jsonify(budget_dict)

@finances_bp.route('/budgets/<int:budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    """Update a budget"""
    current_user_id = int(get_jwt_identity())

    budget = Budget.query.get(budget_id)
    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    # Verify property ownership
    property = Property.query.filter_by(id=budget.property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Budget not found"}), 404

    data = request.get_json()

    # Save original values for uniqueness check
    original_category = budget.category
    original_month = budget.month
    original_year = budget.year
    original_property_id = budget.property_id

    # Update fields if provided
    if 'category' in data:
        budget.category = data['category']

    if 'amount' in data:
        try:
            amount_dollars = float(data['amount'])
            if amount_dollars <= 0:
                return jsonify({"error": "Amount must be positive"}), 400
            budget.amount = int(amount_dollars * 100)
        except (ValueError, TypeError):
            return jsonify({"error": "Amount must be a valid number"}), 400

    if 'month' in data:
        try:
            month = int(data['month'])
            if not 1 <= month <= 12:
                return jsonify({"error": "Month must be between 1 and 12"}), 400
            budget.month = month
        except (ValueError, TypeError):
            return jsonify({"error": "Month must be a valid integer"}), 400

    if 'year' in data:
        try:
            year = int(data['year'])
            if year < 2000 or year > 2100:
                return jsonify({"error": "Year must be between 2000 and 2100"}), 400
            budget.year = year
        except (ValueError, TypeError):
            return jsonify({"error": "Year must be a valid integer"}), 400

    # If property_id is being updated, verify ownership of new property
    if 'property_id' in data and data['property_id'] != budget.property_id:
        new_property_id = data['property_id']
        if new_property_id:
            new_property = Property.query.filter_by(id=new_property_id, user_id=current_user_id).first()
            if not new_property:
                return jsonify({"error": "Property not found"}), 404
        budget.property_id = new_property_id

    # Check for uniqueness constraint if any of category, month, year, or property_id changed
    if (budget.category != original_category or
        budget.month != original_month or
        budget.year != original_year or
        budget.property_id != original_property_id):

        existing_budget = Budget.query.filter_by(
            category=budget.category,
            month=budget.month,
            year=budget.year,
            property_id=budget.property_id
        ).filter(Budget.id != budget_id).first()

        if existing_budget:
            return jsonify({"error": "A budget already exists for this category, month, year, and property"}), 409

    db.session.commit()

    return jsonify({
        'id': budget.id,
        'category': budget.category,
        'message': 'Budget updated successfully'
    })

@finances_bp.route('/budgets/<int:budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    """Delete a budget"""
    current_user_id = int(get_jwt_identity())

    budget = Budget.query.get(budget_id)
    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    # Verify property ownership
    property = Property.query.filter_by(id=budget.property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Budget not found"}), 404

    db.session.delete(budget)
    db.session.commit()

    return jsonify({
        'message': 'Budget deleted successfully'
    })

# Reporting Endpoints
@finances_bp.route('/reports/monthly-summary', methods=['GET'])
@jwt_required()
def monthly_summary_report():
    """Get monthly summary of expenses and budget comparison"""
    current_user_id = int(get_jwt_identity())

    # Get query parameters
    property_id = request.args.get('property_id')
    year = request.args.get('year')
    month = request.args.get('month')

    # Validate parameters
    if not property_id:
        return jsonify({"error": "property_id is required"}), 400

    if not year or not month:
        return jsonify({"error": "year and month are required"}), 400

    try:
        year_int = int(year)
        month_int = int(month)
        if not 1 <= month_int <= 12:
            return jsonify({"error": "Month must be between 1 and 12"}), 400
    except ValueError:
        return jsonify({"error": "Year and month must be valid integers"}), 400

    # Verify property ownership
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Property not found"}), 404

    # Get expenses for the specified month
    start_date = datetime(year_int, month_int, 1).date()
    if month_int == 12:
        end_date = datetime(year_int + 1, 1, 1).date()
    else:
        end_date = datetime(year_int, month_int + 1, 1).date()

    expenses = Expense.query.filter(
        Expense.property_id == property_id,
        Expense.date >= start_date,
        Expense.date < end_date
    ).all()

    # Get budgets for the specified month
    budgets = Budget.query.filter_by(
        property_id=property_id,
        year=year_int,
        month=month_int
    ).all()

    # Organize expenses by category
    expenses_by_category = {}
    for expense in expenses:
        category = expense.category
        if category not in expenses_by_category:
            expenses_by_category[category] = []
        expenses_by_category[category].append(expense.to_dict())

    # Calculate totals and budget comparison
    category_summary = {}
    total_expenses = 0
    total_budget = 0

    # Get all unique categories from both expenses and budgets
    all_categories = set(expenses_by_category.keys())
    for budget in budgets:
        all_categories.add(budget.category)

    for category in all_categories:
        # Sum expenses for category
        category_expenses = sum(float(expense['amount']) for expense in expenses_by_category.get(category, []))
        total_expenses += category_expenses

        # Find budget for category
        category_budget = next((float(budget.amount) for budget in budgets if budget.category == category), 0)
        total_budget += category_budget

        # Calculate variance
        variance = category_budget - category_expenses
        variance_percent = (variance / category_budget * 100) if category_budget > 0 else None

        category_summary[category] = {
            'expenses': category_expenses,
            'budget': category_budget,
            'variance': variance,
            'variance_percent': variance_percent,
            'status': 'under_budget' if variance >= 0 else 'over_budget',
            'detail': expenses_by_category.get(category, [])
        }

    # Overall summary
    total_variance = total_budget - total_expenses
    total_variance_percent = (total_variance / total_budget * 100) if total_budget > 0 else None

    summary = {
        'property': {
            'id': property.id,
            'address': property.address,
            'city': property.city,
            'state': property.state
        },
        'period': {
            'year': year_int,
            'month': month_int
        },
        'totals': {
            'expenses': total_expenses,
            'budget': total_budget,
            'variance': total_variance,
            'variance_percent': total_variance_percent,
            'status': 'under_budget' if total_variance >= 0 else 'over_budget'
        },
        'categories': category_summary
    }

    return jsonify(summary)

@finances_bp.route('/reports/yearly-summary', methods=['GET'])
@jwt_required()
def yearly_summary_report():
    """Get yearly summary of expenses by month"""
    current_user_id = int(get_jwt_identity())

    # Get query parameters
    property_id = request.args.get('property_id')
    year = request.args.get('year')

    # Validate parameters
    if not property_id:
        return jsonify({"error": "property_id is required"}), 400

    if not year:
        return jsonify({"error": "year is required"}), 400

    try:
        year_int = int(year)
    except ValueError:
        return jsonify({"error": "Year must be a valid integer"}), 400

    # Verify property ownership
    property = Property.query.filter_by(id=property_id, user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "Property not found"}), 404

    # Get all expenses for the year
    start_date = datetime(year_int, 1, 1).date()
    end_date = datetime(year_int + 1, 1, 1).date()

    expenses = Expense.query.filter(
        Expense.property_id == property_id,
        Expense.date >= start_date,
        Expense.date < end_date
    ).all()

    # Get all budgets for the year
    budgets = Budget.query.filter_by(
        property_id=property_id,
        year=year_int
    ).all()

    # Organize expenses by month and category
    monthly_data = {}
    for month in range(1, 13):
        monthly_data[month] = {
            'expenses': {},
            'total_expenses': 0,
            'total_budget': 0
        }

    # Process expenses
    for expense in expenses:
        month = expense.date.month
        category = expense.category

        if category not in monthly_data[month]['expenses']:
            monthly_data[month]['expenses'][category] = 0

        monthly_data[month]['expenses'][category] += float(expense.amount)
        monthly_data[month]['total_expenses'] += float(expense.amount)

    # Process budgets
    for budget in budgets:
        month = budget.month
        if month in monthly_data:
            monthly_data[month]['total_budget'] += float(budget.amount)

    # Calculate yearly totals
    yearly_total_expenses = sum(data['total_expenses'] for data in monthly_data.values())
    yearly_total_budget = sum(data['total_budget'] for data in monthly_data.values())

    # Get expenses by category for the entire year
    category_totals = {}
    for month_data in monthly_data.values():
        for category, amount in month_data['expenses'].items():
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += amount

    # Format the response
    summary = {
        'property': {
            'id': property.id,
            'address': property.address,
            'city': property.city,
            'state': property.state
        },
        'year': year_int,
        'monthly_data': {
            str(month): {
                'total_expenses': data['total_expenses'],
                'total_budget': data['total_budget'],
                'variance': data['total_budget'] - data['total_expenses'],
                'categories': data['expenses']
            } for month, data in monthly_data.items()
        },
        'yearly_totals': {
            'expenses': yearly_total_expenses,
            'budget': yearly_total_budget,
            'variance': yearly_total_budget - yearly_total_expenses
        },
        'category_totals': category_totals
    }

    return jsonify(summary)

@finances_bp.route('/reports/property-comparison', methods=['GET'])
@jwt_required()
def property_comparison_report():
    """Get expense summary for the user's property (simplified for single property)"""
    current_user_id = int(get_jwt_identity())

    # Get query parameters
    year = request.args.get('year')
    month = request.args.get('month')
    category = request.args.get('category')

    # Validate parameters
    if not year:
        return jsonify({"error": "year is required"}), 400

    try:
        year_int = int(year)
    except ValueError:
        return jsonify({"error": "Year must be a valid integer"}), 400

    if month:
        try:
            month_int = int(month)
            if not 1 <= month_int <= 12:
                return jsonify({"error": "Month must be between 1 and 12"}), 400
        except ValueError:
            return jsonify({"error": "Month must be a valid integer"}), 400

    # Get user's property
    property = Property.query.filter_by(user_id=current_user_id).first()
    if not property:
        return jsonify({"error": "No property found"}), 404

    # Build query for expenses
    if month:
        start_date = datetime(year_int, month_int, 1).date()
        if month_int == 12:
            end_date = datetime(year_int + 1, 1, 1).date()
        else:
            end_date = datetime(year_int, month_int + 1, 1).date()
    else:
        start_date = datetime(year_int, 1, 1).date()
        end_date = datetime(year_int + 1, 1, 1).date()

    # Base query
    query = db.session.query(
        Expense.property_id,
        Expense.category,
        func.sum(Expense.amount).label('total_amount')
    ).filter(
        Expense.property_id == property.id,
        Expense.date >= start_date,
        Expense.date < end_date
    )

    # Apply category filter if provided
    if category:
        query = query.filter(Expense.category == category)

    # Group and execute
    results = query.group_by(Expense.property_id, Expense.category).all()

    # Organize results
    property_data = {
        'id': property.id,
        'address': property.address,
        'city': property.city,
        'state': property.state,
        'categories': {},
        'total_expenses': 0
    }

    # Fill in expense data
    for prop_id, category_name, total_amount in results:
        property_data['categories'][category_name] = float(total_amount)
        property_data['total_expenses'] += float(total_amount)

    comparison = {
        'period': {
            'year': year_int,
            'month': month_int if month else None,
            'category': category
        },
        'properties': [property_data],
        'averages': {
            'total': property_data['total_expenses'],
            'categories': property_data['categories']
        }
    }

    return jsonify(comparison)
