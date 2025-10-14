import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Save, Calculator, Users, Heart, Globe, Accessibility } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { toast } from 'sonner';

const OutreachForm: React.FC = () => {
  const { scores, updateOutreachData } = useData();
  const [formData, setFormData] = useState({
    rd: scores.outreach.rd || 0,
    wd: scores.outreach.wd || 0,
    escs: scores.outreach.escs || 0,
    pcs: scores.outreach.pcs || 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData({
      rd: scores.outreach.rd || 0,
      wd: scores.outreach.wd || 0,
      escs: scores.outreach.escs || 0,
      pcs: scores.outreach.pcs || 0
    });
  }, [scores.outreach]);

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
    setHasChanges(true);
  };

  const calculateTotal = () => {
    return formData.rd + formData.wd + formData.escs + formData.pcs;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const total = calculateTotal();
      const success = await updateOutreachData({
        ...formData,
        total
      });

      if (success) {
        setHasChanges(false);
        toast.success('Outreach & Inclusivity data saved successfully!');
      } else {
        toast.error('Failed to save data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving outreach data:', error);
      toast.error('An error occurred while saving data.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentTotal = calculateTotal();
  const maxScore = 100;
  const progressPercentage = Math.min((currentTotal / maxScore) * 100, 100);

  const metrics = [
    {
      id: 'rd',
      label: 'Regional Diversity (RD)',
      value: formData.rd,
      icon: <Globe className="h-4 w-4" />,
      description: 'Students from different regions',
      maxPoints: 25
    },
    {
      id: 'wd',
      label: 'Women Diversity (WD)',
      value: formData.wd,
      icon: <Users className="h-4 w-4" />,
      description: 'Women students and faculty',
      maxPoints: 25
    },
    {
      id: 'escs',
      label: 'Economically & Socially Challenged Students (ESCS)',
      value: formData.escs,
      icon: <Heart className="h-4 w-4" />,
      description: 'Support for underprivileged students',
      maxPoints: 25
    },
    {
      id: 'pcs',
      label: 'Physically Challenged Students (PCS)',
      value: formData.pcs,
      icon: <Accessibility className="h-4 w-4" />,
      description: 'Accessibility and inclusion measures',
      maxPoints: 25
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-orange-600" />
                <span>Outreach & Inclusivity</span>
              </CardTitle>
              <CardDescription>
                Diversity, inclusion, and outreach initiatives (Weight: 10%)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {currentTotal.toFixed(1)} / {maxScore}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                {metric.icon}
                <span>{metric.label}</span>
              </CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={metric.id}>
                  Score (Max: {metric.maxPoints} points)
                </Label>
                <Input
                  id={metric.id}
                  type="number"
                  min="0"
                  max={metric.maxPoints}
                  step="0.1"
                  value={metric.value}
                  onChange={(e) => handleInputChange(metric.id, e.target.value)}
                  className="text-lg font-medium"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Current: {metric.value.toFixed(1)}</span>
                <span>Max: {metric.maxPoints}</span>
              </div>
              <Progress 
                value={Math.min((metric.value / metric.maxPoints) * 100, 100)} 
                className="h-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Section Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formData.rd.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Regional Diversity</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formData.wd.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Women Diversity</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formData.escs.toFixed(1)}</div>
              <div className="text-sm text-gray-600">ESCS Students</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{formData.pcs.toFixed(1)}</div>
              <div className="text-sm text-gray-600">PCS Students</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Total Score</div>
              <div className="text-2xl font-bold text-gray-900">
                {currentTotal.toFixed(1)} / {maxScore}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Contribution to Overall</div>
              <div className="text-lg font-semibold text-orange-600">
                {(currentTotal * 0.10).toFixed(1)} points (10%)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
            </div>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="min-w-[120px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OutreachForm;