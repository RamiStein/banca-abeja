import Papa from 'papaparse';

// Normaliza las transacciones a un formato común
// Formato destino: { date: Date, amount: number, concept: string, category: string, wallet: string }

export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data;
          if (data.length === 0) {
            resolve([]);
            return;
          }

          // Detectar si es Mercado Pago o Pago Fácil según las cabeceras
          const headers = Object.keys(data[0]);
          let normalized = [];

          const isMercadoPago = headers.includes('Operación') && headers.includes('Monto');
          const isPagoFacil = headers.includes('FECHA') && headers.includes('IMPORTE') && headers.includes('CONCEPTO'); // Ejemplo supuesto
          // Nota: Las cabeceras exactas dependen del export actual, usamos algo aproximado para iniciar.

          if (isMercadoPago || (headers.includes('Fecha') && headers.includes('Monto'))) {
            // Lógica Mercado Pago aprox
            normalized = data.map(row => {
              // Convertir monto a número. Ej: "1.500,50" -> 1500.50
              let rawAmount = row['Monto'] || row['Importe'] || '0';
              rawAmount = rawAmount.toString().replace(/\./g, '').replace(',', '.');
              const amount = parseFloat(rawAmount);

              return {
                date: row['Fecha'] || row['Date'] || new Date().toISOString(),
                amount: isNaN(amount) ? 0 : amount,
                concept: row['Operación'] || row['Motivo'] || row['Concepto'] || 'Movimiento',
                category: amount > 0 ? 'Ingreso' : 'Gasto',
                wallet: 'Mercado Pago'
              };
            });
          } else {
            // Asumimos Pago Fácil o genérico
            normalized = data.map(row => {
               // Búsqueda flexible de columnas
               const dateCol = Object.keys(row).find(k => k.toLowerCase().includes('fecha') || k.toLowerCase().includes('date'));
               const amountCol = Object.keys(row).find(k => k.toLowerCase().includes('monto') || k.toLowerCase().includes('importe'));
               const conceptCol = Object.keys(row).find(k => k.toLowerCase().includes('concepto') || k.toLowerCase().includes('descrip') || k.toLowerCase().includes('detalle'));

               let rawAmount = row[amountCol] || '0';
               rawAmount = rawAmount.toString().replace(/\./g, '').replace(',', '.');
               const amount = parseFloat(rawAmount);

               return {
                 date: dateCol ? row[dateCol] : new Date().toISOString(),
                 amount: isNaN(amount) ? 0 : amount,
                 concept: conceptCol ? row[conceptCol] : 'Movimiento PF',
                 category: amount > 0 ? 'Ingreso' : 'Gasto',
                 wallet: 'Pago Fácil'
               };
            });
          }

          resolve(normalized);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
