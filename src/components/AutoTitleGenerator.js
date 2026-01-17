export const generateTitleFromText = (text) => {
  const maxLength = 30;
  const noNewlines = text.split("\n")[0];
  return noNewlines.length > maxLength
    ? noNewlines.slice(0, maxLength) + "..."
    : noNewlines;
};
