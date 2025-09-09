import React, { useState } from 'react';

const ExcelExportOptions = ({ onExport, onClose }) => {
  const [selectedColumns, setSelectedColumns] = useState([
    'houseNumber',
    'street',
    'name',
    'fatherName',
    'age',
    'gender',
    'occupation',
    'education',
    'quran',
    'maktab',
    'dawat',
    'mobile',
    'role',
  ]);

  const allColumns = [
    { key: 'houseNumber', label: 'House #', description: 'House number' },
    { key: 'street', label: 'Street', description: 'Street address' },
    { key: 'name', label: 'Name', description: 'Member name' },
    { key: 'fatherName', label: "Father's Name", description: "Father's name" },
    { key: 'age', label: 'Age', description: 'Member age' },
    { key: 'gender', label: 'Gender', description: 'Member gender' },
    {
      key: 'occupation',
      label: 'Occupation',
      description: 'Member occupation',
    },
    { key: 'education', label: 'Education', description: 'Education level' },
    { key: 'quran', label: 'Quran', description: 'Quran status' },
    { key: 'maktab', label: 'Maktab', description: 'Maktab status' },
    { key: 'dawat', label: 'Dawat', description: 'Dawat information' },
    { key: 'mobile', label: 'Mobile', description: 'Mobile number' },
    { key: 'role', label: 'Role', description: 'Member role' },
  ];

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnKey)) {
        return prev.filter((key) => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedColumns(allColumns.map((col) => col.key));
  };

  const handleSelectNone = () => {
    setSelectedColumns([]);
  };

  const handleExport = () => {
    console.log('Excel Export Options - handleExport called');
    console.log('Selected columns:', selectedColumns);

    if (selectedColumns.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    console.log('Calling onExport with options:', { selectedColumns });
    onExport({ selectedColumns });
  };

  return (
    <div className='excel-export-options'>
      <div className='modal-backdrop'>
        <div className='modal' style={{ maxWidth: 600 }}>
          <div className='modal-header'>
            <h3>📊 Excel Export Options</h3>
            <button className='modal-close-btn' onClick={onClose}>
              ✕
            </button>
          </div>

          <div className='modal-body'>
            <div className='export-info'>
              <p>
                Select the columns you want to include in your Excel export:
              </p>
            </div>

            <div className='column-selection'>
              <div className='selection-controls'>
                <button onClick={handleSelectAll} className='select-btn'>
                  ✅ Select All
                </button>
                <button onClick={handleSelectNone} className='select-btn'>
                  ❌ Select None
                </button>
              </div>

              <div className='columns-grid'>
                {allColumns.map((column) => (
                  <div key={column.key} className='column-item'>
                    <label className='column-checkbox'>
                      <input
                        type='checkbox'
                        checked={selectedColumns.includes(column.key)}
                        onChange={() => handleColumnToggle(column.key)}
                      />
                      <span className='checkmark'></span>
                      <div className='column-info'>
                        <div className='column-label'>{column.label}</div>
                        <div className='column-description'>
                          {column.description}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className='export-summary'>
              <p>
                <strong>Selected Columns:</strong> {selectedColumns.length} of{' '}
                {allColumns.length}
              </p>
              {selectedColumns.length === 0 && (
                <p className='warning'>
                  ⚠️ Please select at least one column to export.
                </p>
              )}
            </div>
          </div>

          <div className='modal-footer'>
            <button onClick={onClose} className='btn-secondary'>
              Cancel
            </button>
            <button
              onClick={handleExport}
              className='btn-primary'
              disabled={selectedColumns.length === 0}
            >
              📊 Export Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelExportOptions;
