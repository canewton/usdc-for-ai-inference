'use client';

import { ChevronRight } from 'lucide-react';
import React, { useEffect } from 'react';
import { type FunctionComponent, useState } from 'react';

import { SortIcon } from '@/app/icons/SortIcon';
import { USDCIcon } from '@/app/icons/USDCIcon';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { SortField } from './transaction-history';

export interface BillingTransaction {
  id: string;
  ai_model: string;
  project_name: string;
  transaction_type: string;
  amount: string;
  status: string;
  created_at: string;
  expanded: boolean;
}

interface Props {
  data: BillingTransaction[];
  loading: boolean;
  sortConfig: {
    field: string;
    direction: string;
  };
  onSort: (field: SortField) => void;
}

const ITEMS_PER_PAGE = 5;

export const Billing: FunctionComponent<Props> = ({
  data,
  loading,
  sortConfig,
  onSort,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const [paginatedData, setPaginatedData] = useState<BillingTransaction[]>(
    data.slice(startIndex, startIndex + ITEMS_PER_PAGE),
  );

  useEffect(() => {
    setPaginatedData(data.slice(startIndex, startIndex + ITEMS_PER_PAGE));
  }, [currentPage]);

  useEffect(() => {
    setPaginatedData(data.slice(startIndex, startIndex + ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [data]);

  if (data.length == 0 && loading) {
    return <Skeleton className="w-[206px] h-[28px] rounded-full" />;
  }

  if (data && data.length < 1) {
    return (
      <p className="text-xl text-muted-foreground cursor-pointer">
        No transactions found
      </p>
    );
  }

  const toggleExpand = (id: string) => {
    console.log('toggleExpand', id, paginatedData);
    setPaginatedData(
      paginatedData.map((tx) =>
        tx.id === id ? { ...tx, expanded: !tx.expanded } : tx,
      ),
    );
  };

  const blockchain = process.env.CIRCLE_BLOCKCHAIN ?? 'ARB-SEPOLIA';

  function truncateString(text: string): string {
    console.log(text.length, text);
    if (text.length <= 40) {
      return text;
    }

    const truncated = text.substring(0, 40);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace === -1) {
      return truncated + '...';
    }

    return truncated.substring(0, lastSpace) + '...';
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 overflow-hidden mb-4">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead colSpan={2} onClick={() => onSort('date')}>
                <div className="flex items-center gap-1">
                  Date
                  <SortIcon />
                </div>
              </TableHead>
              <TableHead onClick={() => onSort('name')}>
                <div className="flex items-center gap-1">
                  Project Title
                  <SortIcon />
                </div>
              </TableHead>
              <TableHead>Model</TableHead>
              <TableHead onClick={() => onSort('amount')}>
                <div className="flex items-center gap-1">
                  Total Amount
                  <SortIcon />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <TableRow
                  onClick={() => toggleExpand(transaction.id)}
                  className="border-b-0"
                  key={transaction.id}
                >
                  <TableCell className="p-4" colSpan={2}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`transition-transform duration-300 ${transaction.expanded ? 'rotate-90' : ''}`}
                      >
                        <ChevronRight className="text-gray-500" size={20} />
                      </div>
                      {transaction.created_at}
                    </div>
                  </TableCell>
                  <TableCell>
                    {truncateString(transaction.project_name)}
                  </TableCell>
                  <TableCell>{transaction.ai_model}</TableCell>
                  {transaction.transaction_type === 'INBOUND' && (
                    <TableCell className="text-green-600">
                      <div className="flex items-center gap-1">
                        +{transaction.amount}{' '}
                        <USDCIcon className="text-green-600" />
                      </div>
                    </TableCell>
                  )}
                  {transaction.transaction_type === 'OUTBOUND' && (
                    <TableCell className="text-red-600">
                      <div className="flex items-center gap-1">
                        -{transaction.amount}{' '}
                        <USDCIcon className="text-red-600" />
                      </div>
                    </TableCell>
                  )}
                  {transaction.status == 'CONFIRMED' && (
                    <TableCell>
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full font-medium bg-green-100 text-green-800">
                        {transaction.status}
                      </span>
                    </TableCell>
                  )}
                  {transaction.status !== 'CONFIRMED' && (
                    <TableCell>
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full font-medium bg-red-100 text-red-800">
                        {transaction.status}
                      </span>
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  <TableCell className={`p-0`} colSpan={2}>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        transaction.expanded
                          ? 'max-h-20 opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-6 px-11 align-middle">
                        <div>ID: {transaction.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={`p-0`}>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        transaction.expanded
                          ? 'max-h-20 opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-6 align-middle">
                        <div>Blockchain: {blockchain}</div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                }}
                className={
                  currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>

            {/* First page */}
            {currentPage > 2 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(1);
                  }}
                  isActive={currentPage === 1}
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Ellipsis for skipped pages */}
            {currentPage > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Previous page (if applicable) */}
            {currentPage > 1 && currentPage <= totalPages && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(currentPage - 1);
                  }}
                  isActive={false}
                >
                  {currentPage - 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Current page */}
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(currentPage);
                }}
                isActive={true}
              >
                {currentPage}
              </PaginationLink>
            </PaginationItem>

            {/* Next page (if applicable) */}
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(currentPage + 1);
                  }}
                  isActive={false}
                >
                  {currentPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Ellipsis for skipped pages */}
            {currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Last page */}
            {currentPage < totalPages - 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(totalPages);
                  }}
                  isActive={currentPage === totalPages}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                }}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};
