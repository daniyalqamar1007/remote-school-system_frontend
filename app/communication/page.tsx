import { Book, Share2, Database, Laptop } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Sidebar from "@/components/sidebar"

export default function CommunicationSettingsPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Same as in dashboard.tsx */}
      {/* <aside className="w-64 bg-white shadow-md">... Sidebar content ...</aside> */}
      <Sidebar/>
      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {/* Header - Similar to dashboard.tsx */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h2 className="font-semibold text-xl text-gray-800">Communication & Settings</h2>
            {/* ... Header content ... */}
          </div>
        </header>

        {/* Communication and Settings Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Tabs defaultValue="communication" className="space-y-4">
            <TabsList>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="system">System Settings</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="communication" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Message</CardTitle>
                  <CardDescription>Communicate with students, parents, or staff</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="recipient-type">Recipient Type</Label>
                      <Select>
                        <SelectTrigger id="recipient-type">
                          <SelectValue placeholder="Select recipient type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="class">Entire Class</SelectItem>
                          <SelectItem value="grade">Entire Grade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="recipient">Recipient</Label>
                      <Select>
                        <SelectTrigger id="recipient">
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="john-doe">John Doe</SelectItem>
                          <SelectItem value="jane-smith">Jane Smith</SelectItem>
                          <SelectItem value="class-10a">Class 10A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="Enter message subject" />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Type your message here" rows={5} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="urgent" />
                      <Label htmlFor="urgent">Mark as urgent</Label>
                    </div>
                    <Button>Send Message</Button>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                  <CardDescription>Your latest communications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        sender: "John Doe",
                        subject: "Absence Notice",
                        preview: "I will be absent tomorrow due to...",
                        time: "2 hours ago",
                      },
                      {
                        sender: "Jane Smith",
                        subject: "Parent-Teacher Meeting",
                        preview: "Regarding the upcoming parent-teacher...",
                        time: "1 day ago",
                      },
                      {
                        sender: "Class 10A",
                        subject: "Field Trip Reminder",
                        preview: "Don't forget to bring your permission slips...",
                        time: "3 days ago",
                      },
                    ].map((message, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={`/avatars/${index + 1}.png`} alt={message.sender} />
                          <AvatarFallback>{message.sender[0]}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-medium">{message.sender}</p>
                          <p className="text-sm text-muted-foreground">{message.subject}</p>
                          <p className="text-sm">{message.preview}</p>
                          <p className="text-xs text-muted-foreground">{message.time}</p>
                        </div>
                      </div>
                    ))}
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

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src="/avatars/01.png" alt="Profile Picture" />
                        <AvatarFallback>AD</AvatarFallback>
                      </Avatar>
                      <Button variant="outline">Change Picture</Button>
                    </div>
                    <div>
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input id="full-name" defaultValue="Admin User" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="admin@school.edu" />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" defaultValue="Administrator" disabled />
                    </div>
                    <Button>Update Profile</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button>Change Password</Button>
                  </form>
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

