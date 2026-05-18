/**
 * Lead Validation Module
 * Validates and sanitizes lead form submissions
 */

const Joi = require('joi');

const leadSchema = Joi.object({
  firstName: Joi.string()
    .required()
    .trim()
    .max(100)
    .messages({
      'string.empty': 'First name is required',
      'string.max': 'First name must not exceed 100 characters'
    }),
  lastName: Joi.string()
    .required()
    .trim()
    .max(100)
    .messages({
      'string.empty': 'Last name is required'
    }),
  email: Joi.string()
    .required()
    .email()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  companyName: Joi.string()
    .required()
    .trim()
    .max(200)
    .messages({
      'string.empty': 'Company name is required'
    }),
  companyWebsite: Joi.string()
    .allow('')
    .optional()
    .messages({
      'string.uri': 'Please provide a valid website URL'
    }),
  industry: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional(),
  companySize: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .optional(),
  phone: Joi.string()
    .trim()
    .max(20)
    .allow('')
    .optional()
});

/**
 * Validate lead data
 * @param {Object} data - Lead data to validate
 * @returns {Object} - Validation result { valid: boolean, data: Object, errors: Array }
 */
function validateLead(data) {
  const { error, value } = leadSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return {
      valid: false,
      data: null,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }

  return {
    valid: true,
    data: value,
    errors: []
  };
}

module.exports = {
  validateLead,
  leadSchema
};
