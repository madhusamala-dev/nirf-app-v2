import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Edit, Clock, User } from 'lucide-react';
import type { FormSection } from '../../context/DataContext';

interface ReviewSectionProps {
  title: string;
  sectionData: FormSection;
  onUpdate: (data: any) => void;
  maxScore: number;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ 
  title, 
  sectionData, 
  onUpdate, 
  maxScore 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [adminNotes, setAdminNotes] = useState('');

  // Safe access to section data with fallbacks
  const safeData = sectionData?.data || {};
  const coordinatorEmail = sectionData?.coordinatorEmail || 'Unknown';
  const lastModified = sectionData?.lastModified || new Date();
  const modifiedBy = sectionData?.modifiedBy || 'coordinator';
  const existingNotes = sectionData?.adminNotes || '';

  useEffect(() => {
    setEditData({ ...safeData });
    setAdminNotes(existingNotes);
  }, [sectionData]);

  const handleSave = () => {
    console.log('ReviewSection handleSave called with editData:', editData);
    console.log('Admin notes:', adminNotes);
    
    // Calculate total for the updated data
    const updatedData = {
      ...editData,
      total: calculateTotal(editData),
      adminNotes: adminNotes // Include admin notes in the saved data
    };
    
    console.log('Final data being sent to onUpdate:', updatedData);
    onUpdate(updatedData);
    setIsEditing(false);
  };

  const calculateTotal = (data: any) => {
    if (!data || typeof data !== 'object') return 0;
    
    const values = Object.entries(data)
      .filter(([key, val]) => key !== 'total' && key !== 'adminNotes' && typeof val === 'number' && !isNaN(val))
      .map(([, val]) => val as number);
    
    return values.reduce((sum, val) => sum + val, 0);
  };

  const handleFieldChange = (key: string, value: number) => {
    console.log(`Field ${key} changed to:`, value);
    setEditData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCancel = () => {
    setEditData({ ...safeData });
    setAdminNotes(existingNotes);
    setIsEditing(false);
  };

  const renderField = (key: string, value: any) => {
    if (key === 'total' || key === 'adminNotes') return null; // Skip calculated fields
    
    const numValue = typeof value === 'number' ? value : 0;
    
    return (
      <div key={key} className="space-y-2">
        <label className="text-sm font-medium text-gray-700 capitalize">
          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
        </label>
        {isEditing ? (
          <Input
            type="number"
            value={editData[key] || 0}
            onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
            className="w-full"
            min="0"
            max={maxScore}
            step="0.1"
          />
        ) : (
          <div className="p-2 bg-gray-50 rounded border">
            {numValue.toFixed(1)}
          </div>
        )}
      </div>
    );
  };

  const currentTotal = calculateTotal(isEditing ? editData : safeData);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={modifiedBy === 'admin' ? 'default' : 'secondary'}>
              {modifiedBy === 'admin' ? 'Admin Modified' : 'Coordinator Data'}
            </Badge>
            {!isEditing ? (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Coordinator: {coordinatorEmail}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Last Modified: {new Date(lastModified).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-lg font-semibold text-blue-600">
            Total: {currentTotal.toFixed(1)} / {maxScore}
          </div>
        </div>

        {/* Data Fields */}
        {Object.keys(safeData).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(safeData).map(([key, value]) => 
              renderField(key, value)
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No data available for this section</p>
          </div>
        )}

        {/* Admin Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Admin Notes (Optional)
          </label>
          {isEditing ? (
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about changes made to this section..."
              rows={3}
            />
          ) : existingNotes ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm text-blue-800">{existingNotes}</div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border rounded text-sm text-gray-500">
              No admin notes
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewSection;