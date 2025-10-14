import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  CheckCircle, 
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { PerceptionScores } from '../../context/DataContext';
import { toast } from 'sonner';

const PerceptionForm: React.FC = () => {
  const { scores, updatePerceptionData } = useData();
  const [formData, setFormData] = useState<PerceptionScores>(scores.perception);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(scores.perception);
  }, [scores.perception]);

  const handleInputChange = (field: keyof PerceptionScores, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newData = { ...formData, [field]: numValue };
    
    // Calculate total automatically (excluding the total field itself)
    if (field !== 'total') {
      newData.total = newData.pr;
    }
    
    setFormData(newData);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await updatePerceptionData(formData);
      if (success) {
        setHasChanges(false);
        toast.success('Perception data saved successfully!');
      } else {
        toast.error('Failed to save data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving perception data:', error);
      toast.error('An error occurred while saving data.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = () => {
    const maxScore = 100;
    return Math.min((formData.total / maxScore) * 100, 100);
  };

  const getScoreStatus = () => {
    const progress = calculateProgress();
    if (progress >= 80) return { color: 'text-green-600', status: 'Excellent' };
    if (progress >= 60) return { color: 'text-blue-600', status: 'Good' };
    if (progress >= 40) return { color: 'text-yellow-600', status: 'Average' };
    return { color: 'text-red-600', status: 'Needs Improvement' };
  };

  const scoreStatus = getScoreStatus();
  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Perception (PR)</CardTitle>
                <CardDescription>
                  Peer perception from employers and academic peers
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={scoreStatus.color}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {scoreStatus.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{formData.total.toFixed(1)} / 100</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-6">
        {/* Peer Perception */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <span>Peer Perception (PR)</span>
            </CardTitle>
            <CardDescription>
              Employers & Academic Peer Perception Score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pr">Peer Perception Score</Label>
              <Input
                id="pr"
                type="number"
                value={formData.pr}
                onChange={(e) => handleInputChange('pr', e.target.value)}
                placeholder="Enter PR score"
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum: 100 points</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Section Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formData.pr.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Peer Perception</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{formData.total.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Total Score</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center">
            <div className="text-sm text-gray-600">
              Weighted Contribution to Overall Score: {(formData.total * 0.1).toFixed(1)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Section */}
      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Please save your data before leaving this section.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-4">
        <Button
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Data
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PerceptionForm;