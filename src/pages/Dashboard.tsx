import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Award, 
  GraduationCap, 
  Users, 
  Eye,
  BarChart3, 
  CheckCircle, 
  Clock,
  Send,
  LogOut
} from 'lucide-react';
import TLRForm from '../components/forms/TLRForm';
import ResearchForm from '../components/forms/ResearchForm';
import GraduationForm from '../components/forms/GraduationForm';
import OutreachForm from '../components/forms/OutreachForm';
import PerceptionForm from '../components/forms/PerceptionForm';
import AdminDashboard from '../components/admin/AdminDashboard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { scores, submitForApproval } = useData();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  // Unified logout handler for both admin and coordinator
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Admin Dashboard
  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  // Coordinator Dashboard
  const scoreCards = [
    {
      title: 'Teaching, Learning & Resources',
      key: 'tlr',
      score: scores.tlr.total,
      maxScore: 100,
      weight: '30%',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Research & Professional Practice',
      key: 'research',
      score: scores.research.total,
      maxScore: 100,
      weight: '30%',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Graduation Outcomes',
      key: 'graduation',
      score: scores.graduation.total,
      maxScore: 100,
      weight: '20%',
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Outreach & Inclusivity',
      key: 'outreach',
      score: scores.outreach.total,
      maxScore: 100,
      weight: '10%',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Perception',
      key: 'perception',
      score: scores.perception.total,
      maxScore: 100,
      weight: '10%',
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const overallProgress = (scores.overall / 100) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* College Logo */}
              <div className="flex-shrink-0">
                <img 
                  src="/assets/college-logo.png" 
                  alt="College Logo" 
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Indian Institute of Technology Delhi</h1>
                <p className="text-sm text-gray-600">Welcome, {user.name} ({user.email})</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tlr">TLR (30%)</TabsTrigger>
            <TabsTrigger value="research">Research (30%)</TabsTrigger>
            <TabsTrigger value="graduation">Graduation (20%)</TabsTrigger>
            <TabsTrigger value="outreach">Outreach (10%)</TabsTrigger>
            <TabsTrigger value="perception">Perception (10%)</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Overall Score Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span>Overall NIRF Score</span>
                    </CardTitle>
                    <CardDescription>Weighted average of all sections</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {scores.overall.toFixed(1)} / 100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{overallProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Section Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scoreCards.map((card) => {
                const Icon = card.icon;
                const progress = (card.score / card.maxScore) * 100;
                
                return (
                  <Card key={card.key} className={`${card.borderColor} border-2`}>
                    <CardHeader className={card.bgColor}>
                      <div className="flex items-center justify-between">
                        <Icon className={`h-6 w-6 ${card.color}`} />
                        <Badge variant="outline">{card.weight}</Badge>
                      </div>
                      <CardTitle className="text-base">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Score</span>
                          <span className={`text-sm font-bold ${card.color}`}>
                            {card.score.toFixed(1)} / {card.maxScore}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-xs text-gray-500">
                          Weighted: {(card.score * parseFloat(card.weight) / 100).toFixed(1)} points
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Action Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-green-600" />
                  <span>Submit for Review</span>
                </CardTitle>
                <CardDescription>
                  Once you've completed all sections, submit your data for admin review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">All sections ready for submission</span>
                  </div>
                  <Button onClick={submitForApproval} className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Form Tabs */}
          <TabsContent value="tlr">
            <TLRForm />
          </TabsContent>

          <TabsContent value="research">
            <ResearchForm />
          </TabsContent>

          <TabsContent value="graduation">
            <GraduationForm />
          </TabsContent>

          <TabsContent value="outreach">
            <OutreachForm />
          </TabsContent>

          <TabsContent value="perception">
            <PerceptionForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;