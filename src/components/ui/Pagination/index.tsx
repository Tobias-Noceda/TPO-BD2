import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  nextArrowLabel?: boolean;
  previousArrowLabel?: boolean;
  isLoading?: boolean;
  hasItemsPerPage?: boolean;
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
  nextArrowLabel,
  previousArrowLabel,
  isLoading,
  hasItemsPerPage = false,
  itemsPerPage = 15,
  itemsPerPageOptions = [15, 30, 50],
  onItemsPerPageChange,
}: PaginationProps) => {
  const [showItemsPerPageDropdown, setShowItemsPerPageDropdown] = useState(false);
  const [showDropdown, setShowDropdown] = useState<'left' | 'right' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemsPerPageDropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null);
      }
      if (showItemsPerPageDropdown && itemsPerPageDropdownRef.current && !itemsPerPageDropdownRef.current.contains(event.target as Node)) {
        setShowItemsPerPageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showItemsPerPageDropdown]);

  const getPages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 2) {
      return [1, 2, 'right-ellipsis', totalPages - 1, totalPages];
    }
    if (currentPage >= totalPages - 1) {
      return [1, 2, 'left-ellipsis', totalPages - 1, totalPages];
    }
    return [1, 'left-ellipsis', currentPage, 'right-ellipsis', totalPages];
  };

  const renderDropdown = (side: 'left' | 'right') => {
    let pages: number[] = [];
    if (side === 'left') {
      pages = Array.from({ length: currentPage - 2 }, (_, i) => i + 2);
    } else {
      pages = Array.from({ length: totalPages - currentPage - 1 }, (_, i) => currentPage + 1 + i);
    }
    return (
      <div
        ref={dropdownRef}
        className='absolute flex-col items-center justify-center z-10 bg-white border border-[#E9EAEB] rounded-[8px] shadow-lg p-1 max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bottom-[100%] mb-1'
      >
        {pages.map((page) => (
          <button
            key={page}
            className='block w-full px-3 py-1 text-left text-[14px] rounded-[8px] font-[500] text-[#3D3D3D] hover:bg-[#F7F7F7] hover:cursor-pointer'
            onClick={() => {
              setShowDropdown(null);
              onPageChange(page);
            }}
          >
            {page}
          </button>
        ))}
      </div>
    );
  };

  const pages = getPages();

  return (
    <div className='flex flex-row justify-between items-center gap-2 p-4 w-full'>
      {isLoading ? (
        <>
          <div className='rounded-[16px] bg-[#F7F7F7] w-[7%] h-[40px] animate-pulse' />
          <div className='rounded-full bg-[#F7F7F7] w-[50%] h-[20px] animate-pulse' />
          <div className='rounded-[16px] bg-[#F7F7F7] w-[7%] h-[40px] animate-pulse' />
        </>
      ) : (
        <>
          <button
            data-testid='pagination-previous-button'
            className='flex items-center justify-center p-2 rounded-[16px] border border-[#E9EAEB] disabled:opacity-30 disabled:cursor-not-allowed gap-2 hover:cursor-pointer enabled:hover:bg-[#F7F7F7]'
            disabled={disabled || currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft size={20} />
            {previousArrowLabel && (
              <p className='text-[14px] font-[600] text-[#3D3D3D] m-0'>Previous</p>
            )}
          </button>
          <div className='flex items-center gap-1 relative'>
            {pages.map((page, idx) => {
              if (page === 'left-ellipsis' || page === 'right-ellipsis') {
                const side = page === 'left-ellipsis' ? 'left' : 'right';
                return (
                  <div key={side + idx} className='relative group'>
                    <button
                      data-testid='pagination-button'
                      className='flex items-center justify-center px-3 py-1 rounded-[8px] hover:bg-[#F7F7F7] hover:cursor-pointer disabled:bg-transparent disabled:cursor-not-allowed disabled:border disabled:border-[#EFEFEF] disabled:text-[#EFEFEF] disabled:hover:cursor-not-allowed'
                      disabled={disabled}
                      onClick={() => setShowDropdown(showDropdown === side ? null : side)}
                      type='button'
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {showDropdown === side && renderDropdown(side)}
                  </div>
                );
              }
              return (
                <button
                  data-testid={`pagination-page-${page}`}
                  key={page}
                  className={`px-3 py-1 rounded-[8px] text-[14px] hover:bg-[#F7F7F7] ${
                    currentPage === page
                      ? 'bg-[#F7F7F7] text-[#3D3D3D] font-[600]'
                      : 'font-[500] text-[#656565] hover:cursor-pointer'
                  } disabled:bg-transparent disabled:cursor-not-allowed disabled:border disabled:border-[#EFEFEF] disabled:text-[#EFEFEF]`}
                  disabled={disabled}
                  onClick={() => onPageChange(Number(page))}
                >
                  {page}
                </button>
              );
            })}
            {hasItemsPerPage && (
            <div className="relative">
              <button
                data-testid='pagination-button'
                className='flex items-center justify-center px-3 py-1 rounded-[8px] hover:bg-[#F7F7F7] hover:cursor-pointer disabled:bg-transparent disabled:cursor-not-allowed disabled:border disabled:border-[#EFEFEF] disabled:text-[#EFEFEF] disabled:hover:cursor-not-allowed'
                disabled={disabled}
                onClick={() => setShowItemsPerPageDropdown(!showItemsPerPageDropdown)}
                type='button'
              >
                <span className="text-[14px] font-[500] text-[#3D3D3D] mr-1">{itemsPerPage} per page</span>
                <MoreHorizontal size={16} className='text-[#656565]' />
              </button>
              {showItemsPerPageDropdown && (
                <div
                  ref={itemsPerPageDropdownRef}
                  className='absolute flex-col items-center justify-center z-10 bg-white border border-[#E9EAEB] rounded-[8px] shadow-lg p-1 max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bottom-[100%] mb-1'
                >
                  {itemsPerPageOptions.map((value) => (
                    <button
                      key={value}
                      className='block w-full px-3 py-1 text-left text-[14px] rounded-[8px] font-[500] text-[#3D3D3D] hover:bg-[#F7F7F7] hover:cursor-pointer'
                      onClick={() => {
                        setShowItemsPerPageDropdown(false);
                        onItemsPerPageChange?.(value);
                      }}
                    >
                      {value} per page
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
          <button
            data-testid='pagination-next-button'
            className='flex items-center justify-center p-2 rounded-[16px] border border-[#E9EAEB] disabled:opacity-30 disabled:cursor-not-allowed gap-2 hover:cursor-pointer enabled:hover:bg-[#F7F7F7]'
            disabled={disabled || currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight size={20} />
            {nextArrowLabel && (
              <p className='text-[14px] font-[600] text-[#3D3D3D] m-0'>Next</p>
            )}
          </button>
        </>
      )}
    </div>
  );
};
