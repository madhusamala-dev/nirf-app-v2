import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Calculator, Users, GraduationCap, Save, Info, AlertTriangle, UserCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import FacultyTable from './FacultyTable';
import type { TLRScores, TLRFormData } from '../../context/DataContext';

interface ProgramIntake {
  program: string;
  '2024-25': number;
  '2023-24': number;
  '2022-23': number;
  '2021-22': number;
  total: number;
}

interface StudentEnrollment {
  program: string;
  maleStudents: number;
  femaleStudents: number;
  totalStudents: number;
}

const TLRForm: React.FC = () => {
  const { scores, tlrFormData, updateTLRFormData } = useData();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the persistent form data from context
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(tlrFormData.selectedPrograms);
  const [programIntakes, setProgramIntakes] = useState<ProgramIntake[]>(tlrFormData.programIntakes);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>(tlrFormData.studentEnrollments);

  const programOptions = [
    'UG (3 Years)',
    'UG (4 Years)', 
    'UG (5 Years)',
    'PG (2 Years)',
    'PG (3 Years)'
  ];

  // Sync local state with context data on mount and context changes
  useEffect(() => {
    setSelectedPrograms(tlrFormData.selectedPrograms);
    setProgramIntakes(tlrFormData.programIntakes);
    setStudentEnrollments(tlrFormData.studentEnrollments);
  }, [tlrFormData]);

  // Calculate total NT from program intakes
  const calculateTotalNT = (): number => {
    return programIntakes.reduce((sum, program) => sum + program.total, 0);
  };

  // Calculate total NE from student enrollments
  const calculateTotalNE = (): number => {
    return studentEnrollments.reduce((sum, enrollment) => sum + enrollment.totalStudents, 0);
  };

  // Update NT when program intakes change
  useEffect(() => {
    const totalNT = calculateTotalNT();
    if (totalNT !== tlrFormData.nt) {
      handleInputChange('nt', totalNT.toString());
    }
  }, [programIntakes]);

  // Update NE when student enrollments change
  useEffect(() => {
    const totalNE = calculateTotalNE();
    if (totalNE !== tlrFormData.ne) {
      handleInputChange('ne', totalNE.toString());
    }
  }, [studentEnrollments]);

  // Update student enrollments when selected programs change
  useEffect(() => {
    const newEnrollments = selectedPrograms.map(program => {
      const existing = studentEnrollments.find(e => e.program === program);
      return existing || {
        program,
        maleStudents: 0,
        femaleStudents: 0,
        totalStudents: 0
      };
    });
    
    if (JSON.stringify(newEnrollments) !== JSON.stringify(studentEnrollments)) {
      setStudentEnrollments(newEnrollments);
      updateTLRFormData({ studentEnrollments: newEnrollments });
    }
  }, [selectedPrograms]);

  // Calculate Student Strength using NIRF formula
  const calculateStudentStrength = (nt: number, ne: number, np: number): number => {
    // NIRF formula: SS = f(NT, NE) × 15 + f(NP) × 5
    const fNTNE = nt > 0 ? Math.min(ne / nt, 1) : 0; // Enrollment ratio, capped at 1
    const fNP = np > 0 ? Math.min(np / 100, 1) : 0; // Normalized doctoral enrollment
    
    const ss = (fNTNE * 15) + (fNP * 5);
    return Math.min(ss, 20); // Cap at 20 marks
  };

  // Calculate Faculty-Student Ratio using NIRF formula
  const calculateFSR = (f: number, nt: number, np: number): number => {
    const n = nt + np; // Total students
    
    if (n === 0 || f === 0) return 0;
    
    const ratio = f / n; // Faculty to student ratio
    
    // If ratio is less than 1:50 (0.02), set FSR to zero
    if (ratio < 1/50) return 0;
    
    // Calculate FSR score - at 1:15 ratio, FSR should be maximum (30 marks)
    const idealRatio = 1/15; // 0.0667
    const fsrScore = 30 * Math.min(ratio / idealRatio, 1);
    
    return Math.min(fsrScore, 30); // Cap at 30 marks
  };

  const handleInputChange = async (field: keyof TLRScores, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedData: Partial<TLRFormData> = { [field]: numValue };
    
    // Recalculate SS if NT, NE, or NP changed
    if (field === 'nt' || field === 'ne' || field === 'np') {
      const nt = field === 'nt' ? numValue : tlrFormData.nt;
      const ne = field === 'ne' ? numValue : tlrFormData.ne;
      const np = field === 'np' ? numValue : tlrFormData.np;
      updatedData.ss = calculateStudentStrength(nt, ne, np);
    }
    
    // Recalculate FSR if F, NT, or NP changed
    if (field === 'f' || field === 'nt' || field === 'np') {
      const f = field === 'f' ? numValue : tlrFormData.f;
      const nt = field === 'nt' ? numValue : tlrFormData.nt;
      const np = field === 'np' ? numValue : tlrFormData.np;
      updatedData.fsr = calculateFSR(f, nt, np);
    }
    
    // Calculate total
    const ss = updatedData.ss || tlrFormData.ss;
    const fsr = updatedData.fsr || tlrFormData.fsr;
    const fqe = field === 'fqe' ? numValue : tlrFormData.fqe;
    const fru = field === 'fru' ? numValue : tlrFormData.fru;
    updatedData.total = ss + fsr + fqe + fru;
    
    await updateTLRFormData(updatedData);
  };

  const handleFacultyCountChange = async (count: number) => {
    await handleInputChange('f', count.toString());
  };

  const handleProgramSelection = async (program: string, checked: boolean) => {
    let newSelectedPrograms: string[];
    let newProgramIntakes: ProgramIntake[];
    
    if (checked) {
      newSelectedPrograms = [...selectedPrograms, program];
      newProgramIntakes = [...programIntakes, {
        program,
        '2024-25': 0,
        '2023-24': 0,
        '2022-23': 0,
        '2021-22': 0,
        total: 0
      }];
    } else {
      newSelectedPrograms = selectedPrograms.filter(p => p !== program);
      newProgramIntakes = programIntakes.filter(p => p.program !== program);
    }
    
    setSelectedPrograms(newSelectedPrograms);
    setProgramIntakes(newProgramIntakes);
    
    await updateTLRFormData({
      selectedPrograms: newSelectedPrograms,
      programIntakes: newProgramIntakes
    });
  };

  const handleIntakeChange = async (program: string, year: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newProgramIntakes = programIntakes.map(p => {
      if (p.program === program) {
        const updated = { ...p, [year]: numValue };
        updated.total = updated['2024-25'] + updated['2023-24'] + updated['2022-23'] + updated['2021-22'];
        return updated;
      }
      return p;
    });
    
    setProgramIntakes(newProgramIntakes);
    await updateTLRFormData({ programIntakes: newProgramIntakes });
  };

  const handleEnrollmentChange = async (program: string, field: 'maleStudents' | 'femaleStudents', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newStudentEnrollments = studentEnrollments.map(e => {
      if (e.program === program) {
        const updated = { ...e, [field]: numValue };
        updated.totalStudents = updated.maleStudents + updated.femaleStudents;
        return updated;
      }
      return e;
    });
    
    setStudentEnrollments(newStudentEnrollments);
    await updateTLRFormData({ studentEnrollments: newStudentEnrollments });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Data is already saved through updateTLRFormData calls
      console.log('TLR data saved successfully');
    } catch (error) {
      console.error('Error saving TLR data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (tlrFormData.total / 100) * 100;
  const n = tlrFormData.nt + tlrFormData.np;
  const facultyRatio = n > 0 ? tlrFormData.f / n : 0;
  const isRatioTooLow = facultyRatio > 0 && facultyRatio < 1/50;
  const grandTotalNT = calculateTotalNT();
  const grandTotalNE = calculateTotalNE();

  // Calculate weighted score for Student Strength (30% of SS score)
  const ssWeightedScore = tlrFormData.ss * 0.30; // 30% of the SS score
  const maxWeightedScore = 20 * 0.30; // Maximum possible weighted score (30% of 20)

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>Teaching, Learning & Resources (TLR)</span>
            <Badge variant="outline">30% Weight</Badge>
          </CardTitle>
          <CardDescription>
            Comprehensive evaluation of teaching quality, learning resources, and infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Total Score</span>
            <span className="text-2xl font-bold text-blue-600">
              {tlrFormData.total.toFixed(1)} / 100
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="text-sm text-gray-600 mt-2">
            Progress: {progress.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      {/* Student Strength Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Student Strength (SS)</span>
            <Badge variant="secondary">20 Marks</Badge>
            <Badge variant="outline">30% Weightage</Badge>
          </CardTitle>
          <CardDescription>
            Calculate student strength using NIRF formula: SS = f(NT, NE) × 15 + f(NP) × 5
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formula Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">NIRF Formula</h4>
                <p className="text-sm text-blue-800 mt-1">
                  SS = f(NT, NE) × 15 + f(NP) × 5 (Maximum: 20 marks)
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1">
                  <li>• NT: Total sanctioned approved intake (UG + PG programs)</li>
                  <li>• NE: Total enrolled students (UG + PG programs)</li>
                  <li>• NP: Total doctoral students enrolled till previous academic year</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sanctioned Approved Intake Section */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Sanctioned Approved Intake (NT)</h4>
              
              {/* Program Selection Checkboxes */}
              <div className="space-y-3 mb-6">
                <Label className="text-sm font-medium">Select Program Types:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {programOptions.map((program) => (
                    <div key={program} className="flex items-center space-x-2">
                      <Checkbox
                        id={program}
                        checked={selectedPrograms.includes(program)}
                        onCheckedChange={(checked) => handleProgramSelection(program, checked as boolean)}
                      />
                      <Label htmlFor={program} className="text-sm">
                        {program}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Intake Table */}
              {selectedPrograms.length > 0 && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Academic Year</TableHead>
                          <TableHead className="text-center">A.Y. (2024-25)</TableHead>
                          <TableHead className="text-center">2023-24</TableHead>
                          <TableHead className="text-center">2022-23</TableHead>
                          <TableHead className="text-center">2021-22</TableHead>
                          <TableHead className="text-center">Total Intake (NT)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programIntakes.map((program) => (
                          <TableRow key={program.program}>
                            <TableCell className="font-medium">{program.program}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={program['2024-25'] || ''}
                                onChange={(e) => handleIntakeChange(program.program, '2024-25', e.target.value)}
                                className="w-20 text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={program['2023-24'] || ''}
                                onChange={(e) => handleIntakeChange(program.program, '2023-24', e.target.value)}
                                className="w-20 text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={program['2022-23'] || ''}
                                onChange={(e) => handleIntakeChange(program.program, '2022-23', e.target.value)}
                                className="w-20 text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={program['2021-22'] || ''}
                                onChange={(e) => handleIntakeChange(program.program, '2021-22', e.target.value)}
                                className="w-20 text-center"
                              />
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {program.total}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Grand Total Row */}
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell>Grand Total</TableCell>
                          <TableCell className="text-center">
                            {programIntakes.reduce((sum, p) => sum + p['2024-25'], 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            {programIntakes.reduce((sum, p) => sum + p['2023-24'], 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            {programIntakes.reduce((sum, p) => sum + p['2022-23'], 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            {programIntakes.reduce((sum, p) => sum + p['2021-22'], 0)}
                          </TableCell>
                          <TableCell className="text-center text-blue-600">
                            {grandTotalNT}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Total NT Display */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Total Sanctioned Intake (NT):
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    {grandTotalNT}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Actual Student Strength Section */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Total Actual Student Strength (NE)</h4>
              
              {selectedPrograms.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Program</TableHead>
                          <TableHead className="text-center">No of Male Students</TableHead>
                          <TableHead className="text-center">No of Female Students</TableHead>
                          <TableHead className="text-center">Total Students (NE)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentEnrollments.map((enrollment) => (
                          <TableRow key={enrollment.program}>
                            <TableCell className="font-medium">{enrollment.program}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={enrollment.maleStudents || ''}
                                onChange={(e) => handleEnrollmentChange(enrollment.program, 'maleStudents', e.target.value)}
                                className="w-24 text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={enrollment.femaleStudents || ''}
                                onChange={(e) => handleEnrollmentChange(enrollment.program, 'femaleStudents', e.target.value)}
                                className="w-24 text-center"
                              />
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {enrollment.totalStudents}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Grand Total Row */}
                        <TableRow className="bg-green-50 font-bold">
                          <TableCell>Grand Total</TableCell>
                          <TableCell className="text-center">
                            {studentEnrollments.reduce((sum, e) => sum + e.maleStudents, 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            {studentEnrollments.reduce((sum, e) => sum + e.femaleStudents, 0)}
                          </TableCell>
                          <TableCell className="text-center text-green-600">
                            {grandTotalNE}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Please select programs from the Sanctioned Approved Intake section above</p>
                  <p className="text-sm">The enrollment table will appear once you select program types</p>
                </div>
              )}

              {/* Total NE Display */}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">
                    Total Actual Student Strength (NE):
                  </span>
                  <span className="text-lg font-bold text-green-700">
                    {grandTotalNE}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* NP Field */}
            <div className="space-y-2">
              <Label htmlFor="np" className="text-sm font-medium">
                Doctoral Students (NP)
              </Label>
              <Input
                id="np"
                type="number"
                placeholder="Enter doctoral students count"
                value={tlrFormData.np || ''}
                onChange={(e) => handleInputChange('np', e.target.value)}
                min="0"
              />
              <p className="text-xs text-gray-500">
                Students enrolled in doctoral programs till previous academic year
              </p>
            </div>

            {/* Calculated SS */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Student Strength Score (SS)
              </Label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="text-lg font-bold text-blue-700">
                      {tlrFormData.ss.toFixed(2)} / 20
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Automatically calculated using NIRF formula
              </p>
            </div>

            {/* Weighted SS Score */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Weighted SS Score (30%)
              </Label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-purple-600" />
                    <span className="text-lg font-bold text-purple-700">
                      {ssWeightedScore.toFixed(2)} / {maxWeightedScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {tlrFormData.ss.toFixed(2)} × 0.30 = {ssWeightedScore.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faculty-Student Ratio Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <span>Faculty-Student Ratio (FSR)</span>
            <Badge variant="secondary">30 Marks</Badge>
          </CardTitle>
          <CardDescription>
            Calculate FSR using NIRF formula: FSR = 30 × [15 × (F/N)] where N = NT + NP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formula Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">NIRF Formula</h4>
                <p className="text-sm text-green-800 mt-1">
                  FSR = 30 × [15 × (F/N)] where N = NT + NP (Maximum: 30 marks)
                </p>
                <ul className="text-xs text-green-700 mt-2 space-y-1">
                  <li>• F: Full-time regular faculty (Ph.D./M.E./M.Tech. holders)</li>
                  <li>• Faculty who taught in both semesters of academic year 2023-24</li>
                  <li>• Expected ratio: 1:15 for maximum marks</li>
                  <li>• For F/N &lt; 1:50, FSR will be set to zero</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Faculty Details Table */}
          <FacultyTable onFacultyCountChange={handleFacultyCountChange} />

          {/* Warning for low ratio */}
          {isRatioTooLow && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Faculty-Student ratio ({(facultyRatio * 1000).toFixed(0)}:1000) is below 1:50. FSR score will be zero.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Faculty Count Display */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Full-time Regular Faculty (F)
              </Label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <span className="text-lg font-bold text-gray-700">
                    {tlrFormData.f}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Automatically counted from faculty table (currently working faculty)
              </p>
            </div>

            {/* Calculated FSR */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Faculty-Student Ratio Score (FSR)
              </Label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-700">
                      {tlrFormData.fsr.toFixed(2)} / 30
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Current ratio: {n > 0 ? `1:${Math.round(n / Math.max(tlrFormData.f, 1))}` : 'N/A'}
              </p>
            </div>

            {/* Total Students (N) Display */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Total Students (N = NT + NP)
              </Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-lg font-bold text-gray-700">
                  {n.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {tlrFormData.nt.toLocaleString()} (intake) + {tlrFormData.np.toLocaleString()} (doctoral)
              </p>
            </div>

            {/* Ratio Display */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Current F:N Ratio
              </Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-lg font-bold text-gray-700">
                  {facultyRatio > 0 ? `1:${Math.round(1/facultyRatio)}` : 'N/A'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {facultyRatio >= 1/15 ? '✅ Excellent ratio' : 
                 facultyRatio >= 1/50 ? '⚠️ Acceptable ratio' : 
                 facultyRatio > 0 ? '❌ Below minimum (1:50)' : 'Enter values to calculate'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other TLR Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            <span>Other TLR Components</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Faculty Qualification & Experience */}
            <div className="space-y-2">
              <Label htmlFor="fqe" className="text-sm font-medium">
                Faculty Qualification & Experience (FQE)
              </Label>
              <Input
                id="fqe"
                type="number"
                placeholder="Enter FQE score"
                value={tlrFormData.fqe || ''}
                onChange={(e) => handleInputChange('fqe', e.target.value)}
                min="0"
                max="25"
                step="0.1"
              />
              <p className="text-xs text-gray-500">Maximum: 25 marks</p>
            </div>

            {/* Financial Resources */}
            <div className="space-y-2">
              <Label htmlFor="fru" className="text-sm font-medium">
                Financial Resources Utilization (FRU)
              </Label>
              <Input
                id="fru"
                type="number"
                placeholder="Enter FRU score"
                value={tlrFormData.fru || ''}
                onChange={(e) => handleInputChange('fru', e.target.value)}
                min="0"
                max="25"
                step="0.1"
              />
              <p className="text-xs text-gray-500">Maximum: 25 marks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>TLR Score Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {tlrFormData.ss.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Student Strength</div>
              <div className="text-xs text-gray-500">/ 20</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {tlrFormData.fsr.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">FSR</div>
              <div className="text-xs text-gray-500">/ 30</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {tlrFormData.fqe.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">FQE</div>
              <div className="text-xs text-gray-500">/ 25</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {tlrFormData.fru.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">FRU</div>
              <div className="text-xs text-gray-500">/ 25</div>
            </div>
            <div className="text-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
              <div className="text-xl font-bold text-gray-900">
                {tlrFormData.total.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-xs text-gray-500">/ 100</div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save TLR Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TLRForm;