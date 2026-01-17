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

export const getDaysUntilTag = (dateStr: string): { text: string; isPast: boolean } | null => {
  if (!dateStr || dateStr === 'No Date') return null;
  
  const date = new Date(dateStr);
  const today = new Date();
  
  // Reset time to compare just dates
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return null; // Today - no tag needed
  } else if (diffDays === 1) {
    return null; // Tomorrow - already shown in title
  } else if (diffDays > 1) {
    return { text: `in ${diffDays} days`, isPast: false };
  } else if (diffDays === -1) {
    return { text: '1 day ago', isPast: true };
  } else {
    return { text: `${Math.abs(diffDays)} days ago`, isPast: true };
  }
}; 