import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Collapse,
  Stack,
  Card,
  CardContent,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import { Category, Instance, Screwdriver, isCategory, isInstance } from '../../types';
import InstanceCard from './InstanceCard';
import AttributeModal from '../Modals/AttributeModal';

interface CategoryCardProps {
  category: Category;
  onAddInstance: (categoryId: number) => void;
  onAddCategory: (parentId: number) => void;
  onDelete: (categoryId: number) => void;
  onDeleteInstance: (instanceId: number) => Promise<void>;
  level?: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onAddInstance,
  onAddCategory,
  onDelete,
  onDeleteInstance,
  level = 0,
}) => {
  const [expanded, setExpanded] = React.useState(true);
  const [isAttributeModalOpen, setIsAttributeModalOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    try {
      await onDelete(category.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const renderChild = (child: Screwdriver, isLast: boolean) => {
    const commonStyles = {
      position: 'relative',
      '&:before': {
        content: '""',
        position: 'absolute',
        left: -16,
        top: 0,
        width: 16,
        height: 24,
        borderLeft: '2px solid #666',
        borderBottom: '2px solid #666',
      },
      '&:after': {
        content: '""',
        position: 'absolute',
        left: -16,
        top: 24,
        bottom: isLast ? 0 : -8,
        width: 2,
        background: isLast ? 'transparent' : '#666',
      },
    };

    if (isCategory(child)) {
      return (
        <Box key={child.id} sx={commonStyles}>
          <CategoryCard
            category={child}
            onAddInstance={onAddInstance}
            onAddCategory={onAddCategory}
            onDelete={onDelete}
            onDeleteInstance={onDeleteInstance}
            level={level + 1}
          />
        </Box>
      );
    } else if (isInstance(child)) {
      return (
        <Box key={child.id} sx={commonStyles}>
          <InstanceCard 
            instance={child} 
            onDelete={onDeleteInstance}
          />
        </Box>
      );
    }
    return null;
  };

  return (
    <>
      <Card sx={{ mb: 1, ml: level * 3 }}>
        <CardContent sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
              <Typography variant="subtitle1">{category.name}</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Manage Attributes">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => setIsAttributeModalOpen(true)}
                >
                  Attributes
                </Button>
              </Tooltip>
              <Tooltip title="Add Instance">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => onAddInstance(category.id)}
                >
                  Instance
                </Button>
              </Tooltip>
              <Tooltip title="Add Subcategory">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => onAddCategory(category.id)}
                >
                  Category
                </Button>
              </Tooltip>
              <Tooltip title="Delete Category">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </CardContent>
        <Collapse in={expanded}>
          <Box sx={{ py: 1, pl: 4 }}>
            {category.children?.map((child, index, array) => 
              renderChild(child, index === array.length - 1)
            )}
          </Box>
        </Collapse>

        <AttributeModal
          isOpen={isAttributeModalOpen}
          onClose={() => setIsAttributeModalOpen(false)}
          categoryId={category.id}
        />
      </Card>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the category "{category.name}" and all its contents? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CategoryCard; 