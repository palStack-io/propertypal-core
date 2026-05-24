import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiHelpers } from '../../services/api';

const PropertySetupWizard = ({ onComplete }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    property_type: 'single_family',
    bedrooms: '',
    bathrooms: '',
    square_footage: '',
    purchase_date: '',
    purchase_price: '',
    current_value: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create the property
      const propertyData = {
        ...formData,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : null
      };

      await apiHelpers.post('properties', propertyData);

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating property:', err);
      setError(err.response?.data?.error || 'Failed to create property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center mb-4">
          <img src="/propertyPal.png" alt="propertyPal" className="h-14 w-14 mb-3" />
          <div className="text-3xl font-bold">
            <span className="property-text">property</span><span className="t-primary">Pal</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold t-primary">Set Up Your Property</h2>
        <p className="mt-2 text-center text-sm t-secondary">Let's get started by adding your property details</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <div className="card py-8 px-6">
          {error && <div className="alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold t-primary mb-4">Property Address</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="address" className="form-label">Street Address *</label>
                  <input type="text" name="address" id="address" required
                    value={formData.address} onChange={handleChange} className="form-input" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="city" className="form-label">City *</label>
                    <input type="text" name="city" id="city" required
                      value={formData.city} onChange={handleChange} className="form-input" />
                  </div>
                  <div>
                    <label htmlFor="state" className="form-label">State *</label>
                    <input type="text" name="state" id="state" required maxLength="2"
                      value={formData.state} onChange={handleChange} className="form-input" />
                  </div>
                </div>
                <div>
                  <label htmlFor="zip" className="form-label">ZIP Code *</label>
                  <input type="text" name="zip" id="zip" required
                    value={formData.zip} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold t-primary mb-4">Property Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="property_type" className="form-label">Property Type *</label>
                  <select name="property_type" id="property_type" required
                    value={formData.property_type} onChange={handleChange} className="form-input">
                    <option value="single_family">Single Family</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="multi_family">Multi-Family</option>
                    <option value="apartment">Apartment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="bedrooms" className="form-label">Bedrooms</label>
                    <input type="number" name="bedrooms" id="bedrooms" min="0"
                      value={formData.bedrooms} onChange={handleChange} className="form-input" />
                  </div>
                  <div>
                    <label htmlFor="bathrooms" className="form-label">Bathrooms</label>
                    <input type="number" name="bathrooms" id="bathrooms" min="0" step="0.5"
                      value={formData.bathrooms} onChange={handleChange} className="form-input" />
                  </div>
                  <div>
                    <label htmlFor="square_footage" className="form-label">Sq. Ft.</label>
                    <input type="number" name="square_footage" id="square_footage" min="0"
                      value={formData.square_footage} onChange={handleChange} className="form-input" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold t-primary mb-4">Financial Information <span className="t-muted font-normal text-sm">(Optional)</span></h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="purchase_date" className="form-label">Purchase Date</label>
                    <input type="date" name="purchase_date" id="purchase_date"
                      value={formData.purchase_date} onChange={handleChange} className="form-input" />
                  </div>
                  <div>
                    <label htmlFor="purchase_price" className="form-label">Purchase Price</label>
                    <input type="number" name="purchase_price" id="purchase_price" min="0" step="0.01"
                      value={formData.purchase_price} onChange={handleChange} className="form-input" />
                  </div>
                </div>
                <div>
                  <label htmlFor="current_value" className="form-label">Current Value</label>
                  <input type="number" name="current_value" id="current_value" min="0" step="0.01"
                    value={formData.current_value} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea name="description" id="description" rows="3"
                    value={formData.description} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-md disabled:opacity-50">
              {loading ? 'Creating Property...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PropertySetupWizard;
