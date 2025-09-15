export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, error: "Phone number is required" };
  }

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length !== 10) {
    return { isValid: false, error: "Phone number must be 10 digits" };
  }

  if (!cleaned.startsWith("0")) {
    return { isValid: false, error: "Phone number must start with 0" };
  }

  return { isValid: true, cleaned };
};

export const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true, cleaned: email.toLowerCase().trim() };
};

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/['"]/g, "")
    .substring(0, 1000);
};

export const validateUserId = (userId) => {
  if (!userId || typeof userId !== "string") {
    return { isValid: false, error: "User ID is required" };
  }

  // LINE user IDs are typically alphanumeric with specific patterns
  const userIdRegex = /^U[a-f0-9]{32}$/;
  if (!userIdRegex.test(userId)) {
    return { isValid: false, error: "Invalid user ID format" };
  }

  return { isValid: true, cleaned: userId };
};
