import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Attribute } from '../../types';

interface AttributeListProps {
  attributes: Attribute[];
  onDelete: (id: number) => void;
}

const AttributeList: React.FC<AttributeListProps> = ({
  attributes,
  onDelete,
}) => {
  return (
    <List>
      {attributes.map((attr) => (
        <ListItem
          key={attr.id}
          sx={{
            mb: 1,
            borderRadius: 1,
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1">{attr.name}</Typography>
                {attr.is_required && (
                  <Typography variant="caption" color="error">
                    *
                  </Typography>
                )}
              </Box>
            }
            secondary={
              <>
                {attr.default_value && (
                  <Typography variant="body2" color="text.secondary">
                    Default: {attr.default_value}
                  </Typography>
                )}
                {attr.format_data && (
                  <Typography variant="caption" color="text.secondary">
                    Format: {attr.format_data}
                  </Typography>
                )}
              </>
            }
          />
          <Tooltip title="Delete Attribute">
            <IconButton
              edge="end"
              onClick={() => onDelete(attr.id)}
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </ListItem>
      ))}
    </List>
  );
};

export default AttributeList; 