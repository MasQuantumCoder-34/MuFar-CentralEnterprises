'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ImageUpload from '@/components/shared/ImageUpload';
import {
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ICategory, IApiResponse } from '@/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parent: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

type CategoryForm = z.infer<typeof categorySchema>;

function CategoryRow({
  category,
  onEdit,
  onDelete,
  depth = 0,
}: {
  category: ICategory;
  onEdit: (c: ICategory) => void;
  onDelete: (id: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <div
        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <FolderTree className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{category.name}</span>
          <Badge variant={category.isActive ? 'success' : 'secondary'}>
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onDelete(category._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<IApiResponse<ICategory[]>>('/categories');
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      await api.post('/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
      closeDialog();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryForm> }) => {
      await api.put(`/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated');
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditingCategory(null);
    form.reset({ sortOrder: 0 });
    setDialogOpen(true);
  };

  const openEdit = (cat: ICategory) => {
    setEditingCategory(cat);
    form.reset({
      name: cat.name,
      description: cat.description || '',
      parent: typeof cat.parent === 'object' ? cat.parent?._id : cat.parent || '',
      sortOrder: cat.sortOrder,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const rootCategories = (categories || []).filter((c) => !c.parent);

  const getChildren = (parentId: string) =>
    (categories || []).filter(
      (c) => (typeof c.parent === 'object' ? c.parent?._id : c.parent) === parentId
    );

  const renderTree = (catList: ICategory[], depth = 0) => {
    return catList.map((cat) => (
      <div key={cat._id} className="space-y-2">
        <CategoryRow category={cat} onEdit={openEdit} onDelete={setDeleteId} depth={depth} />
        {getChildren(cat._id).length > 0 && renderTree(getChildren(cat._id), depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your product categories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Tree</CardTitle>
        </CardHeader>
        <CardContent>
          {categories?.length === 0 ? (
            <EmptyState
              title="No categories"
              description="Create your first category to organize products"
              actionLabel="Add Category"
              onAction={openCreate}
            />
          ) : (
            <div className="space-y-2">{renderTree(rootCategories)}</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category Image</Label>
              <ImageUpload
                images={form.watch('image') ? [form.watch('image')!] : []}
                onChange={(urls) => form.setValue('image', urls[0] || '')}
                maxImages={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...form.register('description')} />
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={form.watch('parent') || ''}
                onValueChange={(v) => form.setValue('parent', v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (top level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top level)</SelectItem>
                  {(categories || [])
                    .filter((c) => c._id !== editingCategory?._id)
                    .map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" {...form.register('sortOrder')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Category"
        description="Are you sure? This will also affect subcategories."
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
