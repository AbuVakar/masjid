/**
 * Export Utilities
 * Provides Excel and PDF export functionality for houses and members data
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { logError, ERROR_SEVERITY } from './errorHandler';

// jspdf-autotable is imported as side effect to extend jsPDF prototype

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
                row[col.field] = house.houseNumber || '';
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
                row[col.field] = member.dawat || '';
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
              row[col.field] = house.houseNumber || '';
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
export const exportToPDF = (houses, filename = 'houses-data', options = {}) => {
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

    // Check if jsPDF is available
    if (typeof jsPDF !== 'function') {
      throw new Error('jsPDF library is not available');
    }

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

    // Add main title
    pdfDoc.setFontSize(20);
    pdfDoc.setFont(undefined, 'bold');
    pdfDoc.setTextColor(68, 114, 196);
    pdfDoc.text('Madina Masjid Badarkha', pageWidth / 2, 25, {
      align: 'center',
    });

    // Add subtitle
    pdfDoc.setFontSize(14);
    pdfDoc.setFont(undefined, 'normal');
    pdfDoc.setTextColor(0, 0, 0);
    pdfDoc.text('Houses & Members Report', pageWidth / 2, 35, {
      align: 'center',
    });

    // Add statistics section
    pdfDoc.setFontSize(12);
    pdfDoc.setFont(undefined, 'bold');
    pdfDoc.setTextColor(0, 0, 0);

    const statsY = 50;
    pdfDoc.text(`Total Houses: ${houses.length}`, margin, statsY);
    pdfDoc.text(`Total Members: ${totalMembers}`, margin + 80, statsY);

    // Add generation date and time
    const now = new Date();
    const dateTime =
      now.toLocaleDateString() + ' at ' + now.toLocaleTimeString();
    pdfDoc.text(`Generated: ${dateTime}`, margin + 160, statsY);

    // Prepare data for table
    const tableData = [];

    houses.forEach((house) => {
      if (house.members && house.members.length > 0) {
        house.members.forEach((member) => {
          tableData.push({
            houseNumber: house.houseNumber || '',
            street: house.street || '',
            name: member.name || '',
            fatherName: member.fatherName || '',
            age: member.age || '',
            gender: member.gender || '',
            occupation: member.occupation || '',
            education: member.education || '',
            quran: member.quran || '',
            maktab: member.maktab || '',
            dawat: member.dawat || '',
            mobile: member.mobile || '',
            role: member.role || '',
          });
        });
      } else {
        // Add house without members
        tableData.push({
          houseNumber: house.houseNumber || '',
          street: house.street || '',
          name: '',
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
        });
      }
    });

    // Define table columns with better spacing
    const tableColumns = [
      { header: 'House #', dataKey: 'houseNumber', width: 20 },
      { header: 'Street', dataKey: 'street', width: 35 },
      { header: 'Name', dataKey: 'name', width: 30 },
      { header: "Father's Name", dataKey: 'fatherName', width: 25 },
      { header: 'Age', dataKey: 'age', width: 12 },
      { header: 'Gender', dataKey: 'gender', width: 15 },
      { header: 'Occupation', dataKey: 'occupation', width: 25 },
      { header: 'Education', dataKey: 'education', width: 22 },
      { header: 'Quran', dataKey: 'quran', width: 12 },
      { header: 'Maktab', dataKey: 'maktab', width: 15 },
      { header: 'Dawat', dataKey: 'dawat', width: 30 },
      { header: 'Mobile', dataKey: 'mobile', width: 20 },
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

    // Create table using jsPDF autoTable
    pdfDoc.autoTable({
      head: [filteredColumns.map((col) => col.header)],
      body: tableData.map((row) =>
        filteredColumns.map((col) => row[col.dataKey] || ''),
      ),
      startY: 65,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [68, 114, 196],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        'House #': { halign: 'center', cellWidth: 20 },
        Age: { halign: 'center', cellWidth: 12 },
        Gender: { halign: 'center', cellWidth: 15 },
        Quran: { halign: 'center', cellWidth: 12 },
        Maktab: { halign: 'center', cellWidth: 15 },
        Role: { halign: 'center', cellWidth: 15 },
      },
      didDrawPage: (data) => {
        // Add page number
        pdfDoc.setFontSize(8);
        pdfDoc.setTextColor(128, 128, 128);
        pdfDoc.text(
          `Page ${data.pageNumber}`,
          pageWidth - margin,
          pageHeight - 5,
          { align: 'right' },
        );
      },
    });

    // Save the PDF
    pdfDoc.save(`${filename}.pdf`);
    console.log('PDF exported successfully');
  } catch (error) {
    console.error('PDF Export Error:', error);
    logError(error, 'Export PDF', ERROR_SEVERITY.MEDIUM);
    throw new Error(`Failed to export PDF file: ${error.message}`);
  }
};
