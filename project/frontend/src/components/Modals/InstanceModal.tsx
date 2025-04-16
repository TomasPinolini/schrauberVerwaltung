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
  CircularProgress,
  FormHelperText,
  Box,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormLabel,
  Paper,
  Divider,
} from '@mui/material';
import { Attribute } from '../../types';

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number;
}

interface AttributeWithSource extends Attribute {
  categoryName?: string;
  description?: string;
  inherited?: boolean;
  category: {
    id: number;
    name: string;
    type: 'category';
  };
}

const InstanceModal: React.FC<InstanceModalProps> = ({
  isOpen,
  onClose,
  categoryId,
}) => {
  const [attributes, setAttributes] = useState<AttributeWithSource[]>([]);
  const [values, setValues] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [instanceName, setInstanceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error'
  });

  useEffect(() => {
    if (isOpen && categoryId) {
      fetchAttributes();
      setInstanceName('');
      setValues({});
      setErrors({});
    }
  }, [isOpen, categoryId]);

  const fetchAttributes = async () => {
    try {
      // Get all attributes from the current category and its parents
      const response = await fetch(`/api/screwdrivers/${categoryId}/inherited-attributes`);
      if (!response.ok) throw new Error('Failed to fetch attributes');
      const data = await response.json();
      
      // Sort attributes by category hierarchy
      const sortedData = [...data].sort((a, b) => {
        // Root category attributes first
        if (a.category.name === 'Screwdriver') return -1;
        if (b.category.name === 'Screwdriver') return 1;
        // Then by category name (assuming hierarchical naming like 1, 1.1, 1.1.1)
        return a.category.name.localeCompare(b.category.name);
      });

      setAttributes(sortedData);

      // Set default values
      const defaultValues: Record<number, string> = {};
      sortedData.forEach((attr: AttributeWithSource) => {
        if (attr.default_value) {
          defaultValues[attr.id] = attr.default_value;
        }
      });
      setValues(defaultValues);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      setToast({
        open: true,
        message: 'Failed to load attributes',
        severity: 'error'
      });
    }
  };

  const getFormatHelperText = (format: string | null): string => {
    switch (format) {
      case "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b":
        return "Format: XXX.XXX.XXX.XXX (e.g., 192.168.1.1)";
      case "\\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\\b":
        return "Format: XX:XX:XX:XX:XX:XX (e.g., 00:1A:2B:3C:4D:5E)";
      case "\\b(0?[1-9]|[12][0-9]|3[01])/(0?[1-9]|1[0-2])/\\d{4}\\b":
        return "Format: DD/MM/YYYY (e.g., 16/04/2025)";
      case "^.{0,10}$":
        return "Maximum 10 characters";
      default:
        return format || "";
    }
  };

  const validateValue = (value: string, format: string | null): boolean => {
    if (!format) return true;
    if (!value) return true; // Empty values are handled by required validation
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
        [attributeId]: `Invalid format. ${getFormatHelperText(format)}`,
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
      setIsSubmitting(true);

      // Create instance
      const instanceResponse = await fetch('/api/screwdrivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: instanceName,
          parent_id: categoryId,
          type: 'instance',
        }),
      });

      if (!instanceResponse.ok) {
        throw new Error('Failed to create instance');
      }

      const instance = await instanceResponse.json();

      // Create attribute values
      const attributeValues = Object.entries(values)
        .filter(([_, value]) => value.trim() !== '')
        .map(([attributeId, value]) => ({
          screwdriver_id: instance.id,
          attribute_id: parseInt(attributeId),
          value: value.trim(),
        }));

      if (attributeValues.length > 0) {
        const valuesResponse = await fetch(`/api/attribute-values/${instance.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: attributeValues }),
        });

        if (!valuesResponse.ok) {
          throw new Error('Failed to create attribute values');
        }
      }

      setToast({
        open: true,
        message: 'Instance created successfully',
        severity: 'success'
      });

      // Delay closing the modal to show the success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to create instance',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAttributesByCategory = () => {
    const categoryGroups = new Map<string, AttributeWithSource[]>();
    
    attributes.forEach(attr => {
      const categoryName = attr.category.name;
      if (!categoryGroups.has(categoryName)) {
        categoryGroups.set(categoryName, []);
      }
      categoryGroups.get(categoryName)?.push(attr);
    });

    return Array.from(categoryGroups.entries()).map(([categoryName, attrs], index) => (
      <Paper key={categoryName} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Inherited from: {categoryName}
        </Typography>
        <Stack spacing={2}>
          {attrs.map(attr => (
            <FormControl key={attr.id} fullWidth error={!!errors[attr.id]}>
              <FormLabel required={attr.is_required}>
                {attr.name}
              </FormLabel>
              <OutlinedInput
                fullWidth
                value={values[attr.id] || ''}
                onChange={(e) => handleChange(attr.id, e.target.value, attr.format_data, attr.is_required)}
                placeholder={`Enter ${attr.name}`}
                disabled={isSubmitting}
                error={!!errors[attr.id]}
              />
              {attr.description && (
                <FormHelperText>
                  {attr.description}
                </FormHelperText>
              )}
              {attr.default_value && !values[attr.id] && (
                <FormHelperText>
                  Default: {attr.default_value}
                </FormHelperText>
              )}
              {attr.format_data && (
                <FormHelperText>
                  {getFormatHelperText(attr.format_data)}
                </FormHelperText>
              )}
              {errors[attr.id] && (
                <FormHelperText error>
                  {errors[attr.id]}
                </FormHelperText>
              )}
            </FormControl>
          ))}
        </Stack>
      </Paper>
    ));
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={!isSubmitting ? onClose : undefined}
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={isSubmitting}
      >
        <DialogTitle>Create New Instance</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              required
              fullWidth
              label="Instance Name"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Enter instance name"
              disabled={isSubmitting}
              error={!instanceName}
              helperText={!instanceName ? 'Instance name is required' : ''}
            />
            
            {renderAttributesByCategory()}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !instanceName ||
              Object.keys(errors).length > 0
            }
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Creating...' : 'Create Instance'}
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

export default InstanceModal; 