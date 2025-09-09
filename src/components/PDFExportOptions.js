import React, { useState } from 'react';

const PDFExportOptions = ({ onExport, onClose }) => {
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
    console.log('PDF Export Options - handleExport called');
    console.log('Selected columns:', selectedColumns);

    if (selectedColumns.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    console.log('Calling onExport with options:', { selectedColumns });
    onExport({ selectedColumns });
  };

  return (
    <div className='pdf-export-options'>
      <div className='modal-backdrop'>
        <div className='modal' style={{ maxWidth: 600 }}>
          <div className='modal-header'>
            <h3>📄 PDF Export Options</h3>
            <button className='modal-close-btn' onClick={onClose}>
              ✕
            </button>
          </div>

          <div className='modal-body'>
            <div className='export-info'>
              <p>Select the columns you want to include in your PDF export:</p>
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
              📄 Export PDF
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pdf-export-options {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        .modal-backdrop {
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 15px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 20px;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6b7280;
          padding: 5px;
          border-radius: 5px;
        }

        .modal-close-btn:hover {
          background: #f3f4f6;
        }

        .modal-body {
          padding: 25px;
        }

        .export-info {
          margin-bottom: 20px;
        }

        .export-info p {
          color: #6b7280;
          margin: 0;
        }

        .selection-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .select-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .select-btn:hover {
          background: #e5e7eb;
        }

        .columns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .column-item {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 15px;
          transition: all 0.2s;
        }

        .column-item:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .column-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          gap: 12px;
        }

        .column-checkbox input[type='checkbox'] {
          display: none;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          position: relative;
          flex-shrink: 0;
        }

        .column-checkbox input[type='checkbox']:checked + .checkmark {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .column-checkbox input[type='checkbox']:checked + .checkmark::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .column-info {
          flex: 1;
        }

        .column-label {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .column-description {
          font-size: 12px;
          color: #6b7280;
        }

        .export-summary {
          background: #f8fafc;
          padding: 15px;
          border-radius: 10px;
          border-left: 4px solid #3b82f6;
        }

        .export-summary p {
          margin: 0 0 10px 0;
          color: #374151;
        }

        .warning {
          color: #dc2626 !important;
          font-weight: 500;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding: 20px 25px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-primary {
          background: #3b82f6;
          border: 1px solid #3b82f6;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          border-color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default PDFExportOptions;
