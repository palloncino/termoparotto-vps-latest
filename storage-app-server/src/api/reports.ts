import express, { Request, Response } from 'express';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import { Product, Report } from '../collections';
import auth from '../middleware/auth';

const router = express.Router();

// Validation function for material unloading data
function validateMaterialUnloading(task: any): any {
  const validatedTask = { ...task };
  
  // Ensure material_unloading is boolean
  if (typeof task.material_unloading !== 'boolean') {
    validatedTask.material_unloading = false;
  }
  
  // Ensure material_unloading_hours is a valid number
  if (typeof task.material_unloading_hours === 'number' && task.material_unloading_hours >= 0) {
    validatedTask.material_unloading_hours = Math.round((task.material_unloading_hours + Number.EPSILON) * 100) / 100;
  } else {
    validatedTask.material_unloading_hours = 0;
  }
  
  // If material_unloading is false, ensure hours are 0
  if (!validatedTask.material_unloading) {
    validatedTask.material_unloading_hours = 0;
  }
  
  return validatedTask;
}

// router.get('/exports', auth, async (req: Request, res: Response) => {
//   try {
//     const { month, technician, client, worksite } = req.query;

//     const filters: any = {};
//     if (month) {
//       const [year, monthPart] = (month as string).split('-');
//       filters.date = {
//         $gte: new Date(`${year}-${monthPart}-01`),
//         $lte: new Date(`${year}-${monthPart}-31`),
//       };
//     }
//     if (technician) filters.technician_id = technician;
//     if (client) filters['activities.client_id'] = client;
//     if (worksite) filters['activities.worksite_id'] = worksite;

//     // Fetch reports and populate all the way down
//     const reports = await Report.find(filters)
//       .populate('technician_id', 'name')
//       .populate('activities.client_id', 'name')
//       .populate('activities.worksite_id', 'name')
//       .lean();

//     const rows: any[] = [];

//     for (const report of reports) {
//       const reportDate = report.date ? new Date(report.date).toISOString().split('T')[0] : '';
//       const technicianName = (report.technician_id as any).name || '';
//       const lunchLocation = report.lunch_location || '';
//       const shortDescription = report.short_description || '';

//       for (const activity of report.activities) {
//         const clientName = (activity.client_id as any).name || '';
//         const worksiteName = (activity.worksite_id as any).name || '';
//         const travelTimeHours = activity.travel_time_hours || 0;

//         for (const task of activity.tasks) {
//           // Task details
//           const taskDesc = task.task_description || 'NoDesc';
//           const taskHours = task.work_hours || 0;
//           const materialUnloadingHours = task.material_unloading_hours || 0;

//           // Optional: Summarize materials
//           const materialsSummary = task.materials_used && task.materials_used.length > 0
//             ? await Promise.all(task.materials_used.map(async m => {
//                 const product = await Product.findById(m.product_id).lean();
//                 return product ? `${product.codice_articolo}:${m.quantity}` : '';
//               })).then(results => results.filter(Boolean).join('; '))
//             : '';

//           // Optional: Assigned technicians for the task
//           const assignedTechIds = task.assigned_technician_ids || [];
//           const assignedTechCount = assignedTechIds.length; // or populate them if you want names

//           rows.push({
//             date: reportDate,
//             technician: technicianName,
//             client: clientName,
//             worksite: worksiteName,
//             travel_time_hours: travelTimeHours,
//             task_description: taskDesc,
//             task_work_hours: taskHours,
//             material_unloading_hours: materialUnloadingHours,
//             lunch_location: lunchLocation,
//             short_description: shortDescription,
//             assigned_task_technicians_count: assignedTechCount,
//             materials_used: materialsSummary
//           });
//         }
//       }
//     }

