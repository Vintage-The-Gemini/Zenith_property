// frontend/src/utils/tenantStatementGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateTenantStatementPDF = (tenant, payments, expenses, property, dateRange) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const centerX = pageWidth / 2;

  // Add company header with professional styling
  doc.setFillColor(71, 85, 105); // Dark blue header
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TENANT STATEMENT', centerX, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Property Management System', centerX, 35, { align: 'center' });
  
  // Reset text color to black
  doc.setTextColor(0, 0, 0);
  
  // Add decorative line
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.5);
  doc.line(margin, 55, pageWidth - margin, 55);

  // Property and Tenant Info in better layout
  let yPos = 70;
  
  // Property details section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PROPERTY INFORMATION', margin, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Property details in a clean layout
  const propertyInfo = [
    ['Property Name:', property.name || 'N/A'],
    ['Property Type:', property.type || 'N/A']
  ];
  
  // Handle address object or string
  const address = typeof property.address === 'object' 
    ? `${property.address.street || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zipCode || ''}`.trim().replace(/^,\s*/, '') 
    : property.address || 'N/A';
  
  propertyInfo.push(['Address:', address]);
  
  propertyInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 35, yPos);
    yPos += 7;
  });
  
  yPos += 10;
  
  // Tenant details section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TENANT INFORMATION', margin, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const tenantInfo = [
    ['Tenant Name:', `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'N/A'],
    ['Unit Number:', tenant.unitId?.unitNumber || 'N/A'],
    ['Email:', tenant.email || 'N/A'],
    ['Phone:', tenant.phone || 'N/A']
  ];
  
  tenantInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 35, yPos);
    yPos += 7;
  });
  
  yPos += 10;

  // Statement Period section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('STATEMENT PERIOD', margin, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const periodInfo = [
    ['From:', dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString() : 'All Time'],
    ['To:', dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString() : 'Present'],
    ['Generated:', new Date().toLocaleDateString()]
  ];
  
  periodInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 35, yPos);
    yPos += 7;
  });
  
  yPos += 15;

  // Account Summary with improved styling
  const totalCharges = payments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
  const totalPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const currentBalance = tenant.currentBalance || 0;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('ACCOUNT SUMMARY', margin, yPos);
  yPos += 5;
  
  // Add underline for section
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + 60, yPos);
  yPos += 10;
  
  // Summary table with better styling
  const summaryData = [
    ['Total Charges', `KES ${totalCharges.toLocaleString()}`],
    ['Total Payments', `KES ${totalPayments.toLocaleString()}`],
    ['Current Balance', `KES ${Math.abs(currentBalance).toLocaleString()} ${currentBalance < 0 ? '(Credit)' : '(Outstanding)'}`]
  ];

  try {
    doc.autoTable({
      startY: yPos,
      head: [['Description', 'Amount']],
      body: summaryData,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: { 
        fillColor: [71, 85, 105], 
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold', textColor: [0, 100, 0] }
      },
      alternateRowStyles: { fillColor: [245, 248, 250] }
    });
    yPos = doc.lastAutoTable.finalY + 20;
  } catch (error) {
    console.error('autoTable error:', error);
    // Fallback to manual table creation
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, yPos);
    doc.text('Amount', pageWidth - 80, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    summaryData.forEach(([desc, amount]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(desc, margin, yPos);
      doc.text(amount, pageWidth - 80, yPos);
      yPos += 8;
    });
    yPos += 10;
  }

  // Payment History with professional styling
  if (payments && payments.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('PAYMENT HISTORY', margin, yPos);
    yPos += 5;
    
    // Add underline for section
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, margin + 60, yPos);
    yPos += 15;

    const paymentData = payments.map(payment => [
      payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A',
      payment.type || 'Rent',
      payment.reference || 'N/A',
      `KES ${(payment.amountDue || 0).toLocaleString()}`,
      `KES ${(payment.amountPaid || 0).toLocaleString()}`,
      payment.status || 'Unknown',
      payment.paymentMethod || 'N/A'
    ]);

    try {
      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Type', 'Reference', 'Amount Due', 'Amount Paid', 'Status', 'Method']],
        body: paymentData,
        margin: { left: margin, right: margin },
        theme: 'striped',
        headStyles: { 
          fillColor: [71, 85, 105], 
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 18 },
          2: { cellWidth: 25 },
          3: { halign: 'right', cellWidth: 25 },
          4: { halign: 'right', cellWidth: 25 },
          5: { halign: 'center', cellWidth: 20 },
          6: { cellWidth: 20 }
        },
        alternateRowStyles: { fillColor: [245, 248, 250] }
      });
      yPos = doc.lastAutoTable.finalY + 20;
    } catch (error) {
      console.error('Payment history autoTable error:', error);
      // Fallback to manual table for payments
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Date | Type | Reference | Amount Due | Amount Paid | Status | Method', margin, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      paymentData.forEach(payment => {
        doc.text(payment.join(' | '), margin, yPos);
        yPos += 7;
      });
      yPos += 20;
    }
  } else {
    // No payments message
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('PAYMENT HISTORY', margin, yPos);
    yPos += 20;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('No payment records found for the selected period.', margin, yPos);
    yPos += 20;
  }

  // Property-related expenses (if any)
  const tenantExpenses = expenses.filter(exp => 
    exp.unit && exp.unit._id === tenant.unitId?._id
  );

  if (tenantExpenses && tenantExpenses.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('UNIT-RELATED EXPENSES', margin, yPos);
    yPos += 5;
    
    // Add underline for section
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, margin + 70, yPos);
    yPos += 15;

    const expenseData = tenantExpenses.map(expense => [
      expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A',
      expense.category === 'custom' ? (expense.customCategory || 'Custom') : (expense.category || 'General'),
      expense.description || 'No description',
      `KES ${(expense.amount || 0).toLocaleString()}`,
      expense.paymentStatus || 'Unknown'
    ]);

    try {
      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Category', 'Description', 'Amount', 'Status']],
        body: expenseData,
        margin: { left: margin, right: margin },
        theme: 'striped',
        headStyles: { 
          fillColor: [71, 85, 105], 
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 50 },
          3: { halign: 'right', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 20 }
        },
        alternateRowStyles: { fillColor: [245, 248, 250] }
      });
      yPos = doc.lastAutoTable.finalY + 20;
    } catch (error) {
      console.error('Expenses autoTable error:', error);
      // Fallback to simple text
      expenseData.forEach(expense => {
        doc.setFontSize(8);
        doc.text(expense.join(' | '), margin, yPos);
        yPos += 7;
      });
      yPos += 20;
    }
  }

  // Professional Footer with notes
  // Check if we need a new page for footer
  if (yPos > pageHeight - 120) {
    doc.addPage();
    yPos = 30;
  }

  // Important Notes Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('IMPORTANT NOTES', margin, yPos);
  yPos += 5;
  
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + 65, yPos);
  yPos += 15;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const notes = [
    '• This statement reflects your account status as of the generation date.',
    '• Please contact the property management office if you have any questions.',
    '• Payment methods accepted: Bank Transfer, Cash, Check, Mobile Money.',
    '• Late payment fees may apply for overdue balances.',
    '• Keep this statement for your records.'
  ];

  notes.forEach(note => {
    doc.text(note, margin, yPos);
    yPos += 7;
  });

  yPos += 10;

  // Contact Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CONTACT INFORMATION', margin, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const contactInfo = [
    ['Office:', 'Property Management Office'],
    ['Email:', 'info@propertymanagement.com'],
    ['Phone:', '+254 XXX XXX XXX'],
    ['Hours:', 'Monday - Friday, 8:00 AM - 6:00 PM']
  ];
  
  contactInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 25, yPos);
    yPos += 7;
  });

  // Add professional footer at bottom of last page
  const finalYPos = pageHeight - 30;
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.5);
  doc.line(margin, finalYPos, pageWidth - margin, finalYPos);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('This document was generated electronically and is valid without signature.', centerX, finalYPos + 10, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, centerX, finalYPos + 17, { align: 'center' });

  // Generate filename
  const periodText = dateRange.startDate && dateRange.endDate 
    ? `${new Date(dateRange.startDate).toISOString().split('T')[0]}_to_${new Date(dateRange.endDate).toISOString().split('T')[0]}`
    : 'all_time';
  
  const fileName = `${tenant.firstName}_${tenant.lastName}_statement_${periodText}.pdf`;

  // Save the PDF
  doc.save(fileName);
};

export const generateTenantStatementCSV = (tenant, payments, expenses, property, dateRange) => {
  const csvData = [];
  
  // Header information
  csvData.push(['TENANT STATEMENT']);
  csvData.push([]);
  csvData.push(['Property:', property.name || 'N/A']);
  
  // Handle address object or string
  const address = typeof property.address === 'object' 
    ? `${property.address.street || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zipCode || ''}` 
    : property.address || 'N/A';
  const cityState = typeof property.address === 'object'
    ? `${property.address.city || ''}, ${property.address.state || ''}`
    : `${property.city || ''}, ${property.state || ''}`;
  
  csvData.push(['Property Address:', address]);
  csvData.push(['City, State:', cityState]);
  csvData.push(['Tenant:', `${tenant.firstName} ${tenant.lastName}`]);
  csvData.push(['Unit:', tenant.unitId?.unitNumber || 'N/A']);
  csvData.push(['Email:', tenant.email || 'N/A']);
  csvData.push(['Phone:', tenant.phone || 'N/A']);
  csvData.push(['Statement Period:', 
    `${dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString() : 'All Time'} - ${dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString() : 'Present'}`
  ]);
  csvData.push(['Generated:', new Date().toLocaleDateString()]);
  csvData.push([]);

  // Account Summary
  const totalCharges = payments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
  const totalPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const currentBalance = tenant.currentBalance || 0;

  csvData.push(['ACCOUNT SUMMARY']);
  csvData.push(['Description', 'Amount']);
  csvData.push(['Total Charges', `KES ${totalCharges.toLocaleString()}`]);
  csvData.push(['Total Payments', `KES ${totalPayments.toLocaleString()}`]);
  csvData.push(['Current Balance', `KES ${Math.abs(currentBalance).toLocaleString()} ${currentBalance < 0 ? '(Credit)' : '(Outstanding)'}`]);
  csvData.push([]);

  // Payment History
  if (payments && payments.length > 0) {
    csvData.push(['PAYMENT HISTORY']);
    csvData.push(['Date', 'Type', 'Reference', 'Amount Due', 'Amount Paid', 'Status', 'Payment Method', 'Due Date', 'Late Fee', 'Notes']);
    
    payments.forEach(payment => {
      csvData.push([
        payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A',
        payment.type || 'Rent',
        payment.reference || '',
        `KES ${(payment.amountDue || 0).toLocaleString()}`,
        `KES ${(payment.amountPaid || 0).toLocaleString()}`,
        payment.status || 'Unknown',
        payment.paymentMethod || 'N/A',
        payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A',
        `KES ${(payment.lateFee || 0).toLocaleString()}`,
        payment.notes || ''
      ]);
    });
    csvData.push([]);
  } else {
    csvData.push(['PAYMENT HISTORY']);
    csvData.push(['No payment transactions found for the selected period']);
    csvData.push([]);
  }

  // Unit-related expenses
  const tenantExpenses = expenses.filter(exp => 
    exp.unit && exp.unit._id === tenant.unitId?._id
  );

  if (tenantExpenses && tenantExpenses.length > 0) {
    csvData.push(['UNIT-RELATED EXPENSES']);
    csvData.push(['Date', 'Category', 'Description', 'Amount', 'Status', 'Vendor', 'Invoice Number']);
    
    tenantExpenses.forEach(expense => {
      csvData.push([
        expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A',
        expense.category === 'custom' ? (expense.customCategory || 'Custom') : (expense.category || 'General'),
        expense.description || 'No description',
        `KES ${(expense.amount || 0).toLocaleString()}`,
        expense.paymentStatus || 'Unknown',
        expense.vendor?.name || 'N/A',
        expense.vendor?.invoiceNumber || 'N/A'
      ]);
    });
    csvData.push([]);
  } else {
    csvData.push(['UNIT-RELATED EXPENSES']);
    csvData.push(['No unit-related expenses found for the selected period']);
    csvData.push([]);
  }

  // Important Notes
  csvData.push(['IMPORTANT NOTES']);
  csvData.push(['• This statement reflects your account status as of the generation date']);
  csvData.push(['• Please contact the property management office if you have any questions']);
  csvData.push(['• Payment methods accepted: Bank Transfer, Cash, Check, Mobile Money']);
  csvData.push(['• Late payment fees may apply for overdue balances']);
  csvData.push(['• Keep this statement for your records']);
  csvData.push([]);

  // Contact Information
  csvData.push(['CONTACT INFORMATION']);
  csvData.push(['Property Management Office']);
  csvData.push(['Email: info@propertymanagement.com']);
  csvData.push(['Phone: +254 XXX XXX XXX']);

  return csvData;
};