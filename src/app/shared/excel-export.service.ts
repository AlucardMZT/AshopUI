import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  async exportToExcel(data: any[], headers: string[], fileName: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Datos');

    worksheet.addRow(headers); // Encabezados

    data.forEach(row => {
      worksheet.addRow(Object.values(row));
    });

    // Estilo básico
    worksheet.columns.forEach(col => {
      col.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    FileSaver.saveAs(new Blob([buffer]), `${fileName}.xlsx`);
  }
}
