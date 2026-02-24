import React, { useState, useRef, useEffect } from 'react';
import { Typography, Box, TextField, Button, IconButton, useTheme, useMediaQuery, Paper, List, ListItemButton, ListItemText, Chip } from '@mui/material';
import { Add, Event } from '@mui/icons-material';
import { EisenhowerTag, EISENHOWER_OPTIONS } from '../../types/todo';
import EisenhowerTagPicker from './EisenhowerTagPicker';

interface AddTodoFormProps {
  onAddTodo: (text: string, dueDate?: string, eisenhowerTag?: EisenhowerTag, description?: string) => void;
  allHashtags?: string[];
  showAllFields?: boolean;
}

const AddTodoForm: React.FC<AddTodoFormProps> = ({ onAddTodo, allHashtags = [], showAllFields = false }) => {
  const [newTodo, setNewTodo] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [showDateInput, setShowDateInput] = useState<boolean>(false);
  const [eisenhowerTag, setEisenhowerTag] = useState<EisenhowerTag | null>(null);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Detect hashtag being typed and show suggestions
  const detectHashtagInput = (text: string, cursorPosition: number) => {
    // Find the hashtag being typed at cursor position
    const textBeforeCursor = text.substring(0, cursorPosition);
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    
    if (hashtagMatch) {
      const partialTag = hashtagMatch[1].toLowerCase();
      if (partialTag.length > 0) {
        // Filter existing hashtags that start with the partial input
        const matches = allHashtags.filter(tag => 
          tag.toLowerCase().startsWith('#' + partialTag) && 
          tag.toLowerCase() !== '#' + partialTag
        );
        setHashtagSuggestions(matches);
        setShowSuggestions(matches.length > 0);
        setSelectedSuggestionIndex(-1);
      } else {
        // Just typed #, show all hashtags
        setHashtagSuggestions(allHashtags.slice(0, 5));
        setShowSuggestions(allHashtags.length > 0);
        setSelectedSuggestionIndex(-1);
      }
    } else {
      setShowSuggestions(false);
      setHashtagSuggestions([]);
    }
  };

  // Insert selected hashtag
  const insertHashtag = (hashtag: string) => {
    const cursorPosition = inputRef.current?.selectionStart || newTodo.length;
    const textBeforeCursor = newTodo.substring(0, cursorPosition);
    const textAfterCursor = newTodo.substring(cursorPosition);
    
    // Find and replace the partial hashtag
    const hashtagMatch = textBeforeCursor.match(/#\w*$/);
    if (hashtagMatch) {
      const newText = textBeforeCursor.substring(0, hashtagMatch.index) + hashtag + ' ' + textAfterCursor;
      setNewTodo(newText);
    }
    
    setShowSuggestions(false);
    setHashtagSuggestions([]);
    
    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmit = () => {
    if (newTodo.trim()) {
      onAddTodo(newTodo.trim(), dueDate || undefined, eisenhowerTag || undefined, description.trim() || undefined);
      setNewTodo('');
      setDescription('');
      setDueDate('');
      setShowDateInput(false);
      setEisenhowerTag(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (showSuggestions && hashtagSuggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < hashtagSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : hashtagSuggestions.length - 1
        );
      } else if (event.key === 'Enter' && selectedSuggestionIndex >= 0) {
        event.preventDefault();
        insertHashtag(hashtagSuggestions[selectedSuggestionIndex]);
      } else if (event.key === 'Escape') {
        setShowSuggestions(false);
      } else if (event.key === 'Tab' && hashtagSuggestions.length > 0) {
        event.preventDefault();
        insertHashtag(hashtagSuggestions[selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0]);
      }
    }
    
    if (event.key === 'Enter' && !showSuggestions) {
      handleSubmit();
    }
  };

  const handleDateIconClick = () => {
    setShowDateInput(true);
  };

  const handleDateInputBlur = () => {
    // Hide the input if no date is selected (only on desktop)
    if (!dueDate && !isMobile) {
      setShowDateInput(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Auto-open calendar when date input appears (desktop only)
  useEffect(() => {
    if (showDateInput && dateInputRef.current && !isMobile) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      }, 100);
    }
  }, [showDateInput, isMobile]);

  // On mobile, always show date input; on desktop, use the toggle behavior
  const shouldShowDateInput = isMobile || showDateInput;

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1.5, 
        mb: 2 
      }}>
        {/* Text Input - Full width on mobile, takes remaining space on desktop */}
        <Box sx={{ position: 'relative', width: { xs: '100%', sm: 'auto' }, flex: { sm: 1 }, display: 'flex', alignItems: 'center' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            label="What needs to be done?"
            variant="outlined"
            value={newTodo}
            onChange={(e) => {
              setNewTodo(e.target.value);
              detectHashtagInput(e.target.value, e.target.selectionStart || 0);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder="Enter a new task..."
            size="small"
            autoComplete="off"
          />
          
          {/* Hashtag Suggestions Dropdown */}
          {showSuggestions && hashtagSuggestions.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                mt: 0.5,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              <List dense disablePadding>
                {hashtagSuggestions.map((hashtag, index) => (
                  <ListItemButton
                    key={hashtag}
                    selected={index === selectedSuggestionIndex}
                    onClick={() => insertHashtag(hashtag)}
                    sx={{
                      py: 0.75,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                      },
                    }}
                  >
                    <ListItemText 
                      primary={hashtag}
                      primaryTypographyProps={{
                        sx: { color: 'primary.main', fontWeight: 500 }
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>
        
        {/* Buttons Container - Separate row on mobile */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          justifyContent: { xs: 'flex-end', sm: 'flex-start' },
          width: { xs: '100%', sm: 'auto' },
        }}>
          {/* Compact 2x2 Eisenhower Matrix (desktop only) - headers appear on hover */}
          {!isMobile && (
            <Box sx={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3px',
              '& .matrix-header': {
                opacity: 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: 'none',
                backgroundColor: 'rgba(255,255,255,0.9)',
                px: '3px',
                borderRadius: '2px',
              },
              '&:hover .matrix-header': {
                opacity: 1,
              },
            }}>
              {/* Column headers - absolutely positioned above */}
              <Typography className="matrix-header" variant="caption" sx={{ position: 'absolute', top: -14, left: 0, right: '50%', textAlign: 'center', fontSize: '0.6rem', color: 'text.secondary', fontWeight: 600 }}>
                Urgent
              </Typography>
              <Typography className="matrix-header" variant="caption" sx={{ position: 'absolute', top: -14, left: '50%', right: 0, textAlign: 'center', fontSize: '0.6rem', color: 'text.secondary', fontWeight: 600 }}>
                Not Urgent
              </Typography>
              {/* Row headers - absolutely positioned to the left */}
              <Typography className="matrix-header" variant="caption" sx={{ position: 'absolute', top: 0, bottom: '50%', right: '100%', pr: 0.5, fontSize: '0.6rem', color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                Important
              </Typography>
              <Typography className="matrix-header" variant="caption" sx={{ position: 'absolute', top: '50%', bottom: 0, right: '100%', pr: 0.5, fontSize: '0.6rem', color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                Not Imp.
              </Typography>
              {(['do', 'schedule', 'delegate', 'delete'] as EisenhowerTag[]).map((tag) => {
                const option = EISENHOWER_OPTIONS.find(o => o.value === tag)!;
                const isSelected = eisenhowerTag === tag;
                return (
                  <Chip
                    key={tag}
                    label={option.label}
                    size="small"
                    onClick={() => setEisenhowerTag(isSelected ? null : tag)}
                    sx={{
                      height: 24,
                      fontSize: '0.68rem',
                      fontWeight: isSelected ? 600 : 500,
                      backgroundColor: isSelected ? option.color : 'transparent',
                      color: isSelected ? '#fff' : option.color,
                      border: '1.5px solid',
                      borderColor: isSelected ? option.color : `${option.color}50`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      '& .MuiChip-label': { px: 1 },
                      '&:hover': {
                        backgroundColor: isSelected ? option.color : `${option.color}14`,
                        borderColor: option.color,
                      },
                    }}
                  />
                );
              })}
            </Box>
          )}

          {/* Date Input or Icon Button */}
          {shouldShowDateInput ? (
            <TextField
              ref={dateInputRef}
              type="date"
              variant="outlined"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                // If date is cleared, hide the input (only on desktop)
                if (!e.target.value && !isMobile) {
                  setShowDateInput(false);
                }
              }}
              onBlur={handleDateInputBlur}
              size="small"
              label={isMobile ? "Due Date" : undefined}
              sx={{
                width: { xs: 'auto', sm: 220 },
                '& .MuiInputBase-input': {
                  cursor: 'pointer'
                }
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          ) : (
            <IconButton
              onClick={handleDateIconClick}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: dueDate ? 'primary.main' : 'divider',
                borderRadius: 1,
                backgroundColor: dueDate ? 'primary.50' : 'transparent',
                color: dueDate ? 'primary.main' : 'text.secondary',
                minWidth: 40,
                height: 40,
                position: 'relative',
                '&:hover': {
                  backgroundColor: dueDate ? 'primary.100' : 'action.hover',
                }
              }}
            >
              <Event fontSize="small" />
              {dueDate && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    fontSize: '8px',
                    lineHeight: 1,
                    color: 'primary.main',
                    fontWeight: 600
                  }}
                >
                  {formatDateDisplay(dueDate)}
                </Typography>
              )}
            </IconButton>
          )}

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!newTodo.trim()}
            startIcon={<Add />}
            sx={{
              minWidth: { xs: 'auto', sm: 100 },
              whiteSpace: 'nowrap',
              flex: { xs: 1, sm: 'none' }
            }}
            size="small"
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {/* Extra fields - shown in expanded/mobile add mode */}
      {showAllFields && (
        <>
          <TextField
            fullWidth
            label="Description"
            variant="outlined"
            multiline
            minRows={2}
            maxRows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this task..."
            size="small"
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 1 }}>
            <EisenhowerTagPicker
              value={eisenhowerTag}
              onChange={setEisenhowerTag}
            />
          </Box>
        </>
      )}
    </>
  );
};

export default AddTodoForm; 