export const validateNigerianPhone = (phone) => {
  const cleaned = phone.replace(/\s/g, '');
  return /^0[789][01]\d{8}$/.test(cleaned);
};

export const validateNIN = (nin) => {
  return /^\d{11}$/.test(nin);
};


export const validatePassword = (password) => {
  return password.length >= 8;
};

export const formatToInternational = (phone) => {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('0')) {
    return '+234' + cleaned.slice(1);
  }
  return cleaned;
};