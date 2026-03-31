"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    month: "Jan",
    attendance: 95,
  },
  {
    month: "Feb",
    attendance: 93,
  },
  {
    month: "Mar",
    attendance: 91,
  },
  {
    month: "Apr",
    attendance: 94,
  },
  {
    month: "May",
    attendance: 89,
  },
  {
    month: "Jun",
    attendance: 92,
  },
]

export function AttendanceChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip />
        <Line type="monotone" dataKey="attendance" stroke="#000" strokeWidth={2} dot={{ fill: "#000" }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

