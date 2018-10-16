const Validator = require("validator");

module.exports = function validateChangePasswordData(data) {
  let errors = {};
  if (Validator.isEmpty(data.oldPassword)) {
    errors.oldPassword = "Old password required";
  }

  if (Validator.isEmpty(data.newPassword)) {
    errors.newPassword = "New password required";
  }

  //check password length
  if (!Validator.isLength(data.newPassword, { min: 8 })) {
    errors.password = "Password must be at least 8 characters";
  }
  if (Validator.isEmpty(data.newPassword2)) {
    errors.newPassword2 = "Confirm new password required";
  }
  //check passwords match
  if (!Validator.equals(data.newPassword, data.newPassword2)) {
    errors.password2 = "Passwords must match";
  }
  let isValid;

  Object.keys(errors).length > 0 ? (isValid = false) : (isValid = true);

  return {
    errors,
    isValid
  };
};
