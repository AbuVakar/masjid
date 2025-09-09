/**
 * Export Utilities
 * Provides Excel and PDF export functionality for houses and members data
 */

import * as XLSX from 'xlsx';
import { logError, ERROR_SEVERITY } from './errorHandler';

/**
 * Export houses data to Excel
 * @param {Array} houses - Houses data to export
 * @param {string} filename - Optional filename
 * @param {Object} options - Export options including column selection
 */
export const exportToExcel = (
  houses,
  filename = 'houses-data',
  options = {},
) => {
  try {
    // Validate input
    if (!Array.isArray(houses)) {
      throw new Error('Houses data must be an array');
    }

    if (houses.length === 0) {
      throw new Error('No houses data to export');
    }

    // Define all available columns
    const allColumns = [
      { key: 'houseNumber', label: 'House Number', field: 'House Number' },
      { key: 'street', label: 'Street', field: 'Street' },
      { key: 'name', label: 'Member Name', field: 'Member Name' },
      { key: 'fatherName', label: "Father's Name", field: "Father's Name" },
      { key: 'age', label: 'Age', field: 'Age' },
      { key: 'gender', label: 'Gender', field: 'Gender' },
      { key: 'occupation', label: 'Occupation', field: 'Occupation' },
      { key: 'education', label: 'Education', field: 'Education' },
      { key: 'quran', label: 'Quran', field: 'Quran' },
      { key: 'maktab', label: 'Maktab', field: 'Maktab' },
      { key: 'dawat', label: 'Dawat', field: 'Dawat' },
      { key: 'mobile', label: 'Mobile', field: 'Mobile' },
      { key: 'role', label: 'Role', field: 'Role' },
    ];

    // Use selected columns or default to all columns
    const selectedColumns =
      options.selectedColumns || allColumns.map((col) => col.key);
    console.log('Excel Export - Selected columns:', selectedColumns);

    const columns = allColumns.filter((col) =>
      selectedColumns.includes(col.key),
    );
    console.log('Excel Export - Filtered columns:', columns);

    // Helper function to format dawat status with counts (for Excel export)
    const formatDawatStatusForExcel = (member) => {
      if (!member.dawatCounts) {
        return member.dawat || 'Nil';
      }

      const counts = member.dawatCounts;
      const parts = [];

      // Add counts for each dawat type
      if (counts['3-day'] && counts['3-day'] > 0) {
        parts.push(`3d×${counts['3-day']}`);
      }
      if (counts['10-day'] && counts['10-day'] > 0) {
        parts.push(`10d×${counts['10-day']}`);
      }
      if (counts['40-day'] && counts['40-day'] > 0) {
        parts.push(`40d×${counts['40-day']}`);
      }
      if (counts['4-month'] && counts['4-month'] > 0) {
        parts.push(`4m×${counts['4-month']}`);
      }

      // If no counts, return the enum value
      if (parts.length === 0) {
        return member.dawat || 'Nil';
      }

      return parts.join(', ');
    };

    // Prepare data for export
    const exportData = [];

    houses.forEach((house) => {
      // Add member information
      if (house.members && house.members.length > 0) {
        house.members.forEach((member) => {
          const row = {};
          columns.forEach((col) => {
            switch (col.key) {
              case 'houseNumber':
                row[col.field] = house.number || ''; // FIXED: Use 'number' field from database
                break;
              case 'street':
                row[col.field] = house.street || '';
                break;
              case 'name':
                row[col.field] = member.name || '';
                break;
              case 'fatherName':
                row[col.field] = member.fatherName || '';
                break;
              case 'age':
                row[col.field] = member.age || '';
                break;
              case 'gender':
                row[col.field] = member.gender || '';
                break;
              case 'occupation':
                row[col.field] = member.occupation || '';
                break;
              case 'education':
                row[col.field] = member.education || '';
                break;
              case 'quran':
                row[col.field] = member.quran || '';
                break;
              case 'maktab':
                row[col.field] = member.maktab || '';
                break;
              case 'dawat':
                row[col.field] = formatDawatStatusForExcel(member); // FIXED: Show complete dawat status with counts
                break;
              case 'mobile':
                row[col.field] = member.mobile || '';
                break;
              case 'role':
                row[col.field] = member.role || '';
                break;
              default:
                row[col.field] = '';
            }
          });
          exportData.push(row);
        });
      } else {
        // Add house without members
        const row = {};
        columns.forEach((col) => {
          switch (col.key) {
            case 'houseNumber':
              row[col.field] = house.number || ''; // FIXED: Use 'number' field from database
              break;
            case 'street':
              row[col.field] = house.street || '';
              break;
            default:
              row[col.field] = '';
          }
        });
        exportData.push(row);
      }
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Houses Data');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}-${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, finalFilename);

    return true;
  } catch (error) {
    logError(error, 'Export Excel', ERROR_SEVERITY.MEDIUM);
    throw new Error(`Failed to export Excel file: ${error.message}`);
  }
};

/**
 * Export houses data to PDF
 * @param {Array} houses - Houses data to export
 * @param {string} filename - Optional filename
 * @param {Object} options - Export options including column selection
 */
export const exportToPDF = async (
  houses,
  filename = 'houses-data',
  options = {},
) => {
  try {
    // Validate input
    if (!Array.isArray(houses)) {
      throw new Error('Houses data must be an array');
    }

    if (houses.length === 0) {
      throw new Error('No houses data to export');
    }

    console.log('Exporting PDF with houses:', houses.length);
    console.log('Export options:', options);

    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    // Create PDF in landscape mode for A4 paper
    const pdfDoc = new jsPDF('landscape', 'mm', 'a4');
    console.log('PDF document created successfully');

    // A4 landscape dimensions: 297mm x 210mm
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 15;

    // Calculate total members
    const totalMembers = houses.reduce((total, house) => {
      return total + (house.members ? house.members.length : 0);
    }, 0);

    // ===== 6. TITLE AND SUMMARY SECTION =====
    // Masjid Name (big bold, center)
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(28);
    pdfDoc.setTextColor(0, 0, 0);
    pdfDoc.text('Madina Masjid Badarkha', pageWidth / 2, 30, {
      align: 'center',
    });

    // Generated Date/Time only (removed totals from top)
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(12);
    pdfDoc.setTextColor(60, 60, 60);

    const summaryY = 40; // Further reduced from 45 to 40 to reduce space
    const leftAlign = 25;

    // Generated Date/Time
    const now = new Date();
    const dateTime = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    pdfDoc.text(`Generated on: ${dateTime}`, leftAlign, summaryY);

    // Helper function to format dawat status with counts
    const formatDawatStatus = (member) => {
      if (!member.dawatCounts) {
        return member.dawat || 'Nil';
      }

      const counts = member.dawatCounts;
      const parts = [];

      // Add counts for each dawat type
      if (counts['3-day'] && counts['3-day'] > 0) {
        parts.push(`3d×${counts['3-day']}`);
      }
      if (counts['10-day'] && counts['10-day'] > 0) {
        parts.push(`10d×${counts['10-day']}`);
      }
      if (counts['40-day'] && counts['40-day'] > 0) {
        parts.push(`40d×${counts['40-day']}`);
      }
      if (counts['4-month'] && counts['4-month'] > 0) {
        parts.push(`4m×${counts['4-month']}`);
      }

      // If no counts, return the enum value
      if (parts.length === 0) {
        return member.dawat || 'Nil';
      }

      return parts.join(', ');
    };

    // Prepare data for table
    const tableData = [];

    houses.forEach((house) => {
      if (house.members && house.members.length > 0) {
        house.members.forEach((member) => {
          const rowData = {
            houseNumber: house.number || '', // FIXED: Use 'number' field from database
            street: house.street || '',
            name: member.name || '',
            fatherName: member.fatherName || '',
            age: member.age || '',
            gender: member.gender || '',
            occupation: member.occupation || '',
            education: member.education || '',
            quran: member.quran || '',
            maktab: member.maktab || '',
            dawat: formatDawatStatus(member), // FIXED: Show complete dawat status with counts
            mobile: member.mobile || '',
            role: member.role || '',
          };

          tableData.push(rowData);
        });
      } else {
        // Add house without members
        const emptyRow = {
          houseNumber: house.number || '', // FIXED: Use 'number' field from database
          street: house.street || '',
          name: 'No members',
          fatherName: '',
          age: '',
          gender: '',
          occupation: '',
          education: '',
          quran: '',
          maktab: '',
          dawat: '',
          mobile: '',
          role: '',
        };

        tableData.push(emptyRow);
      }
    });

    // ===== 2. FIXED COLUMN WIDTHS =====
    // Fixed column widths with proper spacing to prevent merging: House# (18), Street Name (28), Name (25), Father's Name (30), Age (12), Gender (15), Occupation (25), Education (20), Quran (15), Maktab (15), Dawat (18), Mobile (25), Role (15)
    const tableColumns = [
      { header: 'House #', dataKey: 'houseNumber', width: 18 },
      { header: 'Street Name', dataKey: 'street', width: 28 },
      { header: 'Name', dataKey: 'name', width: 25 },
      { header: "Father's Name", dataKey: 'fatherName', width: 30 },
      { header: 'Age', dataKey: 'age', width: 12 },
      { header: 'Gender', dataKey: 'gender', width: 15 },
      { header: 'Occupation', dataKey: 'occupation', width: 25 },
      { header: 'Education', dataKey: 'education', width: 20 },
      { header: 'Quran', dataKey: 'quran', width: 15 },
      { header: 'Maktab', dataKey: 'maktab', width: 15 },
      { header: 'Dawat', dataKey: 'dawat', width: 18 },
      { header: 'Mobile', dataKey: 'mobile', width: 25 },
      { header: 'Role', dataKey: 'role', width: 15 },
    ];

    // Filter columns based on options
    const selectedColumns =
      options.selectedColumns || tableColumns.map((col) => col.dataKey);
    const filteredColumns = tableColumns.filter((col) =>
      selectedColumns.includes(col.dataKey),
    );

    console.log('Selected columns:', selectedColumns);
    console.log('Filtered columns:', filteredColumns);

    // ===== 1. JSPDF + JSPDF-AUTOTABLE IMPLEMENTATION =====
    // Check if autoTable is available and use it
    if (typeof pdfDoc.autoTable === 'function') {
      // Calculate summary statistics including dawat counts
      const summaryStats = {
        totalMembers: tableData.length,
        totalHouses: houses.length,
        maleCount: tableData.filter((row) => row.gender === 'Male').length,
        femaleCount: tableData.filter((row) => row.gender === 'Female').length,
        headCount: tableData.filter((row) => row.role === 'Head').length,
        memberCount: tableData.filter((row) => row.role === 'Member').length,
        // Calculate dawat statistics
        nilCount: tableData.filter(
          (row) => row.dawat === 'Nil' || row.dawat === '',
        ).length,
        threeDayCount: tableData.reduce((total, row) => {
          if (row.dawat && row.dawat.includes('3d×')) {
            const match = row.dawat.match(/3d×(\d+)/);
            return total + (match ? parseInt(match[1]) : 0);
          }
          return total;
        }, 0),
        tenDayCount: tableData.reduce((total, row) => {
          if (row.dawat && row.dawat.includes('10d×')) {
            const match = row.dawat.match(/10d×(\d+)/);
            return total + (match ? parseInt(match[1]) : 0);
          }
          return total;
        }, 0),
        fortyDayCount: tableData.reduce((total, row) => {
          if (row.dawat && row.dawat.includes('40d×')) {
            const match = row.dawat.match(/40d×(\d+)/);
            return total + (match ? parseInt(match[1]) : 0);
          }
          return total;
        }, 0),
        fourMonthCount: tableData.reduce((total, row) => {
          if (row.dawat && row.dawat.includes('4m×')) {
            const match = row.dawat.match(/4m×(\d+)/);
            return total + (match ? parseInt(match[1]) : 0);
          }
          return total;
        }, 0),
      };

      // Prepare table body data with summary row
      const tableBody = tableData.map((row) =>
        filteredColumns.map((col) => row[col.dataKey] || ''),
      );

      // Add summary row at the bottom (without Heads/Members)
      const summaryRow = filteredColumns.map((col) => {
        switch (col.dataKey) {
          case 'houseNumber':
            return `Total: ${summaryStats.totalHouses} Houses`;
          case 'name':
            return `Total: ${summaryStats.totalMembers} Members`;
          case 'gender':
            return `M: ${summaryStats.maleCount}, F: ${summaryStats.femaleCount}`;
          case 'dawat':
            return `Nil:${summaryStats.nilCount} | 3d:${summaryStats.threeDayCount} | 10d:${summaryStats.tenDayCount} | 40d:${summaryStats.fortyDayCount} | 4m:${summaryStats.fourMonthCount}`;
          default:
            return '';
        }
      });
      tableBody.push(summaryRow);

      // Draw the table first
      pdfDoc.autoTable({
        head: [filteredColumns.map((col) => col.header)],
        body: tableBody,
        startY: 65,
        margin: { left: margin, right: margin, top: 65, bottom: 20 },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4,
          overflow: 'linebreak',
          halign: 'left',
          valign: 'middle',
          lineColor: [120, 120, 120],
          lineWidth: 0.8,
          textColor: [0, 0, 0],
        },
        headStyles: {
          font: 'helvetica',
          fontStyle: 'bold',
          fontSize: 10,
          fillColor: [60, 60, 60],
          textColor: [255, 255, 255],
          halign: 'center',
          valign: 'middle',
          cellPadding: 4,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        didParseCell: (data) => {
          // Style the summary row (last row)
          if (data.row.index === tableBody.length - 1) {
            data.cell.styles.fillColor = [245, 245, 245];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 8;
            data.cell.styles.textColor = [40, 40, 40];
            data.cell.styles.cellPadding = 6;
          }
        },
        columnStyles: {
          'House #': { halign: 'center', cellWidth: 18 },
          'Street Name': { halign: 'left', cellWidth: 28 },
          Name: { halign: 'left', cellWidth: 25 },
          "Father's Name": { halign: 'left', cellWidth: 30 },
          Age: { halign: 'center', cellWidth: 12 },
          Gender: { halign: 'center', cellWidth: 15 },
          Occupation: { halign: 'left', cellWidth: 25 },
          Education: { halign: 'left', cellWidth: 20 },
          Quran: { halign: 'center', cellWidth: 15 },
          Maktab: { halign: 'center', cellWidth: 15 },
          Dawat: { halign: 'left', cellWidth: 18 },
          Mobile: { halign: 'right', cellWidth: 25 },
          Role: { halign: 'center', cellWidth: 15 },
        },
        didDrawPage: (data) => {
          let pageSize = pdfDoc.internal.pageSize;
          let pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
          let pageHeight = pageSize.height
            ? pageSize.height
            : pageSize.getHeight();

          // Add footer with export details
          pdfDoc.setFontSize(7);
          pdfDoc.setTextColor(100, 100, 100);
          const footerText = `Generated on ${dateTime} | Total: ${totalMembers} members from ${houses.length} houses`;
          pdfDoc.text(footerText, margin, pageHeight - 8, { align: 'left' });

          // 👇 Placeholder text (replace later)
          pdfDoc.setFontSize(8);
          pdfDoc.setTextColor(128, 128, 128);
          pdfDoc.text(
            `Page ${data.pageNumber} of {totalPages}`,
            pageWidth - margin,
            pageHeight - 8,
            { align: 'right' },
          );
        },
        pageBreak: 'auto',
      });

      // ✅ Now overwrite footer with correct total pages
      const totalPages = pdfDoc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdfDoc.setPage(i);

        let pageSize = pdfDoc.internal.pageSize;
        let pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        let pageHeight = pageSize.height
          ? pageSize.height
          : pageSize.getHeight();

        pdfDoc.setFontSize(8);
        pdfDoc.setTextColor(128, 128, 128);
        pdfDoc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 8,
          { align: 'right' },
        );
      }
    } else {
      // Fallback: Create a simple table without autoTable
      console.warn('autoTable not available, using fallback method');

      // ===== SUMMARY STATISTICS CALCULATION =====
      // Calculate summary statistics for fallback table including dawat counts
      const summaryStats = {
        totalMembers: tableData.length,
        totalHouses: houses.length,
        maleCount: tableData.filter((row) => row.gender === 'Male').length,
        femaleCount: tableData.filter((row) => row.gender === 'Female').length,
        headCount: tableData.filter((row) => row.role === 'Head').length,
        memberCount: tableData.filter((row) => row.role === 'Member').length,
        // Calculate dawat statistics
        nilCount: tableData.filter(
          (row) => row.dawat === 'Nil' || row.dawat === '',
        ).length,
        threeDayCount: tableData.reduce((total, row) => {
          if (row.dawat && row.dawat.includes('3d×')) {
            const match = row.dawat.match(/3d×(\d+)/);
            return total + (match ? parseInt(match[1]) : 0);
          }
          return total;
        }, 0),
        tenDayCount: tableData.reduce((total, row) => {
          if (row.dawat && row.dawat.includes('10d×')) {
            const match = row.dawat.match(/10d×(\d+)/);
            return total + (match ? parseInt(match[1]) : 0);
          }
          return total;
        }, 0),
        fortyDayCount: tableData.reduce((total, row) => {
          if (row.dawat && row.dawat.includes('40d×')) {
            const match = row.dawat.match(/40d×(\d+)/);
            return total + (match ? parseInt(match[1]) : 0);
          }
          return total;
        }, 0),
        fourMonthCount: tableData.reduce((total, row) => {
          if (row.dawat && row.dawat.includes('4m×')) {
            const match = row.dawat.match(/4m×(\d+)/);
            return total + (match ? parseInt(match[1]) : 0);
          }
          return total;
        }, 0),
      };

      // Create tableBody for fallback method (same as autoTable)
      const tableBody = tableData.map((row) => {
        return filteredColumns.map((col) => {
          switch (col.dataKey) {
            case 'houseNumber':
              return row.houseNumber || '';
            case 'street':
              return row.street || '';
            case 'name':
              return row.name || '';
            case 'fatherName':
              return row.fatherName || '';
            case 'age':
              return row.age || '';
            case 'gender':
              return row.gender || '';
            case 'occupation':
              return row.occupation || '';
            case 'education':
              return row.education || '';
            case 'quran':
              return row.quran || '';
            case 'maktab':
              return row.maktab || '';
            case 'dawat':
              return row.dawat || '';
            case 'mobile':
              return row.mobile || '';
            case 'role':
              return row.role || '';
            default:
              return '';
          }
        });
      });

      // Add summary row for fallback method (without Heads/Members)
      const summaryRow = filteredColumns.map((col) => {
        switch (col.dataKey) {
          case 'houseNumber':
            return `Total: ${summaryStats.totalHouses} Houses`;
          case 'name':
            return `Total: ${summaryStats.totalMembers} Members`;
          case 'gender':
            return `M: ${summaryStats.maleCount}, F: ${summaryStats.femaleCount}`;
          case 'dawat':
            return `Nil:${summaryStats.nilCount} | 3d:${summaryStats.threeDayCount} | 10d:${summaryStats.tenDayCount} | 40d:${summaryStats.fortyDayCount} | 4m:${summaryStats.fourMonthCount}`;
          default:
            return '';
        }
      });
      tableBody.push(summaryRow);

      // ===== 7. PROFESSIONAL FALLBACK TABLE =====
      let yPosition = 65; // Reduced from 75 to 65 to match autoTable and reduce empty space
      const lineHeight = 12; // Optimized for readability

      // Calculate column positions based on fixed widths
      let currentX = margin;
      const columnPositions = filteredColumns.map((col) => {
        const colIndex = tableColumns.findIndex(
          (tc) => tc.dataKey === col.dataKey,
        );
        const width = tableColumns[colIndex].width;
        const position = currentX;
        currentX += width;
        return { position, width };
      });

      // ===== PROFESSIONAL HEADERS =====
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(10);
      pdfDoc.setFillColor(60, 60, 60); // Dark background for headers
      pdfDoc.rect(
        margin,
        yPosition - 4,
        pageWidth - 2 * margin,
        lineHeight,
        'F',
      );

      // Add horizontal line below header
      pdfDoc.setDrawColor(120, 120, 120); // Reduced opacity lines
      pdfDoc.setLineWidth(0.8);
      pdfDoc.line(
        margin,
        yPosition + lineHeight - 2,
        pageWidth - margin,
        yPosition + lineHeight - 2,
      );

      pdfDoc.setTextColor(255, 255, 255);
      filteredColumns.forEach((col, index) => {
        const { position } = columnPositions[index];
        const xPosition = position + 2; // 2px padding
        pdfDoc.text(col.header, xPosition, yPosition);
      });

      yPosition += lineHeight + 2;

      // ===== PROFESSIONAL DATA ROWS =====
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(9);
      tableData.forEach((row, rowIndex) => {
        // Professional alternating row colors
        if (rowIndex % 2 === 0) {
          pdfDoc.setFillColor(248, 248, 248); // Zebra striping
          pdfDoc.rect(
            margin,
            yPosition - 3,
            pageWidth - 2 * margin,
            lineHeight,
            'F',
          );
        }

        pdfDoc.setTextColor(0, 0, 0);
        filteredColumns.forEach((col, index) => {
          const { position, width: colWidth } = columnPositions[index];
          const xPosition = position + 2; // 2px padding
          const cellValue = String(row[col.dataKey] || '');

          // Professional text wrapping - no truncation
          const maxChars = Math.floor(colWidth / 2); // Approximate characters per column width
          if (cellValue.length > maxChars) {
            // Split long text into multiple lines
            const words = cellValue.split(' ');
            let line = '';
            let currentY = yPosition;

            words.forEach((word) => {
              if ((line + word).length > maxChars && line.length > 0) {
                pdfDoc.text(line, xPosition, currentY);
                line = word + ' ';
                currentY += 3; // Line spacing
              } else {
                line += word + ' ';
              }
            });
            if (line.trim()) {
              pdfDoc.text(line, xPosition, currentY);
            }
          } else {
            pdfDoc.text(cellValue, xPosition, yPosition);
          }
        });

        // Add horizontal line below each row
        pdfDoc.setDrawColor(120, 120, 120); // Reduced opacity lines
        pdfDoc.setLineWidth(0.8);
        pdfDoc.line(
          margin,
          yPosition + lineHeight - 2,
          pageWidth - margin,
          yPosition + lineHeight - 2,
        );

        // Add vertical lines between columns
        filteredColumns.forEach((col, index) => {
          const { position } = columnPositions[index];
          if (index > 0) {
            // Don't draw line before first column
            pdfDoc.line(
              position,
              yPosition - 3,
              position,
              yPosition + lineHeight - 2,
            );
          }
        });

        yPosition += lineHeight + 2;

        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          pdfDoc.addPage();
          yPosition = 20;
        }
      });

      // Add extra spacing before summary row to prevent overlap
      yPosition += 8; // Increased from 4 to 8 for more gap

      // ===== SUMMARY ROW =====

      // Add summary row background with better spacing
      pdfDoc.setFillColor(245, 245, 245); // Slightly darker background for better visibility
      pdfDoc.rect(
        margin,
        yPosition - 3,
        pageWidth - 2 * margin,
        lineHeight + 2, // Extra height to prevent overlap
        'F',
      );

      // Add summary row text with better styling
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(8); // Smaller font to prevent overflow
      pdfDoc.setTextColor(40, 40, 40); // Darker text for better contrast

      filteredColumns.forEach((col, index) => {
        const { position } = columnPositions[index];
        const xPosition = position + 2; // 2px padding

        let summaryText = '';
        switch (col.dataKey) {
          case 'houseNumber':
            summaryText = `Total: ${summaryStats.totalHouses} Houses`;
            break;
          case 'name':
            summaryText = `Total: ${summaryStats.totalMembers} Members`;
            break;
          case 'gender':
            summaryText = `M: ${summaryStats.maleCount}, F: ${summaryStats.femaleCount}`;
            break;
          case 'dawat':
            summaryText = `Nil:${summaryStats.nilCount} | 3d:${summaryStats.threeDayCount} | 10d:${summaryStats.tenDayCount} | 40d:${summaryStats.fortyDayCount} | 4m:${summaryStats.fourMonthCount}`;
            break;
          default:
            summaryText = '';
        }

        pdfDoc.text(summaryText, xPosition, yPosition);
      });

      // Add horizontal line below summary row
      pdfDoc.setDrawColor(120, 120, 120);
      pdfDoc.setLineWidth(0.8);
      pdfDoc.line(
        margin,
        yPosition + lineHeight - 2,
        pageWidth - margin,
        yPosition + lineHeight - 2,
      );

      // ===== FOOTER =====
      // Add footer with export details
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(7);
      pdfDoc.setTextColor(100, 100, 100);
      const footerText = `Generated on ${dateTime} | Total: ${totalMembers} members from ${houses.length} houses`;
      pdfDoc.text(footerText, margin, pageHeight - 8, { align: 'left' });

      // Add page number (fallback method shows single page)
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(128, 128, 128);
      pdfDoc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 8, {
        align: 'right',
      });
    }

    // Save the PDF
    pdfDoc.save(`${filename}.pdf`);
    console.log('PDF exported successfully');
  } catch (error) {
    console.error('PDF Export Error:', error);
    logError(error, 'Export PDF', ERROR_SEVERITY.MEDIUM);
    throw new Error(`Failed to export PDF file: ${error.message}`);
  }
};
