import React from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';
import { EisenhowerTag, EISENHOWER_OPTIONS } from '../../types/todo';

interface EisenhowerTagPickerProps {
  value: EisenhowerTag | null | undefined;
  onChange: (tag: EisenhowerTag | null) => void;
}

// Matrix layout:
//                  Urgent          Not Urgent
// Important     |  Do           |  Decide      |
// Not Important |  Delegate     |  Delete      |

const MATRIX: { row: string; cols: EisenhowerTag[] }[] = [
  { row: 'Important', cols: ['do', 'schedule'] },
  { row: 'Not Important', cols: ['delegate', 'delete'] },
];
const COL_HEADERS = ['Urgent', 'Not Urgent'];

const EisenhowerTagPicker: React.FC<EisenhowerTagPickerProps> = ({ value, onChange }) => {
  const getOption = (tag: EisenhowerTag) => EISENHOWER_OPTIONS.find(o => o.value === tag)!;

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
        Eisenhower Priority
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gridTemplateRows: 'auto 1fr 1fr', gap: 0.5 }}>
        {/* Top-left empty cell */}
        <Box />
        {/* Column headers */}
        {COL_HEADERS.map((header) => (
          <Typography
            key={header}
            variant="caption"
            sx={{ textAlign: 'center', fontWeight: 600, fontSize: '0.65rem', color: 'text.secondary', pb: 0.25 }}
          >
            {header}
          </Typography>
        ))}

        {/* Rows */}
        {MATRIX.map(({ row, cols }) => (
          <React.Fragment key={row}>
            {/* Row header */}
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: '0.65rem',
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                pr: 0.75,
                whiteSpace: 'nowrap',
              }}
            >
              {row}
            </Typography>
            {/* Cells */}
            {cols.map((tag) => {
              const option = getOption(tag);
              const isSelected = value === tag;
              return (
                <ButtonBase
                  key={tag}
                  onClick={() => onChange(isSelected ? null : tag)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 1,
                    px: 1,
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor: isSelected ? option.color : 'divider',
                    backgroundColor: isSelected ? option.color : 'transparent',
                    color: isSelected ? '#fff' : option.color,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: option.color,
                      backgroundColor: isSelected ? option.color : `${option.color}0D`,
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>
                    {option.label}
                  </Typography>
                </ButtonBase>
              );
            })}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default EisenhowerTagPicker;
