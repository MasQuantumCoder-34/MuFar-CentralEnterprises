'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  error,
  sortKey,
  sortOrder,
  onSort,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  emptyTitle = 'No data found',
  emptyDescription,
  actions,
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortKey !== column) return <ChevronsUpDown className="ml-1 h-4 w-4" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>
                  {col.sortable && onSort ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => onSort(col.key)}
                    >
                      {col.header}
                      <SortIcon column={col.key} />
                    </Button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
              {actions && <TableHead className="w-[80px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={keyExtractor(item)}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render
                      ? col.render(item)
                      : String((item as any)[col.key] ?? '')}
                  </TableCell>
                ))}
                {actions && <TableCell>{actions(item)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {page !== undefined &&
        total !== undefined &&
        totalPages !== undefined &&
        onPageChange &&
        onLimitChange && (
          <Pagination
            page={page}
            limit={limit || 10}
            total={total}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        )}
    </div>
  );
}
