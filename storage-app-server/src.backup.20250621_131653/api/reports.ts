import express, { Request, Response } from 'express';
import { Parser } from 'json2csv';
import { Product, Report } from '../collections';
import auth from '../middleware/auth';

const router = express.Router();

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
    const completedReports = await Report.countDocuments({ status: 'completed' });

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
    const reports = await Report.find(query).populate('technician_id', 'name');
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const report = await Report.findById(req.params.id).populate('technician_id', 'name');
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

    const reportData = {
      date: header.date ? new Date(header.date) : new Date(),
      technician_id: header.author_id,
      status: header.status || 'draft',
      lunch_location: header.lunch_location || '',
      short_description: header.head_description || '',
      activities: activities || []
    };

    const newReport = new Report(reportData);
    const report = await newReport.save();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { header, activities } = req.body;

    const reportData: any = {};
    if (header) {
      if (header.date) reportData.date = new Date(header.date);
      if (header.author_id) reportData.technician_id = header.author_id;
      if (header.status) reportData.status = header.status;
      if (header.lunch_location) reportData.lunch_location = header.lunch_location;
      if (header.head_description) reportData.short_description = header.head_description;
    }
    if (activities) {
      reportData.activities = activities;
    }

    const report = await Report.findByIdAndUpdate(req.params.id, reportData, { new: true });
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
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


export default router;
