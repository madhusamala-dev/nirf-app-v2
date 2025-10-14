import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Calculator, Users, GraduationCap, Save, Info, AlertTriangle, UserCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { TLRScores } from '../../context/DataContext';

const TLRForm: React.FC = () => {
  const { scores, updateTLRData } = useData();
  const [formData, setFormData] = useState<TLRScores>(scores.tlr);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData(scores.tlr);
  }, [scores.tlr]);

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

  const handleInputChange = (field: keyof TLRScores, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedData = { ...formData, [field]: numValue };
    
    // Recalculate SS if NT, NE, or NP changed
    if (field === 'nt' || field === 'ne' || field === 'np') {
      updatedData.ss = calculateStudentStrength(updatedData.nt, updatedData.ne, updatedData.np);
    }
    
    // Recalculate FSR if F, NT, or NP changed
    if (field === 'f' || field === 'nt' || field === 'np') {
      updatedData.fsr = calculateFSR(updatedData.f, updatedData.nt, updatedData.np);
    }
    
    // Calculate total
    updatedData.total = updatedData.ss + updatedData.fsr + updatedData.fqe + updatedData.fru;
    
    setFormData(updatedData);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateTLRData(formData);
    } catch (error) {
      console.error('Error saving TLR data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (formData.total / 100) * 100;
  const n = formData.nt + formData.np;
  const facultyRatio = n > 0 ? formData.f / n : 0;
  const isRatioTooLow = facultyRatio > 0 && facultyRatio < 1/50;

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
              {formData.total.toFixed(1)} / 100
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NT Field */}
            <div className="space-y-2">
              <Label htmlFor="nt" className="text-sm font-medium">
                Total Sanctioned Intake (NT)
              </Label>
              <Input
                id="nt"
                type="number"
                placeholder="Enter total sanctioned intake"
                value={formData.nt || ''}
                onChange={(e) => handleInputChange('nt', e.target.value)}
                min="0"
              />
              <p className="text-xs text-gray-500">
                Combined intake capacity for all UG and PG programs
              </p>
            </div>

            {/* NE Field */}
            <div className="space-y-2">
              <Label htmlFor="ne" className="text-sm font-medium">
                Total Enrolled Students (NE)
              </Label>
              <Input
                id="ne"
                type="number"
                placeholder="Enter total enrolled students"
                value={formData.ne || ''}
                onChange={(e) => handleInputChange('ne', e.target.value)}
                min="0"
              />
              <p className="text-xs text-gray-500">
                Total students enrolled in all UG and PG programs
              </p>
            </div>

            {/* NP Field */}
            <div className="space-y-2">
              <Label htmlFor="np" className="text-sm font-medium">
                Doctoral Students (NP)
              </Label>
              <Input
                id="np"
                type="number"
                placeholder="Enter doctoral students count"
                value={formData.np || ''}
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
                      {formData.ss.toFixed(2)} / 20
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Automatically calculated using NIRF formula
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
            {/* Faculty Count Field */}
            <div className="space-y-2">
              <Label htmlFor="f" className="text-sm font-medium">
                Full-time Regular Faculty (F)
              </Label>
              <Input
                id="f"
                type="number"
                placeholder="Enter faculty count"
                value={formData.f || ''}
                onChange={(e) => handleInputChange('f', e.target.value)}
                min="0"
              />
              <p className="text-xs text-gray-500">
                Faculty with Ph.D./M.E./M.Tech. who taught in both semesters (2023-24)
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
                      {formData.fsr.toFixed(2)} / 30
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Current ratio: {n > 0 ? `1:${Math.round(n / Math.max(formData.f, 1))}` : 'N/A'}
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
                {formData.nt.toLocaleString()} (intake) + {formData.np.toLocaleString()} (doctoral)
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
                value={formData.fqe || ''}
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
                value={formData.fru || ''}
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
                {formData.ss.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Student Strength</div>
              <div className="text-xs text-gray-500">/ 20</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {formData.fsr.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">FSR</div>
              <div className="text-xs text-gray-500">/ 30</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {formData.fqe.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">FQE</div>
              <div className="text-xs text-gray-500">/ 25</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {formData.fru.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">FRU</div>
              <div className="text-xs text-gray-500">/ 25</div>
            </div>
            <div className="text-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
              <div className="text-xl font-bold text-gray-900">
                {formData.total.toFixed(1)}
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