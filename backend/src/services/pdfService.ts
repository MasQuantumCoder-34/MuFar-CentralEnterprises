import PDFDocument from 'pdfkit';
import { IOrder, ISettings } from '@mufar-commerce/shared';

const generateInvoicePDF = async (order: IOrder, company: ISettings): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;
      const leftMargin = 50;

      doc.font('Helvetica-Bold').fontSize(20).text(company.companyName || 'Central Enterprises', leftMargin, 50);
      doc.font('Helvetica').fontSize(10).text(company.address || '', leftMargin, 75);
      doc.text(`Phone: ${company.contactNumber || ''}`, leftMargin, 90);
      doc.text(`Email: ${company.email || ''}`, leftMargin, 105);
      if (company.gstNumber) {
        doc.text(`GST: ${company.gstNumber}`, leftMargin, 120);
      }

      doc.font('Helvetica-Bold').fontSize(16).text('INVOICE', leftMargin, 150);

      const invoiceTop = 180;
      doc.font('Helvetica').fontSize(10);
      doc.text(`Invoice Number: ${order.invoiceNumber}`, leftMargin, invoiceTop);
      doc.text(`Order Number: ${order.orderNumber}`, leftMargin, invoiceTop + 15);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, leftMargin, invoiceTop + 30);

      const clientInfoTop = 240;
      const client = typeof order.client === 'object' ? order.client : null;
      doc.font('Helvetica-Bold').fontSize(12).text('Bill To:', leftMargin, clientInfoTop);
      doc.font('Helvetica').fontSize(10);
      doc.text(client ? (client as any).storeName || (client as any).name || '' : '', leftMargin, clientInfoTop + 20);
      doc.text(client ? (client as any).address || '' : '', leftMargin, clientInfoTop + 35);
      doc.text(client ? (client as any).city || '' : '', leftMargin, clientInfoTop + 50);
      doc.text(`Phone: ${order.contactNumber}`, leftMargin, clientInfoTop + 65);

      const tableTop = 340;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.rect(leftMargin, tableTop - 10, pageWidth, 20).fill('#2563eb');
      doc.fillColor('#ffffff')
        .text('#', leftMargin + 5, tableTop - 5)
        .text('Product', leftMargin + 30, tableTop - 5)
        .text('SKU', leftMargin + 200, tableTop - 5)
        .text('Qty', leftMargin + 290, tableTop - 5, { width: 40, align: 'center' })
        .text('Price', leftMargin + 330, tableTop - 5, { width: 70, align: 'right' })
        .text('Total', leftMargin + 420, tableTop - 5, { width: 70, align: 'right' });

      doc.fillColor('#000000');
      let yPos = tableTop + 15;

      order.items.forEach((item, i) => {
        doc.font('Helvetica').fontSize(9);
        doc.text(`${i + 1}`, leftMargin + 5, yPos);
        doc.text(item.productName, leftMargin + 30, yPos, { width: 160 });
        doc.text(item.sku, leftMargin + 200, yPos, { width: 80 });
        doc.text(`${item.quantity}`, leftMargin + 290, yPos, { width: 40, align: 'center' });
        doc.text(`₹${item.price.toFixed(2)}`, leftMargin + 330, yPos, { width: 70, align: 'right' });
        doc.text(`₹${item.total.toFixed(2)}`, leftMargin + 420, yPos, { width: 70, align: 'right' });
        yPos += 20;

        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });

      const totalsTop = Math.max(yPos + 20, 500);
      doc.rect(leftMargin, totalsTop, pageWidth, 1).fill('#000000');

      doc.font('Helvetica').fontSize(10);
      doc.text('Subtotal:', leftMargin + 350, totalsTop + 10, { width: 70, align: 'right' });
      doc.text(`₹${order.subtotal.toFixed(2)}`, leftMargin + 420, totalsTop + 10, { width: 70, align: 'right' });

      doc.text('Discount:', leftMargin + 350, totalsTop + 25, { width: 70, align: 'right' });
      doc.text(`₹${order.discount.toFixed(2)}`, leftMargin + 420, totalsTop + 25, { width: 70, align: 'right' });

      doc.text('Tax (18%):', leftMargin + 350, totalsTop + 40, { width: 70, align: 'right' });
      doc.text(`₹${order.tax.toFixed(2)}`, leftMargin + 420, totalsTop + 40, { width: 70, align: 'right' });

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total:', leftMargin + 350, totalsTop + 60, { width: 70, align: 'right' });
      doc.text(`₹${order.total.toFixed(2)}`, leftMargin + 420, totalsTop + 60, { width: 70, align: 'right' });

      doc.font('Helvetica').fontSize(9).fillColor('#6b7280');
      doc.text(`Payment Terms: Due on receipt`, leftMargin, doc.page.height - 70);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, leftMargin, doc.page.height - 55);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export { generateInvoicePDF };
