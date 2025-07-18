// utils/date.js
const excelDateToISO = (excelDate) => {
  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
  return jsDate.toISOString().split('T')[0];
};

module.exports = { excelDateToISO };
