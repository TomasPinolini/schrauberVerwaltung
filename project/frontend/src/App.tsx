import React from 'react';
import {
  Box,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import CategoryCard from './components/CategoryTree/CategoryCard';
import InstanceModal from './components/Modals/InstanceModal';
import CategoryModal from './components/Modals/CategoryModal';
import { Category, Screwdriver, Instance, AttributeValue, isCategory } from './types';

interface ApiScrewdriver {
  id: number;
  name: string;
  parent_id: number | null;
  type: 'category' | 'instance';
  state: 'on' | 'off';
  created_at: string;
  updated_at: string;
  attributeValues?: AttributeValue[];
}

const App: React.FC = () => {
  const [rootCategory, setRootCategory] = React.useState<Category | null>(null);
  const [isInstanceModalOpen, setIsInstanceModalOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [toast, setToast] = React.useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error'
  });

  const fetchRootCategory = React.useCallback(async () => {
    try {
      const response = await fetch('/api/screwdrivers?include=children,attributes,attributeValues');
      if (!response.ok) {
        throw new Error('Failed to fetch screwdrivers');
      }
      const data: ApiScrewdriver[] = await response.json();
      
      const buildTree = (items: ApiScrewdriver[]): Screwdriver[] => {
        const itemMap = new Map<number, Screwdriver>();
        
        // Only include items with state 'on'
        items.filter(item => item.state === 'on').forEach(item => {
          if (item.type === 'instance') {
            itemMap.set(item.id, { 
              ...item, 
              type: 'instance' as const,
              attributeValues: item.attributeValues || []
            } as Instance);
          } else {
            itemMap.set(item.id, { 
              ...item, 
              type: 'category' as const,
              children: []
            } as Category);
          }
        });
        
        const roots: Screwdriver[] = [];
        itemMap.forEach(item => {
          if (item.parent_id) {
            const parent = itemMap.get(item.parent_id);
            if (parent && isCategory(parent)) {
              parent.children.push(item);
            }
          } else {
            roots.push(item);
          }
        });
        
        return roots;
      };

      const tree = buildTree(data);
      const root = tree.find(item => isCategory(item) && !item.parent_id);
      
      if (!root || !isCategory(root)) {
        throw new Error('No root category found');
      }
      
      setRootCategory(root);
    } catch (error) {
      console.error('Error fetching root category:', error);
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to load root category',
        severity: 'error'
      });
    }
  }, []);

  React.useEffect(() => {
    fetchRootCategory();
  }, [fetchRootCategory]);

  const handleAddInstance = async (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setIsInstanceModalOpen(true);
  };

  const handleAddCategory = async (parentId: number) => {
    setSelectedCategoryId(parentId);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteInstance = async (instanceId: number) => {
    try {
      const response = await fetch(`/api/screwdrivers/${instanceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete instance');
      }

      setToast({
        open: true,
        message: 'Instance deleted successfully',
        severity: 'success'
      });

      fetchRootCategory(); // Refresh the tree
    } catch (error) {
      console.error('Error deleting instance:', error);
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete instance',
        severity: 'error'
      });
      throw error;
    }
  };

  const handleCategorySubmit = async (name: string) => {
    try {
      const response = await fetch('/api/screwdrivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          parent_id: selectedCategoryId,
          type: 'category',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      setToast({
        open: true,
        message: 'Category created successfully',
        severity: 'success'
      });

      setIsCategoryModalOpen(false);
      setSelectedCategoryId(null);
      fetchRootCategory();
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to create category',
        severity: 'error'
      });
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/screwdrivers/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setToast({
        open: true,
        message: 'Category deleted successfully',
        severity: 'success'
      });

      fetchRootCategory();
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete category',
        severity: 'error'
      });
    }
  };

  const handleInstanceModalClose = () => {
    setIsInstanceModalOpen(false);
    setSelectedCategoryId(null);
    fetchRootCategory();
  };

  const handleCategoryModalClose = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategoryId(null);
  };

  return (
    <Box p={4}>
      <Stack spacing={2}>
        {rootCategory && (
          <CategoryCard
            category={rootCategory}
            onAddInstance={handleAddInstance}
            onAddCategory={handleAddCategory}
            onDelete={handleDeleteCategory}
            onDeleteInstance={handleDeleteInstance}
          />
        )}
      </Stack>

      {selectedCategoryId && (
        <>
          <InstanceModal
            isOpen={isInstanceModalOpen}
            onClose={handleInstanceModalClose}
            categoryId={selectedCategoryId}
          />
          <CategoryModal
            isOpen={isCategoryModalOpen}
            onClose={handleCategoryModalClose}
            parentId={selectedCategoryId}
            onSubmit={handleCategorySubmit}
          />
        </>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App; 