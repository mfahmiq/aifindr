"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts'
import { TrendingUp, Eye, MousePointer, DollarSign, Users, ArrowUpRight, ArrowDownRight } from "lucide-react"

// Mock data for charts
const visitorData = [
    { name: 'Mon', visitors: 4000, pageViews: 6400 },
    { name: 'Tue', visitors: 3000, pageViews: 4800 },
    { name: 'Wed', visitors: 2000, pageViews: 3200 },
    { name: 'Thu', visitors: 2780, pageViews: 4448 },
    { name: 'Fri', visitors: 1890, pageViews: 3024 },
    { name: 'Sat', visitors: 2390, pageViews: 3824 },
    { name: 'Sun', visitors: 3490, pageViews: 5584 },
]

const revenueData = [
    { name: 'Jan', revenue: 400 },
    { name: 'Feb', revenue: 600 },
    { name: 'Mar', revenue: 800 },
    { name: 'Apr', revenue: 1000 },
    { name: 'May', revenue: 1200 },
    { name: 'Jun', revenue: 1500 },
]

const toolClicksData = [
    { name: 'ChatGPT', clicks: 1200, color: '#8884d8' },
    { name: 'Midjourney', clicks: 980, color: '#82ca9d' },
    { name: 'Claude', clicks: 720, color: '#ffc658' },
    { name: 'Copilot', clicks: 650, color: '#ff7300' },
    { name: 'Runway', clicks: 420, color: '#00C49F' },
]

const searchTermsData = [
    { term: 'ai image generator', count: 450 },
    { term: 'chatgpt alternative', count: 380 },
    { term: 'free ai tools', count: 320 },
    { term: 'ai coding assistant', count: 290 },
    { term: 'text to image ai', count: 250 },
]

const categoryData = [
    { name: 'Chat', value: 35, color: '#8884d8' },
    { name: 'Image', value: 28, color: '#82ca9d' },
    { name: 'Video', value: 15, color: '#ffc658' },
    { name: 'Coding', value: 12, color: '#ff7300' },
    { name: 'Other', value: 10, color: '#00C49F' },
]

export default function AdminAnalyticsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">Monitor your platform performance</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Views</p>
                                <p className="text-2xl font-bold">52.4K</p>
                            </div>
                            <div className="flex items-center text-green-500 text-sm">
                                <ArrowUpRight className="w-4 h-4" />
                                +12%
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Unique Visitors</p>
                                <p className="text-2xl font-bold">18.2K</p>
                            </div>
                            <div className="flex items-center text-green-500 text-sm">
                                <ArrowUpRight className="w-4 h-4" />
                                +8%
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Ext. Link Clicks</p>
                                <p className="text-2xl font-bold">4.3K</p>
                            </div>
                            <div className="flex items-center text-red-500 text-sm">
                                <ArrowDownRight className="w-4 h-4" />
                                -3%
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Session</p>
                                <p className="text-2xl font-bold">3m 24s</p>
                            </div>
                            <div className="flex items-center text-green-500 text-sm">
                                <ArrowUpRight className="w-4 h-4" />
                                +5%
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="traffic" className="w-full">
                <TabsList>
                    <TabsTrigger value="traffic">Traffic</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="tools">Tool Performance</TabsTrigger>
                    <TabsTrigger value="search">Search Terms</TabsTrigger>
                </TabsList>

                <TabsContent value="traffic" className="mt-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Visitors & Page Views</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={visitorData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="name" className="text-xs" />
                                            <YAxis className="text-xs" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Area type="monotone" dataKey="pageViews" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                            <Area type="monotone" dataKey="visitors" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Traffic by Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center mt-4">
                                    {categoryData.map(cat => (
                                        <div key={cat.name} className="flex items-center gap-1 text-xs">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                            {cat.name}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="revenue" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="name" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip
                                            formatter={(value) => [`$${value}`, 'Revenue']}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tools" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Performing Tools (by Clicks)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={toolClicksData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis type="number" className="text-xs" />
                                        <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                                            {toolClicksData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="search" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Popular Search Terms</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {searchTermsData.map((item, index) => (
                                    <div key={item.term} className="flex items-center gap-4">
                                        <span className="text-muted-foreground w-6">{index + 1}.</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">{item.term}</span>
                                                <span className="text-sm text-muted-foreground">{item.count} searches</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${(item.count / searchTermsData[0].count) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
