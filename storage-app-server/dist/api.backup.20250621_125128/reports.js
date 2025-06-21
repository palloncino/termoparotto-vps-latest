"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const collections_1 = require("../collections");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
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
router.get('/stats', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalReports = yield collections_1.Report.countDocuments();
        const pendingReports = yield collections_1.Report.countDocuments({ status: 'pending' });
        const completedReports = yield collections_1.Report.countDocuments({ status: 'completed' });
        res.json({
            totalReports,
            pendingReports,
            completedReports,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
router.get('/', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = req.query.status;
        const query = status ? { status } : {};
        const reports = yield collections_1.Report.find(query).populate('technician_id', 'name');
        res.json(reports);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
router.get('/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const report = yield collections_1.Report.findById(req.params.id).populate('technician_id', 'name');
        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }
        res.json(report);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
router.post('/', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const newReport = new collections_1.Report(reportData);
        const report = yield newReport.save();
        res.json(report);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
router.put('/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { header, activities } = req.body;
        const reportData = {};
        if (header) {
            if (header.date)
                reportData.date = new Date(header.date);
            if (header.author_id)
                reportData.technician_id = header.author_id;
            if (header.status)
                reportData.status = header.status;
            if (header.lunch_location)
                reportData.lunch_location = header.lunch_location;
            if (header.head_description)
                reportData.short_description = header.head_description;
        }
        if (activities) {
            reportData.activities = activities;
        }
        const report = yield collections_1.Report.findByIdAndUpdate(req.params.id, reportData, { new: true });
        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }
        res.json(report);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
router.delete('/:id', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const report = yield collections_1.Report.findByIdAndDelete(req.params.id);
        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }
        res.json({ msg: 'Report removed' });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}));
exports.default = router;
