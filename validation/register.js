const Validator = require("validator");

module.exports = function validateResgisterInfo(data) {
  let errors = {};

  //check for empty strings
  if (Validator.isEmpty(data.username)) {
    errors.username = "Username required";
  }
  if (Validator.isEmpty(data.email)) {
    errors.email = "email required";
  }
  if (Validator.isEmpty(data.password)) {
    errors.password = "Password required";
  }
  if (Validator.isEmpty(data.password2)) {
    errors.password2 = "Confirmation password required";
  }

  if (!Validator.isLength(data.username, { min: 3 })) {
    errors.username = "Username must be at least 3 characters";
  }
  //check is email
  if (!Validator.isEmail(data.email)) {
    errors.email = "Must be a valid email";
  }
  //check password length
  if (!Validator.isLength(data.password, { min: 8 })) {
    errors.password = "Password must be at least 8 characters";
  }
  //check passwords match
  if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = "Passwords must match";
  }
  let isValid;

  Object.keys(errors).length > 0 ? (isValid = false) : (isValid = true);

  return {
    errors,
    isValid
  };
};
