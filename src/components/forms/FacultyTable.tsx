import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, Save, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FacultyMember {
  srno: number;
  name: string;
  age: number;
  designation: string;
  gender: string;
  qualification: string;
  experience: number;
  currentlyWorking: string;
  joiningDate: string;
  leavingDate: string;
  associationType: string;
}

interface FacultyTableProps {
  onFacultyCountChange: (count: number) => void;
}

const FacultyTable: React.FC<FacultyTableProps> = ({ onFacultyCountChange }) => {
  const [facultyData, setFacultyData] = useState<FacultyMember[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const csvHeaders = [
    'Srno',
    'Name',
    'Age',
    'Designation',
    'Gender',
    'Qualification',
    'Experience (In Months)',
    'Currently working with Institution?',
    'Joining Date',
    'Leaving Date',
    'Association Type'
  ];

  const downloadTemplate = () => {
    const csvContent = csvHeaders.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'faculty_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Validate headers
        const expectedHeaders = csvHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const actualHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        const isValidFormat = expectedHeaders.every(expected => 
          actualHeaders.some(actual => actual.includes(expected.substring(0, 5)))
        );

        if (!isValidFormat) {
          setUploadMessage('Invalid CSV format. Please use the downloaded template.');
          return;
        }

        const data: FacultyMember[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const values = line.split(',').map(v => v.trim());
            if (values.length >= 11) {
              data.push({
                srno: parseInt(values[0]) || i,
                name: values[1] || '',
                age: parseInt(values[2]) || 0,
                designation: values[3] || '',
                gender: values[4] || '',
                qualification: values[5] || '',
                experience: parseInt(values[6]) || 0,
                currentlyWorking: values[7] || '',
                joiningDate: values[8] || '',
                leavingDate: values[9] || '',
                associationType: values[10] || ''
              });
            }
          }
        }

        setFacultyData(data);
        setUploadMessage(`Successfully uploaded ${data.length} faculty records.`);
        
        // Count currently working faculty for FSR calculation
        const currentFaculty = data.filter(f => 
          f.currentlyWorking.toLowerCase() === 'yes' || f.currentlyWorking.toLowerCase() === 'true'
        ).length;
        onFacultyCountChange(currentFaculty);
        
      } catch (error) {
        setUploadMessage('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const addNewRow = () => {
    const newRow: FacultyMember = {
      srno: facultyData.length + 1,
      name: '',
      age: 0,
      designation: '',
      gender: '',
      qualification: '',
      experience: 0,
      currentlyWorking: 'Yes',
      joiningDate: '',
      leavingDate: '',
      associationType: ''
    };
    setFacultyData([...facultyData, newRow]);
  };

  const deleteRow = (index: number) => {
    const newData = facultyData.filter((_, i) => i !== index);
    // Renumber the rows
    const renumbered = newData.map((row, i) => ({ ...row, srno: i + 1 }));
    setFacultyData(renumbered);
    
    // Update faculty count
    const currentFaculty = renumbered.filter(f => 
      f.currentlyWorking.toLowerCase() === 'yes' || f.currentlyWorking.toLowerCase() === 'true'
    ).length;
    onFacultyCountChange(currentFaculty);
  };

  const updateFaculty = (index: number, field: keyof FacultyMember, value: string | number) => {
    const newData = [...facultyData];
    newData[index] = { ...newData[index], [field]: value };
    setFacultyData(newData);
    
    // Update faculty count if currently working status changed
    if (field === 'currentlyWorking') {
      const currentFaculty = newData.filter(f => 
        f.currentlyWorking.toLowerCase() === 'yes' || f.currentlyWorking.toLowerCase() === 'true'
      ).length;
      onFacultyCountChange(currentFaculty);
    }
  };

  const saveFacultyData = () => {
    // Save to localStorage for persistence
    localStorage.setItem('nirf_faculty_data', JSON.stringify(facultyData));
    setUploadMessage('Faculty data saved successfully!');
    
    // Count currently working faculty
    const currentFaculty = facultyData.filter(f => 
      f.currentlyWorking.toLowerCase() === 'yes' || f.currentlyWorking.toLowerCase() === 'true'
    ).length;
    onFacultyCountChange(currentFaculty);
  };

  // Load data from localStorage on component mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('nirf_faculty_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFacultyData(parsed);
        const currentFaculty = parsed.filter((f: FacultyMember) => 
          f.currentlyWorking.toLowerCase() === 'yes' || f.currentlyWorking.toLowerCase() === 'true'
        ).length;
        onFacultyCountChange(currentFaculty);
      } catch (error) {
        console.error('Error loading faculty data:', error);
      }
    }
  }, [onFacultyCountChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Faculty Details</span>
        </CardTitle>
        <CardDescription>
          Download the template, fill faculty information, and upload the CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Template and Upload Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={downloadTemplate} variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Download Template</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Upload CSV</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <Button onClick={addNewRow} variant="outline" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Row</span>
          </Button>
        </div>

        {/* Upload Message */}
        {uploadMessage && (
          <Alert>
            <AlertDescription>{uploadMessage}</AlertDescription>
          </Alert>
        )}

        {/* Faculty Table */}
        {facultyData.length > 0 && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Sr.No</TableHead>
                    <TableHead className="min-w-32">Name</TableHead>
                    <TableHead className="w-20">Age</TableHead>
                    <TableHead className="min-w-32">Designation</TableHead>
                    <TableHead className="w-24">Gender</TableHead>
                    <TableHead className="min-w-32">Qualification</TableHead>
                    <TableHead className="w-32">Experience (Months)</TableHead>
                    <TableHead className="w-32">Currently Working?</TableHead>
                    <TableHead className="w-32">Joining Date</TableHead>
                    <TableHead className="w-32">Leaving Date</TableHead>
                    <TableHead className="min-w-32">Association Type</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facultyData.map((faculty, index) => (
                    <TableRow key={index}>
                      <TableCell>{faculty.srno}</TableCell>
                      <TableCell>
                        <Input
                          value={faculty.name}
                          onChange={(e) => updateFaculty(index, 'name', e.target.value)}
                          className="min-w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={faculty.age || ''}
                          onChange={(e) => updateFaculty(index, 'age', parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={faculty.designation}
                          onChange={(e) => updateFaculty(index, 'designation', e.target.value)}
                          className="min-w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={faculty.gender}
                          onValueChange={(value) => updateFaculty(index, 'gender', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={faculty.qualification}
                          onChange={(e) => updateFaculty(index, 'qualification', e.target.value)}
                          className="min-w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={faculty.experience || ''}
                          onChange={(e) => updateFaculty(index, 'experience', parseInt(e.target.value) || 0)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={faculty.currentlyWorking}
                          onValueChange={(value) => updateFaculty(index, 'currentlyWorking', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={faculty.joiningDate}
                          onChange={(e) => updateFaculty(index, 'joiningDate', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={faculty.leavingDate}
                          onChange={(e) => updateFaculty(index, 'leavingDate', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={faculty.associationType}
                          onValueChange={(value) => updateFaculty(index, 'associationType', value)}
                        >
                          <SelectTrigger className="min-w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Visiting">Visiting</SelectItem>
                            <SelectItem value="Guest">Guest</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => deleteRow(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary and Save */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                Total Faculty: {facultyData.length} | 
                Currently Working: {facultyData.filter(f => 
                  f.currentlyWorking.toLowerCase() === 'yes' || f.currentlyWorking.toLowerCase() === 'true'
                ).length}
              </div>
              <Button onClick={saveFacultyData} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save Faculty Data</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FacultyTable;