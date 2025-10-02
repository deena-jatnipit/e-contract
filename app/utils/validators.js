/**
 * Validates if a string contains only English characters, numbers, and spaces
 * @param {string} value - The string to validate
 * @returns {{isValid: boolean, message: string}} Validation result and error message
 */
export function validateTemplateNameFormat(value) {
  const pattern = /^[a-zA-Z0-9\s-_]+$/;

  if (!value) {
    return {
      isValid: false,
      message: "กรุณากรอกชื่อเทมเพลต",
    };
  }

  if (!pattern.test(value)) {
    return {
      isValid: false,
      message: "กรุณาใช้ตัวอักษรภาษาอังกฤษ ตัวเลข และเครื่องหมาย - _ เท่านั้น",
    };
  }

  return {
    isValid: true,
    message: "",
  };
}
