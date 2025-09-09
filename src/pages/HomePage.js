import React, { useState, useCallback, useMemo } from 'react';

import ErrorBoundary from '../components/ErrorBoundary';
import ErrorFallback from '../components/ErrorFallback';
import Filters from '../components/Filters';
import HouseTable from '../components/HouseTable';
import HeroTypewriter from '../components/HeroTypewriter';

import { useUser } from '../context/UserContext';
import { useNotify } from '../context/NotificationContext';
import { useHouses } from '../context/HouseContext';
import { useFilters } from '../hooks/useFilters';

import {
  measurePerformance,
  logError,
  ERROR_SEVERITY,
} from '../utils/errorHandler';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import PDFExportOptions from '../components/PDFExportOptions';
import ExcelExportOptions from '../components/ExcelExportOptions';

const HomePage = ({ openModal }) => {
  const [expandedHouse, setExpandedHouse] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [showPDFOptions, setShowPDFOptions] = useState(false);
  const [showExcelOptions, setShowExcelOptions] = useState(false);

  // Debug modal state
  console.log('HomePage - showExcelOptions:', showExcelOptions);
  console.log('HomePage - showPDFOptions:', showPDFOptions);

  const { houses, loading, deleteHouse, deleteMember } = useHouses();
  const { isAdmin, isGuest, isAuthenticated } = useUser();
  const {
    filters,
    setFilters,
    filteredHouses,
    resetFilters,
    streets,
    occupations,
  } = useFilters(houses);
  const { notify } = useNotify();

  // Debug data flow
  console.log('HomePage - houses data:', houses?.length || 0);
  console.log('HomePage - filters:', filters);
  console.log('HomePage - filteredHouses:', filteredHouses?.length || 0);

  const memoizedFilteredHouses = useMemo(() => {
    const houses = filteredHouses || [];
    // Sort houses by house number (ascending)
    return houses.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
  }, [filteredHouses]);

  const handleDelete = useCallback(
    async (id, type, houseId = null) => {
      console.log('🔍 handleDelete called with:', { id, type, houseId });

      const confirmed = window.confirm(
        `Are you sure you want to delete this ${type}? This action cannot be undone.`,
      );

      if (!confirmed) {
        console.log('❌ Delete cancelled by user');
        return;
      }

      console.log('✅ Delete confirmed, proceeding...');
      setOperationLoading(true);

      try {
        await measurePerformance(`Delete ${type}`, async () => {
          if (type === 'house') {
            console.log('🗑️ Deleting house with ID:', id);
            await deleteHouse(id);
          } else if (type === 'member') {
            console.log(
              '🗑️ Deleting member with ID:',
              id,
              'from house:',
              houseId,
            );
            await deleteMember(houseId, id);
          }
        });
        console.log('✅ Delete operation completed successfully');
        notify(`Successfully deleted ${type}`, { type: 'success' });
      } catch (error) {
        console.error('❌ Delete operation failed:', error);
        logError(error, `Delete ${type}`, ERROR_SEVERITY.MEDIUM);
        notify(`Failed to delete ${type}. Please try again.`, {
          type: 'error',
        });
      } finally {
        setOperationLoading(false);
      }
    },
    [deleteHouse, deleteMember, notify],
  );

  const handleExportExcel = useCallback(
    async (options = {}) => {
      console.log('Export Excel button clicked');
      console.log('Houses to export:', memoizedFilteredHouses.length);

      setOperationLoading(true);
      try {
        await measurePerformance('Export Excel', async () => {
          exportToExcel(memoizedFilteredHouses, 'masjid-houses', options);
        });
        notify('Excel file exported successfully!', { type: 'success' });
      } catch (error) {
        console.error('Export Excel error in HomePage:', error);
        logError(error, 'Export Excel', ERROR_SEVERITY.MEDIUM);
        notify('Failed to export Excel file. Please try again.', {
          type: 'error',
        });
      } finally {
        setOperationLoading(false);
      }
    },
    [memoizedFilteredHouses, notify],
  );

  const handleExportPDF = useCallback(
    async (options = {}) => {
      console.log('Export PDF button clicked');
      console.log('Houses to export:', memoizedFilteredHouses.length);

      setOperationLoading(true);
      try {
        await measurePerformance('Export PDF', async () => {
          exportToPDF(memoizedFilteredHouses, 'masjid-houses', options);
        });
        notify('PDF file exported successfully!', { type: 'success' });
      } catch (error) {
        console.error('Export PDF error in HomePage:', error);
        logError(error, 'Export PDF', ERROR_SEVERITY.MEDIUM);
        notify('Failed to export PDF file. Please try again.', {
          type: 'error',
        });
      } finally {
        setOperationLoading(false);
      }
    },
    [memoizedFilteredHouses, notify],
  );

  const handlePDFOptionsExport = useCallback(
    (options) => {
      console.log(
        'HomePage - handlePDFOptionsExport called with options:',
        options,
      );
      setShowPDFOptions(false);
      handleExportPDF(options);
    },
    [handleExportPDF],
  );

  const handleExcelOptionsExport = useCallback(
    (options) => {
      console.log(
        'HomePage - handleExcelOptionsExport called with options:',
        options,
      );
      setShowExcelOptions(false);
      handleExportExcel(options);
    },
    [handleExportExcel],
  );

  const handleClearFilters = useCallback(() => {
    resetFilters();
    notify('Filters cleared successfully!', { type: 'success' });
  }, [resetFilters, notify]);

  const canEdit = useCallback(() => {
    if (isGuest) return false;
    if (isAdmin) return true;
    if (!isAuthenticated) return false;
    return true;
  }, [isAdmin, isGuest, isAuthenticated]);

  if (loading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner'></div>
        <p>Loading Houses...</p>
      </div>
    );
  }

  return (
    <>
      <HeroTypewriter />
      <ErrorBoundary fallback={<ErrorFallback componentName='Filters' />}>
        <Filters
          filters={filters}
          onFiltersChange={setFilters}
          onAddHouse={() => openModal('house')}
          onClearAll={handleClearFilters}
          onReset={resetFilters}
          onExportExcel={() => {
            console.log(
              'Excel export button clicked - setting showExcelOptions to true',
            );
            setShowExcelOptions(true);
          }}
          onExportPDF={() => setShowPDFOptions(true)}
          onOpenAnalytics={() => openModal('analytics')}
          streets={streets}
          occupations={occupations}
          isAdmin={isAdmin}
          isGuest={isGuest}
          L={{}}
        />
      </ErrorBoundary>

      <ErrorBoundary fallback={<ErrorFallback componentName='House Table' />}>
        <HouseTable
          houses={memoizedFilteredHouses}
          expandedHouse={expandedHouse}
          setExpandedHouse={setExpandedHouse}
          onEditHouse={(houseId) => {
            const house = memoizedFilteredHouses.find(
              (h) => h._id === houseId || h.id === houseId,
            );
            openModal('house', { mode: 'edit', house });
          }}
          onDeleteHouse={(houseId) => handleDelete(houseId, 'house')}
          onAddMember={(houseId) => {
            const house = memoizedFilteredHouses.find(
              (h) => h._id === houseId || h.id === houseId,
            );
            openModal('member', { mode: 'add', houseId, house });
          }}
          onEditMember={(houseId, memberId) => {
            const house = memoizedFilteredHouses.find(
              (h) => h._id === houseId || h.id === houseId,
            );
            const member = house?.members?.find(
              (m) => m._id === memberId || m.id === memberId,
            );
            openModal('member', {
              mode: 'edit',
              houseId,
              memberId,
              member,
              house,
            });
          }}
          onDeleteMember={(memberId, houseId) =>
            handleDelete(memberId, 'member', houseId)
          }
          isAdmin={isAdmin}
          isGuest={isGuest}
          loading={operationLoading}
          L={{}}
        />
      </ErrorBoundary>

      {memoizedFilteredHouses.length === 0 && !loading && (
        <div className='empty-state'>
          <h3>No houses found</h3>
          <p>Try adjusting your filters or add some houses to get started.</p>
          {canEdit() && (
            <button className='btn-primary' onClick={() => openModal('house')}>
              Add First House
            </button>
          )}
        </div>
      )}

      {showPDFOptions && (
        <PDFExportOptions
          onExport={handlePDFOptionsExport}
          onClose={() => setShowPDFOptions(false)}
        />
      )}

      {showExcelOptions && (
        <ExcelExportOptions
          onExport={handleExcelOptionsExport}
          onClose={() => setShowExcelOptions(false)}
        />
      )}
    </>
  );
};

export default HomePage;
