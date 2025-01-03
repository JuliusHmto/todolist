export const formatDate = (date) => {
  if (!date) return 'No date';
  try {
    if (typeof date === 'string') {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return 'Invalid date';
      }
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

// You can add more helper functions here in the future 