export const formatDateGroupTitle = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const dateString = date.toDateString();
  const todayString = today.toDateString();
  const tomorrowString = tomorrow.toDateString();
  
  if (dateString === todayString) {
    return 'Today';
  } else if (dateString === tomorrowString) {
    return 'Tomorrow';
  } else {
    // Show date in DD.MM.YYYY format
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}; 