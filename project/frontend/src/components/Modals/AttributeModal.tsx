import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  IconButton,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Tooltip,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Attribute } from '../../types';

interface AttributeWithSource extends Attribute {
  source_category_id: number | null;
  source_category_name: string | null;
}

interface AttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number;
}

const AttributeModal: React.FC<AttributeModalProps> = ({
  isOpen,
  onClose,
  categoryId,
}) => {
  const [attributes, setAttributes] = useState<AttributeWithSource[]>([]);
  const [newAttribute, setNewAttribute] = useState<Omit<Attribute, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    default_value: null,
    format_data: null,
    is_required: false,
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAttributes();
    }
  }, [isOpen, categoryId]);

  const fetchAttributes = async () => {
    try {
      // Fetch both direct and inherited attributes
      const response = await fetch(`/api/screwdrivers/${categoryId}/all-attributes`);
      if (!response.ok) throw new Error('Failed to fetch attributes');
      const data = await response.json();
      setAttributes(data);
    } catch (error) {
      console.error('Error fetching attributes:', error);
    }
  };

  const handleAddAttribute = async () => {
    try {
      const response = await fetch('/api/attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newAttribute,
          screwdriver_id: categoryId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create attribute');

      setNewAttribute({
        name: '',
        default_value: null,
        format_data: null,
        is_required: false,
      });
      setIsAdding(false);
      fetchAttributes();
    } catch (error) {
      console.error('Error creating attribute:', error);
    }
  };

  const handleDeleteAttribute = async (attributeId: number) => {
    try {
      const response = await fetch(`/api/attributes/${attributeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete attribute');
      fetchAttributes();
    } catch (error) {
      console.error('Error deleting attribute:', error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Category Attributes</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {attributes.map((attr) => (
            <Box
              key={attr.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: 2,
                border: '1px solid',
                borderColor: attr.source_category_id ? 'divider' : 'primary.main',
                borderRadius: 1,
                bgcolor: attr.source_category_id ? 'action.hover' : 'transparent',
              }}
            >
              <Stack spacing={1} flex={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">
                    {attr.name}
                    {attr.is_required && (
                      <Typography component="span" color="error" ml={1}>
                        *
                      </Typography>
                    )}
                  </Typography>
                  {attr.source_category_id && (
                    <Chip
                      size="small"
                      label={`Inherited from ${attr.source_category_name}`}
                      color="info"
                    />
                  )}
                </Box>
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
              </Stack>
              {!attr.source_category_id && (
                <Tooltip title="Delete Attribute">
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleDeleteAttribute(attr.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}

          {isAdding ? (
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Attribute Name"
                  value={newAttribute.name}
                  onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Default Value"
                  value={newAttribute.default_value || ''}
                  onChange={(e) => setNewAttribute(prev => ({ ...prev, default_value: e.target.value || null }))}
                />
                <TextField
                  fullWidth
                  label="Format (regex)"
                  value={newAttribute.format_data || ''}
                  onChange={(e) => setNewAttribute(prev => ({ ...prev, format_data: e.target.value || null }))}
                  helperText="Optional: Add a regex pattern for validation"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={newAttribute.is_required}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, is_required: e.target.checked }))}
                    />
                  }
                  label="Required"
                />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button
                    variant="contained"
                    onClick={handleAddAttribute}
                    disabled={!newAttribute.name.trim()}
                  >
                    Add Attribute
                  </Button>
                </Box>
              </Stack>
            </Box>
          ) : (
            <Button
              startIcon={<AddIcon />}
              onClick={() => setIsAdding(true)}
              variant="outlined"
              fullWidth
            >
              Add New Attribute
            </Button>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttributeModal; 