//     const csvFields = [
//       { label: 'Data', value: 'date' },
//       { label: 'Tecnico', value: 'technician' },
//       { label: 'Cliente', value: 'client' },
//       { label: 'Cantiere', value: 'worksite' },
//       { label: 'Tempo di viaggio (h)', value: 'travel_time_hours' },
//       { label: 'Task Description', value: 'task_description' },
//       { label: 'Task Work Hours (h)', value: 'task_work_hours' },
//       { label: 'Scarico Materiali (h)', value: 'material_unloading_hours' },
//       { label: 'Luogo di pranzo', value: 'lunch_location' },
//       { label: 'Descrizione breve', value: 'short_description' },
//       { label: 'N. Tecnici Assegnati', value: 'assigned_task_technicians_count' },
//       { label: 'Materiali Usati (item_code)', value: 'materials_used' }
//     ];

//     const json2csvParser = new Parser({ fields: csvFields });
//     const csv = json2csvParser.parse(rows);

//     res.header('Content-Type', 'text/csv');
//     res.attachment('reports.csv');
//     res.send(csv);
//   } catch (error) {
//     console.error('Error generating CSV:', error);
//     res.status(500).send('Server Error');
//   }
// });

router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const completedReports = await Report.countDocuments({
      status: 'completed',
    });

    res.json({
      totalReports,
      pendingReports,
      completedReports,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const query = status ? { status } : {};
    const reports = await Report.find(query)
      .populate('technician_id', 'name')
      .populate('activities.client_id', 'name')
      .populate('activities.worksite_id', 'name');
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('technician_id', 'name')
      .populate('activities.client_id', 'name')
      .populate('activities.worksite_id', 'name')
      .populate('activities.tasks.assigned_technician_ids', 'name')
      .populate('activities.tasks.materials_used.product_id', 'descrizione descrizione_interna unit_of_measure');
    
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { header, activities } = req.body;

    // Clean activities: remove materials with falsy product_id and preserve material unloading data
    const cleanedActivities = (activities || []).map((activity: any) => ({
      ...activity,
      tasks: (activity.tasks || []).map((task: any) => {
        const cleanedTask = {
          ...task,
          materials_used: (task.materials_used || []).filter(
            (m: any) => m.product_id && m.product_id.toString().trim() !== '' && m.product_id !== null
          ),
        };
        
        // Validate and set material unloading fields
        const validatedTask = validateMaterialUnloading(cleanedTask);
        return validatedTask;
      }),
    }));

    const reportData = {
      date: header.date ? new Date(header.date) : new Date(),
      technician_id: header.author_id,
      status: header.status || 'draft',
      lunch_location: header.lunch_location || '',
      activities: cleanedActivities,
      created: new Date(), // Explicitly set creation timestamp
      last_updated: new Date(), // Set initial last_updated timestamp
    };

    const newReport = new Report(reportData);
    const report = await newReport.save();
    res.json(report);
  } catch (err: any) {
    console.error('Error creating report:', err);

    // Handle Mongoose validation errors specifically
    if (err.name === 'ValidationError') {
      const validationErrors: Record<string, string> = {};

      // Extract validation error messages with better formatting
      Object.keys(err.errors).forEach(field => {
        const error = err.errors[field];
        validationErrors[field] = error.message || `${field} is invalid`;
      });

      console.log('Validation errors during report creation:', validationErrors);

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Report validation failed. Please check all required fields.',
        details: validationErrors,
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate Error',
        message: 'A report with similar data already exists',
      });
    }

    // Handle other types of errors
    res.status(500).json({
      error: 'Server Error',
      message: 'An unexpected error occurred while creating the report',
    });
  }
});

router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { header, activities } = req.body;

    const reportData: any = {
      last_updated: new Date(), // Always update the last_updated timestamp
    };
    if (header) {
      if (header.date) reportData.date = new Date(header.date);
      if (header.author_id) reportData.technician_id = header.author_id;
      if (header.status) reportData.status = header.status;
      if (header.lunch_location)
        reportData.lunch_location = header.lunch_location;
    }
    if (activities) {
      // Clean activities: remove materials with falsy product_id and preserve material unloading data
      const cleanedActivities = activities.map((activity: any) => ({
        ...activity,
        tasks: (activity.tasks || []).map((task: any) => {
          const cleanedTask = {
            ...task,
            materials_used: (task.materials_used || []).filter(
              (m: any) => m.product_id && m.product_id.toString().trim() !== '' && m.product_id !== null
            ),
          };
          
          // Validate and set material unloading fields
          const validatedTask = validateMaterialUnloading(cleanedTask);
          return validatedTask;
        }),
      }));
      reportData.activities = cleanedActivities;
    }

    const report = await Report.findByIdAndUpdate(req.params.id, reportData, {
      new: true,
    });
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.json(report);
  } catch (err: any) {
    console.error(err);

    // Handle Mongoose validation errors specifically
    if (err.name === 'ValidationError') {
      const validationErrors: Record<string, string> = {};

      // Extract validation error messages
      Object.keys(err.errors).forEach(field => {
        validationErrors[field] = err.errors[field].message;
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Report validation failed',
        details: validationErrors,
      });
    }

    // Handle other types of errors
    res.status(500).json({
      error: 'Server Error',
      message: 'An unexpected error occurred',
    });
  }
});

