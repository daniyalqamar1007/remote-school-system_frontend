import { Book, Database, Laptop, Share2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Sidebar from "@/components/sidebar"

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Same as in dashboard.tsx */}
      <Sidebar/>
      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h2 className="font-semibold text-xl text-gray-800">Settings</h2>
          </div>
        </header>

        {/* Settings Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Tabs defaultValue="system" className="space-y-4">
            <TabsList>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="system" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure system-wide settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="school-name">School Name</Label>
                      <Input id="school-name" defaultValue="Caribbean International School" />
                    </div>
                    <div>
                      <Label htmlFor="academic-year">Current Academic Year</Label>
                      <Select>
                        <SelectTrigger id="academic-year">
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2023-2024">2023-2024</SelectItem>
                          <SelectItem value="2024-2025">2024-2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="grading-scale">Grading Scale</Label>
                      <Select>
                        <SelectTrigger id="grading-scale">
                          <SelectValue placeholder="Select grading scale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="letter">Letter Grade</SelectItem>
                          <SelectItem value="gpa">GPA Scale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="enable-ai" />
                      <Label htmlFor="enable-ai">Enable AI-powered insights</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: "Email Notifications", description: "Receive notifications via email" },
                      { title: "SMS Notifications", description: "Receive notifications via text message" },
                      { title: "Push Notifications", description: "Receive push notifications on your device" },
                      { title: "Attendance Alerts", description: "Get notified about student absences" },
                      { title: "Grade Updates", description: "Receive alerts when new grades are posted" },
                      { title: "Behavior Incidents", description: "Be informed about student behavior issues" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between space-x-2">
                        <div>
                          <Label htmlFor={`notify-${index}`}>{item.title}</Label>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch id={`notify-${index}`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>Connect with other platforms and services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Microsoft 365", icon: <Share2 className="h-6 w-6" />, connected: true },
                      { name: "Google Classroom", icon: <Book className="h-6 w-6" />, connected: false },
                      { name: "National Education Database", icon: <Database className="h-6 w-6" />, connected: true },
                      { name: "Learning Management System", icon: <Laptop className="h-6 w-6" />, connected: false },
                    ].map((integration, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {integration.icon}
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {integration.connected ? "Connected" : "Not connected"}
                            </p>
                          </div>
                        </div>
                        <Button variant={integration.connected ? "outline" : "default"}>
                          {integration.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

