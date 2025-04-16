import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  Card,
  CardContent,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { Instance } from '../../types';
import AttributeValueModal from '../Modals/AttributeValueModal';

interface AttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  attribute: {
    name: string;
    is_required: boolean;
    format_data: string;
  };
}

interface InstanceCardProps {
  instance: Instance;
  onDelete: (instanceId: number) => Promise<void>;
}

const InstanceCard: React.FC<InstanceCardProps> = ({ instance, onDelete }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(instance.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting instance:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card sx={{ mb: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">{instance.name}</Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="View/Edit Attributes">
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => setIsOpen(true)}
                  variant="outlined"
                >
                  View/Edit
                </Button>
              </Tooltip>
              <Tooltip title="Delete Instance">
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

        <AttributeValueModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          instance={instance}
        />
      </Card>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Instance</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the instance "{instance.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsDeleteDialogOpen(false)} 
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InstanceCard; 