router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.json({ msg: 'Report removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// XLSX Export endpoint
router.get('/export/xlsx', auth, async (req: Request, res: Response) => {
  try {
    const { month, technician, client, worksite, reportId } = req.query;

    const filters: any = {};
    
    // If specific report ID(s) are provided, export only those reports
    if (reportId) {
      // Handle both single ID and comma-separated IDs
      const reportIds = typeof reportId === 'string' ? reportId.split(',').map(id => id.trim()) : [reportId];
      if (reportIds.length === 1) {
        filters._id = reportIds[0];
      } else {
        filters._id = { $in: reportIds };
      }
    } else {
      // Apply filters for bulk export
      if (month) {
        const [year, monthPart] = (month as string).split('-');
        filters.date = {
          $gte: new Date(`${year}-${monthPart}-01`),
          $lte: new Date(`${year}-${monthPart}-31`),
        };
      }
      if (technician) filters.technician_id = technician;
      
      // For nested array filtering, we need to use $elemMatch
      if (client || worksite) {
        const activityFilters: any = {};
        if (client) activityFilters.client_id = client;
        if (worksite) activityFilters.worksite_id = worksite;
        filters.activities = { $elemMatch: activityFilters };
      }
    }

    // Debug: Log the filters being applied
    console.log('Export filters:', filters);
    
    // Fetch reports and populate all the way down
    const reports = await Report.find(filters)
      .populate('technician_id', 'name')
      .populate('activities.client_id', 'name')
      .populate('activities.worksite_id', 'name')
      .lean();
    
    console.log(`Found ${reports.length} reports matching filters`);

    if (reports.length === 0) {
      return res.status(404).json({ msg: 'No reports found' });
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reports');

    // Define columns with proper formatting
    worksheet.columns = [
      { header: 'Data', key: 'date', width: 12, style: { numFmt: 'dd/mm/yyyy' } },
      { header: 'Tecnico', key: 'technician', width: 20 },
      { header: 'Cliente', key: 'client', width: 25 },
      { header: 'Cantiere', key: 'worksite', width: 25 },
      { header: 'Tempo di viaggio (h)', key: 'travel_time_hours', width: 18, style: { numFmt: '0.00' } },
      { header: 'Task Description', key: 'task_description', width: 35 },
      { header: 'Task Work Hours (h)', key: 'task_work_hours', width: 18, style: { numFmt: '0.00' } },
      { header: 'Scarico Materiali (h)', key: 'material_unloading_hours', width: 20, style: { numFmt: '0.00' } },
      { header: 'Luogo di pranzo', key: 'lunch_location', width: 25 },
      { header: 'N. Tecnici Assegnati', key: 'assigned_task_technicians_count', width: 18, style: { numFmt: '0' } },
      { header: 'Materiali Usati', key: 'materials_used', width: 50 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Process each report
    for (const report of reports) {
      // Convert date to proper Excel date format
      const reportDate = report.date ? new Date(report.date) : null;
      const technicianName = (report.technician_id as any)?.name || '';
      const lunchLocation = report.lunch_location || '';
      const status = report.status || '';

      for (const activity of report.activities || []) {
        const clientName = (activity.client_id as any)?.name || '';
        const worksiteName = (activity.worksite_id as any)?.name || '';
        // Ensure numeric values are properly formatted
        const travelTimeHours = parseFloat(String(activity.travel_time_hours || 0));

        for (const task of activity.tasks || []) {
          const taskDesc = task.task_description || 'No Description';
          const taskHours = parseFloat(String(task.work_hours || 0));
          const materialUnloadingHours = parseFloat(String(task.material_unloading_hours || 0));

          // Process materials
          let materialsSummary = '';
          if (task.materials_used && task.materials_used.length > 0) {
            const materialPromises = task.materials_used.map(async (m: any) => {
              const product = await Product.findById(m.product_id).lean();
              return product ? `${product.descrizione || product.descrizione_interna || 'Unknown'}: ${m.quantity}` : '';
            });
            const materialResults = await Promise.all(materialPromises);
            materialsSummary = materialResults.filter(Boolean).join('; ');
          }

          // Count assigned technicians
          const assignedTechIds = task.assigned_technician_ids || [];
          const assignedTechCount = assignedTechIds.length;

          // Add row to worksheet with proper data types
          const row = worksheet.addRow({
            date: reportDate,
            technician: technicianName,
            client: clientName,
            worksite: worksiteName,
            travel_time_hours: travelTimeHours,
            task_description: taskDesc,
            task_work_hours: taskHours,
            material_unloading_hours: materialUnloadingHours,
            lunch_location: lunchLocation,
            assigned_task_technicians_count: assignedTechCount,
            materials_used: materialsSummary,
            status: status
          });

          // Apply cell formatting for better Excel compatibility
          if (reportDate) {
            row.getCell('date').numFmt = 'dd/mm/yyyy';
          }
          row.getCell('travel_time_hours').numFmt = '0.00';
          row.getCell('task_work_hours').numFmt = '0.00';
          row.getCell('material_unloading_hours').numFmt = '0.00';
          row.getCell('assigned_task_technicians_count').numFmt = '0';
          
          // Enable text wrapping for long text fields
          row.getCell('task_description').alignment = { wrapText: true, vertical: 'top' };
          row.getCell('materials_used').alignment = { wrapText: true, vertical: 'top' };
        }
      }
    }

    // Auto-fit columns with better sizing
    worksheet.columns.forEach(column => {
      if (column.key) {
        let maxLength = column.header?.length || 0;
        
        // Calculate max content length more accurately
        worksheet.getColumn(column.key).eachCell((cell, rowNumber) => {
          if (rowNumber > 1) { // Skip header row
            const cellValue = cell.value;
            if (cellValue) {
              let cellLength = 0;
              if (cellValue instanceof Date) {
                cellLength = 10; // Date format length
              } else if (typeof cellValue === 'number') {
                cellLength = cellValue.toString().length + 2; // Add space for decimals
              } else {
                cellLength = cellValue.toString().length;
              }
              maxLength = Math.max(maxLength, cellLength);
            }
          }
        });
        
        // Set column width with reasonable limits
        column.width = Math.min(Math.max(maxLength + 2, 10), 60);
      }
    });

    // Add borders and additional formatting
    const borderStyle = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    };

    // Apply borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = borderStyle;
        if (rowNumber === 1) {
          // Header row styling
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          // Data row styling
          cell.alignment = { vertical: 'top' };
        }
      });
    });

    // Set response headers for download
    let filename = '';
    if (reportId) {
      // Handle filename for single or multiple reports
      const reportIds = typeof reportId === 'string' ? reportId.split(',').map(id => id.trim()) : [reportId];
      if (reportIds.length === 1) {
        filename = `report-${reportIds[0]}.xlsx`;
      } else {
        filename = `reports-${reportIds.length}-selected-${new Date().toISOString().split('T')[0]}.xlsx`;
      }
    } else {
      filename = `reports-${new Date().toISOString().split('T')[0]}`;
      
      // Add filter information to filename if filters are applied
      const filterParts = [];
      if (month) filterParts.push(`month-${month}`);
      if (technician) filterParts.push('technician-filtered');
      if (client) filterParts.push('client-filtered');
      if (worksite) filterParts.push('worksite-filtered');
      
      if (filterParts.length > 0) {
        filename += `-${filterParts.join('-')}`;
      }
      filename += '.xlsx';
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    // Stream workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating XLSX:', error);
    res.status(500).json({ error: 'Failed to export XLSX' });
  }
});

// Monthly Users Export endpoint
router.get('/export/monthly-users', auth, async (req: Request, res: Response) => {
  try {
    const { month, technician } = req.query;
    
    if (!month) {
      return res.status(400).json({ error: 'Month parameter is required (YYYY-MM format)' });
    }

    const [year, monthPart] = (month as string).split('-');
    if (!year || !monthPart) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Calculate month boundaries
    const startDate = new Date(`${year}-${monthPart}-01`);
    const endDate = new Date(`${year}-${monthPart}-31`);
    
    // Get the number of days in the month
    const daysInMonth = new Date(parseInt(year), parseInt(monthPart), 0).getDate();

    // Build filters
    const filters: any = {
      date: {
        $gte: startDate,
        $lte: endDate,
      }
    };
    
    if (technician) {
      filters.technician_id = technician;
    }

    // Fetch reports for the month
    const reports = await Report.find(filters)
      .populate('technician_id', 'name')
      .lean();

    if (reports.length === 0) {
      return res.status(404).json({ msg: 'No reports found for the specified month' });
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly Users Export');

    // Create dynamic columns: User info + one column per day
    const columns = [
      { header: 'Nome Autore (Operatore)', key: 'technician_name', width: 25 },
      { header: 'Data Report', key: 'report_date', width: 15 },
      { header: 'Luogo Pranzo', key: 'lunch_location', width: 20 },
      { header: 'Tempo Viaggio (OV2)', key: 'travel_time', width: 20 },
      { header: 'Ore Ordinarie di Lavoro', key: 'work_hours', width: 25 }
    ];

    // Add day columns dynamically
    for (let day = 1; day <= daysInMonth; day++) {
      columns.push({
        header: day.toString(),
        key: `day_${day}`,
        width: 8
      });
    }

    worksheet.columns = columns;

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Group reports by technician and date
    const technicianData = new Map();

    for (const report of reports) {
      const technicianId = report.technician_id?._id?.toString();
      const technicianName = (report.technician_id as any)?.name || 'Unknown';
      const reportDate = new Date(report.date);
      const dayOfMonth = reportDate.getDate();
      
      if (!technicianData.has(technicianId)) {
        technicianData.set(technicianId, {
          technician_name: technicianName,
          report_date: report.date ? new Date(report.date).toISOString().split('T')[0] : '',
          lunch_location: report.lunch_location || '',
          travel_time: 0,
          work_hours: 0,
          daily_hours: new Array(daysInMonth).fill(0)
        });
      }

      const techData = technicianData.get(technicianId);
      
      // Calculate total hours for this report
      let totalWorkHours = 0;
      let totalTravelHours = 0;

      for (const activity of report.activities || []) {
        totalTravelHours += activity.travel_time_hours || 0;
        
        for (const task of activity.tasks || []) {
          totalWorkHours += task.work_hours || 0;
        }
      }

      // Add to daily hours (day is 1-indexed, array is 0-indexed)
      techData.daily_hours[dayOfMonth - 1] += totalWorkHours + totalTravelHours;
      techData.travel_time += totalTravelHours;
      techData.work_hours += totalWorkHours;
    }

    // Add rows to worksheet
    for (const techData of technicianData.values()) {
      const rowData: any = {
        technician_name: techData.technician_name,
        report_date: techData.report_date,
        lunch_location: techData.lunch_location,
        travel_time: techData.travel_time.toFixed(2),
        work_hours: techData.work_hours.toFixed(2)
      };

      // Add daily hours
      for (let day = 1; day <= daysInMonth; day++) {
        rowData[`day_${day}`] = techData.daily_hours[day - 1].toFixed(2);
      }

      worksheet.addRow(rowData);
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.key) {
        const maxLength = Math.max(
          column.header?.length || 0,
          ...worksheet.getColumn(column.key).values.map((v: any) => 
            v ? v.toString().length : 0
          )
        );
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    // Generate filename
    const monthName = new Date(startDate).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    const filename = `export-utenti-mensile-${monthName.replace(' ', '-')}.xlsx`;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    // Stream workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Monthly Users Export:', error);
    res.status(500).json({ error: 'Failed to export Monthly Users data' });
  }
});

// Labor Export endpoint
router.get('/export/labor', auth, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, client, worksite } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date parameters are required (YYYY-MM-DD format)' });
    }

    // Build filters
    const filters: any = {
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      }
    };
    
    if (client) {
      filters['activities.client_id'] = client;
    }
    
    if (worksite) {
      filters['activities.worksite_id'] = worksite;
    }

    // Fetch reports for the date range
    const reports = await Report.find(filters)
      .populate('technician_id', 'name hourly_cost')
      .populate('activities.client_id', 'name')
      .populate('activities.worksite_id', 'name')
      .lean();

    if (reports.length === 0) {
      return res.status(404).json({ msg: 'No reports found for the specified date range' });
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Labor Export');

    // Define columns
    worksheet.columns = [
      { header: 'Nome Cantiere', key: 'worksite_name', width: 25 },
      { header: 'Nome Cliente', key: 'client_name', width: 25 },
      { header: 'Ore di Lavoro', key: 'total_hours', width: 15 },
      { header: 'Manodopera', key: 'labor_costs', width: 20 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Group data by worksite and client
    const worksiteData = new Map();

    for (const report of reports) {
      const technicianId = report.technician_id?._id?.toString();
      const technicianName = (report.technician_id as any)?.name || 'Unknown';
      const hourlyCost = (report.technician_id as any)?.hourly_cost || 0;

      for (const activity of report.activities || []) {
        const clientId = activity.client_id?._id?.toString();
        const worksiteId = activity.worksite_id?._id?.toString();
        const clientName = (activity.client_id as any)?.name || 'Unknown';
        const worksiteName = (activity.worksite_id as any)?.name || 'Unknown';
        
        const key = `${worksiteId}-${clientId}`;
        
        if (!worksiteData.has(key)) {
          worksiteData.set(key, {
            worksite_name: worksiteName,
            client_name: clientName,
            technicians: new Map(),
            total_hours: 0
          });
        }

        const wsData = worksiteData.get(key);
        
        // Calculate hours for this activity
        let activityHours = 0;
        for (const task of activity.tasks || []) {
          activityHours += task.work_hours || 0;
        }
        
        // Add to technician's hours
        if (!wsData.technicians.has(technicianId)) {
          wsData.technicians.set(technicianId, {
            name: technicianName,
            hours: 0,
            hourly_cost: hourlyCost
          });
        }
        
        wsData.technicians.get(technicianId).hours += activityHours;
        wsData.total_hours += activityHours;
      }
    }

    // Add rows to worksheet
    for (const wsData of worksiteData.values()) {
      // Calculate labor costs for each technician
      let laborCostsText = '';
      let totalLaborCost = 0;
      
      for (const techData of wsData.technicians.values()) {
        const techCost = techData.hours * techData.hourly_cost;
        totalLaborCost += techCost;
        
        if (laborCostsText) laborCostsText += '\n';
        laborCostsText += `${techData.name}: ${techData.hours.toFixed(2)}h × €${techData.hourly_cost.toFixed(2)} = €${techCost.toFixed(2)}`;
      }

      worksheet.addRow({
        worksite_name: wsData.worksite_name,
        client_name: wsData.client_name,
        total_hours: wsData.total_hours.toFixed(2),
        labor_costs: laborCostsText
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.key) {
        const maxLength = Math.max(
          column.header?.length || 0,
          ...worksheet.getColumn(column.key).values.map((v: any) => 
            v ? v.toString().length : 0
          )
        );
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    // Generate filename
    const startDateStr = new Date(startDate as string).toISOString().split('T')[0];
    const endDateStr = new Date(endDate as string).toISOString().split('T')[0];
    const filename = `export-manodopera-${startDateStr}-to-${endDateStr}.xlsx`;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    // Stream workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Labor Export:', error);
    res.status(500).json({ error: 'Failed to export Labor data' });
  }
});

export default router;
