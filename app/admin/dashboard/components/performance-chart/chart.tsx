"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    subject: "Math",
    average: 85,
  },
  {
    subject: "Science",
    average: 78,
  },
  {
    subject: "English",
    average: 82,
  },
  {
    subject: "History",
    average: 88,
  },
  {
    subject: "Art",
    average: 92,
  },
  {
    subject: "Physics",
    average: 76,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="subject" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Bar dataKey="average" fill="#000" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

