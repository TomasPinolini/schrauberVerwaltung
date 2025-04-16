import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: number;
  onSubmit: (name: string) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  parentId,
  onSubmit,
}) => {
  const [categoryName, setCategoryName] = useState('');

  const handleSubmit = () => {
    onSubmit(categoryName);
    setCategoryName('');
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Category</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            required
            fullWidth
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Enter category name"
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!categoryName.trim()}
        >
          Create Category
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryModal; 