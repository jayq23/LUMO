import Joi from 'joi';

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(100).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),

  transaction: Joi.object({
    userId: Joi.number().required(),
    category: Joi.string().max(100).required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(500).allow('').optional(),
    transactionDate: Joi.date(),
    type: Joi.string().valid('income', 'expense').required(),
  }),

  budget: Joi.object({
    userId: Joi.number().required(),
    category: Joi.string().max(100).required(),
    limitAmount: Joi.number().positive().required(),
    month: Joi.number().min(1).max(12).required(),
    year: Joi.number().min(2000).required(),
  }),
  forgotPassword: Joi.object({
  email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    newPassword: Joi.string().min(6).required(),
  }),
};

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }
    
    req.validatedData = value;
    next();
  };
};
