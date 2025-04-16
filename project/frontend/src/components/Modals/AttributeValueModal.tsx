import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  Alert,
  Snackbar,
  Paper,
  Box,
  CircularProgress,
} from '@mui/material';
import { Instance, AttributeValue, Attribute } from '../../types';

interface AttributeWithValue extends Attribute {
  value?: string;
  categoryName?: string;
  inherited?: boolean;
  category: {
    id: number;
    name: string;
    type: 'category';
  };
}

interface AttributeValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: Instance;
}

const AttributeValueModal: React.FC<AttributeValueModalProps> = ({
  isOpen,
  onClose,
  instance,
}) => {
  const [values, setValues] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [attributes, setAttributes] = useState<AttributeWithValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error'
  });

  useEffect(() => {
    if (isOpen) {
      fetchAttributesAndValues();
    }
  }, [isOpen, instance.id]);

  const fetchAttributesAndValues = async () => {
    try {
      setIsLoading(true);
      // Fetch all attributes including inherited ones
      const response = await fetch(`/api/screwdrivers/${instance.id}/inherited-attributes`);
      if (!response.ok) throw new Error('Failed to fetch attributes');
      const attributesData = await response.json();

      // Fetch current attribute values for this instance
      const valuesResponse = await fetch(`/api/attribute-values/${instance.id}`);
      if (!valuesResponse.ok) throw new Error('Failed to fetch attribute values');
      const valuesData = await valuesResponse.json();

      // Create a map of attribute values
      const valueMap: Record<number, string> = {};
      valuesData.forEach((av: AttributeValue) => {
        valueMap[av.attribute_id] = av.value;
      });

      // Sort attributes by category hierarchy and merge with values
      const sortedAttributes = [...attributesData].sort((a, b) => {
        if (a.category.name === 'Screwdriver') return -1;
        if (b.category.name === 'Screwdriver') return 1;
        return a.category.name.localeCompare(b.category.name);
      });

      // Set the values and attributes
      setValues(valueMap);
      setAttributes(sortedAttributes);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({
        open: true,
        message: 'Failed to load attributes and values',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateValue = (value: string, format: string | null): boolean => {
    if (!format) return true;
    try {
      const regex = new RegExp(format);
      return regex.test(value);
    } catch (e) {
      console.error('Invalid regex pattern:', format);
      return true;
    }
  };

  const handleChange = (attributeId: number, value: string, format: string | null, required: boolean) => {
    setValues((prev) => ({ ...prev, [attributeId]: value }));
    
    if (!value && required) {
      setErrors((prev) => ({
        ...prev,
        [attributeId]: 'This field is required',
      }));
      return;
    }

    if (value && !validateValue(value, format)) {
      setErrors((prev) => ({
        ...prev,
        [attributeId]: `Value does not match format: ${format}`,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[attributeId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const updates = Object.entries(values).map(([attributeId, value]) => ({
        screwdriver_id: instance.id,
        attribute_id: parseInt(attributeId),
        value: value.trim(),
      }));

      const response = await fetch(`/api/attribute-values/${instance.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update attribute values');
      }

      setToast({
        open: true,
        message: 'Attribute values updated successfully',
        severity: 'success'
      });

      onClose();
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to update attribute values',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderAttributesByCategory = () => {
    const categoryGroups = new Map<string, AttributeWithValue[]>();
    
    attributes.forEach(attr => {
      const categoryName = attr.category.name;
      if (!categoryGroups.has(categoryName)) {
        categoryGroups.set(categoryName, []);
      }
      categoryGroups.get(categoryName)?.push(attr);
    });

    return Array.from(categoryGroups.entries()).map(([categoryName, attrs]) => (
      <Paper key={categoryName} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Inherited from: {categoryName}
        </Typography>
        <Stack spacing={2}>
          {attrs.map(attr => (
            <Box key={attr.id}>
              <TextField
                fullWidth
                required={attr.is_required}
                error={!!errors[attr.id]}
                helperText={
                  errors[attr.id] || 
                  (attr.format_data ? `Format: ${attr.format_data}` : '') ||
                  (attr.default_value && !values[attr.id] ? `Default: ${attr.default_value}` : '')
                }
                label={attr.name}
                value={values[attr.id] || ''}
                onChange={(e) => handleChange(attr.id, e.target.value, attr.format_data, attr.is_required)}
                placeholder={`Enter ${attr.name}`}
                disabled={isSaving}
              />
            </Box>
          ))}
        </Stack>
      </Paper>
    ));
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={!isSaving ? onClose : undefined}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>View/Edit Attributes - {instance.name}</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 2 }}>
              {renderAttributesByCategory()}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSaving || Object.keys(errors).length > 0}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AttributeValueModal; 